![CI](https://github.com/buttercode101/OrderPilot/actions/workflows/test.yml/badge.svg)

# OrderPilot

Turn customer enquiries into quotes using your own prices, then track them through to paid jobs.

[Open OrderPilot](https://orderpilot-za.vercel.app/) · [Design research and new interface](docs/REDESIGN.md) · [Verification and remaining work](docs/TAKEOVER.md)

Built for small service businesses in South Africa: caterers, cleaners, tradespeople, painters and event organisers. OrderPilot is a separate product from Resolve ZA.

> **Status (2026-11-08, branch `flagship-excellence`):** conditionally ready for the current browser-local product — see [RELEASE_VERDICT.md](RELEASE_VERDICT.md). No accounts, no payment processing, no published pricing. The optional AI reader is disabled by default and has not been verified against a live provider.

## The one rule

**AI extracts details only. Prices always come from the owner's price book or an explicit manual entry.**

The built-in reader is deterministic pattern matching and needs no API key. An optional server-side AI reader, when enabled, receives a catalog of item identifiers, names, units and categories only — never prices — and cannot introduce a price or a catalog ID that is not in the owner's book. Quote amounts are calculated locally, each line rounded to cents and then summed. Existing quote prices are snapshots: they never reprice silently, and currency changes apply to new quotes only. There is no currency conversion.

## Current product

- Paste an enquiry from WhatsApp, email or social media.
- Review extracted details and missing-detail questions.
- Maintain your own price book; approve or edit every suggested quote line. Each suggested line is confirmed individually — there is no bulk-confirm shortcut.
- Copy a follow-up or quote, or open WhatsApp yourself. Nothing is ever sent automatically.
- Track Needs you → Ready → Waiting → Won → Paid, or Passed.
- Set follow-up dates, print quotes / save as PDF, export and restore validated backups.
- Share a customer form which creates a message for the customer to send back.

**Storage:** this version saves records in the current browser, without accounts or cloud sync. Clearing site data removes records. Export backups regularly. Customer forms do not submit into a remote business inbox; the customer sends their prepared message via WhatsApp or another channel. Paid is a manual bookkeeping status; OrderPilot does not collect or verify payments.

**Pricing:** quote amounts come from the business's price book or explicit manual entries. Calculations round each line to cents and sum the rounded lines. Existing quote prices remain snapshots until the owner explicitly pulls current prices. Currency changes apply to new quotes; there is no currency conversion. Starter lists and the practice inbox contain example prices, not market recommendations. OrderPilot itself has no subscription price — see [MONETIZATION.md](MONETIZATION.md) for the (unvalidated) pricing hypothesis and why no price is published yet.

## Verification

Re-run 2026-11-08 on `flagship-excellence` (`d9711b8`):

| Check | Result |
|---|---|
| `npm test` | 59/59 pass |
| `npm run test:product` | 12/12 pass, including: unmatched enquiries cannot invent quote lines; AI catalog identifiers cannot introduce arbitrary prices; price edits do not silently change existing quotes; per-line confirm flips one flag only |
| `npx tsc --noEmit` | clean |
| `npm audit --omit=dev --audit-level=high` | 4 vulnerabilities (1 critical, 1 moderate, 2 low) — see [DEFECT_REGISTER.md](DEFECT_REGISTER.md) O-005 |

Known limitations are documented, not hidden: [DEFECT_REGISTER.md](DEFECT_REGISTER.md) (including O-005, the better-auth critical held on 1.6.x with auth off), [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md), and [RELEASE_VERDICT.md](RELEASE_VERDICT.md).

Full evidence trail: [RELEASE_ACCEPTANCE_REPORT.md](RELEASE_ACCEPTANCE_REPORT.md), [PRODUCTION_READINESS_AUDIT.md](PRODUCTION_READINESS_AUDIT.md), [SECURITY_REVIEW.md](SECURITY_REVIEW.md), [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md), [RESPONSIVE_COMPATIBILITY_REPORT.md](RESPONSIVE_COMPATIBILITY_REPORT.md), [ACCEPTANCE_TEST_PLAN.md](ACCEPTANCE_TEST_PLAN.md).

Product and design evidence: [PRODUCT_IDENTITY.md](PRODUCT_IDENTITY.md), [COMPETITIVE_BENCHMARK.md](COMPETITIVE_BENCHMARK.md), [UX_AUDIT.md](UX_AUDIT.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [MONETIZATION.md](MONETIZATION.md).

## Development

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm test
npm run test:product
```

Configuration is documented in [.env.example](.env.example). The core workflow works with no secrets; optional integrations (database, auth, AI reader) require explicit keys.

The Grok-origin scaffold uses React 19, TanStack Start, Vite, Tailwind, Zustand and Nitro's Vercel output adapter. The original host bridge and attribution plumbing are retained. No database migrations are needed for the current browser-local product.

## Deployment

Deploy the repository to Vercel with Node 24, `npm ci --no-audit --no-fund` as the install command, and `npm run build` as the build command. Nitro emits `.vercel/output` automatically. No secrets are required for the core workflow. Do not commit `.env`, `.vercel`, browser records or backups.

## Optional AI reader

The built-in reader uses deterministic pattern matching and works without an API key. Optional server-side AI reading remains disabled unless both `ORDERPILOT_AI_ENABLED=true` and `XAI_API_KEY` are configured. `ORDERPILOT_AI_MODEL` selects the provider model. This integration is inherited from Grok and has not been verified against a live provider in this takeover. Before enabling it publicly, add authenticated users and enforce usage quotas. Do not expose a paid provider key behind an unrestricted public endpoint. Customer messages and catalog descriptions would be sent to that provider; prices are excluded from the AI catalog and always calculated locally.

## Security

See [SECURITY.md](SECURITY.md) and [SECURITY_REVIEW.md](SECURITY_REVIEW.md). In particular: auth is off in the shipped deployment (`VITE_AUTH_ENABLED=false` by default), and the better-auth 1.6.x critical in [DEFECT_REGISTER.md](DEFECT_REGISTER.md) O-005 must be resolved by an owner-approved 1.7 migration before auth is ever enabled.

## Next delivery slice

1. Account-based persistent storage with tenant isolation and a real customer form inbox.
2. Authenticated AI extraction with usage limits and explicit data disclosure.
3. Quote versions, deposits, acceptance records and follow-up history.

See `docs/TAKEOVER.md` for verification and known limitations.
