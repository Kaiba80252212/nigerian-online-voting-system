import { Router } from "express";
import { db } from "@workspace/db";
import { votersTable, votesTable, candidatesTable, electionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "nigeria-votes-secret-2025";

router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Please verify your identity first." });
    return;
  }

  const token = authHeader.slice(7);
  let voterId: number;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { voterId: number };
    voterId = payload.voterId;
  } catch {
    res.status(403).json({ error: "Invalid or expired token. Please verify your identity again." });
    return;
  }

  const [voter] = await db.select().from(votersTable).where(eq(votersTable.id, voterId)).limit(1);
  if (!voter) {
    res.status(404).json({ error: "Voter not found." });
    return;
  }

  const votes = await db
    .select({
      voteId: votesTable.id,
      receiptCode: votesTable.receiptCode,
      votedAt: votesTable.createdAt,
      candidateName: candidatesTable.fullName,
      party: candidatesTable.party,
      partyAbbreviation: candidatesTable.partyAbbreviation,
      electionTitle: electionsTable.title,
      electionType: electionsTable.type,
      electionStatus: electionsTable.status,
    })
    .from(votesTable)
    .innerJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
    .innerJoin(electionsTable, eq(votesTable.electionId, electionsTable.id))
    .where(eq(votesTable.voterId, voterId))
    .orderBy(votesTable.createdAt);

  res.json({
    id: voter.id,
    nin: voter.nin,
    fullName: voter.fullName,
    dateOfBirth: voter.dateOfBirth,
    state: voter.state,
    lga: voter.lga,
    pollingUnit: voter.pollingUnit,
    phoneNumber: voter.phoneNumber,
    status: voter.status,
    createdAt: voter.createdAt.toISOString(),
    votingHistory: votes.map((v) => ({
      voteId: v.voteId,
      receiptCode: v.receiptCode,
      votedAt: v.votedAt.toISOString(),
      candidateName: v.candidateName,
      party: v.party,
      partyAbbreviation: v.partyAbbreviation,
      electionTitle: v.electionTitle,
      electionType: v.electionType,
      electionStatus: v.electionStatus,
    })),
  });
});

export default router;
