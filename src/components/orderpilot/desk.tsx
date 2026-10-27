import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { allGaps, enquiryFromMessage, sortEnquiries } from "@/lib/orderpilot/engine";
import { formatMoney, quoteTotal } from "@/lib/orderpilot/money";
import { PASTE_EXAMPLES } from "@/lib/orderpilot/presets";
import { useOrderPilot, useOrderPilotHydrated } from "@/lib/orderpilot/store";
import type { Currency, Enquiry, Status } from "@/lib/orderpilot/types";
import { EnquiryDetail } from "./detail";
import { BusinessScreen } from "./business-screen";
import { PricesScreen } from "./prices-screen";
import { Button, Mark, StatusPill, TextArea } from "./ui";

type Screen = "inbox" | "compose" | "prices" | "business";
type Filter = "all" | Status;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs-info", label: "Needs you" },
  { id: "ready", label: "Ready" },
  { id: "sent", label: "Waiting" },
  { id: "won", label: "Won" },
  { id: "paid", label: "Paid" },
  { id: "lost", label: "Passed" },
];

export function OrderPilotDesk() {
  const hydrated = useOrderPilotHydrated();
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <div className="h-1 bg-moss" />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="font-display text-4xl">OrderPilot</p>
          <p className="mt-2 text-muted">Opening your inbox…</p>
        </div>
      </div>
    );
  }
  return <Desk />;
}

function Desk() {
  const business = useOrderPilot((state) => state.business);
  const enquiries = useOrderPilot((state) => state.enquiries);
  const introDismissed = useOrderPilot((state) => state.introDismissed);
  const dismissIntro = useOrderPilot((state) => state.dismissIntro);
  const pendingFocusId = useOrderPilot((state) => state.pendingFocusId);
  const clearPending = useOrderPilot((state) => state.clearPending);
  const [screen, setScreen] = useState<Screen>("inbox");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  const sorted = useMemo(() => sortEnquiries(enquiries), [enquiries]);

  useEffect(() => {
    if (pendingFocusId) {
      setSelectedId(pendingFocusId);
      setScreen("inbox");
      setMobileDetail(true);
      clearPending();
      return;
    }
    setSelectedId((current) => {
      if (current && enquiries.some((enquiry) => enquiry.id === current)) return current;
      return sorted[0]?.id ?? null;
    });
  }, [pendingFocusId, enquiries, sorted, clearPending]);

  const visible = sorted.filter((enquiry) => filter === "all" || enquiry.status === filter);
  const selected = enquiries.find((enquiry) => enquiry.id === selectedId) ?? sorted[0] ?? null;
  const followUpsDue = enquiries.filter((item) => item.followUpOn && item.followUpOn <= new Date().toLocaleDateString("en-CA") && !["won", "paid", "lost"].includes(item.status)).length;
  const needsYou = enquiries.filter((enquiry) => enquiry.status === "needs-info" || enquiry.status === "ready").length;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="h-1 bg-moss" />
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Mark />
            <div className="min-w-0">
              <p className="font-display text-xl leading-none">OrderPilot</p>
              <p className="truncate text-sm text-muted">{business.name}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setScreen("compose");
              setMobileDetail(false);
            }}
          >
            New enquiry
          </Button>
        </div>
        <nav className="mx-auto grid max-w-6xl grid-cols-3 border-t border-line lg:flex lg:gap-1 lg:border-t-0 lg:px-4 lg:pb-3">
          <Tab pressed={screen === "inbox" || screen === "compose"} onClick={() => { setScreen("inbox"); setMobileDetail(false); }} label="Inbox" count={needsYou} />
          <Tab pressed={screen === "prices"} onClick={() => setScreen("prices")} label="Prices" />
          <Tab pressed={screen === "business"} onClick={() => setScreen("business")} label="Business" />
        </nav>
      </header>

      {followUpsDue > 0 ? <p role="status" className="mx-auto max-w-6xl px-4 py-3 text-sm font-semibold text-clay">{followUpsDue} follow-up{followUpsDue === 1 ? "" : "s"} due. Open the highlighted enquiries to respond.</p> : null}
      {screen === "prices" ? <PricesScreen /> : null}
      {screen === "business" ? <BusinessScreen /> : null}
      {screen === "inbox" || screen === "compose" ? (
        <div className="mx-auto grid max-w-6xl lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className={`min-w-0 lg:border-r lg:border-line ${screen === "compose" || mobileDetail ? "hidden lg:block" : ""}`}>
            {!introDismissed ? (
              <div className="m-4 rounded-xl bg-moss-soft p-4">
                <p className="text-sm text-ink">
                  Practice inbox for {business.name}. Paste a real message whenever you like. Quotes use only your prices, and nothing is sent until you copy it.
                </p>
                <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-moss" onClick={dismissIntro}>
                  Hide this
                </button>
              </div>
            ) : null}
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                  className={`min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${filter === item.id ? "bg-ink text-paper" : "bg-paper-2 text-ink-soft"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ul className="flex flex-col gap-3 px-4 pb-24">
              {visible.length === 0 ? (
                <li className="rounded-xl bg-card p-4 text-sm text-muted shadow-card">Nothing in this pile.</li>
              ) : (
                visible.map((enquiry) => (
                  <li key={enquiry.id}>
                    <EnquiryCard
                      enquiry={enquiry}
                      currency={enquiry.currency ?? business.currency}
                      selected={enquiry.id === selectedId}
                      onSelect={() => {
                        setSelectedId(enquiry.id);
                        setScreen("inbox");
                        setMobileDetail(true);
                      }}
                    />
                  </li>
                ))
              )}
            </ul>
          </aside>
          <section className={`min-w-0 ${screen === "inbox" && !mobileDetail ? "hidden lg:block" : ""}`}>
            {screen === "compose" ? (
              <Composer
                onCancel={() => setScreen("inbox")}
                onSaved={() => {
                  setScreen("inbox");
                  setMobileDetail(true);
                }}
              />
            ) : selected ? (
              <EnquiryDetail enquiry={selected} onBack={() => setMobileDetail(false)} />
            ) : (
              <div className="px-4 py-16 text-center">
                <h2 className="font-display text-3xl">No enquiries yet</h2>
                <p className="mt-2 text-muted">Paste the next message that lands on your phone.</p>
                <Button className="mt-4" onClick={() => setScreen("compose")}>
                  New enquiry
                </Button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Tab({
  pressed,
  onClick,
  label,
  count,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 px-3 text-sm font-semibold ${pressed ? "text-moss" : "text-muted"}`}
    >
      {label}
      {count ? <span className="ml-1 tabular-nums text-clay">{count}</span> : null}
    </button>
  );
}

function EnquiryCard({
  enquiry,
  selected,
  onSelect,
  currency,
}: {
  enquiry: Enquiry;
  selected: boolean;
  onSelect: () => void;
  currency: Currency;
}) {
  const total = quoteTotal(enquiry.lines);
  const gaps = allGaps(enquiry, useOrderPilot.getState().business.trade);
  const bits = [enquiry.service, enquiry.quantity ? `${enquiry.quantity} ${enquiry.quantityLabel}` : "", enquiry.when]
    .filter(Boolean)
    .join(" · ");
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`w-full rounded-xl p-4 text-left shadow-card ${selected ? "bg-moss-soft" : "bg-card"}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold text-ink">{enquiry.customerName.trim() || "No name yet"}</span>
        <StatusPill status={enquiry.status} />
      </span>
      <span className="mt-1 block truncate text-sm text-ink-soft">{bits || "Waiting to be read"}</span>
      <span className="mt-3 flex items-end justify-between gap-2">
        <span className="font-display text-2xl tabular-nums text-ink">
          {enquiry.lines.length ? formatMoney(total, currency) : "No price yet"}
        </span>
        <span className="text-sm text-muted">{safeAgo(enquiry.updatedAt)}</span>
      </span>
      {enquiry.followUpOn && !["paid", "lost", "won"].includes(enquiry.status) ? <span className="mt-2 block text-sm font-semibold text-clay">Follow up: {enquiry.followUpOn}</span> : null}
      {enquiry.status === "needs-info" && gaps[0] ? (
        <span className="mt-2 block truncate text-sm text-clay">{gaps[0].ask}</span>
      ) : null}
    </button>
  );
}

function Composer({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const business = useOrderPilot((state) => state.business);
  const prices = useOrderPilot((state) => state.prices);
  const addEnquiry = useOrderPilot((state) => state.addEnquiry);
  const [text, setText] = useState("");
  const preview = useMemo(() => {
    if (text.trim().length < 8) return null;
    return enquiryFromMessage(text, business, prices, "paste");
  }, [text, business, prices]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 pb-24">
      <div>
        <button type="button" onClick={onCancel} className="mb-2 min-h-11 text-sm font-semibold text-moss lg:hidden">
          Back
        </button>
        <h2 className="font-display text-4xl">Paste their message</h2>
        <p className="mt-2 text-ink-soft">WhatsApp, email, Instagram — the messy version is fine.</p>
      </div>
      <TextArea
        maxLength={6000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        placeholder="Hi, I need catering for about 80 people next Saturday…"
        aria-label="Customer message"
      />
      <div className="flex flex-wrap gap-2">
        {PASTE_EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => setText(example.text)}
            className="min-h-11 rounded-full bg-paper-2 px-3 text-sm font-semibold text-ink-soft"
          >
            {example.label}
          </button>
        ))}
      </div>
      {preview ? (
        <div className="rounded-xl bg-card p-4 shadow-card">
          <p className="text-sm font-semibold text-muted">Picked out</p>
          <p className="mt-2 text-ink">
            {[
              preview.customerName,
              preview.service,
              preview.quantity ? `${preview.quantity} ${preview.quantityLabel}` : "",
              preview.when,
              preview.location,
            ]
              .filter(Boolean)
              .join(" · ") || "Not much to go on yet."}
          </p>
          <p className="mt-2 text-sm text-muted">
            {preview.lines.length
              ? `Draft ${formatMoney(quoteTotal(preview.lines), business.currency)} from your list.`
              : "No matching price yet — a quote will not invent one."}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={text.trim().length < 8}
          onClick={() => {
            addEnquiry(enquiryFromMessage(text, business, prices, "paste"));
            onSaved();
          }}
        >
          Save and open the quote
        </Button>
        <Button variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function safeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}
