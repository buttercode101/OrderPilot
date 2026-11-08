# Competitive Benchmark — OrderPilot Phase 2

**Date:** 2026-11-08  
**Scope:** Quote tools, SaHV CRM, service-business tools, AI pricing-separation patterns  
**Method:** Web sources cited per claim. Where a source could not be verified, it is marked UNVERIFIED rather than guessed.

---

## 1. EVIDENCE — competitor landscape

### 1.1 Quote-centric tools (direct competitors for "enquiry → quote")

**Jobber** (getjobber.com) — the most-cited reference in OrderPilot's own REDESIGN.md.
- Pricing (published, USD): Core $29/mo annual ($49 monthly) for 1 user; Connect $99/mo annual; Grow $149/mo annual (1 user); Plus $399/mo annual (teams). Add users $29/mo each. Trial 14 days, no card. (Source: getjobber.com/pricing; myquoteiq.com/jobber-pricing-breakdown-2025)
- Quoting: professional quotes with markups, client quote approvals, quote options/add-on pricing, customer financing on quotes $500–$25,000 (US only). (Source: Jobber help — quote basics / quote approvals; Jobber vs Estimate Rocket comparison)
- Separation pattern: prices come from the business's own items/rates; quoting is template/pre-build driven, not AI-generated numbers. AI features (AI Receptionist, Sales Pipeline) are communication/pipeline add-ons, not price invention.
- OrderPilot overlap: quote lifecycle language (draft → sent → approved), PDF quote, follow-up. OrderPilot gap: no online client approval, no e-signature, no financing, no multi-user field scheduling.

**ServiceM8** (AU-origin, servicem8.com) — strongest pricing-transparency model for solo operators.
- Pricing (published): Free plan — $0, 1 user, 30 jobs/mo; Starter $29/mo unlimited users 50 jobs; Growing $79/mo 150 jobs; Premium $149/mo 500 jobs; Premium Plus $349/mo 1500+ jobs (AU $). No per-user fees on paid plans. (Source: servicem8.com/au, servicem8.com/au/free-plan)
- Quoting: quote options (client picks via link), online quote acceptance, e-signature (on-device + remote PDF signature), job costing (estimated profit/loss before issuing), quote follow-up automation. (Source: servicem8.com/us/pricing; servicem8.com/us/articles/quoting-for-work)
- Key lesson: **job-based (not user-based) pricing** + a genuinely usable free tier is the solo-trades playbook. OrderPilot currently has no pricing at all — this is the model to beat on affordability for SA solos.
- Separation pattern: job costing explicitly separates estimated cost vs billable price (see Simpro below — same pattern).

**Simpro** (simprogroup.com) — enterprise trades, the "correctness" benchmark.
- Pricing: quote-only, no published price. Third-party estimates ~$30–$150/user/mo + implementation $2k–$15k+; 1-star reviews cluster at 2–10 employees, 5-star at 51–200. Floor ≈ 15 people + a dedicated system owner. (Source: ferrorstudio.ca/news/simpro-review-pricing-alternatives; softwarefinder.com/field-service/simpro-enterprise)
- Quoting: catalogue items, take-off templates, pre-builds; tracks quote progress, deadlines, lost-reason capture; good/better/best options; accepted quotes convert to jobs. (Source: simprogroup.com/features/estimating-software; simprogroup.com/blog/estimate-close-rate)
- **Pricing-separation pattern (most rigorous found):** three distinct numbers per line — *Estimated Cost* (what the job costs the business), *Actual Cost* (what it really cost), *Billable Price* (what the customer sees). Labour rates pulled from customer card/system defaults; markup applied to estimated cost to derive billable. (Source: helpguide.simprogroup.com — Estimated and Actual Costs)
- OrderPilot lesson: even a lightweight version of this (owner cost vs billable price) would be a differentiator no solo tool offers. OrderPilot currently has only billable price — no margin visibility.

**Tradify** (tradifyhq.com) — simplicity-first, published pricing.
- Pricing (published, USD/user/mo): Lite $47, Pro $51, Plus $61; 14-day trial with all features. (Source: fieldtechreviews.com/blog/tradify-pricing-lite-pro-plus-custom; costloop.app/blog/tradify-pricing)
- Quoting: templates + price lists ("quote jobs twice as fast"); simple quote-to-invoice flow; positioned for solo/small teams, low implementation. (Source: fieldservicechoice.com/products/tradify)
- OrderPilot lesson: per-user pricing punishes small teams adding an office hand; ServiceM8's per-job model is the better precedent for OrderPilot's future pricing.

**Bonsai** (hellobonsai.com) — freelancer proposals, referenced in OrderPilot REDESIGN.md.
- Pricing: $9–$49/user/mo annual tiers (per-user; a 3-person studio on Essentials pays $57/mo before add-ons); 7-day trial; 1% payment fee on some plans. (Source: hellobonsai.com/proposals + pricing; signaturely.com/bonsai-alternatives)
- Quoting: proposal builder with upsell packages, contracts, e-signatures; clean document-like quote with line-item breakdown. (Source: hellobonsai.com/proposals)
- OrderPilot lesson: document-quality quote + clean hand-off to sending (already adopted in REDESIGN.md). Bonsai's per-user model is a cautionary tale for team growth.

**Estimate Rocket** (via Jobber comparison): $139–$359/mo flat for 3–15 full users + $10/mo field users — the mid-market alternative. (Source: getjobber.com/comparison/jobber-vs-estimate-rocket)

### 1.2 SaHV CRM — UNVERIFIED
- **No verifiable public information found** for a product called "SaHV CRM" (searches 2026-11-08 returned only generic SA CRM lists — Maximizer, Salesforce, Zoho, Sage, HelloLeads — and unrelated Facebook groups). It may be: (a) a private/internal tool, (b) a mis-spelled or differently-styled name (e.g. "SaHV" as abbreviation), or (c) a small local vendor without indexed web presence.
- **Do not treat SaHV CRM as a known competitor until the owner confirms what it is.** If a URL or full name is supplied, re-run this section.
- Closest verifiable SA context: SA SMB CRMs (Sage SA, Zoho) are general-purpose CRMs — none of the indexed results offered a WhatsApp-enquiry→quote flow comparable to OrderPilot. (Sources: sage.com/en-za/crm-software; maximizer.com/blog/best-crm-software-south-africa)

### 1.3 Service-business platforms (adjacent, not quote-only)

| Tool | Price signal | Quote-relevant strength | Weakness vs OrderPilot niche |
|---|---|---|---|
| Jobber | $29–$399/mo + $29/user | Approvals, financing, scheduling | US$ per-user; residential > catering/cleaning SA |
| ServiceM8 | $0–$349/mo, per-job | Free tier, e-sign, costing | AU/NZ trade focus; no WhatsApp-paste entry |
| Simpro | Quote-only, ~$150/user est. | Cost/billable separation, takeoffs | Enterprise floor; overkill for solo |
| Tradify | $47–$61/user/mo | Templates, simple | Per-user; no AI extraction |
| Bonsai | $9–$49/user/mo | Proposal docs, contracts | Freelancer, not trades/services |
| Housecall Pro | ~$79/mo entry (via third-party) | Easiest residential onboarding | Dispatch-first, not quote-first |
| ServiceTitan | Quote-only | Deep reporting, ecosystem | Expensive, multi-year (via ferrorstudio.ca comparison) |

(Sources: individual pricing/feature pages above; ferrorstudio.ca/news/simpro-review-pricing-alternatives for cross-tool table.)

### 1.4 The AI pricing-separation pattern (industry consensus, 2025–2026)

The pattern is consistent across independent sources — **AI must never emit a price; it may only select from a business-supplied price book:**

1. **Grounded generation:** "AI doesn't know your price book. It will generate plausible-looking numbers based on patterns in its training data." Fix: give AI a source of truth (price book/catalog) + verification. (Source: ymeadows.com/en/insights/newsletter/your-ai-just-quoted-a-price-that-doesnt-exist, 2026-04-17)
2. **Placeholder pattern:** "AI invents dollar figures without saying it is guessing. Quofo leaves every amount as [PRICE] until you fill it in." (Source: getquofo.com/no-invented-prices)
3. **Catalog-ID pattern:** AI returns only catalog ids + quantities; prices are looked up locally. This is exactly OrderPilot's `read-enquiry.ts` design (catalog sent without prices; `sanitizeReading` drops unknown ids; `applyReading` drops out-of-range qty). OrderPilot is **ahead of the generic pattern** in one respect: it excludes prices from the AI payload entirely, so the model never sees a number to regurgitate.
4. **Margin-aware pattern:** "AI builds accurate, margin-aware quotes from your price book with zero manual re-keying" (AppCorp) — i.e. AI assembles, the book decides. (Source: appcorp.org/ai-use-cases/ai-quote-generator)
5. **Simpro's variant:** AI agents (JobReady/JobScribe/JobBrief) handle admin; cost vs billable separation is enforced in the data model, not the prompt. (Source: ferrorstudio.ca Simpro review — AI quotas section)

**OrderPilot compliance check (evidence):** deterministic reader (no AI) ✓; optional AI catalog excludes prices ✓; unknown ids rejected ✓; qty bounds enforced ✓; snapshot pricing ✓; manual Paid ✓. **OrderPilot satisfies the industry pattern as implemented.** Gap vs best practice: no visible in-product disclosure that prices are book-sourced (the pattern's trust payoff requires surfacing it), and the xAI path is unverified against a live provider (TAKEOVER.md:49).

---

## 2. HYPOTHESES (require validation)

1. **H1 — ZAR per-job pricing undercuts the field.** ServiceM8's $0–$29 starter (per-job, not per-user) proves solo affordability wins; Jobber/Tradify/Bonsai per-user pricing punishes a 2-person SA crew in USD. Hypothesis: per-business ZAR pricing (e.g. R149–R299/mo, free tier ≤30 quotes) is the wedge. *Test:* price-sensitivity interviews with 5 SA service owners.
2. **H2 — WhatsApp is the moat, not AI.** None of the benchmarked tools lead with "paste a WhatsApp message → quote". If SA enquiries arrive on WhatsApp (H1 in PRODUCT_IDENTITY.md), the paste flow + `wa.me` hand-off is a distribution advantage no US/AU tool has reason to copy first.
3. **H3 — Margin visibility is the unclaimed feature.** Simpro proves cost-vs-billable separation matters at scale; no solo tool offers it. A lightweight "your cost / your price" toggle in the price book could be OrderPilot's second differentiator — but only if owners track cost, which is unproven for solos.
4. **H4 — SaHV CRM may be the actual local competitor** (e.g. an SA-built service CRM with WhatsApp presence). Until identified, competitive conclusions about the local field are provisional. *Action:* owner to confirm SaHV CRM full name/URL.
5. **H5 — Online client approval is table stakes within 12 months.** Jobber (approvals), ServiceM8 (e-sign + online acceptance), Simpro (online approval) all ship it; OrderPilot's "customer sends their own message back" is honest but friction-heavy. Hypothesis: a shareable quote link with accept/reject is the highest-leverage next feature after cloud storage.

---

## 3. WHAT TO BORROW / WHAT TO AVOID

**Borrow:** ServiceM8 per-job pricing + free tier · Simpro cost/billable separation (lightweight) · Jobber approval flow · Quofo/Y-Meadows "prices never AI-generated" disclosure copy · Tradify template speed.
**Avoid:** Simpro enterprise lock-in (multi-year, escalators, implementation fees) · Bonsai/Jobber per-user scaling · AI price invention in any form · silent repricing (already avoided — keep it that way).
