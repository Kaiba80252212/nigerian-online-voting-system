import { Router } from "express";
import { db } from "@workspace/db";
import { adminsTable, votersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AdminLoginBody, RegisterVoterBody, VerifyVoterBiometricBody } from "@workspace/api-zod";
import { activityLogTable } from "@workspace/db";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "nigeria-votes-secret-2025";

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

router.post("/admin/login", async (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username)).limit(1);
  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = jwt.sign({ adminId: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: "8h" });
  res.json({
    token,
    admin: { id: admin.id, username: admin.username, role: admin.role },
  });
});

router.post("/voter/register", async (req, res) => {
  const parsed = RegisterVoterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + JSON.stringify(parsed.error.issues) });
    return;
  }
  const { nin, fullName, dateOfBirth, state, lga, pollingUnit, phoneNumber, faceDescriptor } = parsed.data;

  // Age eligibility: must be 18 or older
  // dateOfBirth is a JS Date (coerced by Zod)
  if (dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age--;
    if (age < 18) {
      res.status(403).json({ error: "You must be 18 years or older to register as a voter." });
      return;
    }
  }

  const existing = await db.select().from(votersTable).where(eq(votersTable.nin, nin)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "A voter with this NIN is already registered" });
    return;
  }

  const [voter] = await db.insert(votersTable).values({
    nin,
    fullName,
    dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : "",
    state,
    lga,
    pollingUnit,
    phoneNumber: phoneNumber ?? null,
    status: "registered",
    faceDescriptor: faceDescriptor as unknown as null,
  }).returning();

  await db.insert(activityLogTable).values({
    type: "voter_registered",
    description: `${fullName} registered from ${state}`,
    state,
  });

  res.status(201).json({
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

router.post("/voter/verify", async (req, res) => {
  const parsed = VerifyVoterBiometricBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { nin, faceDescriptor } = parsed.data;

  const [voter] = await db.select().from(votersTable).where(eq(votersTable.nin, nin)).limit(1);
  if (!voter) {
    res.status(401).json({ error: "Voter not found with this NIN" });
    return;
  }

  // Age eligibility check at verify time (guards against edge cases)
  if (voter.dateOfBirth) {
    const dob = new Date(voter.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) {
      res.status(403).json({ error: "You are not eligible to vote. Voters must be 18 years or older." });
      return;
    }
  }

  if (voter.faceDescriptor) {
    const stored = voter.faceDescriptor as number[];
    const distance = euclideanDistance(faceDescriptor, stored);
    if (distance > 0.6) {
      res.status(401).json({ error: "Biometric verification failed. Face does not match registered data." });
      return;
    }
  }

  await db.update(votersTable).set({ status: "verified" }).where(eq(votersTable.id, voter.id));

  const token = jwt.sign({ voterId: voter.id, nin: voter.nin, state: voter.state }, JWT_SECRET, { expiresIn: "30m" });

  res.json({
    token,
    voter: {
      id: voter.id,
      nin: voter.nin,
      fullName: voter.fullName,
      dateOfBirth: voter.dateOfBirth,
      state: voter.state,
      lga: voter.lga,
      pollingUnit: voter.pollingUnit,
      phoneNumber: voter.phoneNumber,
      status: "verified",
      createdAt: voter.createdAt.toISOString(),
    },
  });
});

export default router;
