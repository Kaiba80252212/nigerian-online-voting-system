import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  helmetMiddleware,
  generalLimiter,
  hppMiddleware,
  suspiciousPayloadGuard,
  autoBlockMiddleware,
} from "./middlewares/security";

const app: Express = express();

// ── Trust proxy: needed for accurate IP behind Replit's reverse proxy ─────────
app.set("trust proxy", 1);

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmetMiddleware);

// ── IP auto-block check ───────────────────────────────────────────────────────
app.use(autoBlockMiddleware);

// ── HTTP Parameter Pollution protection ───────────────────────────────────────
app.use(hppMiddleware);

// ── General rate limit ────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.REPLIT_DOMAINS
  ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin (server-to-server, curl, mobile)
      if (!origin) return callback(null, true);
      // In development allow any localhost origin
      if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
        return callback(null, true);
      }
      if (allowedOrigins.length === 0 || allowedOrigins.some((o) => origin.startsWith(o))) {
        return callback(null, true);
      }
      logger.warn({ origin }, "CORS request from disallowed origin blocked");
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // Cache preflight for 24 h
  })
);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Body parsing — strict 1 MB limit to prevent large-payload attacks ─────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Suspicious payload scanner (XSS + SQL injection patterns) ─────────────────
app.use(suspiciousPayloadGuard);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
