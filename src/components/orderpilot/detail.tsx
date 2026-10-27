import { handleTabKeys } from "./ui-model";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  MessageSquarePlus,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { readEnquiry } from "@/lib/orderpilot/read-enquiry";
import {
  allGaps,
  applyReading,
  assumptionNote,
  followUpText,
  freshStatus,
  patchEnquiry,
  pullLatestPrices,
  quoteText,
  mergeReply,
} from "@/lib/orderpilot/engine";
import { copyText, formatMoney, lineTotal, quoteTotal, whatsappLink } from "@/lib/orderpilot/money";
import { useOrderPilot } from "@/lib/orderpilot/store";
import type { Currency, Enquiry, QuoteLine } from "@/lib/orderpilot/types";
import { Avatar, Button, Field, StatusPill, TextArea, TextInput } from "./ui";

export function EnquiryDetail({ enquiry, onBack }: { enquiry: Enquiry; onBack: () => void }) {
  const business = useOrderPilot((state) => state.business);
  const currency = enquiry.currency ?? business.currency;
  const prices = useOrderPilot((state) => state.prices);
  const replaceEnquiry = useOrderPilot((state) => state.replaceEnquiry);
  const removeEnquiry = useOrderPilot((state) => state.removeEnquiry);
  const [editing, setEditing] = useState(enquiry.status === "needs-info");
  const [tab, setTab] = useState<"details" | "quote" | "conversation">("quote");
  const [wording, setWording] = useState(false);
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState<"follow" | "quote" | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function edit(patch: Partial<Enquiry>) {
    const latest =
      useOrderPilot.getState().enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
    replaceEnquiry(patchEnquiry(latest, patch, prices, business.trade));
  }

  function saveStatus(status: Enquiry["status"]) {
    const latest =
      useOrderPilot.getState().enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
    replaceEnquiry({
      ...latest,
      status,
      sentAt: status === "sent" ? (latest.sentAt ?? new Date().toISOString()) : latest.sentAt,
      paidAt: status === "paid" ? new Date().toISOString() : latest.paidAt,
      updatedAt: new Date().toISOString(),
    });
  }

  function reopen() {
    const latest =
      useOrderPilot.getState().enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
    const cleared = { ...latest, forcedReady: false, sentAt: null, paidAt: null };
    replaceEnquiry({
      ...cleared,
      status: freshStatus(cleared, business.trade),
      updatedAt: new Date().toISOString(),
    });
  }

  async function copy(kind: "follow" | "quote", text: string) {
    const ok = await copyText(text);
    setCopied(ok ? kind : null);
  }

  async function sharpen() {
    setAiBusy(true);
    setAiNote("");
    try {
      const latest = useOrderPilot.getState();
      const current = latest.enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
      const result = await readEnquiry({
        data: {
          message: current.rawMessage,
          businessName: latest.business.name,
          trade: latest.business.trade,
          catalog: latest.prices.map((price) => ({
            id: price.id,
            name: price.name,
            unit: price.unit,
            category: price.category,
          })),
        },
      });
      if (!result.ok) {
        setAiNote(result.error);
        return;
      }
      const now = useOrderPilot.getState();
      const unchanged = now.enquiries.find((item) => item.id === current.id);
      if (!unchanged || unchanged.updatedAt !== current.updatedAt || now.prices !== latest.prices) {
        setAiNote("Details changed while AI was reading. Try again to keep your latest edits.");
        return;
      }
      replaceEnquiry(applyReading(unchanged, result.reading, now.prices, now.business.trade));
      setAiNote("AI updated the details. Every price still comes from your list.");
    } catch {
      setAiNote("AI couldn't read that. Your own reading still stands.");
    } finally {
      setAiBusy(false);
    }
  }

  const gaps = allGaps(enquiry, business.trade);
  const follow = followUpText(business, enquiry, business.trade);
  const quote = quoteText(business, enquiry);
  const total = quoteTotal(enquiry.lines);
  const assumed = assumptionNote(enquiry.lines);
  const whenLabel = safeAgo(enquiry.createdAt);
  const terminal = ["won", "paid", "lost"].includes(enquiry.status);
  const mismatch = !!enquiry.currency && enquiry.currency !== business.currency;

  return (
    <article data-quote-detail className="op-detail">
      <button type="button" className="op-back" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to enquiries
      </button>
      <div className="op-detail-heading">
        <div className="op-detail-person">
          <Avatar name={enquiry.customerName} />
          <div>
            <div className="op-detail-name">
              <h1>{enquiry.customerName.trim() || "Unnamed customer"}</h1>
              <StatusPill status={enquiry.status} />
            </div>
            <p>
              {enquiry.service || "Service to confirm"}
              <span>·</span>
              {whenLabel}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={sharpen} disabled={aiBusy}>
          <Sparkles size={16} />
          {aiBusy ? "Reading…" : "Read with AI"}
        </Button>
      </div>
      {aiNote ? (
        <div role="status" className="op-notice">
          <Sparkles size={17} />
          <p>{aiNote}</p>
        </div>
      ) : null}
      <div className="op-detail-grid">
        <div className="op-detail-primary">
          <nav
            className="op-detail-tabs"
            role="tablist"
            onKeyDown={handleTabKeys}
            aria-label="Enquiry sections"
          >
            {(
              [
                ["quote", "Quote"],
                ["details", "Job details"],
                ["conversation", "Conversation"],
              ] as const
            ).map(([id, label]) => (
              <button
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                tabIndex={tab === id ? 0 : -1}
                aria-controls={`panel-${id}`}
                key={id}
                onClick={() => setTab(id)}
              >
                {id === "quote" ? (
                  <FileText size={16} />
                ) : id === "conversation" ? (
                  <MessageSquarePlus size={16} />
                ) : null}
                {label}
                {id === "details" && gaps.some((g) => g.blocking) && !terminal ? (
                  <span className="op-tab-dot" />
                ) : null}
              </button>
            ))}
          </nav>
          {tab === "quote" ? (
            <section
              className="op-work-panel op-quote-editor"
              role="tabpanel"
              id="panel-quote"
              aria-labelledby="tab-quote"
            >
              <div className="op-quote-paper-heading">
                <div>
                  <p className="op-eyebrow">
                    {enquiry.status === "needs-info" ? "DRAFT QUOTE" : "QUOTE"}
                  </p>
                  <h2>{business.name || "Your business"}</h2>
                  <p>Prepared for {enquiry.customerName || "your customer"}</p>
                </div>
                <div className="op-quote-reference">
                  <strong>QT-{enquiry.id.slice(0, 6).toUpperCase()}</strong>
                  <span>Valid for {business.validityDays} days</span>
                </div>
              </div>
              <div className="op-quote-context">
                <span>
                  <strong>Service</strong>
                  {enquiry.service || "To confirm"}
                </span>
                <span>
                  <strong>When</strong>
                  {enquiry.when || "To confirm"}
                </span>
                <span>
                  <strong>Location</strong>
                  {enquiry.location || "To confirm"}
                </span>
              </div>
              {mismatch ? (
                <div className="op-notice op-notice--warning">
                  <ShieldCheck size={17} />
                  <p>
                    This quote uses {currency}. Your price book now uses {business.currency}; add a
                    manual line in {currency} to avoid mixing currencies.
                  </p>
                </div>
              ) : null}
              {assumed ? (
                <div className="op-notice op-notice--warning">
                  <CircleAlertIcon />
                  <p>{assumed}</p>
                </div>
              ) : null}
              <div className="op-line-table">
                <div className="op-line-table-head" aria-hidden>
                  <span>Description</span>
                  <span>Quantity</span>
                  <span>Amount</span>
                  <span />
                </div>
                {enquiry.lines.length ? (
                  enquiry.lines.map((line) => (
                    <LineRow
                      key={line.id}
                      line={line}
                      currency={currency}
                      onChange={(qty) => changeQty(line, qty)}
                      onRemove={() => removeLine(line.id)}
                    />
                  ))
                ) : (
                  <div className="op-empty">
                    <FileText size={25} />
                    <h3>Add your first quote line</h3>
                    <p>No matching rate was found. Choose a price below or enter your own.</p>
                  </div>
                )}
              </div>
              <div className="op-add-lines">
                <Field label="Add from your list">
                  <select
                    className="op-input"
                    value=""
                    disabled={mismatch}
                    onChange={(event) => {
                      const price = prices.find((item) => item.id === event.target.value);
                      if (!price) return;
                      const qty =
                        (price.unit === "person" || price.unit === "room") && enquiry.quantity
                          ? enquiry.quantity
                          : 1;
                      edit({
                        lines: [
                          ...enquiry.lines,
                          {
                            id: crypto.randomUUID(),
                            priceItemId: price.id,
                            label: price.name,
                            category: price.category,
                            qty,
                            unit: price.unit,
                            unitPrice: price.price,
                            assumed: false,
                          },
                        ],
                        linesCustom: true,
                      });
                    }}
                  >
                    <option value="">Choose a price to add…</option>
                    {prices.map((price) => (
                      <option key={price.id} value={price.id}>
                        {price.name} — {formatMoney(price.price, currency)}
                      </option>
                    ))}
                  </select>
                </Field>
                <CustomLine
                  onAdd={(line) => edit({ lines: [...enquiry.lines, line], linesCustom: true })}
                />
                <div className="op-line-utilities">
                  {enquiry.linesCustom ? (
                    <button
                      type="button"
                      onClick={() => edit({ linesCustom: false, forcedReady: false })}
                    >
                      Match the message again
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={mismatch}
                    onClick={() => replaceEnquiry(pullLatestPrices(enquiry, prices))}
                  >
                    Pull latest prices
                  </button>
                </div>
              </div>
              <div className="op-quote-total">
                <div>
                  <ShieldCheck size={16} />
                  <span>Calculated from your own rates</span>
                </div>
                <p>
                  <span>
                    Total <small>{currency}</small>
                  </span>
                  <strong>{enquiry.lines.length ? formatMoney(total, currency) : "—"}</strong>
                </p>
              </div>
              <div className="op-quote-message">
                <div className="op-section-heading">
                  <h3>Message to send</h3>
                  <button
                    type="button"
                    className="op-text-button"
                    onClick={() => setWording((v) => !v)}
                  >
                    {wording ? "Done" : "Edit wording"}
                  </button>
                </div>
                {wording ? (
                  <TextArea
                    aria-label="Quote message"
                    value={quote}
                    onChange={(e) => edit({ customMessage: e.target.value })}
                    rows={9}
                  />
                ) : (
                  <details className="op-message-disclosure">
                    <summary>Preview customer message</summary>
                    <p className="op-message-preview">{quote}</p>
                  </details>
                )}
                {enquiry.customMessage ? (
                  <button
                    type="button"
                    className="op-text-button"
                    onClick={() => edit({ customMessage: null })}
                  >
                    Reset wording
                  </button>
                ) : null}
                <div className="op-message-actions">
                  <Button onClick={() => copy("quote", quote)} disabled={!enquiry.lines.length}>
                    {copied === "quote" ? <Check size={16} /> : <Copy size={16} />}{" "}
                    {copied === "quote" ? "Copied" : "Copy quote"}
                  </Button>
                  <a
                    className="op-button op-button--secondary"
                    href={whatsappLink(enquiry.contact, quote)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Send size={15} />
                    Open WhatsApp
                  </a>
                  <Button
                    variant="quiet"
                    onClick={() => window.print()}
                    disabled={!enquiry.lines.length}
                  >
                    <Printer size={16} />
                    Print / save PDF
                  </Button>
                </div>
                <p className="op-field-hint">
                  You choose where to send it. Copying or opening WhatsApp does not mark the quote
                  as sent.
                </p>
              </div>
            </section>
          ) : null}
          {tab === "details" ? (
            <section
              className="op-work-panel"
              role="tabpanel"
              id="panel-details"
              aria-labelledby="tab-details"
            >
              <div className="op-panel-heading">
                <div>
                  <h2>Job details</h2>
                  <p>Confirm the facts before you commit to a price.</p>
                </div>
                <Button variant="quiet" onClick={() => setEditing((v) => !v)}>
                  {editing ? "Done" : "Edit details"}
                </Button>
              </div>
              <div className="op-panel-body">
                {editing ? (
                  <div className="op-form-grid">
                    <Field label="Their name">
                      <TextInput
                        value={enquiry.customerName}
                        onChange={(e) => edit({ customerName: e.target.value })}
                      />
                    </Field>
                    <Field label="How to reach them">
                      <TextInput
                        value={enquiry.contact}
                        onChange={(e) => edit({ contact: e.target.value })}
                      />
                    </Field>
                    <Field label="What they want">
                      <TextInput
                        value={enquiry.service}
                        onChange={(e) => edit({ service: e.target.value })}
                      />
                    </Field>
                    <Field label="How many">
                      <div className="op-input-pair">
                        <TextInput
                          aria-label="How many"
                          type="number"
                          step="0.01"
                          min="0"
                          value={enquiry.quantity ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") edit({ quantity: null });
                            else if (Number.isFinite(Number(v))) edit({ quantity: Number(v) });
                          }}
                        />
                        <TextInput
                          aria-label="Quantity unit"
                          value={enquiry.quantityLabel}
                          onChange={(e) => edit({ quantityLabel: e.target.value })}
                        />
                      </div>
                    </Field>
                    <Field label="When">
                      <TextInput
                        value={enquiry.when}
                        onChange={(e) => edit({ when: e.target.value })}
                      />
                    </Field>
                    <Field label="Where">
                      <TextInput
                        value={enquiry.location}
                        onChange={(e) => edit({ location: e.target.value })}
                      />
                    </Field>
                    <div className="op-span-2">
                      <Field label="Notes">
                        <TextArea
                          value={enquiry.notes}
                          onChange={(e) => edit({ notes: e.target.value })}
                          rows={3}
                        />
                      </Field>
                    </div>
                  </div>
                ) : (
                  <dl className="op-facts">
                    {[
                      ["Customer", enquiry.customerName],
                      ["Contact", enquiry.contact],
                      ["Service", enquiry.service],
                      [
                        "Size",
                        enquiry.quantity ? `${enquiry.quantity} ${enquiry.quantityLabel}` : "",
                      ],
                      ["When", enquiry.when],
                      ["Where", enquiry.location],
                      ["Notes", enquiry.notes],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v || "To confirm"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              {gaps.length && !terminal ? (
                <div className="op-question-panel">
                  <div className="op-section-heading">
                    <h3>Fill in the gaps</h3>
                    <span className="op-count">{gaps.length} questions</span>
                  </div>
                  <ul>
                    {gaps.map((g) => (
                      <li key={g.id}>
                        <span className={g.blocking ? "op-required-dot" : "op-optional-dot"} />
                        <span>
                          {g.ask}
                          {g.blocking ? <small>Required for a firm quote</small> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <TextArea
                    aria-label="Follow-up message"
                    rows={7}
                    value={follow}
                    onChange={(e) => edit({ customFollowUp: e.target.value })}
                  />
                  <div className="op-message-actions">
                    <Button onClick={() => copy("follow", follow)}>
                      <Copy size={16} />
                      {copied === "follow" ? "Copied" : "Copy follow-up"}
                    </Button>
                    {enquiry.customFollowUp ? (
                      <Button variant="quiet" onClick={() => edit({ customFollowUp: null })}>
                        Reset message
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
          {tab === "conversation" ? (
            <section
              className="op-work-panel"
              role="tabpanel"
              id="panel-conversation"
              aria-labelledby="tab-conversation"
            >
              <div className="op-panel-heading">
                <div>
                  <h2>The conversation</h2>
                  <p>Keep the original enquiry and replies in context.</p>
                </div>
              </div>
              <div className="op-panel-body">
                <div className="op-original-message">
                  <Avatar name={enquiry.customerName} small />
                  <div>
                    <strong>
                      {enquiry.customerName || "Customer"}
                      <span>{new Date(enquiry.createdAt).toLocaleDateString("en-ZA")}</span>
                    </strong>
                    <p>{enquiry.rawMessage}</p>
                  </div>
                </div>
                <div className="op-reply-composer">
                  <h3>Add their latest reply</h3>
                  <p>
                    Paste the message to update the details. Your manually chosen prices stay in
                    place.
                  </p>
                  <TextArea
                    aria-label="Customer reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={5}
                    placeholder="We’re in Claremont, buffet is perfect, no allergies."
                  />
                  <Button
                    disabled={reply.trim().length < 2}
                    onClick={() => {
                      const latest =
                        useOrderPilot.getState().enquiries.find((e) => e.id === enquiry.id) ??
                        enquiry;
                      replaceEnquiry(mergeReply(latest, reply, prices, business.trade));
                      setReply("");
                    }}
                  >
                    <MessageSquarePlus size={16} />
                    Add this reply
                  </Button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
        <aside className="op-detail-rail" aria-label="Enquiry actions">
          <section className="op-work-panel op-next-step">
            <p className="op-eyebrow">NEXT STEP</p>
            <h2>
              {enquiry.status === "paid"
                ? "A job well done."
                : enquiry.status === "won"
                  ? "Record the payment."
                  : enquiry.status === "sent"
                    ? "Keep the conversation going."
                    : enquiry.status === "lost"
                      ? "Room for the next opportunity."
                      : enquiry.status === "ready"
                        ? "Ready for your customer."
                        : "A few details to confirm."}
            </h2>
            <p>
              {enquiry.status === "paid"
                ? "Payment has been marked as received in your records."
                : enquiry.status === "won"
                  ? "Your customer said yes. Mark the job paid when you receive payment."
                  : enquiry.status === "sent"
                    ? "Set a follow-up date so this quote stays on your radar."
                    : enquiry.status === "lost"
                      ? "You can reopen this enquiry if the customer comes back."
                      : enquiry.status === "ready"
                        ? "Review the quote, send it yourself, then mark it sent."
                        : "Review the suggested prices and ask for the missing information."}
            </p>
            <div className="op-status-actions">
              {enquiry.status === "needs-info" && enquiry.lines.length ? (
                <Button
                  onClick={() =>
                    edit({
                      lines: enquiry.lines.map((l) => ({ ...l, assumed: false })),
                      linesCustom: true,
                      forcedReady: true,
                      status: "ready",
                    })
                  }
                >
                  The quote is ready
                  <ArrowRight size={16} />
                </Button>
              ) : null}
              {!["sent", "won", "paid", "lost"].includes(enquiry.status) ? (
                <Button
                  variant={enquiry.status === "ready" ? "primary" : "secondary"}
                  disabled={!enquiry.lines.length}
                  onClick={() => saveStatus("sent")}
                >
                  <Send size={16} />
                  Mark sent
                </Button>
              ) : null}
              {!["won", "paid", "lost"].includes(enquiry.status) ? (
                <Button variant="secondary" onClick={() => saveStatus("won")}>
                  <CheckCircle2 size={16} />
                  Won
                </Button>
              ) : null}
              {enquiry.status === "won" ? (
                <Button onClick={() => saveStatus("paid")}>
                  <CheckCircle2 size={16} />
                  Mark paid
                </Button>
              ) : null}
              {!["lost", "paid"].includes(enquiry.status) ? (
                <Button variant="quiet" onClick={() => saveStatus("lost")}>
                  Close enquiry
                </Button>
              ) : null}
              {["sent", "won", "paid", "lost"].includes(enquiry.status) ? (
                <Button variant="secondary" onClick={reopen}>
                  Reopen
                </Button>
              ) : null}
            </div>
          </section>
          <section className="op-work-panel op-followup-panel">
            <div className="op-section-heading">
              <h3>Follow-up</h3>
              <MessageSquarePlus size={17} />
            </div>
            <Field
              label="Next follow-up"
              hint="A reminder in your workspace. No automatic messages."
            >
              <TextInput
                type="date"
                value={enquiry.followUpOn ?? ""}
                onChange={(e) => edit({ followUpOn: e.target.value })}
              />
            </Field>
            {enquiry.paidAt ? (
              <p className="op-payment-record">
                <CheckCircle2 size={16} />
                <span>
                  Payment recorded {new Date(enquiry.paidAt).toLocaleDateString("en-ZA")}
                  <small>Manual record, not payment verification.</small>
                </span>
              </p>
            ) : null}
          </section>
          <div className="op-detail-meta">
            <span>ENQUIRY REFERENCE</span>
            <strong>OP-{enquiry.id.slice(0, 8).toUpperCase()}</strong>
            <p>Updated {safeAgo(enquiry.updatedAt)}</p>
          </div>
          <button
            type="button"
            className="op-delete"
            onClick={() => (confirmDelete ? removeEnquiry(enquiry.id) : setConfirmDelete(true))}
          >
            <Trash2 size={15} />
            {confirmDelete ? "Yes, delete this enquiry" : "Delete enquiry"}
          </button>
          {confirmDelete ? (
            <button
              type="button"
              className="op-text-button"
              onClick={() => setConfirmDelete(false)}
            >
              Keep this enquiry
            </button>
          ) : null}
        </aside>
      </div>
      <section className="print-quote" aria-hidden="true">
        <h1>{business.name || "OrderPilot"}</h1>
        <p>QUOTE · {enquiry.id.slice(0, 8).toUpperCase()}</p>
        <p>Prepared {new Date().toLocaleDateString("en-ZA")}</p>
        <p className="quote-print-message">{quote}</p>
      </section>
    </article>
  );
  function changeQty(line: QuoteLine, qty: number) {
    if (!Number.isFinite(qty) || qty <= 0) return;
    edit({
      lines: enquiry.lines.map((item) =>
        item.id === line.id ? { ...item, qty, assumed: false } : item,
      ),
      linesCustom: true,
    });
  }
  function removeLine(id: string) {
    edit({ lines: enquiry.lines.filter((item) => item.id !== id), linesCustom: true });
  }
}
function CircleAlertIcon() {
  return (
    <span className="op-warning-symbol" aria-hidden>
      !
    </span>
  );
}
function LineRow({
  line,
  currency,
  onChange,
  onRemove,
}: {
  line: QuoteLine;
  currency: Currency;
  onChange: (q: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="op-line-row">
      <div>
        <strong>{line.label}</strong>
        <span>
          {formatMoney(line.unitPrice, currency)} / {line.unit}
          {line.assumed ? " · Review suggestion" : ""}
        </span>
      </div>
      <label>
        <span className="sr-only">Qty</span>
        <input
          className="op-input"
          type="number"
          step="0.01"
          min="0.01"
          value={line.qty}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
      <strong>{formatMoney(lineTotal(line.qty, line.unitPrice), currency)}</strong>
      <button
        type="button"
        aria-label={`Remove ${line.label}`}
        className="op-icon-button"
        onClick={onRemove}
      >
        <X size={15} />
      </button>
    </div>
  );
}
function CustomLine({ onAdd }: { onAdd: (line: QuoteLine) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  if (!open)
    return (
      <button type="button" className="op-text-button op-add-custom" onClick={() => setOpen(true)}>
        + Type your own line
      </button>
    );
  return (
    <form
      className="op-custom-line"
      onSubmit={(e) => {
        e.preventDefault();
        const unitPrice = Number(price),
          count = Number(qty);
        if (
          !label.trim() ||
          !price.trim() ||
          !Number.isFinite(unitPrice) ||
          unitPrice < 0 ||
          !Number.isFinite(count) ||
          count <= 0
        )
          return;
        onAdd({
          id: crypto.randomUUID(),
          priceItemId: null,
          label: label.trim(),
          category: "Custom",
          qty: count,
          unit: "each",
          unitPrice,
          assumed: false,
        });
        setLabel("");
        setPrice("");
        setQty("1");
        setOpen(false);
      }}
    >
      <TextInput
        aria-label="Line name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Service or item"
        required
      />
      <TextInput
        aria-label="Quantity"
        inputMode="decimal"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />
      <TextInput
        aria-label="Your price"
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Your price"
        required
      />
      <Button type="submit">Add</Button>
      <Button variant="quiet" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
function safeAgo(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNow(date, { addSuffix: true });
}
