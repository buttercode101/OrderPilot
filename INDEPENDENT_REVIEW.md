# OrderPilot — Independent Review (Phase 5)

**Date:** 2026-11-08 · **Branch:** `flagship-excellence` · **Commit under review:** `d9711b8`
**Scope:** Re-verification of prior audits against current HEAD. Prior verdicts: `RELEASE_ACCEPTANCE_REPORT.md` (2026-11-06, 75/100 NOT READY), `PRODUCTION_READINESS_AUDIT.md`, `DEFECT_REGISTER.md` (O-001–O-005), `SECURITY_REVIEW.md`.
**Constraint honoured:** better-auth stays **1.6.x** (`~1.6.30` in `package.json`, installed `1.6.34`). No upgrade attempted in this pass. No merge/push/deploy.

---

## 1. QA evidence (re-run 2026-11-08, this pass, on `d9711b8`)

| Command | Result | Evidence |
|---|---|---|
| `npm test` | **59 pass, 0 fail** (18 suites, ~4.9s) | Node test runner output: `tests 59 · pass 59 · fail 0` |
| `npm run test:product` | **12 pass, 0 fail** (~26s) | Incl. new d9711b8 tests: per-line confirm flips one flag only (bulk-confirm gone), send-anyway override records unconfirmed lines/blocking gaps, every trade incl. `other` yields non-empty starter book, composer limits + preview confidence |
| `npx tsc --noEmit` | **Clean, exit 0** | No output |
| `npm audit --omit=dev --audit-level=high` | **4 vulns: 1 critical, 1 moderate, 2 low** | Critical = O-005 (below). Moderate = seroval GHSA-f86p-h4j2 / GHSA-9wx9-5pv9. Note: audit exits non-zero on high-severity findings — CI step is `continue-on-error: true`, so it is visible but non-blocking. |

The 2026-11-06 tsx blocker (O-003, `RELEASE_ACCEPTANCE_REPORT.md`) is **resolved in this environment**: `test:product` and all TypeScript tests execute. `npm test` now covers the full suite (59, not the MJS-only 34).

---

## 2. Defect register re-check (O-001–O-005)

| ID | Prior status | Current status (verified 2026-11-08) |
|---|---|---|
| O-001 No `.env.example` | FLAGGED | **RESOLVED** — `.env.example` exists (added `6b80566`), covering `DATABASE_URL`, `VITE_AUTH_ENABLED`, `ORDERPILOT_AI_*`, `XAI_API_KEY`, `BETTER_AUTH_*`, Grok scaffold vars |
| O-002 Branch protection missing | FLAGGED | **NOT RE-VERIFIED** — no `gh` API check run this pass. Remains an owner/CI action, not a code defect |
| O-003 tsx runner unavailable | ENVIRONMENT BLOCKER | **RESOLVED** — `tsx` present; `test:product` 12/12 pass, `npm test` 59/59 |
| O-004 No npm audit gate in CI | FLAGGED | **RESOLVED (informational)** — `test.yml` now runs `npm audit --omit=dev --audit-level=high` with `continue-on-error: true`, plus a `typecheck` step. It will not fail the build while O-005 is open — deliberate, documented in the workflow |
| **O-005 better-auth critical (GHSA-44jh-23m7-hpcf)** | DOCUMENTED, fix outside 1.6.x | **OPEN — unchanged, by design.** See §3 |

---

## 3. O-005 — better-auth critical: status

- **Vulnerability:** GHSA-44jh-23m7-hpcf — rate-limit bypass via concurrent PostgreSQL requests, in `@better-auth/drizzle-adapter` / `@better-auth/kysely-adapter` (1.6.17–1.7.6) via better-auth 1.3.8-beta.3–1.7.6. Confirmed present in today's audit run.
- **Fix upstream:** better-auth `1.7.18`. **Constraint:** it must stay 1.6.x in this branch — the 1.7 upgrade was attempted 2026-11-06 and reverted (`9b0c857`) because it broke the API surface (`genericOAuthClient` removed from `better-auth/client/plugins`; `auth.api.signInWithOAuth2` removed) and failed typecheck.
- **Shipped exposure (mitigating):** auth is off in the shipped deployment (`VITE_AUTH_ENABLED=false` default, `.env.example`); the product is browser-localStorage only. The vulnerable code path is scaffold, not the shipped surface. This is the same assessment as `DEFECT_REGISTER.md O-005` and it still holds.
- **What remains:** migration to 1.7.x is **queued as owner-approved work** — API compatibility review + auth-enabled test pass. It is not forced by this pass, and no version bump was made.
- **Reviewer judgement:** keeping 1.6.x with a documented, non-shipped critical is defensible *for this branch*, but it is **not a production-auth posture**. Any change that enables auth (`VITE_AUTH_ENABLED=true`) without the 1.7 migration ships a known critical. That gate must be explicit in the release verdict.

---

## 4. Prior BLOCKED/UNVERIFIED items — re-checked

| Prior item (`RELEASE_ACCEPTANCE_REPORT.md`) | Now |
|---|---|
| tsx blocker | Resolved (§1) |
| `.env.example` missing | Resolved (O-001) |
| npm audit gate in CI | Resolved, informational (O-004) |
| AI pricing separation untested | **Now tested** — `test:product` covers unmatched enquiries cannot invent lines, AI catalog ids cannot introduce arbitrary prices, price edits do not silently change quotes, reply preserves manually chosen prices. Live xAI provider path remains untested (no key) — carried as a known limitation |
| Vercel commit-equality (deployed == source) | **UNVERIFIED** — no Vercel API proof this pass. Live site HTTP 200 carried from `PRODUCT_IDENTITY.md §1.6` (2026-11-08) |
| 11-viewport matrix / physical device | **NOT VERIFIED** — no Playwright matrix or device pass run this pass (`RESPONSIVE_COMPATIBILITY_REPORT.md` still stands) |
| Lighthouse targets | **NOT RUN** — no scores claimed (`PERFORMANCE_REPORT.md` stands) |
| Branch protection (O-002) | NOT RE-VERIFIED (§2) |

---

## 5. UX audit follow-through (d9711b8 vs `UX_AUDIT.md`)

d9711b8 closed or materially addressed several P1/P2 items from Phase 3:
- **UX-03 (P1, bulk-confirm)** — closed: per-line Confirm rows, N-of-M progress, derived Ready, recorded send-anyway override. Covered by new product tests.
- **UX-08 (P1, catering-only first run)** — closed: 3-step trade-first first run (`first-run.tsx`), starter list per trade including a new "other" list. New product test asserts every trade yields a non-empty book.
- **UX-12 (P3, composer silent limits)** — addressed: 8-char hint, truncation notice, amber guessed-preview fields.
- **UX-16 (P2, gap rigour)** — partially: "other" now has a starter list. Trade-by-trade blocking rigour unchanged.

Still open from the register (not touched by d9711b8): UX-01 clipboard silence, UX-02 no undo, UX-04 silent re-matching, UX-05 no in-place gap answers, UX-06 mark-sent decoupling, UX-07 unguarded transitions (partially mitigated by derived Ready), UX-09 starter list flips trade, UX-10 currency totals, UX-11 WhatsApp dead-end, UX-13–15, UX-17–19. These are P2/P3 and do not block the verdict below, but they are the next slice's backlog.

---

## 6. Reviewer verdict

**The 2026-11-06 NOT READY verdict was driven by environment blockers (tsx, env docs, audit gate), all now resolved and re-verified.** What remains open is either (a) deliberately deferred with a documented gate (O-005, gated on auth staying off), or (b) unverified non-code items (viewport/device/Lighthouse, Vercel equality, branch protection).

Independent-review recommendation: **CONDITIONALLY READY** for the current browser-local product, subject to the gates in `RELEASE_VERDICT.md`. The single hard gate is O-005: **auth must not be enabled on 1.6.x.**
