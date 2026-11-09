// Postgres error helpers. node-postgres surfaces constraint violations with
// `code = "23505"` and a `constraint` name; Drizzle ORM may wrap that error as
// the `cause` of its own error, so we check both layers.
function findPgError(err: unknown): { code?: string; constraint?: string } | null {
  let current: unknown = err;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth++) {
    const candidate = current as { code?: string; constraint?: string; cause?: unknown };
    if (typeof candidate.code === "string") return candidate;
    current = candidate.cause;
  }
  return null;
}

export function isPgError(err: unknown, code: string): boolean {
  return findPgError(err)?.code === code;
}

/** True when `err` is a Postgres unique-constraint violation, optionally
 * filtered to violations whose constraint name mentions `nameFragment`. */
export function isUniqueViolation(err: unknown, nameFragment?: string): boolean {
  if (!isPgError(err, "23505")) return false;
  if (!nameFragment) return true;
  const constraint = findPgError(err)?.constraint;
  return typeof constraint === "string" && constraint.includes(nameFragment);
}
