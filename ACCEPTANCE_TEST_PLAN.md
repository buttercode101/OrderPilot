# Acceptance Test Plan — OrderPilot

Date: 2026-11-06 · Tested commit: `e5fbc38` · Env: Termux, Node v26.3.1 (CI: 24.x; tsx blocker).
Core journey: Business setup → customer enquiry → AI interpretation → missing questions → price calculation → quotation → follow-up.

## Mandatory tests — execution results
| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | New business onboarding | UNKNOWN | no DATABASE_URL configured in this env |
| 2 | Business profile creation | UNKNOWN | scaffold exists; DATABASE_URL required |
| 3 | Customer creation | UNKNOWN | no test data/env |
| 4 | Enquiry submission | UNKNOWN | JS-rendered SPA; curl returns empty body |
| 5 | Ambiguous enquiry | UNKNOWN | AI extraction untested |
| 6 | Incomplete enquiry | UNKNOWN | no test fixtures |
| 7 | Contradictory enquiry | UNKNOWN | |
| 8 | AI extraction / missing info detection | UNKNOWN | `--import tsx` unavailable; `npm i -D tsx` times out (180s) on Termux |
| 9 | Price book / deterministic calculations | UNKNOWN | same tsx blocker |
| 10 | Quote generation | UNKNOWN | |
| 11 | PDF generation | UNKNOWN | |
| 12 | Customer association / pipeline transitions | UNKNOWN | |
| 12 | Follow-up preparation | UNKNOWN | |
| 14 | Data persistence (localStorage) | PARTIAL | observable in browser; no server sync test |
| 15 | Concurrent updates | UNKNOWN | |
| 16 | Network interruption recovery | UNKNOWN | |

**Test execution note:** Base `npm test` runs MJS scripts (`scripts/**/*.test.mjs`) + 5 `.ts` files. 34 pass, 1 fail (`app-data.test.ts` — tsx unavailable). `test:product` (`node --import tsx --test src/lib/orderpilot/orderpilot.test.ts`) cannot run without `tsx`; installing it times out on Termux network. All TypeScript-dependent tests marked UNKNOWN/BLOCKED pending owner tsx availability decision.

Counts: PASS 34 (MJS only) · UNKNOWN 16 · BLOCKED 1 (tsx). Total 35+ script paths.