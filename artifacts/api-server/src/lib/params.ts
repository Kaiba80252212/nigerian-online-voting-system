// Express route params are typed as `string | string[] | undefined` in many
// overloads (e.g. once middleware is sandwiched between path and handler).
// Centralise safe integer parsing here.
export function intParam(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
