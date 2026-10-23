import { Router } from "express";
import { db } from "@workspace/db";
import { votersTable, electionsTable, votesTable, activityLogTable, candidatesTable } from "@workspace/db";
import { eq, sql, gte, desc, and } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    [{ totalVoters }],
    [{ verifiedVoters }],
    [{ totalElections }],
    [{ activeElections }],
    [{ totalVotesCast }],
    [{ registeredToday }],
  ] = await Promise.all([
    db.select({ totalVoters: sql<number>`count(*)::int` }).from(votersTable),
    db.select({ verifiedVoters: sql<number>`count(*)::int` }).from(votersTable).where(eq(votersTable.status, "verified")),
    db.select({ totalElections: sql<number>`count(*)::int` }).from(electionsTable),
    db.select({ activeElections: sql<number>`count(*)::int` }).from(electionsTable).where(eq(electionsTable.status, "active")),
    db.select({ totalVotesCast: sql<number>`count(*)::int` }).from(votesTable),
    db.select({ registeredToday: sql<number>`count(*)::int` }).from(votersTable).where(gte(votersTable.createdAt, today)),
  ]);

  res.json({ totalVoters, verifiedVoters, totalElections, activeElections, totalVotesCast, registeredToday });
});

router.get("/recent-activity", async (req, res) => {
  const activities = await db.select().from(activityLogTable)
    .orderBy(sql`${activityLogTable.createdAt} DESC`)
    .limit(20);

  res.json(activities.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    state: a.state,
    timestamp: a.createdAt.toISOString(),
  })));
});

router.get("/voter-turnout", async (req, res) => {
  const stateVoters = await db
    .select({ state: votersTable.state, count: sql<number>`count(*)::int` })
    .from(votersTable)
    .groupBy(votersTable.state);

  const stateVotes = await db
    .select({ state: votesTable.state, count: sql<number>`count(*)::int` })
    .from(votesTable)
    .groupBy(votesTable.state);

  const votesByState = new Map(stateVotes.map((s) => [s.state, s.count]));

  const result = stateVoters.map((sv) => {
    const votesCast = votesByState.get(sv.state) ?? 0;
    return {
      state: sv.state,
      registeredVoters: sv.count,
      votesCast,
      turnoutPercentage: sv.count > 0 ? Math.round((votesCast / sv.count) * 100 * 10) / 10 : 0,
    };
  });

  res.json(result);
});

router.get("/audit-log", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10)));
  const offset = (page - 1) * limit;
  const electionIdFilter = req.query.electionId ? parseInt(String(req.query.electionId), 10) : null;
  const stateFilter = req.query.state ? String(req.query.state) : null;
  const partyFilter = req.query.party ? String(req.query.party) : null;

  const conditions = [];
  if (electionIdFilter) conditions.push(eq(votesTable.electionId, electionIdFilter));
  if (stateFilter) conditions.push(eq(votesTable.state, stateFilter));
  if (partyFilter) conditions.push(eq(candidatesTable.partyAbbreviation, partyFilter));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [voteRows, [{ totalCount }], allElections, hourlyRaw] = await Promise.all([
    db
      .select({
        id: votesTable.id,
        receiptCode: votesTable.receiptCode,
        electionId: votesTable.electionId,
        electionTitle: electionsTable.title,
        electionType: electionsTable.type,
        candidateName: candidatesTable.fullName,
        party: candidatesTable.party,
        partyAbbreviation: candidatesTable.partyAbbreviation,
        state: votesTable.state,
        votedAt: votesTable.createdAt,
      })
      .from(votesTable)
      .innerJoin(electionsTable, eq(votesTable.electionId, electionsTable.id))
      .innerJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
      .where(whereClause)
      .orderBy(desc(votesTable.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ totalCount: sql<number>`count(*)::int` })
      .from(votesTable)
      .innerJoin(electionsTable, eq(votesTable.electionId, electionsTable.id))
      .innerJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
      .where(whereClause),

    db
      .select({
        electionId: electionsTable.id,
        electionTitle: electionsTable.title,
        partyAbbreviation: candidatesTable.partyAbbreviation,
        party: candidatesTable.party,
        candidateName: candidatesTable.fullName,
        voteCount: sql<number>`count(*)::int`,
      })
      .from(votesTable)
      .innerJoin(electionsTable, eq(votesTable.electionId, electionsTable.id))
      .innerJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
      .groupBy(
        electionsTable.id,
        electionsTable.title,
        candidatesTable.partyAbbreviation,
        candidatesTable.party,
        candidatesTable.fullName,
      )
      .orderBy(electionsTable.id, desc(sql`count(*)`)),

    db
      .select({
        hour: sql<string>`to_char(date_trunc('hour', ${votesTable.createdAt}), 'YYYY-MM-DD"T"HH24:00:00"Z"')`,
        voteCount: sql<number>`count(*)::int`,
      })
      .from(votesTable)
      .groupBy(sql`date_trunc('hour', ${votesTable.createdAt})`)
      .orderBy(sql`date_trunc('hour', ${votesTable.createdAt})`),
  ]);

  // Group allElections into per-election summaries with party breakdowns
  const electionMap = new Map<number, { electionId: number; electionTitle: string; totalVotes: number; partyBreakdown: { partyAbbreviation: string; party: string; candidateName: string; voteCount: number; percentage: number }[] }>();
  for (const row of allElections) {
    if (!electionMap.has(row.electionId)) {
      electionMap.set(row.electionId, { electionId: row.electionId, electionTitle: row.electionTitle, totalVotes: 0, partyBreakdown: [] });
    }
    const entry = electionMap.get(row.electionId)!;
    entry.totalVotes += row.voteCount;
    entry.partyBreakdown.push({ partyAbbreviation: row.partyAbbreviation, party: row.party, candidateName: row.candidateName, voteCount: row.voteCount, percentage: 0 });
  }
  // Fill percentages
  for (const entry of electionMap.values()) {
    for (const pb of entry.partyBreakdown) {
      pb.percentage = entry.totalVotes > 0 ? Math.round((pb.voteCount / entry.totalVotes) * 1000) / 10 : 0;
    }
  }

  res.json({
    votes: voteRows.map((v) => ({ ...v, votedAt: v.votedAt.toISOString() })),
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
    elections: Array.from(electionMap.values()),
    hourlyTimeline: hourlyRaw,
  });
});

export default router;
