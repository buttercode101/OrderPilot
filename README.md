![CI](https://github.com/buttercode101/OrderPilot/actions/workflows/test.yml/badge.svg)

# OrderPilot

Turn customer enquiries into quotes using your own prices, then track them through to paid jobs.

[Open OrderPilot](https://orderpilot-za.vercel.app/) · [Design research and new interface](docs/REDESIGN.md) · [Verification and remaining work](docs/TAKEOVER.md)

Built for small service businesses in South Africa: caterers, cleaners, tradespeople, painters and event organisers. OrderPilot is a separate product from Resolve ZA.

## Current product

- Paste an enquiry from WhatsApp, email or social media.
- Review extracted details and missing-detail questions.
- Maintain your own price book; approve or edit every suggested quote line.
- Copy a follow-up or quote, or open WhatsApp yourself.
- Track Needs you → Ready → Waiting → Won → Paid, or Passed.
- Set follow-up dates, print quotes / save as PDF, export and restore validated backups.
- Share a customer form which creates a message for the customer to send back.

**Storage:** this version saves records in the current browser, without accounts or cloud sync. Clearing site data removes records. Export backups regularly. Customer forms do not submit into a remote business inbox; the customer sends their prepared message via WhatsApp or another channel. Paid is a manual bookkeeping status; OrderPilot does not collect or verify payments.

**Pricing:** quote amounts come from the business's price book or explicit manual entries. Calculations round each line to cents and sum the rounded lines. Existing quote prices remain snapshots until the owner explicitly pulls current prices. Currency changes apply to new quotes; there is no currency conversion. Starter lists and the practice inbox contain example prices, not market recommendations.

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

The Grok-origin scaffold uses React 19, TanStack Start, Vite, Tailwind, Zustand and Nitro's Vercel output adapter. The original host bridge and attribution plumbing are retained. No database migrations are needed for the current browser-local product.

## Deployment

Deploy the repository to Vercel with Node 24, `npm ci --no-audit --no-fund` as the install command, and `npm run build` as the build command. Nitro emits `.vercel/output` automatically. No secrets are required for the core workflow. Do not commit `.env`, `.vercel`, browser records or backups.

## Optional AI reader

The built-in reader uses deterministic pattern matching and works without an API key. Optional server-side AI reading remains disabled unless both `ORDERPILOT_AI_ENABLED=true` and `XAI_API_KEY` are configured. `ORDERPILOT_AI_MODEL` selects the provider model. This integration is inherited from Grok and has not been verified against a live provider in this takeover. Before enabling it publicly, add authenticated users and enforce usage quotas. Do not expose a paid provider key behind an unrestricted public endpoint. Customer messages and catalog descriptions would be sent to that provider; prices are excluded from the AI catalog and always calculated locally.

## Next delivery slice

1. Account-based persistent storage with tenant isolation and a real customer form inbox.
2. Authenticated AI extraction with usage limits and explicit data disclosure.
3. Quote versions, deposits, acceptance records and follow-up history.

See `docs/TAKEOVER.md` for verification and known limitations.
