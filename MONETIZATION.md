# OrderPilot — Monetization (Phase 5)

**Date:** 2026-11-08 · **Branch:** `flagship-excellence` (`d9711b8`)
**Status:** Pricing hypothesis only. **No pricing exists in-product today** (`PRODUCT_IDENTITY.md §1.6`, `README.md:21` — Paid is manual bookkeeping, no processor). Nothing in this document is a price commitment, a willingness-to-pay finding, or a revenue forecast.

---

## 1. What we know vs what we don't

| Question | Answer | Basis |
|---|---|---|
| Current price | Free / none — no billing, no processor, no recurring charge | `README.md:21`, `PRODUCT_IDENTITY.md §1.3` |
| Will SA solos pay? | **UNKNOWN — no interviews, no beta, no WTP data collected** | No user research run in any phase to date |
| Will they pay R149–R299/mo? | **HYPOTHESIS ONLY** — see §3. This range comes from benchmark anchoring, not from buyers | `PRODUCT_IDENTITY.md H5` (untested), `COMPETITIVE_BENCHMARK.md H1` (untested) |
| What do competitors charge? | Published USD/AU$ list prices, §2 below. **Not ZAR-converted** — no FX rate is asserted in this doc | `COMPETITIVE_BENCHMARK.md §1` |

**Explicit non-claims:** no invented willingness-to-pay, no conversion forecast, no market-size figure, no "customers will pay X" statement anywhere in this document. Any future price must be validated with the interview test in §4 before it is published.

---

## 2. Competitor price anchors (published list prices, as benchmarked)

From `COMPETITIVE_BENCHMARK.md §1` (2026-11-08, sources cited there). Kept in original currencies — do not compare directly to a ZAR price without a stated FX assumption.

| Tool | Published price | Model | Relevance to OrderPilot pricing |
|---|---|---|---|
| Jobber | $29–$399/mo (annual) + $29/user/mo add-ons | Per-user | Punishes a 2-person SA crew; USD-denominated |
| ServiceM8 | $0 free (30 jobs/mo) · $29 (50 jobs) · $79 (150) · $149 (500) · $349 (1500+) | **Per-job, not per-user** | The solo-trades playbook: usable free tier + job caps |
| Tradify | $47–$61/user/mo | Per-user | Same per-user caution as Jobber |
| Bonsai | $9–$49/user/mo | Per-user | Freelancer, not trades/services |
| Simpro | Quote-only (~$150/user/mo third-party est.) | Per-user, enterprise | Floor ≈15 people — not OrderPilot's segment |

**Lesson carried into §3:** the only benchmarked tool whose model fits SA solo operators is ServiceM8's — per-job (or per-business), with a genuinely usable free tier. Per-user pricing is the pattern to avoid.

---

## 3. Proposed pricing hypothesis (to be tested, not published)

Anchored on ServiceM8's structure, denominated in ZAR per business (not per user). **These numbers are a hypothesis for interview testing, not a price list.**

| Tier (hypothesis) | ZAR/mo | Unit | Rationale |
|---|---|---|---|
| Free | R0 | ≤30 quotes/mo, 1 business, browser-local storage | Mirrors ServiceM8's $0/30-job free tier; the paste→quote loop is the wedge (`PRODUCT_IDENTITY.md H1`) |
| Solo | **R149/mo** (hypothesis) | Unlimited quotes, 1 business | Sits under the untested "under R300/mo" anchor in `PRODUCT_IDENTITY.md H5`; per-business, not per-user |
| Business | **R299/mo** (hypothesis) | Unlimited quotes, cloud sync + backup, multi-device | Upper anchor of the same hypothesis range; cloud sync is the #1 adoption blocker (`PRODUCT_IDENTITY.md H3`) and the only feature that justifies a paid tier on its own |

**What would justify paid at all:** cloud storage / backup / multi-device. The current browser-local product (`README.md:21`) has a data-loss risk that is the benchmark's #1 adoption blocker — owners will not pay for a quote tool that can lose their pipeline. Pricing before cloud sync exists is premature.

**What must not happen:** per-user ZAR pricing (the Jobber/Tradify pattern), USD pricing for SA solos, or publishing these figures before §4 validation.

---

## 4. Validation required before any price is published

1. **Price-sensitivity interviews** — 5 SA service owners (caterers/cleaners/trades), per `COMPETITIVE_BENCHMARK.md H1` test. Ask, don't tell: current quoting method, time spent, what they'd pay to never lose a pipeline to a cleared cache.
2. **Time-the-loop test** — paste→quote vs current spreadsheet/notes method (`PRODUCT_IDENTITY.md H1` test). A price needs a time-saved number behind it.
3. **Backup-discipline measurement** — how often beta users actually export backups (`PRODUCT_IDENTITY.md H3`). If nobody exports, cloud sync is the paid feature; if everybody does, it isn't.
4. **Free-tier cap test** — whether ≤30 quotes/mo is a real constraint for the target trades or an arbitrary number borrowed from ServiceM8.

Until 1–4 produce evidence, this document stays a hypothesis and the product stays free.

---

## 5. Monetization boundaries (from product identity)

- **No payment processing in-product** until a processor, deposit flow, and acceptance records exist (`README.md:48-53` next-slice items 3). "Paid" stays manual bookkeeping.
- **No AI-pricing upsell.** The AI/pricing separation rule (`AGENTS.md:9`) is the trust differentiator — monetization must never imply AI-generated prices, premium "AI pricing", or price recommendations. Starter lists are example prices, not market recommendations (`README.md:23`).
- **No silent repricing as a retention mechanic.** Snapshot pricing is a trust feature, not a billing lever.

---

## 6. Open questions for the owner

1. Confirm or correct the R149–R299 hypothesis range after interviews — or replace it with interview-derived WTP.
2. Confirm whether cloud sync is in scope for the next delivery slice (`README.md:50` item 1) — it gates any paid tier.
3. Confirm SaHV CRM identity (`COMPETITIVE_BENCHMARK.md §1.2` UNVERIFIED) — if it is a local SA competitor, its pricing may change the anchor set entirely.
