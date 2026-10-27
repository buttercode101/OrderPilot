# OrderPilot contributor guide

Mission: help small service businesses turn enquiries into accurate quotes and track them through paid jobs. OrderPilot stays separate from Resolve ZA.

Preserve the existing React / TanStack Start implementation and cream / moss design system. Use mobile-first layouts and touch targets of at least 44px.

## Commercial correctness

- AI extracts details only. Prices come from the owner's price book or an explicit manual entry.
- Round each quote line to cents, then sum the rounded values.
- Quote rates and currencies are snapshots. Never silently reprice or convert an existing quote.
- Paid is a manual record, not evidence of a processed payment.
- Never send customer messages automatically in the current product.

## Current architecture

Records live in the browser via Zustand persistence. Do not claim accounts, cloud sync or a server inbox. The customer form prepares a message for the customer to send. Optional xAI reading is off by default. Public AI activation requires authentication and usage limits first.

Keep secrets out of client code, source control, logs and test artifacts. Backups contain personal data and must be treated as private.

The source was imported from Grok. Preserve the original attribution, preview bridge and platform support scripts unless a future explicit change authorizes their replacement. Grok-specific sandbox instructions under `.grok/` describe the original host rather than the current deployment environment.

## Verification

Run `npm run typecheck`, `npm run build`, `npm test`, and `npm run test:product`. Exercise the user journey with `BASE_URL=<url> node scripts/product-e2e.mjs`. `QA_SERVE=dev` or `QA_SERVE=preview` starts a local server for QA. `CHROMIUM_EXECUTABLE_PATH` and `CHROMIUM_EXTRA_ARGS` optionally configure Chromium in constrained runners.

Verify rendered mobile and desktop layouts, reload persistence, customer form, quote totals, WhatsApp targets, status changes and backup/restore. Distinguish local checks from deployed-provider verification.
