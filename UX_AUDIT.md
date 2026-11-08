# OrderPilot — UX Audit (Phase 3)

**Date:** 2026-11-08
**Target:** `~/orderpilot-audit` (HEAD `9b0c857` per PRODUCT_IDENTITY.md) · Live: https://orderpilot-za.vercel.app/ (HTTP 200 verified 2026-11-08 via curl; SPA body not curl-readable — live UI claims carried from PRODUCT_IDENTITY.md §1.6, not re-verified this pass)
**Method:** Code-level UX inspection of `src/components/orderpilot/` (desk, detail, business-screen, prices-screen, ask-form) + `src/lib/orderpilot/engine.ts` (868 lines) against PRODUCT_IDENTITY.md and COMPETITIVE_BENCHMARK.md. Every defect cites a file:line. Unverified items are marked CANDIDATE/HYPOTHESIS — nothing below is user-tested.

---

## 1. Journey map (as built)

| # | Journey step | UI surface | Evidence | Friction observed |
|---|---|---|---|---|
| 1 | **Business setup** | Business → Business profile (3 tabs: Profile / Customer form / Data & backups) | `business-screen.tsx:25,49-73` — tabbed, autosave ("Changes save automatically on this device", `:151-154`) | Trading name/currency/trade set in one session; trade change does not re-match existing enquiries' lines (only gaps recompute live via `allGaps(e, business.trade)` in `desk.tsx:540`). |
| 2 | **Enquiry entry** | New enquiry → Composer (paste ≥8 chars to enable, 6,000-char cap, live extraction preview) | `desk.tsx:651-762` | Button disabled with no reason given until 8 chars typed (`desk.tsx:656-657,705-711`); `maxLength={6000}` silently truncates long WhatsApp threads with no overflow notice. |
| 3 | **Interpretation** | Live preview (Customer/Service/Size/When/Where + Draft quote total) → saved enquiry auto-opens in detail (`pendingFocusId`, `store.ts:48-52`, `desk.tsx:110-116`) | `desk.tsx:723-747` | Preview shows extracted values but not confidence/assumptions — those surface only later in detail. Wrong parse looks authoritative at save time. |
| 4 | **Missing questions** | Detail → Job details tab → "Fill in the gaps" panel: blocking (solid dot) vs optional (hollow dot), editable follow-up message, Copy follow-up | `detail.tsx:512-547`, `engine.ts:412-489` | Questions are display-only — there is no per-gap answer field. The owner must copy the message, wait for a reply, then paste it into a *different* tab (Conversation, `detail.tsx:574-600`). Two-tab round-trip for one loop. |
| 5 | **Pricing** | Quote tab: suggested lines (max 5, `engine.ts:325`), per-line qty edit, add-from-list, custom line, "Pull latest prices", currency-mismatch warning | `detail.tsx:250-346` | One-click "The quote is ready" clears **all** `assumed` flags at once (`detail.tsx:635-648`) — bulk-confirms guesses without per-line review, undercutting the product's core trust story. |
| 6 | **Quotation** | "Message to send": preview (collapsed `<details>`) or edit wording; Copy quote / Open WhatsApp / Print-PDF | `detail.tsx:347-407` | Copy/Open/Print **do not** mark the quote sent (honest hint at `:403-406`) — a separate "Mark sent" tap in the rail is required. The most forgettable step in the loop. |
| 7 | **Follow-up** | Rail: date picker (`followUpOn`), Overview "due" strip + bell, inbox "Follow-ups due" filter | `detail.tsx:684-708`, `desk.tsx:60,597-604` | In-app only — no scheduled notifications (README-confirmed). Due = date ≤ today; no time-of-day, no WhatsApp nudge. |
| 8 | **WhatsApp prep** | `whatsappLink()` normalises ZA `0`→`27`, builds `wa.me/` deep link; never sends automatically | `money.ts:78-86`, `detail.tsx:385-393` | No contact number → bare `https://wa.me/` link (WhatsApp home, dead end) with no prompt to add a number (UX-11). |
| 9 | **Pipeline** | Overview metrics → Enquiries list / Pipeline board (6 columns, read-only cards) → Detail rail status actions (Sent/Won/Paid/Close/Reopen) | `desk.tsx:279-388`, `detail.tsx:634-682` | Board cards are not draggable; status changes only via detail rail. "Won" is reachable from `needs-info` with no lines; "Mark sent" only blocked by empty lines — blocking gaps can be sent unresolved (UX-07). |
| 10 | **Customer side** | `/ask` form → composed plaintext message → customer sends via WhatsApp themselves | `ask-form.tsx:49-60,88-155` | No submission reaches a business inbox; success screen must convince the customer to do the last mile themselves. Drop-off risk is structural (UX-15). |

**End-to-end shape:** single-device, single-user, manual-send. The loop's spine (paste → gaps → quote → copy → mark sent) is short and the copy tone is strong, but every handoff to the customer is a copy-paste, and the app's own state changes lag one manual tap behind reality.

---

## 2. First-time experience

**Entry state:** every fresh browser gets the **Harbour & Hearth catering demo** — business, catering price book, 4 sample enquiries (`store.ts:25-32`, `presets.ts:58-65,145-156`). Overview shows a dismissible demo banner ("A little room to explore… Set up my business", `desk.tsx:242-266`) and metrics/attention list pre-populated with sample data.

**What works:**
- Hydration loading state, "Saved on this device" badge, autosave notes — storage model is disclosed, not hidden (`desk.tsx:62-72,198-200`).
- Demo banner + empty-state CTAs consistently route to setup/compose.
- Composer includes 4 paste examples, incl. "A job you don't price" (geyser) — honest failure-mode example (`presets.ts:158-163`).

**Defects:**
- **Catering-only demo for a 6-trade product (UX-08).** A cleaner or painter opens a workspace full of catering prices, catering samples and a caterer's name. Nothing re-skins the demo to their trade; blank-start is buried in Business → Data & backups → destructive reset, framed as "wipe this device" (`business-screen.tsx:309-362`). First-run for 5 of 6 trades starts off-niche.
- **No guided path to a first real quote.** The demo banner links to Business settings, not to "paste your first enquiry". The three things a new owner must do before a real quote (set trade → set prices → paste) are discoverable but not sequenced. CANDIDATE: measure first-quote completion per trade in beta.
- Trust copy is present and good: "Your prices. Your call." (sidebar), "No invented prices. Nothing sent automatically." (composer), "Quotes use your rates, never invented prices." (prices screen). The benchmark gap (priced-sourced disclosure) is narrower than PRODUCT_IDENTITY.md H2 suggested — it *is* in the UI now (`desk.tsx:170-176,756-759`; `prices-screen.tsx:59-62`).

---

## 3. Trade-specific workflows

Base gaps (all trades): service, quantity, when — always blocking; location blocking only for cleaning/handyman/painting (`engine.ts:412-437`). Per-trade extras (`engine.ts:438-484`):

| Trade | Extra questions | Blocking? | Starter list | Parser support (`findService`, `findQuantity`) |
|---|---|---|---|---|
| Catering | Food style (menu), dietary/allergies | Menu **yes**, diet no | 7 items (buffet/tea/kids/diet/cake/delivery/staff) | People/guests/children, buffet → "Buffet catering" |
| Cleaning | Standard vs extras (oven/windows/deep) | No | 7 items (2/3/4-bed packages + extras) | Bedrooms → exact package match (+6, `engine.ts:355-369`) |
| Handyman | Emergency?, photo? | No | 5 items (call-out/labour/geyser/electrical/plumbing) | Hours; geyser/electrical/plumbing service detection |
| Painting | Colours known? | No | 4 items (exterior/interior/prep/gutters) | Rooms; exterior vs interior |
| Events | Theme? | No | 4 items (kids/decor/entertainment/cake) | Children/guests; party detection |
| Other | — (base only; location not asked) | — | **None** — no starter list; "other" trade gets an empty price book with only "Add a price" | Generic |

**Findings:**
- **Uneven gap rigour.** Catering is the only trade where a *content* question blocks a firm quote. A handyman can reach "Ready" without knowing if it's an emergency; a painter without knowing colours. Blocking-ness doesn't follow commercial consequence — it follows catering's template history. CANDIDATE: sales impact unmeasured.
- **"Other" is a dead end for pricing.** No starter list exists for the 6th trade; a user who picks "Other services" must hand-build a price book with zero scaffolding, and `findService` returns `""` for unmatched catering/cleaning trades (`engine.ts:262-264`) so their enquiries start with a blocking service gap. Every other trade at least gets hints.
- **Parser reach (PRODUCT_IDENTITY H4, confirmed in code):** 30 hardcoded places, CPT/JHB/DUR/Pretoria-heavy (`engine.ts:41-72`); free-text location fallback over-fires on prepositions ("in"/"at"/"near") with a stop-list patch (`engine.ts:224-239`). Name extraction requires capitalised intro/sign-off patterns (`engine.ts:147-160`). Voice-note-style WhatsApp messages (no punctuation, lowercase) will under-extract — the app degrades to "To confirm" fields and blocking gaps rather than failing visibly. That is safe but slow; owners will hand-fix every field.
- **Per-trade quantity asks are well written** (`quantityAsk`, `engine.ts:497-511`: "How many bedrooms is the home?", "Roughly how big is the job, or how many hours should I allow?") — the gap *copy* is the best part of the trade system.
- **Events vs catering overlap:** kids-party enquiries can match both starter lists; trade is single-select, so an events business quoting food (or vice versa) has no cross-list. A caterer who also does events must overwrite their price book. CANDIDATE.

---

## 4. Error recovery

| Failure | Recovery path (evidence) | Verdict |
|---|---|---|
| AI reader off / fails / returns garbage | Deterministic reader remains; `"AI couldn't read that. Your own reading still stands."` (`detail.tsx:104-120`); server returns `ok:false` with plain-language errors, 25 s timeout, catalog-ID + qty validation (`read-enquiry.ts:36-38,101-119,122-169`) | **Good.** Best-in-class graceful degradation. |
| AI races an edit mid-read | Stale-check on `updatedAt` + prices identity before applying; owner told to retry (`detail.tsx:108-113`) | **Good.** |
| Bad/oversized/corrupt backup import | zod-validated `parseBackup`, 10 MB cap, error shown in status note, pending-confirm before wholesale replace; cancel path (`business-screen.tsx:258-306`) | **Good.** |
| Copy to clipboard fails | `copyText` returns `false`; UI **silently** does nothing (`detail.tsx:80-83` — `setCopied(ok ? kind : null)`) | **Defect (UX-01).** No feedback, no select-text fallback. |
| Invalid price/qty/custom-line input | Silent `return` — no error message (`prices-screen.tsx:250-260`; `detail.tsx:818-830`); invalid qty in a quote line silently ignored (`detail.tsx:741-749`); validity days silently clamped (`business-screen.tsx:143-147`) | **Defect (UX-13).** Owner gets no signal for why "Add" did nothing. |
| Delete enquiry / price / wipe workspace | Two-tap armed confirm everywhere (`detail.tsx:714-730`; `prices-screen.tsx:151-160`; `business-screen.tsx:317-356`) | **Partial.** Confirm exists, but **no undo, no trash, no export prompt** before wipe — irreversible on a localStorage-only product (UX-02). |
| Workspace data lost (browser cleared) | Manual JSON export; warning copy in Data tab ("Export regularly… there is no cloud account") | **Partial.** Honest copy, manual discipline required (PRODUCT_IDENTITY H3; benchmark's #1 adoption blocker). No scheduled/automatic backup. |
| Currency changed under old quotes | Warning banner + add-from-list/pull-latest disabled with instruction to type a manual line in the quote's currency (`detail.tsx:235-243,280,328`) | **Partial (UX-10).** Safe, but the workaround is manual and Overview totals silently *exclude* mismatched-currency enquiries (`desk.tsx:447-453`) — a paid total can undercount with no note. |
| No price matches an enquiry | Empty quote state with "No matching rate was found. Choose a price below or enter your own." (`detail.tsx:267-273`); status stays `needs-info` (`freshStatus`, `engine.ts:541-546`) | **Good.** |
| Enquiry deleted while open in detail | `desk.tsx:117-119` redirects to inbox | **Good.** |

**Accessibility baseline (from code):** skip link, tablist arrow/Home/End keyboard support (`ui-model.ts:13-28`), aria labels on icon buttons, `role="status"` on AI/backup notes, ≥44 px targets (`styles.css:123,180,394,543-544,1529`). Gaps use colour dots but blocking gaps also carry "Required for a firm quote" text. Not device-tested this pass — CANDIDATE for real screen-reader/voice-control validation.

---

## 5. UX defect register

Severity: **P1** = breaks the core loop or the trust promise · **P2** = measurable friction/loss risk · **P3** = polish/consistency. All items verified in code at the cited lines.

| ID | Sev | Defect | Evidence | User impact |
|---|---|---|---|---|
| UX-01 | P2 | **Clipboard failure is silent.** `copy()` sets "Copied" only on success; on failure nothing happens, the owner thinks the quote copied and pastes something stale into WhatsApp. | `detail.tsx:80-83`; `money.ts:56-76` (returns `false`); same pattern `ask-form.tsx:118` | Wrong/stale quote sent to a customer. No select-text fallback. |
| UX-02 | P2 | **No undo anywhere; destructive actions are one armed tap from permanent loss** on a localStorage-only product. No trash, no undo toast, no export prompt before workspace wipe. | `detail.tsx:714-730`, `prices-screen.tsx:151-160`, `business-screen.tsx:317-362`; `store.ts:57-59` (remove = filter) | One mis-tap loses a pipeline; wiped workspace is unrecoverable without a backup. |
| UX-03 | P1 | **Bulk-confirm of guessed lines.** "The quote is ready" clears `assumed` on *all* lines in one tap — the app's core promise ("you review every quote") is satisfied by a single click. | `detail.tsx:635-648` (`lines.map(l => ({...l, assumed:false}))`) | Owner can send guessed prices without ever seeing them flagged. Directly contradicts `assumptionNote` warnings (`engine.ts:842-849`). |
| UX-04 | P2 | **Silent re-matching wipes owner edits.** Editing service/quantity/notes/location re-runs `suggestLines` and resets `extraQuestions`, `customFollowUp`, `customMessage` whenever lines aren't custom — no notice, no diff. | `engine.ts:586-625` (`patchEnquiry`) | Owner fixes a field, loses the wording they just wrote, and doesn't know why. |
| UX-05 | P2 | **Gaps have no answer capture.** The follow-up loop requires leaving the gap panel, copying, waiting, returning to a second tab, and pasting the reply. | `detail.tsx:512-547` (display + copy) vs `detail.tsx:574-600` (Conversation reply composer) | The central loop (ask → answer → re-quote) is the clunkiest path in the product. |
| UX-06 | P2 | **"Mark sent" is a separate, forgettable step** decoupled from Copy/Open WhatsApp/Print. Pipeline stats and "Awaiting reply" counts drift from reality. | Honest hint `detail.tsx:403-406`; status only changes in rail `detail.tsx:650-659` | Owner sends, forgets to mark, follow-up and metrics are wrong. |
| UX-07 | P2 | **Status transitions unguarded.** "Won" available from `needs-info` with zero lines; "Mark sent" allowed with unresolved blocking gaps or `assumed` lines; `forcedReady` bypasses `freshStatus` entirely. | `detail.tsx:650-665` (Won button has no `disabled`); `engine.ts:541-546` vs `saveStatus` (`detail.tsx:57-67`) | Pipeline integrity relies on owner discipline; "Ready to send" badge can be forced over missing details. |
| UX-08 | P1 | **Catering-only first run.** Demo business/prices/samples are catering; 5 of 6 trades open a niche-mismatched workspace; blank-start is buried and destructively framed. | `presets.ts:58-65,145-156`; `store.ts:25-32`; `business-screen.tsx:309-362`; demo banner `desk.tsx:242-266` | Cleaners/painters/handymen start by discarding someone else's caterer demo. First-quote time suffers for the majority of target trades. |
| UX-09 | P3 | **Applying a starter list silently changes trade too.** Armed confirm says "Yes, replace my prices" but the handler also calls `setBusiness({trade})` — existing enquiries' gap sets change under the owner. | `prices-screen.tsx:198-215` | Surprise trade flip; gap questions on open enquiries change without explanation. |
| UX-10 | P2 | **Currency mismatch: manual workaround + silent metric exclusion.** Add/pull disabled with "type a manual line in {currency}" instruction; Overview Open/Paid totals exclude mismatched-currency enquiries with no footnote. | `detail.tsx:235-243,280,328`; `desk.tsx:447-453` | Owner hand-retypes prices in a second currency; reported pipeline value is wrong without a visible caveat. |
| UX-11 | P2 | **WhatsApp deep link dead-ends without a number.** `whatsappLink` returns bare `https://wa.me/` when no valid number — opens WhatsApp home, no prompt to add the customer's number. | `money.ts:78-86`; used `detail.tsx:385-393`, `ask-form.tsx:107-115` | Owner taps "Open WhatsApp", lands nowhere useful, assumes the quote sent. |
| UX-12 | P3 | **Composer silent limits.** Save disabled until ≥8 chars with no hint why; 6,000-char cap truncates pasted threads silently (`maxLength`). | `desk.tsx:656-657,680-687,705-711` | Long enquiry threads lose their tail; owner quotes from partial information. |
| UX-13 | P3 | **Invalid input fails silently.** Add-price, custom line, qty edits, validity-days all `return`/clamp with no message. | `prices-screen.tsx:250-260`, `detail.tsx:741-749,818-830`, `business-screen.tsx:143-147` | "Why didn't that add?" — owner retries blindly. |
| UX-14 | P3 | **Mobile nav omits Pipeline.** Board view reachable only via the inbox view-toggle; primary mobile nav has 4 of 5 destinations. | `desk.tsx:412-428` (`NAV.filter(n => n.id !== "pipeline")`) | Mobile owners (the majority for WhatsApp-first businesses) can't reach the board in one tap. |
| UX-15 | P2 | **`/ask` form collects too little and delivers nothing.** Size/when/where optional → enquiries land `needs-info`; nothing is submitted anywhere; success screen depends on the customer completing a manual send with no reference number. | `ask-form.tsx:171-270` (only 3 `required`); disclosure `:124-127`; owner shortcut hidden in `<details>` `:133-154` | Form fills the gaps it was meant to fill only sometimes, and its output can vanish between the customer's clipboard and the owner's WhatsApp. |
| UX-16 | P2 | **Gap rigour is catering-only** (see §3). Handyman emergency/photo, painting colours, events theme — all non-blocking, and "other" has no starter list or location question. | `engine.ts:438-484`; `presets.ts:90-126` (5 lists, no "other") | Non-catering trades reach "Ready" with commercially material unknowns. |
| UX-17 | P3 | **Board is read-only.** Pipeline columns show counts but cards can't be dragged; every status change costs a detail-screen round-trip. | `desk.tsx:342-384` (cards are `onClick={open}`) | Kanban affordance without kanban interaction. |
| UX-18 | P3 | **Overview "Jobs won" caption says "Accepted and paid jobs"** while counting won+paid — paid is also its own metric below, double-counting in prose. | `desk.tsx:475-484` | Minor; erodes confidence in the numbers. |
| UX-19 | CANDIDATE | **Live extraction preview over-promises.** `To confirm` for missing fields is shown, but a *wrongly extracted* value (e.g. a quantity from the wrong sentence) is indistinguishable from a correct one until the detail screen. | `desk.tsx:723-747` preview vs assumed-flag only in detail (`detail.tsx:244-249`) | Owners may save confident-but-wrong quotes. Needs user testing to confirm frequency. |

---

## 6. Prioritised improvements

Ordered by (trust impact × reach) ÷ effort. Each item names the defects it closes.

### P1 — do first
1. **Per-line confirm for assumed lines; remove the bulk "quote is ready" shortcut** (closes UX-03). Replace with a checklist: every assumed line must be individually confirmed (qty edit or a confirm tap) before the quote can be marked ready/sent. This is the product's defining trust promise — it should be enforced, not bypassed by one tap. Effort: small (lines already carry `assumed`).
2. **Trade-aware first run** (closes UX-08). On first load (no persisted state), ask trade first, then load that trade's starter list + matching samples. Keep the catering demo as one option ("Explore the catering demo"). Blank-start becomes a first-class, non-destructive choice. Effort: medium (reuses `STARTER_LISTS` + `buildDemo` pattern).

### P2 — next
3. **Answer gaps in place** (closes UX-05). Add a per-gap free-text answer field in the gap panel that feeds `mergeReply`-equivalent parsing and re-matches lines immediately — the ask→answer→re-quote loop without leaving the tab.
4. **Guard status transitions** (closes UX-07). Block "Mark sent"/"Won" while blocking gaps or assumed lines remain (linking to the gap/line), or require an explicit "send anyway" confirm that is recorded. Unblocks honest pipeline metrics.
5. **Copy failure feedback + fallback** (closes UX-01). Show "Copy failed — long-press to copy" and select the textarea on failure. One-line change at `detail.tsx:80-83`.
6. **Undo for destructive actions** (closes UX-02). 10-second undo toast for delete-enquiry/delete-price; require a fresh export (or warn "no backup taken") before workspace wipe. Cheap insurance on a localStorage-only product.
7. **"Mark sent" at the point of send** (closes UX-06). After Copy/Open WhatsApp/Print, offer a one-tap "Mark sent" (or auto-mark with undo). Pipeline then reflects reality.
8. **WhatsApp number prompt** (closes UX-11). When `whatsappLink` would be bare, show an inline "Add their number" field in the quote actions instead of linking to `wa.me/`.
9. **Stop silent re-matching** (closes UX-04). When an edit would re-suggest lines or reset custom wording, show "Details changed — re-match lines? [Re-match] [Keep mine]". Owner edits are never silently discarded.
10. **Currency totals footnote + one-tap conversion-free display** (closes UX-10). Overview metrics show "excludes N enquiries in {currency}" or list them; add-from-list in a mismatched quote offers "add at current book price" with the currency shown before confirming.
11. **`/ask` form: require size/when/where; add a reference code** (closes UX-15). The form's whole purpose is filling gaps — make the gap fields required, and print a short reference (e.g. `OP-XXXXXX`) the customer can quote back, so the owner's WhatsApp thread is matchable to the enquiry.

### P3 — polish
12. Channel parity for gaps (UX-16): make handyman emergency and painting colours blocking; add a generic starter list for "other" (or auto-seed two "per job" placeholders). Warn when a starter list changes trade (UX-09).
13. Mobile nav: include Pipeline or merge board/list into one toggle reachable everywhere (UX-14). Drag-to-move on the board (UX-17).
14. Inline validation messages for price/qty/validity inputs (UX-13); composer hints ("Add a few more words", "Pasted message truncated at 6,000 characters") (UX-12); fix the Jobs-won caption (UX-18).
15. Surface parse confidence in the composer preview (UX-19, CANDIDATE): flag low-confidence extractions at save time, not only in detail.

---

## 7. What NOT to change (evidence-backed strengths)

- **AI failure → deterministic fallback with plain-language errors** (`read-enquiry.ts`, `detail.tsx:104-120`). Keep exactly this behaviour as new features are added.
- **"Nothing sent automatically" honesty** — copy, deep links, manual status. The friction in UX-06 is the price of the trust model; fix it with point-of-send marking, not auto-send.
- **Snapshot pricing + explicit "Pull latest prices"** (`engine.ts:828-840`). Never silently reprice.
- **Two-tap confirms** on destructive actions — extend with undo, don't remove.
- **Trade-specific question copy** (`quantityAsk`/`whereAsk`/`sizeAsk`, `engine.ts:497-528`) — genuinely good SA-small-business voice; reuse the pattern for gap answers.
- **Backup import validation + pending-confirm** (`business-screen.tsx:258-306`) — the correct pattern for all destructive flows.

---

## 8. Verification status

- **Verified in code:** all 19 register items (file:line cited). Live site HTTP 200 (curl, 2026-11-08); SPA content not re-verified this pass — UI-claim carry-forward from PRODUCT_IDENTITY.md §1.6.
- **NOT verified:** any user behaviour, timings, or comprehension (no user testing run); screen-reader/voice-control behaviour; mobile rendering at device widths; xAI path against a live provider (carried from prior audit); SaHV CRM local-competitor question (COMPETITIVE_BENCHMARK §1.2 — owner to confirm).
- Every CANDIDATE item above needs beta evidence before it is treated as a finding.
