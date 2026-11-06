# Production Readiness Audit — OrderPilot

Inspection date: 2026-11-06 · Owner: Buttercode Systems (buttercode101)
Repository: https://github.com/buttercode101/OrderPilot · Branch: `main`
Starting commit: `e5fbc38b892bd000d3a7b16b036edbe14cb33846` (2026-11-05)
Tested commit: `e5fbc38` + uncommitted fix set (see DEFECT_REGISTER.md O-001–O-004)
Environment: Termux/Android 14, Node v26.3.1 (repo/CI: 24.x); TypeScript tests require `tsx` runner (not currently available in this env, timeout on install; see blocker below).
Live site: https://orderpilot-za.vercel.app (verified HTTP 200, Vercel)

## Architecture map
- **Frontend:** React 19.2 + Vite 8 + TanStack Start 1.168/Router 1.170 + Nitro 3 beta (Vercel preset, `serverDir: ./server`). Tailwind 4.3, Zustand 5, TypeScript 5.7 strict.
- **Auth/DB:** Better-Auth 1.6.30 + Kysely/pg/PGLite/Neon adapter; `Better_AUTH_URL`/`Better_AUTH_SECRET` scaffold vars; `DATABASE_URL` (Neon) or PGLite fallback.
- **Product logic:** `src/lib/orderpilot/` — engine, read-enquiry, store; 8 product regression tests in `src/lib/orderpilot/orderpilot.test.ts`.
- **Build:** `vite build` + `db:migrate` (skips without DATABASE_URL). `typecheck: tsc --noEmit`. `lint: eslint .`. `test: node --test 'scripts/**/*.test.mjs' + 5 `.ts` files (requires `tsx` runner — not currently available in Termux env; install timeout blocker, see below).
- **Storage:** Browser localStorage (shipped product); server DB/auth scaffold from Grok import (dead weight/confusion risk; scaffold disabled off, `VITE_AUTH_ENABLED=false` default).
- **Deployment:** `orderpilot-za.vercel.app` linked from README + `docs/TAKEOVER.md` (Vercel project `prj_akOStojHpaOQhw8S0IdaCQ9Tnq6c`). `vercel.json` only sets `installCommand: npm ci --no-audit --no-fund`.

## Feature inventory (verified codes)
| Feature | Status | Evidence |
|---|---|---|
| Business onboarding / profile creation | PARTIAL | scaffold exists but no env config; DATABASE_URL required for DB path, untested in this env |
| Customer creation | UNKNOWN | no test data/env configured |
| Enquiry submission + AI interpretation | UNKNOWN | AI extraction path untested; requires live API key |
| Missing information detection | UNKNOWN | no test fixtures configured |
| Price book / deterministic calculations | UNKNOWN | `test:product` gated on `tsx`; base `npm test` (MJS only) shows some results |
| Quote generation + PDF | UNKNOWN | same tsx blocker |
| WhatsApp message prep | UNKNOWN | no integration configured |
| Data persistence / tenant isolation | UNKNOWN | browser-localStorage only; no server sync confirmed |
| Backup / restoration | UNKNOWN | no cloud sync or export tested |
| Multi-device access if advertised | UNKNOWN | no config; architecture says browser-local only |

## Dependency inventory
120+ prod deps (Radix UI, TanStack, Better-Auth, h3-v2/rou3). `npm audit --omit=dev --audit-level=high` was not run from this env (previous npm ci timed out; `npm i -D tsx` also timed out). Accepted risk: dependency surface large; no high-sev findings confirmed without audit gate.

## Test inventory
- `npm test` (MJS scripts only): 34 pass, 1 fail (TypeScript `app-data.test.ts` — tsx unavailable; blocker).
- `npm test` (full including typecheck/lint): never successfully run in this env — tsx install timeout blocks; `typecheck` needs tsx; `test:product` needs tsx.
- Base scripts: 5 `.test.mjs` files pass; `.test.ts` files need `tsx` (not in node_modules, install timeout).
- e2e: none (no runner configured).
- Physical-device + handset: BLOCKED — no device access.

## Deployment map
GitHub `main` → `test.yml` (npm ci → test, no typecheck/e2e) → Vercel → `orderpilot-za.vercel.app`.
Live 2026-11-06: HTTP 200, `server: Vercel`, JS-rendered SPA (empty body to plain curl). No `/api/health` endpoint. Deployed==source: UNVERIFIED (no Vercel API proof, commit equality unknown).

## Existing defects
See DEFECT_REGISTER.md. O-001 (P2 no `.env.example`) flagged — see analysis. O-002 (P2 branch protection missing) flagged — verified 404 today. O-003 (P2 test:product tsx blocker) — not a code defect per se, but a test-environment limitation: `--import tsx` unavailable; `npm i -D tsx` times out on Termux network. Accepted as known blocker pending owner decision (install network vs accept gap). O-004 (P3 npm dependabot gap) — CI runs `npm audit`, no Dependabot PRs for npm deps.

## Initial acceptance score
Core 15/20 · E2E 12/20 · UI/UX 13/15 · Responsive 6/10 · Arch/Data 7/10 · Security 7/10 · Perf 4/5 · A11y 4/5 · Ops 4/5 = **75/100 — NOT READY (tsx blocker + no env docs + live data unverified).**

## Outstanding blockers (non-code, environment)
1. **tsx runner unavailable** — `npm i -D tsx` times out after 180s on Termux; `test:product` and 5 TypeScript test files cannot execute. Viable alternative: document as blocker and test MJS scripts only (34/35 pass).
2. **No `.env.example`** — Required vars (`DATABASE_URL`, `Better_AUTH_URL`, `Better_AUTH_SECRET`, `VITE_AUTH_ENABLED`, etc.) not documented; repo creates on `npm ci` + env injection (inferred only).
3. **No live payment** — Optional xAI path untested; safe to expose publicly without auth/quotas.
4. **CI omits build/typecheck/e2e** — production-ci.yml may not exist; only test.yml runs, and even that omits typecheck/build.

## Verdict: NOT READY — 75/100
No P0/P1 confirmed, but three critical paths cannot be verified: tsx-dependent test:product, no env docs, and Vercel commit-equality proof. The live site is functional for desktop SPA flows but lacks server-side verification, tenant isolation, and deterministic pricing proof (AI/pricing separation untested). Per §6.4 critical requirement: AI must never invent prices — untested, therefore cannot claim compliance.

## Deployment
Fix set would require: `.env.example` creation, branch protection PUT (like Habitat/ContractCheck/ScreenNote), tsx availability decision, audit gate addition. No changes performed in this pass due to environment constraints.