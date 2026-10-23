# Nigeria Votes

A full-stack online voting system for Nigerian elections with biometric facial recognition, built to INEC standards.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/voting-system run dev` — run the frontend (auto port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Charts: Recharts
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (admins, voters, elections, candidates, votes, activityLog)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/voting-system/src/pages/` — React pages
- `artifacts/voting-system/src/components/` — shared components (BiometricCapture, AdminSidebar, PublicNav)

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both server validation (Zod) and client hooks (React Query), preventing drift.
- **Biometric via face-api.js**: Loaded from CDN at runtime to avoid bundle bloat. Face descriptors (128-float array) stored as JSONB. Euclidean distance < 0.6 = match.
- **Voter JWT tokens**: 30-minute short-lived tokens issued after biometric verification, carrying `voterId` and `state`. No session state on server.
- **Anonymous votes**: `votes` table links `voterId` + `candidateId` but receipt codes are random — unlinkable by voters.
- **Admin JWT tokens**: 8-hour tokens issued after password auth (bcrypt). Stored in `sessionStorage` only.

## Product

- **Public voter registration**: NIN + personal info + biometric face capture
- **Biometric identity verification**: Face scan matched against stored descriptor (Euclidean distance threshold)
- **Secure vote casting**: Token-gated, one-vote-per-election enforcement, tamper-proof receipt code
- **Live election results**: Bar charts with real-time vote tallies and turnout percentages
- **Admin panel**: Create/manage elections, add/remove candidates, view all registered voters with filters

## User preferences

- Nigerian green colour theme (#008751) throughout
- Admin default credentials: `admin` / `nigeria2025`
- All 36 Nigerian states + FCT supported in dropdowns
- Party abbreviations (APC, PDP, LP, NNPP) shown prominently on candidate cards

## Gotchas

- face-api.js models are loaded from GitHub raw CDN — requires internet. On first biometric capture, model loading takes ~5–10 seconds.
- The admin bcrypt hash must be generated from within `artifacts/api-server` directory where `bcryptjs` is installed.
- `pnpm --filter @workspace/db run push` must be run after any schema changes before the API will work.
- Routes are path-based: API at `/api`, voting frontend at `/`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/index.ts`
