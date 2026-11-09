import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { candidatesTable, votesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateCandidateBody, UpdateCandidateBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";
import { intParam } from "../lib/params";

const router = Router({ mergeParams: true });

// Params arrive via mergeParams from the "/elections/:electionId/candidates" mount.
// Express 5 types route params from the declared path only, so annotate explicitly.
type ElectionRouteParams = { electionId: string };

function electionIdParam(req: Request): number | null {
  return intParam((req.params as ElectionRouteParams).electionId);
}

function candidateWithVotes(c: typeof candidatesTable.$inferSelect, voteCount: number) {
  return {
    id: c.id,
    electionId: c.electionId,
    fullName: c.fullName,
    party: c.party,
    partyAbbreviation: c.partyAbbreviation,
    state: c.state,
    photoUrl: c.photoUrl,
    manifesto: c.manifesto,
    voteCount,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const electionId = electionIdParam(req);
  if (electionId === null) { res.status(400).json({ error: "Invalid electionId" }); return; }
  const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.electionId, electionId));
  const enriched = await Promise.all(
    candidates.map(async (c) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(votesTable)
        .where(eq(votesTable.candidateId, c.id));
      return candidateWithVotes(c, count);
    })
  );
  res.json(enriched);
});

router.post("/", requireAdmin, async (req, res) => {
  const electionId = electionIdParam(req);
  if (electionId === null) { res.status(400).json({ error: "Invalid electionId" }); return; }
  const parsed = CreateCandidateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { fullName, party, partyAbbreviation, state, photoUrl, manifesto } = parsed.data;
  const [candidate] = await db.insert(candidatesTable).values({
    electionId,
    fullName,
    party,
    partyAbbreviation,
    state: state ?? null,
    photoUrl: photoUrl ?? null,
    manifesto: manifesto ?? null,
  }).returning();
  res.status(201).json(candidateWithVotes(candidate, 0));
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const id = intParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateCandidateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.fullName = parsed.data.fullName;
  if (parsed.data.party !== undefined) updates.party = parsed.data.party;
  if (parsed.data.partyAbbreviation !== undefined) updates.partyAbbreviation = parsed.data.partyAbbreviation;
  if (parsed.data.state !== undefined) updates.state = parsed.data.state;
  if (parsed.data.photoUrl !== undefined) updates.photoUrl = parsed.data.photoUrl;
  if (parsed.data.manifesto !== undefined) updates.manifesto = parsed.data.manifesto;
  const [candidate] = await db.update(candidatesTable).set(updates).where(eq(candidatesTable.id, id)).returning();
  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(votesTable).where(eq(votesTable.candidateId, id));
  res.json(candidateWithVotes(candidate, count));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = intParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(candidatesTable).where(eq(candidatesTable.id, id));
  res.status(204).send();
});

export default router;
