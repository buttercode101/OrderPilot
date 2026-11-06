# Security Review — OrderPilot

Date: 2026-11-06 · Commit `e5fbc38` + partial fix set.

## Observed (verified)
- No P0/P1 severity findings confirmed in this pass.
- Better-Auth scaffold is dead off (`VITE_AUTH_ENABLED=false` default); no auth is shipped — this avoids auth-related surface risk but leaves "auth off" as a design choice needing owner confirmation.
- Browser-localStorage is the shipped product; no server DB sync confirmed — data-loss risk if browser data cleared (noted in inspection).
- `npm audit` not run from this env (see O-004). No high-severity findings confirmed without audit gate.
- Vercel deployment: live at `orderpilot-za.vercel.app` (200). No secrets found in repo source inspected.

## Not verified / gaps
- Unauthorised API access: no API routes verified against unauthenticated callers (auth is off by design; surface unknown).
- Database exposure: Neon/PGLite adapter present but DATABASE_URL not configured in this env; raw connection strings UNVERIFIED.
- Better-Auth secrets (`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`) scaffold vars — not present in repo, but if ever configured, must be server-only (`NEXT_PUBLIC_` prefix never used). Verified by grep.
- CSP / XSS: no custom CSP beyond default `vercel.json` settings — acceptable for SPA but not hardened.

## Secrets hygiene
- No credentials in repo; scaffold vars documented only as names in code comments. No secrets in this report.

## Critical note per §6.4
AI must never invent a business's prices or silently calculate a quotation using unapproved assumptions. This path is untested in this pass — cannot claim compliance. Untested = UNKNOWN, not PASS.