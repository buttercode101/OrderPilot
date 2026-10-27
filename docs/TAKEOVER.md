# OrderPilot takeover — 27 October 2026

## Mission and scope

For small service businesses, turn customer enquiries into owner-reviewed quotes using the business's own price book, then track them through to paid jobs. Preserve the Grok implementation and design. Keep OrderPilot separate from Resolve ZA. This release is a browser-local MVP, not the complete account-based product.

Verdict: **READY WITH KNOWN LIMITATIONS for the browser-local MVP.** Cloud accounts, a server customer inbox and live provider AI are not implemented or certified in this release.

## Starting state

The uploaded `grok-workspace.zip` contained a React 19 / TanStack Start application with a deterministic enquiry reader, price lists, editable quote lines, WhatsApp message links, a guest form and a Zustand browser store. The inherited dependency lock was inconsistent: clean install reported missing AJV dependencies. There were no OrderPilot-specific regression tests. The optional AI reader relied on an xAI key and an unverified provider model.

## Delivered changes and findings

| Finding | Change | Verification |
|---|---|---|
| Totals summed raw values while line amounts displayed rounded values | Sum rounded line totals; correct half-cent rounding | Product regression tests |
| Missing customer phone could open the owner's own WhatsApp | Remove owner-number fallback; parse only a usable phone from combined contacts | Unit tests and browser target inspection |
| Price form rejected amounts with cents through HTML's default integer step | Explicit decimal step | Browser price of R125.50 saved and used in a quote |
| Guest form could accept input before hydration and then discard it | Show loading state until form hydration finishes | Production-build guest-form journey |
| Delayed AI reading could overwrite newer edits | Reject stale results and preserve the latest edits | Source review; configured-provider race not exercised |
| No follow-up schedule or payment outcome | Follow-up dates, due reminders, manual Paid status and timestamp | Reload, sent → won → paid browser journey |
| No portable recovery copy | JSON export, schema-validated import, preview counts and explicit replacement | Valid round trip and invalid-file rejection |
| No printable quote | Print-only quote layout with reference, line items, totals and validity | Chromium PDF generated, text inspected, rendered and confirmed single page |
| Currency change could relabel an old quote | Quote currency snapshot; block pulling a price book in another currency | Product currency regression and UI inspection |
| Amount wrapped across lines on narrow detail view | Wrapping header and non-wrapping amount | Rendered mobile inspection |
| Unmatched generic service produced awkward quote wording | Service inferred from matched catalog labels; grammatical fallback | Product tests and browser journey |
| Scaffold branding tests depended on real app assets | Isolated test fixture directory and explicit identity input | 197 script tests + 59 TypeScript scaffold tests pass |

## Verification evidence

- `npm run typecheck`: passed.
- `npm run build`: passed; Nitro emitted Vercel server functions and static assets.
- `npm test`: 256 scaffold tests passed (197 + 59).
- `npm run test:product`: eight product regression tests passed.
- `scripts/product-e2e.mjs`: passed against the development server and the served production build.
- Browser journeys: blank business setup, own decimal price, pasted enquiry, draft quote, reload persistence, follow-up date, disabled-AI response, sent/won/paid status, WhatsApp recipient, PDF generation, backup export, invalid import rejection, valid restore and guest form message generation.
- Browser viewport emulation: 320, 375, 768 and 1120px without horizontal document overflow on the inbox; rendered desktop and mobile detail also inspected. These were emulated viewports, not physical phone tests.
- No uncaught application errors in the automated local production-build journey.
- Live public deployment `https://orderpilot-za.vercel.app/`: quote creation, a R125.50 custom line, exact total R1975.50, sent → won → paid and persistence after reload directly verified through the cloud browser.
- Browser-extension metadata errors appeared in the cloud browser console, from a `chrome-extension://` URL; they were separate from the app.

Vercel project: `prj_akOStojHpaOQhw8S0IdaCQ9Tnq6c`, in Butter's projects. Verified direct-file release: `dpl_6myswaNkhWGGp2pQ3yiFgDUForND` (READY). The Git-connected successor should be reconciled after repository import. No claim is made that real WhatsApp messages were sent or real payments processed.

## Remaining product work

1. Account-based storage, cross-device sync and tenant isolation. Current records live only in this browser; clearing browser data loses them unless a backup exists.
2. A genuine server inbox for customer form submissions. Current forms prepare a message which the customer sends themselves.
3. Authenticated AI extraction, per-user quotas and disclosure of provider data transfer. The xAI integration is disabled by default and has not been tested with a live key/model. The deterministic reader is active.
4. Quote version history and immutable sent/accepted quotes, deposits, acceptance records, tax configuration and payment reconciliation.
5. More comprehensive extraction across arbitrary trades and wording; users must review suggestions and quantities.
6. Cross-tab conflict handling, browser-storage quota recovery and broader accessibility / real-device coverage.
7. Follow-up dates are reminders inside the app, not scheduled notifications or automatic messaging.

No automatic messages, paid infrastructure, database, payment processor or recurring charge was activated.
