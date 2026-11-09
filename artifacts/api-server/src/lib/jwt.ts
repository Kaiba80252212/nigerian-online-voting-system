import jwt from "jsonwebtoken";

// The JWT signing secret must come from the environment. A hard-coded default
// would let anyone who has read the source forge voter and admin tokens.
export function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required but was not provided. " +
        "It is used to sign voter and admin JWT tokens.",
    );
  }
  return secret;
}

export interface VoterTokenPayload {
  voterId: number;
  nin: string;
  state: string;
}

export interface AdminTokenPayload {
  adminId: number;
  role?: string;
}

export function verifyVoterToken(token: string): VoterTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== "object" || payload === null) return null;
    const { voterId } = payload as Partial<VoterTokenPayload>;
    if (typeof voterId !== "number") return null;
    return payload as VoterTokenPayload;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== "object" || payload === null) return null;
    const { adminId } = payload as Partial<AdminTokenPayload>;
    if (typeof adminId !== "number") return null;
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}
