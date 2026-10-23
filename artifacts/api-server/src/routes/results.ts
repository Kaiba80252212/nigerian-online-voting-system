import { Router } from "express";
import { db } from "@workspace/db";
import { electionsTable, candidatesTable, votesTable, votersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router({ mergeParams: true });

router.get("/:id/results", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
  if (!election) { res.status(404).json({ error: "Election not found" }); return; }

  const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.electionId, id));

  const candidateResults = await Promise.all(
    candidates.map(async (c) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(votesTable)
        .where(eq(votesTable.candidateId, c.id));
      return { candidate: c, voteCount: count };
    })
  );

  const totalVotes = candidateResults.reduce((sum, r) => sum + r.voteCount, 0);
  const totalRegistered = await db.select({ count: sql<number>`count(*)::int` }).from(votersTable);
  const registeredCount = totalRegistered[0]?.count ?? 1;
  const turnoutPercentage = registeredCount > 0 ? Math.round((totalVotes / registeredCount) * 100 * 10) / 10 : 0;

  const sorted = [...candidateResults].sort((a, b) => b.voteCount - a.voteCount);
  const winner = sorted[0]?.candidate ?? null;

  const candidatesWithPercentage = candidateResults.map((r) => ({
    candidate: {
      id: r.candidate.id,
      electionId: r.candidate.electionId,
      fullName: r.candidate.fullName,
      party: r.candidate.party,
      partyAbbreviation: r.candidate.partyAbbreviation,
      state: r.candidate.state,
      photoUrl: r.candidate.photoUrl,
      manifesto: r.candidate.manifesto,
      voteCount: r.voteCount,
      createdAt: r.candidate.createdAt.toISOString(),
    },
    voteCount: r.voteCount,
    percentage: totalVotes > 0 ? Math.round((r.voteCount / totalVotes) * 100 * 10) / 10 : 0,
  }));

  res.json({
    election: {
      id: election.id,
      title: election.title,
      description: election.description,
      type: election.type,
      startDate: election.startDate,
      endDate: election.endDate,
      status: election.status,
      createdAt: election.createdAt.toISOString(),
    },
    candidates: candidatesWithPercentage,
    totalVotes,
    turnoutPercentage,
    winner: winner ? {
      id: winner.id,
      electionId: winner.electionId,
      fullName: winner.fullName,
      party: winner.party,
      partyAbbreviation: winner.partyAbbreviation,
      state: winner.state,
      photoUrl: winner.photoUrl,
      manifesto: winner.manifesto,
      createdAt: winner.createdAt.toISOString(),
    } : null,
  });
});

export default router;
