import { Router } from "express";
import { db } from "@workspace/db";
import { votersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { page = "1", limit = "20", state, status } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  let baseQuery = db.select().from(votersTable);
  let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(votersTable);

  if (state) {
    baseQuery = baseQuery.where(eq(votersTable.state, state)) as typeof baseQuery;
    countQuery = countQuery.where(eq(votersTable.state, state)) as typeof countQuery;
  }
  if (status) {
    baseQuery = baseQuery.where(eq(votersTable.status, status)) as typeof baseQuery;
    countQuery = countQuery.where(eq(votersTable.status, status)) as typeof countQuery;
  }

  const [voters, [{ count: total }]] = await Promise.all([
    baseQuery.limit(limitNum).offset(offset),
    countQuery,
  ]);

  res.json({
    voters: voters.map((v) => ({
      id: v.id,
      nin: v.nin,
      fullName: v.fullName,
      dateOfBirth: v.dateOfBirth,
      state: v.state,
      lga: v.lga,
      pollingUnit: v.pollingUnit,
      phoneNumber: v.phoneNumber,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
    })),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [voter] = await db.select().from(votersTable).where(eq(votersTable.id, id)).limit(1);
  if (!voter) { res.status(404).json({ error: "Voter not found" }); return; }
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
  });
});

export default router;
