import { Router } from "express";
import { db } from "@workspace/db";
import { votesTable, electionsTable, candidatesTable, votersTable, activityLogTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { CastVoteBody } from "@workspace/api-zod";
import { randomBytes } from "crypto";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "nigeria-votes-secret-2025";

router.post("/", async (req, res) => {
  const parsed = CastVoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { electionId, candidateId, voterToken } = parsed.data;

  let voterId: number;
  let voterState: string | undefined;
  try {
    const payload = jwt.verify(voterToken, JWT_SECRET) as { voterId: number; state?: string };
    voterId = payload.voterId;
    voterState = payload.state;
  } catch {
    res.status(403).json({ error: "Invalid or expired voter token. Please re-verify your identity." });
    return;
  }

  const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
  if (!election) { res.status(404).json({ error: "Election not found" }); return; }
  if (election.status !== "active") {
    res.status(400).json({ error: "This election is not currently active" });
    return;
  }

  const existing = await db.select().from(votesTable)
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

  const receiptCode = "NV-" + randomBytes(6).toString("hex").toUpperCase();
  await db.insert(votesTable).values({
    voterId,
    electionId,
    candidateId,
    receiptCode,
    state: voterState ?? null,
  });

  await db.update(votersTable).set({ status: "voted" }).where(eq(votersTable.id, voterId));

  const [voter] = await db.select().from(votersTable).where(eq(votersTable.id, voterId)).limit(1);
  await db.insert(activityLogTable).values({
    type: "vote_cast",
    description: `Vote cast in "${election.title}"`,
    state: voter?.state ?? null,
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
