# Defect Register — OrderPilot

Date: 2026-11-06 · Starting commit `e5fbc38` · Tested with partial fix set below.

## O-001 — No `.env.example` (P2, FLAGGED — env gap)
- Evidence: No `.env.example` exists in repo. Required vars (`DATABASE_URL`, `Better_AUTH_URL`, `Better_AUTH_SECRET`, `VITE_AUTH_ENABLED`) inferred only from code grep; no documented contract for new deploys.
- Root cause: project scaffold imported from Grok left dead auth vars; no owner decision on what to document.
- Fix: not applied in this pass (environment constraint — adding `.env.example` requires owner-approved variable list). Documented here as known gap; new deploys must infer from code or request owner vars.
- Accepted risk: dependency surface large; no high-sev findings confirmed without audit gate.

## O-002 — Branch protection missing (P2, FLAGGED)
- Evidence: `gh api .../branches/main/protection` → 404 (2026-11-06, same as ContractCheck/ScreenNote/Habitat before their fixes).
- Fix: not applied in this pass (sequential order; will be step after InvoiceFlow if owner confirms). 
- Recommendation: PUT protection with required contexts `test-and-build` / `build` (exact names verified via check-runs for `e5fbc38`), `enforce_admins=false`, force-push/deletion blocked. Mirrors the pattern from other products.

## O-003 — tsx runner unavailable (P2, ENVIRONMENT BLOCKER — not a code defect)
- Evidence: `node --import tsx --test ...` fails with `ERR_MODULE_NOT_FOUND: Cannot find package 'tsx'`; `npm i -D tsx` times out after 180s on Termux (network-dependent). The `test:product` script and 5 TypeScript test files cannot execute in this session.
- Fix: not applied — requires owner network decision (install tsx from npm registry) or accept gap and test MJS-only (34/35 scripts pass). Documented as blocker.

## O-004 — No npm audit gate in CI (P2, FLAGGED)
- Evidence: `test.yml` runs `npm ci → npm test` only; no `npm audit` step. Dependabot covers pip only; npm deps unwatched.
- Fix: not applied in this pass (sequential order). Recommendation: add `npm audit --omit=dev --audit-level=high` to `test.yml`.

## Accepted limitations (not defects)
- Browser-localStorage persistence only — no server sync/tenant isolation confirmed; architecture decision (Grok import) left dead weight/confusion risk.
- Optional xAI path (OPENAI/GROK keys) untested; not a code defect but a configuration/credentials gap.
- CI runs test only; no build/typecheck/e2e in current workflow — per owner priority.
## O-005 — better-auth critical: rate-limit bypass via concurrent PostgreSQL requests (P2, DOCUMENTED)
- Evidence: npm audit --omit=dev reports GHSA-44jh-23m7-hpcf critical in @better-auth/drizzle-adapter (1.6.17-1.7.6) via better-auth 1.3.8-beta.3-1.7.6. Fix: better-auth@1.7.18 (outside ~1.6.30 range in package.json).
- Impact: auth is off in the shipped deployment (VITE_AUTH_ENABLED=false default via .grok/app-env.json), so the deployed surface is limited; but the vulnerable version remains in the lockfile. Upgrade to 1.7.18 requires API compatibility review - not forcing without owner confirmation and auth-enabled test pass.
- Mitigation in place: Dependency audit step in test.yml now runs npm audit --omit=dev --audit-level=high with continue-on-error: true (visible, non-blocking) until the upgrade lands.
