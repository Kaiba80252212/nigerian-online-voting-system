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

const router: IRouter = Router();

router.use(healthRouter);

// Auth routes — strict rate limiting (brute-force / credential-stuffing protection)
router.use("/auth", authLimiter, authRouter);

// Vote casting — very strict rate limit (one person = one vote per election)
router.use("/votes", voteLimiter, votesRouter);

// Admin routes — moderate rate limit
router.use("/voters", adminLimiter, votersRouter);
router.use("/dashboard", adminLimiter, dashboardRouter);

// Public / lightly-guarded routes (still covered by the global generalLimiter)
router.use("/elections", electionsRouter);
router.use("/elections/:electionId/candidates", candidatesRouter);
router.use("/elections", resultsRouter);
router.use("/profile", profileRouter);

export default router;
