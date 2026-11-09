import { type Request, type Response, type NextFunction } from "express";
import { verifyAdminToken } from "../lib/jwt";
import { logger } from "../lib/logger";

// Guards admin-only API routes. The admin JWT is issued by POST /api/auth/admin/login
// and must be supplied as an Authorization: Bearer <token> header.
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res
      .status(401)
      .json({ error: "Admin authentication required. Please log in." });
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    logger.warn({ ip: req.ip, path: req.path }, "Rejected invalid admin token");
    res
      .status(401)
      .json({ error: "Invalid or expired admin session. Please log in again." });
    return;
  }

  next();
}
