import { Router } from "express";
import { db } from "@workspace/db";
import { votesTable, electionsTable, candidatesTable, votersTable, activityLogTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CastVoteBody } from "@workspace/api-zod";
import { randomBytes } from "crypto";
import { verifyVoterToken } from "../lib/jwt";
import { isUniqueViolation } from "../lib/dbErrors";

const router = Router();

function generateReceiptCode(): string {
  return "NV-" + randomBytes(6).toString("hex").toUpperCase();
}

router.post("/", async (req, res) => {
  const parsed = CastVoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { electionId, candidateId, voterToken } = parsed.data;

  const payload = verifyVoterToken(voterToken);
  if (!payload) {
    res.status(403).json({ error: "Invalid or expired voter token. Please re-verify your identity." });
    return;
  }
  const voterId = payload.voterId;
  const voterState = payload.state;

  const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
  if (!election) { res.status(404).json({ error: "Election not found" }); return; }
  if (election.status !== "active") {
    res.status(400).json({ error: "This election is not currently active" });
    return;
  }

  const existing = await db.select({ id: votesTable.id }).from(votesTable)
    .where(and(eq(votesTable.voterId, voterId), eq(votesTable.electionId, electionId)))
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "You have already voted in this election" });
    return;
  }

  const [candidate] = await db.select().from(candidatesTable)
    .where(and(eq(candidatesTable.id, candidateId), eq(candidatesTable.electionId, electionId)))
    .limit(1);
  if (!candidate) { res.status(404).json({ error: "Candidate not found in this election" }); return; }

  // Insert with a retry loop:
  // - the (voterId, electionId) unique index is the final guard against
  //   double-voting when two requests race past the check above;
  // - a receipt-code collision (astronomically rare, but the column is unique)
  //   simply draws a new code.
  let receiptCode = "";
  let inserted = false;
  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    receiptCode = generateReceiptCode();
    try {
      await db.insert(votesTable).values({
        voterId,
        electionId,
        candidateId,
        receiptCode,
        state: voterState ?? null,
      });
      inserted = true;
    } catch (err) {
      if (isUniqueViolation(err, "receipt_code")) continue;
      if (isUniqueViolation(err)) {
        res.status(400).json({ error: "You have already voted in this election" });
        return;
      }
      throw err;
    }
  }
  if (!inserted) {
    res.status(500).json({ error: "Could not record your vote. Please try again." });
    return;
  }

  await db.update(votersTable).set({ status: "voted" }).where(eq(votersTable.id, voterId));

  await db.insert(activityLogTable).values({
    type: "vote_cast",
    description: `Vote cast in "${election.title}"`,
    state: voterState ?? null,
  });

  res.status(201).json({
    receiptCode,
    electionId,
    timestamp: new Date().toISOString(),
  });
});

router.get("/verify", async (req, res) => {
  const receipt = (req.query.receipt as string | undefined)?.trim().toUpperCase();
  if (!receipt) {
    res.status(400).json({ error: "Receipt code is required" });
    return;
  }

  const [vote] = await db
    .select({
      id: votesTable.id,
      receiptCode: votesTable.receiptCode,
      createdAt: votesTable.createdAt,
      electionTitle: electionsTable.title,
      electionType: electionsTable.type,
      electionStatus: electionsTable.status,
      candidateName: candidatesTable.fullName,
      party: candidatesTable.party,
      partyAbbreviation: candidatesTable.partyAbbreviation,
    })
    .from(votesTable)
    .innerJoin(electionsTable, eq(votesTable.electionId, electionsTable.id))
    .innerJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
    .where(eq(votesTable.receiptCode, receipt))
    .limit(1);

  if (!vote) {
    res.status(404).json({ error: "Receipt code not found. Please check the code and try again." });
    return;
  }

  res.json({
    valid: true,
    receiptCode: vote.receiptCode,
    electionTitle: vote.electionTitle,
    electionType: vote.electionType ?? "",
    electionStatus: vote.electionStatus,
    candidateName: vote.candidateName,
    party: vote.party,
    partyAbbreviation: vote.partyAbbreviation,
    votedAt: vote.createdAt ? new Date(vote.createdAt).toISOString() : new Date().toISOString(),
  });
});

export default router;
