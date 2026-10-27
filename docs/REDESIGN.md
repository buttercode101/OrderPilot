# OrderPilot — interface redesign

27 October 2026 · v0.3.0

## Product direction

The customer enquiry is the starting point. A reviewed quote and a paying job are the outcomes. The interface should make the next action obvious without asking a small-business owner to learn a complex CRM.

The old cream / serif / stacked-card interface has been replaced with a new workspace shell, typography, colour system, page layouts, components and navigation. The React / TanStack Start runtime and deterministic pricing engine are retained. Browser-local records continue using the same persistence key and schema, so this visual redesign does not require migrating customer records.

## Research and decisions

| Reference | Evidence reviewed | Applied to OrderPilot |
|---|---|---|
| Linear | [March 2026 UI refresh](https://linear.app/changelog/2026-03-12-ui-refresh), [current product](https://linear.app/) and published interface imagery | A restrained sidebar, consistent page headers, predictable navigation, one primary creation action and less decorative chrome. |
| Attio | [Current product](https://attio.com/), [lists](https://attio.com/help/reference/managing-your-data/lists/create-lists) and [record views](https://attio.com/help/reference/managing-your-data/records/create-and-view-records) | Searchable enquiry records, list / pipeline views over the same data, clear stage filters and a focused record workspace. |
| Jobber | [Quote basics](https://help.getjobber.com/en/articles/quote-basics/), [mobile quoting](https://help.getjobber.com/en/articles/quotes-in-the-jobber-app/), [client quote approvals](https://help.getjobber.com/en/articles/quote-approvals/) | Separate missing-detail, ready, waiting, won and paid outcomes. Keep quote review and the next business action visible. |
| Bonsai | [Proposal product](https://www.hellobonsai.com/proposals), [proposal workflow](https://help.hellobonsai.com/en/articles/5616844-all-about-proposals) | A clean document-like quote, a readable line-item breakdown, consistent customer-facing form styling and a clear hand-off to sending. |
| Stripe | [Quote lifecycle](https://docs.stripe.com/quotes) | Explicit lifecycle language and separation of an editable draft from the act of sending or accepting. This redesign does not add Stripe integration. |

These references informed interaction principles and hierarchy. OrderPilot uses its own implementation, icons, brand and layouts. No competitor assets were copied into the product.

## New interface framework

- **Navigation:** persistent desktop sidebar; mobile bottom navigation with the same destination names. A fixed creation action stays available. Workspace selection opens business settings.
- **Overview:** actual open-pipeline value, waiting quotes, won jobs and manually recorded payments. Values are scoped to the selected business currency; unlike currencies are never added together. Sample data is identified.
- **Enquiries:** searchable records with stage / due-follow-up filtering; the pipeline board uses the same records and filters. Mobile boards stack their stages instead of forcing horizontal page scrolling.
- **Enquiry detail:** Quote, Job details and Conversation tabs replace the long, undifferentiated page. A separate next-step panel provides business actions and a follow-up date.
- **Quote editor:** document hierarchy, explicit quote reference, service / date / location context, editable quantities, rate-book choices, manual lines, a clear total and a collapsible customer-message preview.
- **Price book:** searchable services, category navigation, a dedicated add-price form, editable rates and units, and collapsed example templates. Destructive price removal requires a second click.
- **Business settings:** Business profile, Customer form and Data & backups sections; a sign-off preview and explicit local-storage disclosure.
- **Customer form:** a separate, focused public layout; grouped contact and job fields; a review-and-send step that explains that the request has not been submitted automatically.
- **Components:** shared buttons, fields, badges, avatars, navigation models and keyboard tab behaviour. Inter typography, slate text, blue actions, white surfaces and a navy sidebar.
- **Brand:** new arrow mark, favicon, install icon and social card. Original hosting attribution and bridge support remain in place.

## Verification scope

The product regression suite covers rounding, price snapshots, currency snapshots, unknown AI catalog IDs, reply merging, paid status and backup validation. The browser journey covers business setup, a decimal rate, a pasted enquiry, the quote, reload persistence, follow-ups, manual status transitions, WhatsApp targeting, printing, edited notes, reply merging, search, pipeline filters, backup export / validation / restore and the guest form.

Rendered overview and quote pages are inspected at 320, 375, 768, 1120 and 1440 pixels. Price book, settings, enquiry list, pipeline, composer and customer form are also visually inspected. Automated accessibility checks and keyboard tab navigation are included; these checks are bounded evidence, not a claim of comprehensive accessibility certification or physical-device testing.

Three inherited tests that asserted the wording of Grok's original sandbox instruction documents were removed from the standalone product test suite. All runtime branding, marker-expiry and CLI tests remain. The current contributor guide governs this repository; external Grok prompt documents are not product runtime dependencies.

## Product boundaries

Storage remains local to the browser. Customer forms generate a message for the customer to send. Payment status is manually recorded. AI-provider reading remains disabled without explicit server configuration and still needs authentication and usage limits before public activation. The redesign does not claim accounts, cloud sync, automatic customer messaging or payment processing.
