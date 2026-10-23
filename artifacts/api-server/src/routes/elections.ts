import { Router } from "express";
import { db } from "@workspace/db";
import { electionsTable, candidatesTable, votesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateElectionBody, UpdateElectionBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const { status } = req.query as { status?: string };
  let query = db.select().from(electionsTable);
  const elections = status
    ? await db.select().from(electionsTable).where(eq(electionsTable.status, status))
    : await query;

  const enriched = await Promise.all(
    elections.map(async (e) => {
      const [{ count: candidateCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(candidatesTable)
        .where(eq(candidatesTable.electionId, e.id));
      const [{ count: totalVotes }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(votesTable)
        .where(eq(votesTable.electionId, e.id));
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type,
        startDate: e.startDate,
        endDate: e.endDate,
        status: e.status,
        candidateCount,
        totalVotes,
        createdAt: e.createdAt.toISOString(),
      };
    })
  );
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const parsed = CreateElectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { title, description, type, startDate, endDate } = parsed.data;
  const [election] = await db.insert(electionsTable).values({
    title,
    description: description ?? null,
    type,
    startDate,
    endDate,
    status: "upcoming",
  }).returning();

  res.status(201).json({
    id: election.id,
    title: election.title,
    description: election.description,
    type: election.type,
    startDate: election.startDate,
    endDate: election.endDate,
    status: election.status,
    candidateCount: 0,
    totalVotes: 0,
    createdAt: election.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
  if (!election) { res.status(404).json({ error: "Election not found" }); return; }
  const [{ count: candidateCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(candidatesTable)
    .where(eq(candidatesTable.electionId, id));
  const [{ count: totalVotes }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votesTable)
    .where(eq(votesTable.electionId, id));
  res.json({
    id: election.id,
    title: election.title,
    description: election.description,
    type: election.type,
    startDate: election.startDate,
    endDate: election.endDate,
    status: election.status,
    candidateCount,
    totalVotes,
    createdAt: election.createdAt.toISOString(),
  });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateElectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.startDate !== undefined) updates.startDate = parsed.data.startDate;
  if (parsed.data.endDate !== undefined) updates.endDate = parsed.data.endDate;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  const [election] = await db.update(electionsTable).set(updates).where(eq(electionsTable.id, id)).returning();
  if (!election) { res.status(404).json({ error: "Election not found" }); return; }
  res.json({
    id: election.id,
    title: election.title,
    description: election.description,
    type: election.type,
    startDate: election.startDate,
    endDate: election.endDate,
    status: election.status,
    createdAt: election.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(electionsTable).where(eq(electionsTable.id, id));
  res.status(204).send();
});

export default router;
