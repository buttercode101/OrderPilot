# OrderPilot — Design System (Phase 4)

**Date:** 2026-11-08
**Repo:** `~/orderpilot-audit`, HEAD `9b0c857` (per `PRODUCT_IDENTITY.md`)
**Inputs read:** `PRODUCT_IDENTITY.md` (Phase 1), `COMPETITIVE_BENCHMARK.md` (Phase 2), `UX_AUDIT.md` (Phase 3)
**Current implementation:** `src/styles.css` (3,628 lines, Tailwind 4.3 `@theme`), `src/components/orderpilot/` (desk, detail, business-screen, prices-screen, ask-form)
**Status:** Specification, not implementation. Token values below are grounded in current `styles.css` where they already exist; anything marked **NEW** is a proposal.

---

## 0. Design principles (derived from product identity + audit)

1. **Trust is rendered, not asserted.** The product's core promise — *"AI extracts details only. Prices come from the owner's price book"* (`AGENTS.md:9`, `PRODUCT_IDENTITY.md §1.3`) — must be visible in the UI at the point of decision, not only in the README. Every price the owner sees carries its provenance; every guess carries its flag until the owner — not the app — clears it.
2. **Nothing sent automatically.** Copy/deep-links only. The design must never auto-advance status, auto-send a message, or silently reprice a saved quote. Friction at the send point is fixed by marking status *at* the point of send (with undo), never by sending.
3. **Owner's numbers, owner's voice.** The quote is a snapshot of the owner's book. Currency differences, stale prices, and unsaved edits are surfaced, never hidden.
4. **Mobile-first, WhatsApp-first.** The primary user pastes enquiries on a phone, on the move. 44px targets, bottom nav, and single-column flows are the default; desktop is the comfortable desktop.
5. **Deterministic degradation.** When parsing/AI confidence is low, the UI says so plainly and falls back to "To confirm" fields — it never renders a confident-looking wrong value.
6. **Honest states over clever states.** Disabled buttons explain themselves; silent failures (UX-01, UX-13) are defects, not edge cases.

---

## 1. Typography

**Family (existing, kept):** Inter for sans and display, with system fallback — no change.
- `--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (`styles.css:3`)
- `--font-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (`styles.css:4`) — currently identical to sans; keep as a single family. Do not add a serif/display face; the product is a workspace tool, not a marketing page.

**Type scale (existing values, formalised as tokens):**

| Token | Size | Weight | Line-height | Tracking | Use (existing evidence) |
|---|---|---|---|---|---|
| `text-display` | 32px | 650 | 1.18 | −1.2px | `h1` (`styles.css:86-89`); 27px on mobile (`styles.css` @767) |
| `text-metric` | 27px / 23px @≤1200 | 600 | 1.3 | −0.9px | Overview metrics (`styles.css:704-706`); 23px at ≤1200px |
| `text-title` | 20px | 650 | 1.3 | −0.6px | Card/section headings (`styles.css:327-331`) |
| `text-heading` | 16px | 650 | 1.4 | −0.3px | `h2` (`styles.css:92-95`) |
| `text-button` | 15px | 600 | 1.4 | normal | Buttons (`styles.css:127-129`) |
| `text-body` | 14px | 400/550 | 1.5 | normal | Body (`styles.css:44-45`), inputs (`:186-187`) |
| `text-label` | 13–14px | 600–650 | 1.5 | normal | Field labels, `h3` (14px/650, `styles.css:98-100`) |
| `text-small` | 13px | 400–550 | 1.65 | normal | Secondary text (`styles.css:223-226`) |
| `text-caption` | 12px | 500/550 | 1.45 | normal | Status pills, meta (`styles.css:270-272`) |
| `text-eyebrow` | 11px | 550–600 | normal | +1.5–1.65px | Eyebrows/kickers (`styles.css:373-375, 593-595`); 10px/1.4px on mobile |
| `text-micro` | 9px | 500 | normal | +1.6px | Logo/sub-labels (`styles.css:335-338`) — do not use for body or warnings |

**Rules**
- **Weight vocabulary is restricted:** 400 (reading), 500–550 (meta/status), 600–650 (headings/actions). No 700+ — the current system tops out at 650 and should stay there.
- **Numbers are tabular.** Quote totals, metrics, and money columns use tabular figures (Inter's default `tnum` feature) so columns don't jitter when values change. Confirm `font-variant-numeric: tabular-nums` is applied to `.op-metric > strong`, quote totals, and table cells (proposal — verify in code).
- **Money never wraps into a second line.** Totals use `white-space: nowrap` with the currency prefix (`R` / `ZAR`) always adjacent; on narrow screens the amount shrinks (metric scale), not wraps.
- **Micro (9px) is decorative only.** No information, warning, or action lives at 9px — it fails WCAG contrast/size guidance for essential text. Assumed-price flags and gap warnings live at `text-caption` (12px) minimum.
- **Long-press/selectable fallback** (UX-01 fix): when `copy()` fails, the textarea selects its contents and a visible note appears — never a silent no-op.
- **Letter-spacing is only for eyebrows** (+1.4px to +1.65px, uppercase). Body copy stays at 0.

---

## 2. Colour

**Existing palette (kept, renamed for clarity):**

| Semantic token | Value | Source |
|---|---|---|
| `surface/app` | `#f7f8fb` | `--op-bg` / `--color-paper` (`styles.css:28,5`) |
| `surface/subtle` | `#edf0f5` | `--color-paper-2` (`styles.css:6`) |
| `surface/card` | `#ffffff` | `--op-white` / `--color-card` (`styles.css:29,7`) |
| `text/primary` (ink) | `#172033` | `--op-ink` (`styles.css:25`) |
| `text/secondary` | `#47536b` | `--color-ink-soft` (`styles.css:9`) |
| `text/muted` | `#647086` | `--op-muted` (`styles.css:26`) |
| `border/default` | `#e5e9f0` | `--op-border` (`styles.css:27`) |
| `action/primary` (blue) | `#315efb` | `--op-blue` (`styles.css:24`) |
| `action/primary-hover` | `#244bdb` | `--color-moss-2` (`styles.css:13`) |
| `action/soft` | `#eef2ff` / `#edf2ff` | `--color-moss-soft` (`styles.css:14`), `.op-status--blue` (`:286-290`) |
| `navy` (sidebar) | `#101b31` | `--op-navy` (`styles.css:23`) |
| `warning` (clay) | `#a45c08` on `#fffaed` | `--color-clay`, `--color-clay-soft` (`styles.css:15-16`) |
| `danger` | `#b23836` on `#fff1ef`, border `#f9dcd9` | `.op-button--clay` (`styles.css:~166-171`) |

**Status colours (existing, kept — `styles.css:281-305`):** amber `#955c10`/`#fff8e9`, blue `#3c5ac1`/`#edf2ff`, violet `#7857b2`/`#f5f1ff`, green `#267559`/`#edf9f3`, neutral `#5c677a`/`#f0f2f6`. Each is a 4–8px pill with a 5px dot in `currentColor`.

**Status → colour mapping (formalised):**

| Pipeline status | Pill | Why |
|---|---|---|
| `needs-info` | amber | Action needed from owner |
| `ready` | blue | Ready to send, not yet sent |
| `sent` / awaiting | violet | Waiting on the customer |
| `won` | green | Money event, unresolved |
| `paid` | green (stronger) | Terminal success |
| `lost` / `passed` | neutral | Terminal, quiet |

**Rules**
- **The current `--color-moss` name is a misnomer** (it is the blue `#315efb`). **NEW:** rename to `--action` / `--action-hover` / `--action-soft` in CSS, keeping `--color-moss*` as deprecated aliases for one release so existing components don't break.
- **Never encode status by colour alone.** Status pills always carry text + dot (`styles.css:275-280`); gaps use filled = blocking / hollow = optional **plus** the text "Required for a firm quote" (`detail.tsx:512-547`). Keep that pattern everywhere.
- **Warning ≠ danger.** Clay/amber (`#a45c08`, assumed prices, currency mismatch) means "look before you send"; red (`#b23836`) means destructive/irreversible. Assumed lines must never be red — red implies "broken", amber implies "your call".
- **Contrast floor (existing, to be verified):** ink `#172033` on card `#ffffff` ≈ 15.9:1; muted `#647086` on `#f7f8fb` ≈ 4.6:1 (passes AA for normal text). Amber text `#955c10` on `#fff8e9` must be re-checked with a contrast tool before ship — do not assume.
- **Print/PDF quote:** ink + black/white only, no status fills; totals and the validity line must remain legible in grayscale.
- **No new hues.** The product is a slate/blue workspace (per `AGENTS.md:5`); the design does not introduce brand colours beyond the existing slate/blue/amber/green system.

---

## 3. Spacing

**Scale (4px base, existing rhythm):**

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Dot gaps, icon gaps (`op-status` gap 6px ≈ 1.5) |
| `space-2` | 8px | Button gaps, `op-button` gap 8px (`styles.css:119`), gap between inline fields |
| `space-3` | 12px | Input padding (10px 12px, `styles.css:187`), sidebar padding @≤1200 (12px) |
| `space-4` | 16–17px | Button padding (10px 16px), metric padding @≤1200 (16px), detail grid gap (17px) |
| `space-5` | 20–25px | Content padding @≤1200 (28px 25px), topbar mobile (24px), metric desktop |
| `space-6` | 26–28px | Page top padding (26px mobile / 28px desktop), content bottom 77–80px (mobile nav clearance) |

**Rules**
- **Content column:** `max-width: 1500px` (`styles.css:572`), with 25px gutters @≤1200 and 18px @≤767. Quote/detail reading column is narrower — `max-width: 850px` / `580px` / `900px` variants already exist (`styles.css:2997-3026`); the quote editor and gap panel use the 580–850px band, never full 1500px.
- **Card radius:** `--radius-lg: 0.625rem` (10px), `--radius-xl: 0.875rem` (14px) (`styles.css:19-20`). Cards `0.625rem`; panels/modals `0.875rem`. Buttons/inputs 8px. Pills 6px.
- **Shadows:** `--shadow-card: 0 1px 3px #17203306`, `--shadow-lift: 0 4px 12px #1720330a` (`styles.css:17-18`). Two levels only — card and lifted (hover/drag). No large drop shadows.
- **Mobile bottom padding** is always `≥77px + safe-area-inset-bottom` so content never sits under the bottom nav (`op-mobile-nav` uses `env(safe-area-inset-bottom)` at ≤1023px).
- **Vertical rhythm:** page heading `margin-bottom: 23px` (mobile), demo banner `margin-bottom: 21px`, sections 16–25px. New sections follow 24px rhythm, not arbitrary values.

---

## 4. Breakpoints

**Existing breakpoints (kept, named):**

| Token | Query | Layout change (evidence) |
|---|---|---|
| `bp-wide` | `min-width: 1600px` | Board expands to 6 columns (`styles.css:1933-1937`) |
| `bp-compact` | `max-width: 1200px` | Sidebar 195px; local badge hidden; enquiry table drops date column; detail grid 225px rail (`styles.css:1938-1989`) |
| `bp-desktop-down` | `max-width: 1023px` | Sidebar hidden; mobile brand + bottom nav shown; topbar sticky 68px + blur; detail grid 235px rail (`styles.css:1990-2069`) |
| `bp-tablet-down` | `max-width: 767px` | Topbar 65px; `h1` 27px; content 26px 18px 80px; compact buttons 37px (`styles.css:2070-2120+`) |
| `bp-phone-small` | `max-width: 359px` | (`styles.css:2599+`) — verify contents before extending |

**Rules**
- **Mobile-first posture, desktop breakpoints as-is.** Do not introduce a new breakpoint; the five above cover the product. If a component needs a new threshold, it must justify itself against these five.
- **The 1023px line is the touch line.** Above it: sidebar + mouse. Below it: bottom nav + thumb. Every primary action must be reachable below 1023px without a hover-dependent affordance.
- **Board columns:** 6 across at ≥1600px, fewer below — board is scroll-snap horizontally on mobile, never squeezed (proposal; current ≥1600-only 6-col behaviour is kept).
- **Detail rail:** 225–235px at 1023–1200px; collapses below the content at ≤767px (rail becomes a stacked card). Status actions remain visible — they are the loop's spine.
- **Tables degrade by column, not by squish.** At ≤1200 the date column drops; enquiry rows reflow to a 2-line card at ≤767 (`op-enquiry-row` rules at `styles.css:2250, 3490`). Money and status stay in the first two columns.
- **Nothing hides behind the bottom nav.** `op-content` bottom padding ≥77px at ≤1023px (`styles.css:2038+`).

---

## 5. Components

Existing components are formalised; **NEW** marks the P1 additions from `UX_AUDIT.md §6`.

| Component | Spec (existing) | States / notes |
|---|---|---|
| **Button** (`op-button`) | Primary (blue `#315efb`), Secondary (white/border), Quiet (transparent), Clay/destructive (red). 44px min-height, 15px/600, radius 8px, `transform: translateY(-1px)` hover | `:disabled` opacity 0.45, no shadow (`styles.css:173-175`); **every disabled button must name its reason** (UX-13 fix — currently silent at `detail.tsx:741-749`, `prices-screen.tsx:250-260`) |
| **Input / Textarea / Select** (`op-input`) | 44px height, 14px, 8px radius, border `#dce2ec`; focus: border `#7592ff` + 3px ring `#315efb0d` (`styles.css:195-203`); textarea min-height 90px, line-height 1.7 | Disabled: `#f2f4f8` bg. Error state **NEW**: 1px red border + 12px error text below (closes UX-13), `aria-invalid` + `aria-describedby` |
| **Status pill** (`op-status`) | 12px/550, 4–8px padding, 6px radius, dot + text; 5 colour variants (§2) | Never colour-only; always text + dot |
| **Gap row** (`detail.tsx:512-547`) | Filled dot = blocking, hollow = optional + "Required for a firm quote" text | **NEW** (UX-05): per-gap answer input in place; on answer, re-parse and re-match lines with a visible "Updated in-place" note — the ask→answer→re-quote loop stays in one tab |
| **Quote line** (`detail.tsx:250-346`) | Grid `1fr 65px auto 44px` desktop; `1fr 45px 65px 44px` mobile (`styles.css:3536-3539, 3598-3602`); qty editable; max 5 suggested lines (`engine.ts:325`) | **NEW** (UX-03, §9.1): each assumed line is a confirm-row — see below |
| **Confirm-row** (assumed line) | Amber-tinted row; explicit "Confirm this guess" checkbox/tap + qty field; provenance line "From your price book" vs "Guess — confirm before sending" | See §9.1 — replaces the bulk "The quote is ready" shortcut |
| **First-run / trade picker** | **NEW** (§9.2): trade-first chooser → starter list + matching samples; catering demo kept as one option | See §9.2 |
| **Composer / paste area** | Paste ≥8 chars to enable; 6,000-char cap; live extraction preview (`desk.tsx:651-762`) | **NEW** (§9.3): hint + truncation notice + confidence flags — see §9.3 |
| **Board card** | Read-only today (`desk.tsx:342-384`, `onClick={open}`) | P3: drag-to-move; until then cards must not look draggable (no drag handle, no hover-lift) |
| **Banner (demo)** | Dismissible (`desk.tsx:242-266`) | **NEW**: first-run banner routes to "paste your first enquiry" (sequenced), not only to Business settings |
| **Toast / undo** | **NEW** (UX-02/UX-06): 10-second undo toast for delete + "Mark sent" after Copy/Open/Print | Bottom-center above mobile nav; `role="status"` |
| **Empty / no-match state** | "No matching rate was found. Choose a price below or enter your own." (`detail.tsx:267-273`) | Good — keep copy; keep `needs-info` status |

---

## 6. States

| State | Visual | Behavioural rule |
|---|---|---|
| **Idle / saved** | "Saved on this device" badge (`desk.tsx:62-72, 198-200`) | Autosave note stays; no spinner for local writes |
| **Loading (hydration)** | Existing hydration loading state | Must not flash sample data before hydration completes |
| **Editable** | Default | Owner edits are never silently discarded (UX-04: re-match requires explicit "Re-match / Keep mine") |
| **Assumed (guess)** | Amber row, flag text, confirm required | `assumed` flag is per-line; cleared only by per-line confirm (§9.1). AI line-items with unknown ids are dropped entirely (`applyReading`), never shown as guesses |
| **Blocking (gap)** | Filled dot + "Required for a firm quote" | Blocks "Mark sent"/"Won" (UX-07 guard); "Send anyway" requires an explicit, recorded confirm |
| **Ready** | Blue pill | Only when no blocking gaps and no unconfirmed assumed lines |
| **Sent / awaiting** | Violet pill | Set at Copy/Open/Print with undo (UX-06), not in a separate rail tap |
| **Currency mismatch** | Clay banner + disabled add/pull with instruction (existing `detail.tsx:235-243`) | **NEW**: Overview metrics footnote "excludes N enquiries in {currency}" (UX-10); add-from-list offers "add at current book price" with the currency shown before confirming |
| **Disabled (reason missing)** | Opacity 0.45 | **NEW rule**: no disabled control without a reason (UX-13) — hint text or `disabled` tooltip text |
| **Copy failure** | **NEW**: "Copy failed — long-press to copy" + textarea selected | Closes UX-01; never silent |
| **Destructive armed** | Two-tap confirm (existing everywhere) | **NEW**: delete gets a 10-second undo toast; workspace wipe requires a fresh export or warns "no backup taken" (UX-02) |
| **AI failure** | "AI couldn't read that. Your own reading still stands." (`detail.tsx:104-120`) | Keep exactly this behaviour; plain-language errors, 25s timeout |

---

## 7. Motion

**Existing (kept, tightened):**

| Token | Value | Evidence |
|---|---|---|
| `motion-fast` | 0.15–0.16s ease | Buttons/inputs (`styles.css:130-133, 188-190, 396`), stat changes (`:915`) |
| `motion-ease` | Unnamed in code (browser default ease) | **NEW:** name it `cubic-bezier(0.2, 0, 0, 1)` / standard ease-in-out, one curve for all UI |
| `motion-reduced` | `prefers-reduced-motion: reduce` → 0.01ms everywhere, smooth scroll off (`styles.css:2666-2674`) | Keep; do not add motion that bypasses it |

**Rules**
- **What animates:** button hover (`translateY(-1px)`), input focus ring, panel/rail transitions, board column reflow, toast slide-up, drawer/sheet open.
- **What never animates:** numbers counting, totals changing, status pills appearing, "Copied" confirmation. Money changes are instant and legible — animated totals look like the app is inventing numbers.
- **Duration ceiling:** nothing exceeds 250ms except an intentional drag (P3 board). No entrance animations on first paint — hydration shows data, not choreography.
- **No motion anywhere a value is being read.** Quote lines, totals, gaps, and confidence flags appear instantly.
- **Toast (§6 undo):** 150ms slide/fade in, 10s hold, 150ms out; disabled entirely under `prefers-reduced-motion`.

---

## 8. Accessibility

**Baseline (existing, verified in code — `UX_AUDIT.md §4`):** skip link, tablist arrow/Home/End keyboard support (`ui-model.ts:13-28`), aria labels on icon buttons, `role="status"` on AI/backup notes, ≥44px targets (`styles.css:123, 180, 394, 543-544, 1529`). Gaps carry "Required for a firm quote" text, not colour alone.

**Targets (all NEW where marked):**

| Requirement | Target |
|---|---|
| Touch target | ≥44×44px on all interactive controls (existing floor — keep; audit every icon button and board card against it) |
| Focus visible | 3px `#315efb70` outline + 3px offset (`styles.css:109-112`) — never `outline: none` without a replacement. Inputs use the blue 3px ring instead (`:195-203`) |
| Contrast | Ink on card ≥ 7:1 (AAA); muted on bg ≥ 4.5:1 (AA normal text); status-pill text (amber `#955c10` / `#fff8e9`, blue `#3c5ac1`/`#edf2ff`, violet, green, neutral) each ≥ 4.5:1 — **verify with a contrast tool before ship** (current values are uncomputed) |
| Colour independence | Status, gaps, and assumed flags always pair colour with text/icon (existing dot + label pattern) |
| Screen reader | Status pills announced as text (they are text); quote lines list quantity × unit × price as text, not visual-only; toasts are `role="status"`; P1 confirm-rows (§9.1) are real checkboxes with labels, not row clicks |
| Keyboard | Tablist pattern extended to the first-run stepper (§9.2) and confirm checklist (§9.1); board cards reachable by keyboard (they are `onClick` rows today — add `tabIndex`/Enter/Space or make them links) |
| Motion | `prefers-reduced-motion` kills all non-essential motion (existing `styles.css:2666-2674`) |
| Language | `lang="en-ZA"` on `<html>`; money formatting uses the en-ZA locale (`R` prefix, space grouping) consistently |
| Readability | Body 14px/1.5 is the floor — no essential text below 12px; micro 9px is decorative only (§1) |
| Validation | Inputs with errors get `aria-invalid="true"` + `aria-describedby` pointing at the 12px error text (§5) |
| **NOT verified** | Device screen-reader/voice-control behaviour, mobile rendering at device widths (`UX_AUDIT.md §8`). This is CANDIDATE — needs beta evidence, not assertion. |

---

## 9. P1 proposals

### 9.1 Bulk-confirm of guessed lines (UX-03 — P1, closes the trust gap)

**Evidence:** `detail.tsx:635-648` — "The quote is ready" clears `assumed` on *every* line in one tap (`lines.map(l => ({...l, assumed:false}))`), contradicting the product's core promise that the owner reviews every quote (`engine.ts:842-849`, `assumptionNote()`). The lines already carry an `assumed` flag, so no data-model change is needed.

**Design — replace the bulk shortcut with a per-line confirm checklist:**

1. **Each assumed line becomes a confirm-row** (amber-tinted, `text-caption` flag "Guess — confirm before sending"). The row shows: line name, qty input (44px), unit price (from the owner's book, marked "from your price book"), line total, and an explicit **Confirm** checkbox/tap. Tapping Confirm (or editing the qty) clears that line's `assumed` flag — and only that line's.
2. **The quote header shows a confirm count:** "2 of 5 lines confirmed" with a progress bar (blue fill, 150ms transition). The count is text, not colour-only.
3. **"Quote is ready" is replaced by a disabled-until-complete primary action** — e.g. "Mark ready to send", disabled while any `assumed` line remains, with the reason visible below it: "Confirm 2 guessed lines to mark ready." (This implements the §6 "no disabled without a reason" rule.)
4. **"Send anyway" is an explicit, recorded override** (UX-07 guard): available on the disabled section as a quiet secondary action — "Send anyway (not recommended)" — opening a confirm that names the unconfirmed lines. Using it records the override on the enquiry (visible in the detail timeline), so the pipeline never silently lies.
5. **Quote text preview (`Message to send`) does not render the send state until all lines are confirmed**; the preview shows a banner: "This preview includes 2 unconfirmed lines."
6. **Remove `forcedReady` as a silent path** (`engine.ts:541-546` vs `saveStatus` `detail.tsx:57-67`): "Ready" is a derived state, not a button. The rail keeps Sent/Won/Paid/Close/Reopen as owner actions, but "Ready" is computed from (no blocking gaps ∧ no assumed lines).

**Copy (candidate):**
> *"These prices came from your price book. The ones marked **Guess** weren't in your book yet — check them before you send."* — surfaced once, above the quote tab, honouring the benchmark trust-disclosure gap (COMPETITIVE_BENCHMARK §2, H2 / §3 "Borrow: 'prices never AI-generated' disclosure copy").

**Acceptance criteria:**
- No UI path clears more than one line's `assumed` flag per tap.
- "Ready" state is unreachable with `assumed` lines present except via the recorded "Send anyway" override.
- Every price carries a provenance label ("From your price book" / "Guess" / "You typed this").
- Unit test: bulk-confirm handler is gone; per-line confirm flips one flag; ready-state is derived.

**Effort:** small (flag + copy exist). **Out of scope:** changing how `suggestLines` scores.

---

### 9.2 Non-catering first run (UX-08 — P1, closes 5-of-6-trade mismatch)

**Evidence:** Every fresh browser gets the **Harbour & Hearth catering demo** — catering business, catering price book, 4 sample enquiries (`store.ts:25-32`, `presets.ts:58-65,145-156`). 5 of 6 trades open a niche-mismatched workspace; blank-start is buried and destructively framed (`business-screen.tsx:309-362`); the demo banner links to Business settings, not to a first quote (`desk.tsx:242-266`). Five starter lists already exist (`presets.ts:90-126`) — only catering is wired as the default.

**Design — trade-first first run (3 steps, skippable, one session):**

1. **Step 1 — "What do you do?"** Trade picker (6 trades from `types.ts:TRADES`: catering, cleaning, handyman, painting, events, other). Large 44px+ cards with the trade's name and a one-line description in the product's voice ("Cleaning homes, offices and rentals" — reuse the `quantityAsk` copy pattern, `engine.ts:497-511`, which the audit rates as the best copy in the product). Keyboard: arrow/Home/End like the tablist (`ui-model.ts:13-28`); screen-reader: radio-group semantics.
2. **Step 2 — "Start with a sample, or from scratch?"** Two large equal-weight choices, plus a third quiet option:
   - **"Show me with a sample"** → loads that trade's starter list + 1–2 matching sample enquiries (the existing `STARTER_LISTS` + `buildDemo` pattern, per-trade).
   - **"Start empty"** → empty workspace with that trade's starter list pre-loaded (so the price book is never empty — even "other" gets a generic list, closing UX-16's dead end).
   - Quiet link: "Explore the catering demo instead" (keeps the current Harbour & Hearth demo as an explicit option, not the default).
3. **Step 3 — "Paste your first enquiry"** → straight into the Composer (§9.3). The three prerequisites the audit names (set trade → set prices → paste) are sequenced by the flow itself. Currency and business basics ride along on the Business screen, reachable but not gating.
4. **Blank-start is first-class and non-destructive.** Move the reset out of "wipe this device" framing (`business-screen.tsx:309-362`): Data & backups keeps export/restore + a plainly-labelled "Start over (keeps your backup)" with the armed-confirm pattern and the §6 export prompt (UX-02).
5. **Trade changes never silently re-match** (UX-09 / UX-04): applying a starter list that would flip `business.trade` shows "This will also change your trade to Painting — open enquiries will get Painting questions. Re-match lines? [Re-match] [Keep mine]" before applying. Existing enquiries never have their gaps rewritten under the owner.
6. **"Other" trade gets a starter list.** Two generic "per job" placeholders so the trade is never a dead end (UX-16). If the trade is genuinely unlisted, "Other" with free-text label is better than an empty book.

**Empty-state / sample-label honesty (kept):** sample enquiries remain labelled as samples in-product (`PRODUCT_IDENTITY.md §1.6`); the first-run stepper says so: "These two are samples so you can see how it works — delete them any time."

**Acceptance criteria:**
- First load (no persisted state) asks trade before rendering any sample data.
- Every trade — including "other" — yields a non-empty price book.
- The catering demo remains reachable in ≤2 taps from first run.
- Blank-start requires no destructive framing and is reachable from the first-run flow.
- Beta measure (CANDIDATE): first-quote completion rate per trade, vs the catering-default baseline.

**Effort:** medium (reuses `STARTER_LISTS` + `buildDemo`). **Out of scope:** multi-trade businesses (events↔catering cross-list overlap, `UX_AUDIT.md §3` CANDIDATE) — deferred; the trade is single-select by design until beta evidence says otherwise.

---

### 9.3 WhatsApp paste clarity (composer, UX-12 + UX-19 — elevated to P1)

**Evidence:** Composer (`desk.tsx:651-762`) disables "Save" until ≥8 characters with no hint why (`:656-657, 705-711`); `maxLength={6000}` silently truncates long WhatsApp threads with no overflow notice (`:680-687`); the live extraction preview (`:723-747`) shows extracted values but not confidence/assumptions, so a wrong parse looks authoritative at save time (UX-19). The audit's deterministic-degradation strength (AI failure → plain-language fallback) should be matched at the paste point.

**Design — "paste with eyes open":**

1. **The 8-character rule explains itself.** Placeholder + hint line under the textarea: "Paste a WhatsApp message — as short as a name and a job." / below 8 chars: "Add a few more words so I can read it." (UX-12 fix.) The Save button stays disabled with this reason visible — never silent.
2. **Truncation is announced, not silent.** When the pasted text hits the 6,000-character cap, show an inline note at the bottom of the textarea: "This message was cut at 6,000 characters. The quote only has the first part." with a "Paste the most important part first" tip. (UX-12 fix.) The note is `role="status"` so screen readers announce it.
3. **The preview shows its working.** The live preview (`desk.tsx:723-747`) gains a confidence layer per field:
   - **Extracted with confidence** → value + a small "read from your message" caption.
   - **Guessed / low confidence** → value in **amber** with "I guessed this from your words — check it" (mirrors the §9.1 assumed-line pattern; same amber, same copy voice).
   - **Not found** → "To confirm" (existing) — but listed under a "Missing — we'll ask" subheading, so empty and guessed are distinguishable at a glance.
   - Fields the parser over-fires on (free-text location matching prepositions "in"/"at"/"near", `engine.ts:224-239`) render amber, never plain.
4. **The quote total in the preview is labelled as an estimate:** "Draft quote total: R5,200 — from your price book, may change when you check the lines." The trust disclosure (`COMPETITIVE_BENCHMARK.md §3`, "Borrow: 'prices never AI-generated'") lives *here*, at the moment of judgement, not in the README.
5. **After save**, the enquiry opens in detail (`pendingFocusId`, `store.ts:48-52`) and the first thing seen is the gaps panel + confirm checklist (§9.1), not a bare success screen. The loop is: paste → check preview → save → answer gaps → confirm lines → send.
6. **Voice-note reality (H4):** lowercase, punctuation-free messages under-extract by design. The preview for such messages shows more "To confirm" fields and a friendly note — *"Voice-note style messages are harder to read. The missing bits are listed below."* — rather than fabricating values. Safe, and visibly safe.

**Acceptance criteria:**
- A pasted thread >6,000 chars produces a visible truncation note (test with a 7,000-char paste).
- A wrongly-extracted value is visually distinguishable from a correct one *before* save (amber + caption).
- The Save button's disabled reason is always visible (below-8-chars hint).
- The draft total carries the "from your price book" label in the preview.
- Screen-reader pass: the preview fields announce text + confidence caption; truncation note is `role="status"`.

**Effort:** small–medium (copy + conditional rendering; parser unchanged). **CANDIDATE:** measure how often owners correct a preview field post-save (UX-19 frequency) in beta — if near-zero, the confidence layer can be simplified.

---

## 10. Non-goals & what not to change

Preserved from `UX_AUDIT.md §7` — these are strengths, not to be redesigned away:

- AI failure → deterministic fallback with plain-language errors (`read-enquiry.ts`, `detail.tsx:104-120`).
- "Nothing sent automatically" honesty; copy/deep-link/manual status. Fix UX-06 with point-of-send marking + undo, never auto-send.
- Snapshot pricing + explicit "Pull latest prices" (`engine.ts:828-840`). No silent repricing.
- Two-tap armed confirms — extend with undo (§6), don't remove.
- Trade-specific question copy (`quantityAsk`/`whereAsk`/`sizeAsk`) — reuse its voice in §9.1–9.3 copy.
- Backup import validation + pending-confirm (`business-screen.tsx:258-306`) — the pattern for all destructive flows.
- The slate/blue/Inter identity (`AGENTS.md:5`). No new brand colours, no new typeface.

**Explicitly out of scope for the P1s above:** online client approval / shareable quote links (COMPETITIVE_BENCHMARK H5 — highest-leverage *next* feature after these), margin visibility (H3), cloud storage (PRODUCT_IDENTITY H3), gap answer-capture (UX-05 — P2, sketched in §5), drag-to-move board (UX-17 — P3).

---

## 11. Cross-reference vs UX_AUDIT.md defect register

| Defect | Sev | Closed / addressed by |
|---|---|---|
| UX-03 bulk-confirm | P1 | §9.1 (confirm-rows, derived Ready) |
| UX-08 catering-only first run | P1 | §9.2 (trade-first flow) |
| UX-12 composer silent limits · UX-19 preview over-promise | P3/CANDIDATE | §9.3 (hints, truncation note, confidence layer) — elevated to P1 in this phase |
| UX-01 clipboard silent | P2 | §5–6 (Copy failure state + fallback) |
| UX-02 no undo | P2 | §6 (undo toast, export prompt) |
| UX-04 silent re-match | P2 | §6/§9.2 (Re-match/Keep mine) |
| UX-05 no gap answer | P2 | §5 (in-place answer input) |
| UX-06 mark-sent decoupled | P2 | §6 (point-of-send + undo) |
| UX-07 status unguarded | P2 | §9.1 step 6 + "Send anyway" override |
| UX-09 starter list flips trade | P3 | §9.2 step 5 |
| UX-10 currency totals | P2 | §6 (footnote + add-at-book-price) |
| UX-11 wa.me dead-end | P2 | §6 ("Add their number" inline field) |
| UX-13 invalid input silent | P3 | §5–6 (error state + "no disabled without a reason") |
| UX-14/17 mobile nav, read-only board | P3 | §4 breakpoint rules; board drag deferred |
| UX-15 ask-form delivers nothing | P2 | Not in this phase's three P1s — noted; require size/when/where + reference code (UX_AUDIT §6 P2-11) |
| UX-16 gap rigour catering-only · "other" dead end | P2 | Partially §9.2 step 6 (generic list); blocking-ness per trade deferred to P3-12 |
| UX-18 jobs-won caption | P3 | Copy fix, one line (`desk.tsx:475-484`) |

---

## 12. Handoff & open questions

- **SaHV CRM** remains UNVERIFIED (COMPETITIVE_BENCHMARK §1.2) — owner to confirm name/URL before competitive conclusions are treated as final.
- **Beta evidence needed (CANDIDATES):** preview-field correction rate (UX-19, §9.3); first-quote completion per trade (§9.2); screen-reader/voice-control pass (§8 NOT verified); xAI path against a live provider (carried from prior audit).
- **Implementation note:** token renames (§2, `--color-moss*` → `--action*`) should land as aliases first, components second, so no release breaks existing `op-*` classes.
