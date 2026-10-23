import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

// ── Helmet: Security response headers ────────────────────────────────────────
// Protects against: XSS, clickjacking, MIME-sniffing, protocol downgrade
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "raw.githubusercontent.com"],
      styleSrc:      ["'self'", "'unsafe-inline'"],
      imgSrc:        ["'self'", "data:", "blob:"],
      connectSrc:    ["'self'"],
      fontSrc:       ["'self'", "data:"],
      objectSrc:     ["'none'"],
      mediaSrc:      ["'self'", "blob:"],
      frameSrc:      ["'none'"],
      frameAncestors:["'none'"],
      workerSrc:     ["'self'", "blob:"],
      baseUri:       ["'self'"],
      formAction:    ["'self'"],
    },
  },
  // Disabled so the browser can access the camera for biometric capture
  crossOriginEmbedderPolicy: false,
  // Never allow this site to be embedded in an iframe (clickjacking)
  xFrameOptions: { action: "deny" },
  // Prevent MIME-type sniffing
  xContentTypeOptions: true,
  // Only send origin in referrer header, not full URL
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // HTTP Strict Transport Security — 1 year
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
  // Remove X-Powered-By: Express header (fingerprinting)
  hidePoweredBy: true,
});

// ── Rate limiters: DoS / DDoS / brute-force protection ───────────────────────

function makeRateLimitHandler(message: string) {
  return (req: Request, res: Response) => {
    logger.warn({ ip: req.ip, path: req.path, method: req.method }, "Rate limit exceeded");
    res.status(429).json({ error: message });
  };
}

// General API — 300 req / 15 min per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: makeRateLimitHandler(
    "Too many requests from this IP. Please wait before trying again."
  ),
  skip: (req) => req.path.endsWith("/healthz"),
});

// Authentication endpoints — 15 req / 15 min per IP
// Prevents: credential stuffing, brute-force login, registration flooding
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: makeRateLimitHandler(
    "Too many authentication attempts from this IP. Please wait 15 minutes before trying again."
  ),
});

// Vote casting — 20 req / hour per IP
// A legitimate voter casts at most 1 vote per election
export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: makeRateLimitHandler(
    "Unusual voting activity detected from your IP. Access is temporarily restricted."
  ),
});

// Admin panel — 30 req / 15 min per IP
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: makeRateLimitHandler(
    "Too many admin requests from this IP. Please wait before trying again."
  ),
});

// ── HPP: HTTP Parameter Pollution protection ──────────────────────────────────
// Prevents attackers from sending duplicate query params to confuse route logic
export const hppMiddleware = hpp();

// ── Suspicious payload guard: XSS + SQL injection pattern detection ───────────
// Note: Drizzle ORM already uses parameterised queries (SQL injection safe).
// This is an extra defense-in-depth layer that rejects obviously malicious payloads.
const XSS_PATTERNS: RegExp[] = [
  /<script[\s\S]*?>/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /eval\s*\(/i,
  /expression\s*\(/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<link\s/i,
  /<meta\s/i,
];

const SQL_PATTERNS: RegExp[] = [
  /'\s*(OR|AND)\s+'?[\w\d]/i,
  /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE)\b/i,
  /UNION\s+(ALL\s+)?SELECT\b/i,
  /--\s*$/m,
  /\/\*[\s\S]*?\*\//,
  /\bxp_\w+/i,
  /\bINFORMATION_SCHEMA\b/i,
  /\bSYS\.(TABLES|COLUMNS|OBJECTS)\b/i,
];

function isMalicious(val: unknown): boolean {
  if (typeof val === "string") {
    const decoded = decodeURIComponent(val.replace(/\+/g, " "));
    return (
      XSS_PATTERNS.some((p) => p.test(decoded)) ||
      SQL_PATTERNS.some((p) => p.test(decoded))
    );
  }
  if (Array.isArray(val)) return val.some(isMalicious);
  if (val !== null && typeof val === "object") {
    return Object.values(val as Record<string, unknown>).some(isMalicious);
  }
  return false;
}

export function suspiciousPayloadGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (isMalicious(req.body) || isMalicious(req.query) || isMalicious(req.params)) {
    logger.warn(
      { ip: req.ip, path: req.path, method: req.method },
      "Suspicious payload blocked"
    );
    res.status(400).json({ error: "Request contains disallowed content." });
    return;
  }
  next();
}

// ── IP blocklist: persistent block of known-bad IPs ──────────────────────────
// Automatically escalates after 5 rate-limit hits from same IP within 1 hour
const blockedIPs = new Set<string>();
const hitCount = new Map<string, { count: number; resetAt: number }>();
const BLOCK_THRESHOLD = 5;
const BLOCK_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function autoBlockMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip ?? "unknown";

  if (blockedIPs.has(ip)) {
    logger.warn({ ip, path: req.path }, "Blocked IP attempted access");
    res.status(403).json({ error: "Access from this IP has been temporarily suspended." });
    return;
  }
  next();
}

export function recordRateLimitHit(ip: string): void {
  const now = Date.now();
  const entry = hitCount.get(ip);

  if (!entry || now > entry.resetAt) {
    hitCount.set(ip, { count: 1, resetAt: now + BLOCK_WINDOW_MS });
    return;
  }

  entry.count++;
  if (entry.count >= BLOCK_THRESHOLD) {
    blockedIPs.add(ip);
    logger.warn({ ip }, "IP auto-blocked after repeated rate-limit violations");
    // Auto-unblock after 6 hours
    setTimeout(() => {
      blockedIPs.delete(ip);
      hitCount.delete(ip);
      logger.info({ ip }, "IP auto-unblocked after 6-hour cooling-off period");
    }, 6 * 60 * 60 * 1000);
  }
}
