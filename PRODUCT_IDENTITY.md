# OrderPilot — Product Identity (Phase 1)

**Date:** 2026-11-08  
**Repo:** https://github.com/buttercode101/OrderPilot (local clone: `~/orderpilot-audit`, HEAD `9b0c857` per GitHub 2026-11-06; local tree inspected 2026-11-08)  
**Live:** https://orderpilot-za.vercel.app/ (verified live 2026-11-08 — extracted overview page; earlier TAKEOVER.md reports direct cloud-browser verification of R125.50 custom line → R1975.50 total, sent→won→paid, reload persistence)  
**Version:** 0.3.0 (`package.json`)  
**Owner (per prior audit):** Buttercode Systems / buttercode101 — separate product from Resolve ZA (`README.md:9`, `AGENTS.md:3`)

---

## 1. EVIDENCE (from repo + live site)

### 1.1 One-line identity
> Turn customer enquiries into quotes using your own prices, then track them through to paid jobs. (`README.md:5`, GitHub repo description)

**Target market:** Small service businesses in South Africa — caterers, cleaners, tradespeople, painters, event organisers (`README.md:9`).

### 1.2 Core jobs-to-be-done
| # | Job | How it works today (evidence) |
|---|-----|-------------------------------|
| 1 | Paste an enquiry | Paste from WhatsApp/email/social; deterministic pattern-matching reader extracts name, contact, service, quantity, when, location, notes (`README.md:13`, `src/lib/orderpilot/engine.ts:parseEnquiry`, 868 lines) |
| 2 | Review extracted details | Owner reviews fields; missing-detail questions ("gaps") generated per trade (`engine.ts:gaps()` — blocking vs non-blocking; catering asks menu/dietary, cleaning asks extras, handyman asks emergency/photo, painting asks colours, events asks theme) |
| 3 | Maintain price book | Owner's own price book; starter lists per trade (catering, cleaning, handyman, painting, events — `presets.ts`); example prices explicitly NOT market recommendations (`README.md:23`) |
| 4 | Approve/edit every suggested quote line | `suggestLines()` scores price items against enquiry text (hints +3, softHints +2, name words +1, bedroom/room exact match +6), max 5 lines; `assumed` flag marks guesses; owner must approve/edit before sending (`engine.ts`, `assumptionNote()`) |
| 5 | Copy follow-up/quote or open WhatsApp | `followUpText()` / `quoteText()` generate copy-ready messages; `whatsappLink()` builds `wa.me/` deep link (ZA `0`→`27` normalisation); **never sends automatically** (`AGENTS.md:13`, `money.ts:whatsappLink`) |
| 6 | Track pipeline | Needs-info → Ready → Sent → Won → Paid, or Lost (Passed) (`types.ts:Status`; README uses "Needs you → Ready → Waiting → Won → Paid, or Passed" — UI labels differ slightly from code enum; code is source of truth) |
| 7 | Follow-ups, print/PDF, backup | Follow-up dates + due reminders (in-app only, no scheduled notifications); print-only quote layout (reference, line items, totals, validity); JSON export/restore with zod-validated schema, duplicate-ID rejection, 10 MB cap (`backup.ts`) |
| 8 | Customer form | Public form at `/ask` prepares a message **for the customer to send themselves** via WhatsApp/another channel; does NOT submit to a remote business inbox (`README.md:21`, `ask-form.tsx`, 283 lines) |

### 1.3 The AI/pricing separation rule (the product's defining constraint)
- **AI extracts details only. Prices come from the owner's price book or an explicit manual entry.** (`AGENTS.md:9`)
- Deterministic reader is the default (no API key). Optional xAI reader is OFF unless `ORDERPILOT_AI_ENABLED=true` + `XAI_API_KEY` set; model via `ORDERPILOT_AI_MODEL` (default `grok-4.5` in code). Prices are **excluded from the AI catalog** (id/name/unit/category only) and always calculated locally (`README.md:46`, `read-enquiry.ts`).
- Quoted lines are **snapshots**: existing quotes never silently reprice; owner must explicitly `pullLatestPrices()`; currency changes apply to new quotes only; **no currency conversion** (`README.md:23`, `engine.ts:pullLatestPrices`).
- Rounding: each line rounded to cents, then summed (`money.ts:quoteTotal`) — a prior defect (raw-sum vs displayed-sum mismatch) was fixed in takeover (`docs/TAKEOVER.md:17`).
- **Paid is manual bookkeeping**, not processed/verified payment. No payment processor, no recurring charge activated (`README.md:21`, `TAKEOVER.md:55`).
- `applyReading()` drops any AI line-item whose id is not in the owner's price book or whose qty is out of range (1–100000) — AI cannot invent prices or ids (`engine.ts:applyReading`, `read-enquiry.ts:sanitizeReading`).

### 1.4 Architecture & stack (evidence)
- React 19.2 + TanStack Start 1.168/Router 1.170 + Vite 8 + Nitro 3 beta (Vercel preset); Tailwind 4.3; Zustand 5 (persisted); TypeScript 5.7 strict (`package.json`, `PRODUCTION_READINESS_AUDIT.md:11`).
- **Storage: browser localStorage only** (`orderpilot-v1` key). No accounts, no cloud sync, no server inbox. Clearing site data loses records unless backup exists (`README.md:21`, `store.ts`). Better-Auth/PGLite/Neon scaffold exists in deps but is dormant (`VITE_AUTH_ENABLED=false` default per prior audit; `db:migrate` skips without `DATABASE_URL`).
- Design: Inter/slate/blue workspace shell, sidebar (desktop) + bottom nav (mobile), 44px touch targets, mobile-first (`AGENTS.md:5`, `docs/REDESIGN.md`).
- Currencies supported: ZAR, USD, GBP, EUR (`types.ts`). Units: person, each, hour, job, day, room.
- Trades supported: catering, cleaning, handyman, painting, events, other (`types.ts:TRADES`).
- 16 commits, 0 stars/forks (GitHub, 2026-11-08). MIT licence.

### 1.5 What it deliberately does NOT do (boundaries)
No auto-messaging, no payment processing, no accounts/cloud, no currency conversion, no silent repricing, no AI-invented prices, no deposit/acceptance/version-history yet (listed as future work in `README.md:48-53`, `TAKEOVER.md:45-53`).

### 1.6 Verification evidence on record
- Prior takeover (2026-10-27): typecheck ✓, build ✓, 256 scaffold tests ✓, 8 product regression tests ✓, e2e journeys ✓ (dev + prod build), live deploy verified. Vercel project `prj_akOStojHpaOQhw8S0IdaCQ9Tnq6c`, release `dpl_6myswaNkhWGGp2pQ3yiFgDUForND`.
- Prior production audit (2026-11-06): scored 75/100 NOT READY — tsx test-runner blocker in Termux env only (not a code defect), `.env.example` missing at audit time (since added per GitHub history 2026-11-06), deployed==source unverified at that time. **This Phase 1+2 pass did not re-run the test suite** (read-only clone; no code executed) — current test status is therefore carried forward, not re-verified.
- Live site (2026-11-08): overview renders; sample pipeline R22 150 open, 01 awaiting, 01 won; sample enquiries visible (Lerato Khumalo baby shower R5 200 Ready; James kids party R2 150 Awaiting; Priya Naidoo buffet R5 550 Won). Sample data is labelled as such in-product.

---

## 2. HYPOTHESES (not verified — require owner/user validation)

1. **H1 — The WhatsApp-paste entry point is the real wedge.** SA small service businesses live on WhatsApp enquiries; paste→quote→copy-back fits existing behaviour better than a CRM form. *Test:* interview 5 caterers/cleaners; time the paste→quote flow vs their current spreadsheet/notes method.
2. **H2 — The "AI never touches prices" guarantee is the trust differentiator**, but only if it is surfaced in-product (e.g. a visible "prices from your book" badge) rather than buried in README. Currently the guarantee is strong in code, weak in UI copy (live overview says "Your prices" — good, but not explicit).
3. **H3 — Browser-local storage is the #1 adoption blocker**, not a feature gap. One cleared-cache incident loses the business's pipeline. Backup export exists but is manual; will owners actually do it? *Test:* measure backup-export rate in a beta; consider making export prompts part of the weekly flow.
4. **H4 — The 5-trade starter lists (catering/cleaning/handyman/painting/events) cover the launch niche**, but the deterministic parser's SA-place list (30 suburbs, Cape Town/JHB/Durban/Pretoria-heavy) and wording patterns may under-serve KZN/Gauteng vernacular trades. Parser quality outside catering/cleaning sample messages is unmeasured.
5. **H5 — Price point hypothesis:** SA solo operators will not pay Jobber/ServiceM8 US-dollar per-user pricing (see COMPETITIVE_BENCHMARK.md); a ZAR-denominated, per-business (not per-user) price under R300/mo undercuts the field. Untested — no pricing exists in-product yet.
6. **H6 — "Separate from Resolve ZA" is deliberate positioning**, not just hygiene: OrderPilot = quote/pipeline for service businesses; Resolve ZA = adjacent (citizen/government services per prior context). Keep the products' data and branding separate to avoid confusing the SA SMB buyer.

---

## 3. KEY DOCS IN REPO
`README.md` (product truth) · `AGENTS.md` (contributor rules) · `docs/TAKEOVER.md` (2026-10-27 takeover) · `docs/REDESIGN.md` (2026-10-27 redesign + competitor references) · `PRODUCTION_READINESS_AUDIT.md`, `DEFECT_REGISTER.md`, `SECURITY_REVIEW.md`, `ACCEPTANCE_TEST_PLAN.md` (2026-11-06 audits)
