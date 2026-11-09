import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import electionsRouter from "./elections";
import candidatesRouter from "./candidates";
import votesRouter from "./votes";
import resultsRouter from "./results";
import votersRouter from "./voters";
import dashboardRouter from "./dashboard";
import profileRouter from "./profile";
import { authLimiter, voteLimiter, adminLimiter } from "../middlewares/security";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

router.use(healthRouter);

// Auth routes — strict rate limiting (brute-force / credential-stuffing protection)
router.use("/auth", authLimiter, authRouter);

// Vote casting — very strict rate limit (one person = one vote per election).
// The limiter only applies to POST vote casting; public receipt verification
// (GET /votes/verify) is governed by the general limiter instead.
router.use("/votes", voteLimiter, votesRouter);

// Admin routes — moderate rate limit + valid admin JWT required
router.use("/voters", adminLimiter, requireAdmin, votersRouter);
router.use("/dashboard", adminLimiter, requireAdmin, dashboardRouter);

// Public / lightly-guarded routes (still covered by the global generalLimiter).
// Mutating election/candidate endpoints self-protect via requireAdmin.
router.use("/elections", electionsRouter);
router.use("/elections/:electionId/candidates", candidatesRouter);
router.use("/elections", resultsRouter);
router.use("/profile", profileRouter);

export default router;
