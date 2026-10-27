import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Check, Copy, MessageSquarePlus } from "lucide-react";
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
import { Button, Field, StatusPill, TextArea, TextInput } from "./ui";

export function EnquiryDetail({
  enquiry,
  onBack,
}: {
  enquiry: Enquiry;
  onBack: () => void;
}) {
  const business = useOrderPilot((state) => state.business);
  const currency = enquiry.currency ?? business.currency;
  const prices = useOrderPilot((state) => state.prices);
  const replaceEnquiry = useOrderPilot((state) => state.replaceEnquiry);
  const removeEnquiry = useOrderPilot((state) => state.removeEnquiry);
  const [editing, setEditing] = useState(enquiry.status === "needs-info");
  const [messageOpen, setMessageOpen] = useState(false);
  const [wording, setWording] = useState(false);
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState<"follow" | "quote" | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEditing(enquiry.status === "needs-info");
    setMessageOpen(false);
    setWording(false);
    setReply("");
    setCopied(null);
    setAiNote("");
    setConfirmDelete(false);
  }, [enquiry.id]);

  function edit(patch: Partial<Enquiry>) {
    const latest = useOrderPilot.getState().enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
    replaceEnquiry(patchEnquiry(latest, patch, prices, business.trade));
  }

  function saveStatus(status: Enquiry["status"]) {
    const latest = useOrderPilot.getState().enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
    replaceEnquiry({
      ...latest,
      status,
      sentAt: status === "sent" ? (latest.sentAt ?? new Date().toISOString()) : latest.sentAt,
      paidAt: status === "paid" ? new Date().toISOString() : latest.paidAt,
      updatedAt: new Date().toISOString(),
    });
  }

  function reopen() {
    const latest = useOrderPilot.getState().enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
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

  return (
    <article data-quote-detail className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-5 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-moss lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Inbox
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-3xl text-ink">{enquiry.customerName.trim() || "No name yet"}</h2>
            <StatusPill status={enquiry.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {enquiry.service || "Job not named yet"}
            {whenLabel ? ` · ${whenLabel}` : ""}
          </p>
        </div>
        <Button variant="secondary" onClick={sharpen} disabled={aiBusy}>
          {aiBusy ? "Reading…" : "Read with AI"}
        </Button>
      </div>
      {aiNote ? <p className="text-sm text-ink-soft">{aiNote}</p> : null}

      <section className="border-l-2 border-moss pl-4">
        <h3 className="text-sm font-semibold text-muted">What they sent</h3>
        <p className={`mt-2 whitespace-pre-wrap font-display text-lg text-ink ${messageOpen ? "" : "line-clamp-6"}`}>
          {enquiry.rawMessage}
        </p>
        {enquiry.rawMessage.length > 280 ? (
          <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-moss" onClick={() => setMessageOpen((open) => !open)}>
            {messageOpen ? "Show less" : "Show the whole message"}
          </button>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl">What we know</h3>
          <Button variant="quiet" onClick={() => setEditing((open) => !open)}>
            {editing ? "Done" : "Edit details"}
          </Button>
        </div>
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Their name">
              <TextInput value={enquiry.customerName} onChange={(event) => edit({ customerName: event.target.value })} />
            </Field>
            <Field label="How to reach them">
              <TextInput value={enquiry.contact} onChange={(event) => edit({ contact: event.target.value })} />
            </Field>
            <Field label="What they want">
              <TextInput value={enquiry.service} onChange={(event) => edit({ service: event.target.value })} />
            </Field>
            <Field label="How many">
              <div className="flex gap-2">
                <TextInput
                  type="number"
                        step="0.01"
                  min={0}
                  inputMode="decimal"
                  className="w-24 shrink-0"
                  value={enquiry.quantity ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === "") edit({ quantity: null });
                    else if (Number.isFinite(Number(raw))) edit({ quantity: Number(raw) });
                  }}
                />
                <TextInput
                  value={enquiry.quantityLabel}
                  placeholder="people"
                  onChange={(event) => edit({ quantityLabel: event.target.value })}
                />
              </div>
            </Field>
            <Field label="When">
              <TextInput value={enquiry.when} onChange={(event) => edit({ when: event.target.value })} />
            </Field>
            <Field label="Where">
              <TextInput value={enquiry.location} onChange={(event) => edit({ location: event.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <TextInput value={enquiry.notes} onChange={(event) => edit({ notes: event.target.value })} />
              </Field>
            </div>
          </div>
        ) : (
          <p className="text-ink-soft">
            {[
              enquiry.service,
              enquiry.quantity ? `${enquiry.quantity} ${enquiry.quantityLabel || "people"}` : "",
              enquiry.when,
              enquiry.location,
              enquiry.contact,
            ]
              .filter(Boolean)
              .join(" · ") || "Nothing solid yet — edit the details or ask them."}
            {enquiry.notes ? ` ${enquiry.notes}.` : ""}
          </p>
        )}
      </section>

      {gaps.length && !["won", "paid", "lost"].includes(enquiry.status) ? (
        <section className="rounded-xl bg-clay-soft p-4">
          <h3 className="font-display text-2xl text-clay">Still worth asking</h3>
          <ul className="mt-3 space-y-2">
            {gaps.map((gap) => (
              <li key={gap.id} className="text-ink">
                {gap.ask}
                {gap.blocking ? <span className="text-clay"> · needed for a firm quote</span> : null}
              </li>
            ))}
          </ul>
          <TextArea
            className="mt-4 min-h-36 bg-card"
            value={follow}
            onChange={(event) => edit({ customFollowUp: event.target.value })}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => copy("follow", follow)}>
              {copied === "follow" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied === "follow" ? "Copied" : "Copy follow-up"}
            </Button>
            {enquiry.customFollowUp ? (
              <Button variant="quiet" onClick={() => edit({ customFollowUp: null })}>
                Rewrite it
              </Button>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-ink-soft">Nothing goes out until you paste this yourself.</p>
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">{enquiry.status === "needs-info" ? "Draft quote" : "Quote"}</h3>
            <p className="text-sm text-muted">{enquiry.currency && enquiry.currency !== business.currency ? `Quoted in ${enquiry.currency}. New prices use ${business.currency}; do not mix currencies.` : "Built only from prices you set."}</p>
          </div>
          <p className="shrink-0 whitespace-nowrap font-display text-3xl tabular-nums text-ink sm:text-4xl">
            {enquiry.lines.length ? formatMoney(total, currency) : "—"}
          </p>
        </div>
        {assumed ? <p className="mt-3 rounded-lg bg-clay-soft px-3 py-2 text-sm text-clay">{assumed}</p> : null}
        {enquiry.lines.length ? (
          <ul className="mt-4 divide-y divide-line">
            {enquiry.lines.map((line) => (
              <LineRow key={line.id} line={line} currency={currency} onChange={(qty) => changeQty(line, qty)} onRemove={() => removeLine(line.id)} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-ink-soft">
            Nothing on your price list matches this, so there is no number. OrderPilot will not invent one.
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="block min-w-0 flex-1 text-sm font-medium text-ink-soft">
            Add from your list
            <select
              className="mt-1 h-11 w-full rounded-lg border border-line bg-card px-3 text-base text-ink"
              value=""
              disabled={!!enquiry.currency && enquiry.currency !== business.currency}
              onChange={(event) => {
                const price = prices.find((item) => item.id === event.target.value);
                if (!price) return;
                const qty =
                  (price.unit === "person" || price.unit === "room") && enquiry.quantity ? enquiry.quantity : 1;
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
              <option value="">Choose a price</option>
              {prices.map((price) => (
                <option key={price.id} value={price.id}>
                  {price.name} — {formatMoney(price.price, currency)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <CustomLine
          onAdd={(line) => edit({ lines: [...enquiry.lines, line], linesCustom: true })}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {enquiry.linesCustom ? (
            <Button
              variant="quiet"
              onClick={() => edit({ linesCustom: false, forcedReady: false })}
            >
              Match the message again
            </Button>
          ) : null}
          <Button variant="quiet" disabled={!!enquiry.currency && enquiry.currency !== business.currency} onClick={() => replaceEnquiry(pullLatestPrices(enquiry, prices))}>
            Pull latest prices
          </Button>
        </div>
        {enquiry.status === "needs-info" && enquiry.lines.length ? (
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() =>
              edit({
                lines: enquiry.lines.map((line) => ({ ...line, assumed: false })),
                linesCustom: true,
                forcedReady: true,
                status: "ready",
              })
            }
          >
            The quote is ready
          </Button>
        ) : null}
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-muted">Message to send</h4>
            <button type="button" className="min-h-11 text-sm font-semibold text-moss" onClick={() => setWording((open) => !open)}>
              {wording ? "Done" : "Edit wording"}
            </button>
          </div>
          {wording ? (
            <TextArea
              className="min-h-48"
              value={quote}
              onChange={(event) => edit({ customMessage: event.target.value })}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm text-ink-soft">{quote || "Add a price to write the quote."}</p>
          )}
          {enquiry.customMessage ? (
            <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-moss" onClick={() => edit({ customMessage: null })}>
              Reset wording
            </button>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => copy("quote", quote)} disabled={!enquiry.lines.length}>
              {copied === "quote" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied === "quote" ? "Copied" : "Copy quote"}
            </Button>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-card px-4 text-sm font-semibold text-ink shadow-card"
              href={whatsappLink(enquiry.contact, quote)}
              target="_blank"
              rel="noreferrer"
            >
              Open WhatsApp
            </a>
            {!["sent", "won", "paid"].includes(enquiry.status) ? (
              <Button variant="secondary" onClick={() => saveStatus("sent")} disabled={!enquiry.lines.length}>
                Mark sent
              </Button>
            ) : null}
            {!["won", "paid"].includes(enquiry.status) ? (
              <Button variant="quiet" onClick={() => saveStatus("won")}>
                Won
              </Button>
            ) : null}
            {enquiry.status === "won" ? <Button onClick={() => saveStatus("paid")}>Mark paid</Button> : null}
            <Button variant="secondary" onClick={() => window.print()} disabled={!enquiry.lines.length}>Print / save PDF</Button>
            {enquiry.status !== "lost" && enquiry.status !== "paid" ? (
              <Button variant="quiet" onClick={() => saveStatus("lost")}>
                Passed
              </Button>
            ) : null}
            {["won", "paid", "lost", "sent"].includes(enquiry.status) ? (
              <Button variant="quiet" onClick={reopen}>
                Reopen
              </Button>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted">Copying does not send it. Mark it sent once it’s actually gone.</p>
        </div>
      </section>

      <section className="rounded-xl border border-line p-4" data-no-print>
        <Field label="Next follow-up" hint="A reminder inside OrderPilot; no automatic messages are sent.">
          <TextInput type="date" value={enquiry.followUpOn ?? ""} onChange={(event) => edit({ followUpOn: event.target.value })} />
        </Field>
        {enquiry.paidAt ? <p className="mt-3 font-semibold text-moss">Payment recorded {new Date(enquiry.paidAt).toLocaleDateString("en-ZA")}. This is a manual record, not payment verification.</p> : null}
      </section>
      <section className="rounded-xl border border-line p-4" data-no-print>
        <h3 className="flex items-center gap-2 font-display text-2xl">
          <MessageSquarePlus className="size-5" aria-hidden />
          They replied
        </h3>
        <p className="mt-1 text-sm text-muted">Paste the next message. Missing bits get filled in. Your prices stay yours.</p>
        <TextArea className="mt-3 min-h-24" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="We’re in Claremont, buffet is perfect, no allergies." />
        <Button
          className="mt-3"
          variant="secondary"
          disabled={reply.trim().length < 2}
          onClick={() => {
            const latest = useOrderPilot.getState().enquiries.find((item) => item.id === enquiry.id) ?? enquiry;
            replaceEnquiry(mergeReply(latest, reply, prices, business.trade));
            setReply("");
          }}
        >
          Add this reply
        </Button>
      </section>

      <div>
        <Button variant={confirmDelete ? "clay" : "quiet"} onClick={() => (confirmDelete ? removeEnquiry(enquiry.id) : setConfirmDelete(true))}>
          {confirmDelete ? "Yes, delete this enquiry" : "Delete enquiry"}
        </Button>
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
      lines: enquiry.lines.map((item) => (item.id === line.id ? { ...item, qty, assumed: false } : item)),
      linesCustom: true,
    });
  }

  function removeLine(id: string) {
    edit({
      lines: enquiry.lines.filter((item) => item.id !== id),
      linesCustom: true,
    });
  }
}

function LineRow({
  line,
  currency,
  onChange,
  onRemove,
}: {
  line: QuoteLine;
  currency: Currency;
  onChange: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium text-ink">{line.label}</p>
        <p className="text-sm tabular-nums text-muted">
          {formatMoney(lineTotal(line.qty, line.unitPrice), currency)}
          {line.assumed ? " · guess" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted">
          Qty
          <input
            type="number"
                        step="0.01"
            min={1}
            inputMode="decimal"
            value={line.qty}
            onChange={(event) => onChange(Number(event.target.value))}
            className="ml-2 h-11 w-20 rounded-lg border border-line bg-paper px-2 text-base tabular-nums text-ink"
          />
        </label>
        <button type="button" onClick={onRemove} className="min-h-11 px-2 text-sm font-semibold text-clay">
          Remove
        </button>
      </div>
    </li>
  );
}

function CustomLine({ onAdd }: { onAdd: (line: QuoteLine) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  if (!open) {
    return (
      <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-moss" onClick={() => setOpen(true)}>
        Type your own line
      </button>
    );
  }
  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const unitPrice = Number(price);
        const count = Number(qty);
        if (!label.trim() || !price.trim() || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(count) || count <= 0) return;
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
      <TextInput value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Line name" aria-label="Line name" />
      <TextInput value={qty} onChange={(event) => setQty(event.target.value)} inputMode="decimal" aria-label="Quantity" />
      <TextInput value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="Price" aria-label="Your price" />
      <Button type="submit">Add</Button>
    </form>
  );
}

function safeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}
