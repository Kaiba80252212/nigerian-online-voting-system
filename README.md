# Nigerian Online Voting System (Nigeria Votes)

A full-stack online voting system for Nigerian elections with biometric facial
recognition, built to INEC standards. React + Vite frontend, Express 5 API,
PostgreSQL + Drizzle ORM, contract-first API via OpenAPI → Orval codegen.

## Repository layout

| Path | Purpose |
| --- | --- |
| `artifacts/api-server` | Express 5 API (routes in `src/routes/`) |
| `artifacts/voting-system` | Public + admin React frontend (`src/pages/`) |
| `artifacts/mockup-sandbox` | Design/component sandbox |
| `lib/db` | Drizzle schema + DB client |
| `lib/api-spec` | `openapi.yaml` — the API contract (source of truth) |
| `lib/api-client-react` | Generated React Query hooks |
| `lib/api-zod` | Generated Zod validation schemas |

## Setup

Requirements: pnpm 10+, Node.js 20+, a PostgreSQL database.

```bash
pnpm install

# 1. Point at your database
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# 2. JWT signing secret (mandatory — the server refuses to start without it)
export SESSION_SECRET="$(openssl rand -hex 32)"

# 3. Create tables
pnpm --filter @workspace/db run push

# 4. Create the default admin (admin / nigeria2025; override with
#    ADMIN_USERNAME / ADMIN_PASSWORD env vars)
pnpm --filter @workspace/api-server run seed
```

## Run

```bash
# API on :8080 (builds then starts)
PORT=8080 pnpm --filter @workspace/api-server run dev

# Frontend dev server; /api is proxied to the API automatically
# (override the proxy target with API_PROXY_TARGET when needed)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/voting-system run dev
```

## Other commands

- `pnpm run typecheck` — typecheck every package
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client hooks
  and Zod schemas after editing `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — apply schema changes to the database

## Security notes

- Admin JWTs (8 h, bcrypt passwords) guard all `/api/voters`, `/api/dashboard`
  and every election/candidate mutation endpoint.
- Voter JWTs (30 min) are issued only after biometric face match
  (face-api.js descriptor distance < 0.6).
- One vote per voter per election is enforced by a unique index on
  `votes(voter_id, election_id)`; receipt codes are cryptographically random.
- Requests pass through Helmet headers, HPP protection, layered rate limits,
  an XSS/SQLi payload guard, and automatic IP blocking of repeat offenders.
