import { STATUS_META } from "./ui-model";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Home,
  Inbox,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { allGaps, enquiryFromMessage, sortEnquiries } from "@/lib/orderpilot/engine";
import { formatMoney, quoteTotal } from "@/lib/orderpilot/money";
import { PASTE_EXAMPLES } from "@/lib/orderpilot/presets";
import { useOrderPilot, useOrderPilotHydrated } from "@/lib/orderpilot/store";
import type { Enquiry, Status } from "@/lib/orderpilot/types";
import { EnquiryDetail } from "./detail";
import { BusinessScreen } from "./business-screen";
import { PricesScreen } from "./prices-screen";
import { Avatar, Button, Mark, StatusPill, TextArea } from "./ui";

type Screen = "overview" | "inbox" | "pipeline" | "prices" | "business" | "compose" | "detail";
type Filter = "all" | "due" | Status;
const STAGES: Status[] = ["needs-info", "ready", "sent", "won", "paid", "lost"];
const NAV: { id: Screen; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "inbox", label: "Enquiries", icon: Inbox },
  { id: "pipeline", label: "Pipeline", icon: LayoutGrid },
  { id: "prices", label: "Price book", icon: Tag },
  { id: "business", label: "Business", icon: Settings2 },
];
const SCREEN_NAMES: Record<Screen, string> = {
  overview: "Overview",
  inbox: "Enquiries",
  pipeline: "Pipeline",
  prices: "Price book",
  business: "Business",
  compose: "New enquiry",
  detail: "Enquiry details",
};
const today = () => new Intl.DateTimeFormat("en-CA").format(new Date());
const active = (item: Enquiry) => !["won", "paid", "lost"].includes(item.status);
const due = (item: Enquiry) => !!item.followUpOn && item.followUpOn <= today() && active(item);

export function OrderPilotDesk() {
  const hydrated = useOrderPilotHydrated();
  if (!hydrated)
    return (
      <main className="op-loading">
        <Mark />
        <p>
          Opening your workspace<span>One place for your next paying job.</span>
        </p>
      </main>
    );
  return <Desk />;
}
function Desk() {
  const business = useOrderPilot((s) => s.business);
  const enquiries = useOrderPilot((s) => s.enquiries);
  const pendingFocusId = useOrderPilot((s) => s.pendingFocusId);
  const clearPending = useOrderPilot((s) => s.clearPending);
  const introDismissed = useOrderPilot((s) => s.introDismissed);
  const dismissIntro = useOrderPilot((s) => s.dismissIntro);
  const [screen, setScreen] = useState<Screen>("overview");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [returnScreen, setReturnScreen] = useState<Screen>("inbox");
  const sorted = useMemo(() => sortEnquiries(enquiries), [enquiries]);
  const selected = enquiries.find((e) => e.id === selectedId);
  const needsYou = enquiries.filter((e) => ["needs-info", "ready"].includes(e.status)).length;
  const followUps = enquiries.filter(due);
  const examples = enquiries.some((e) => e.source === "sample");
  const visible = sorted.filter(
    (e) =>
      (filter === "all" || (filter === "due" ? due(e) : e.status === filter)) &&
      `${e.customerName} ${e.service} ${e.contact} ${e.location} ${e.rawMessage}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function navigate(next: Screen) {
    setScreen(next);
    setQuery("");
    setFilter("all");
  }
  function open(item: Enquiry) {
    setSelectedId(item.id);
    setReturnScreen(screen === "detail" ? returnScreen : screen);
    setScreen("detail");
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    if (!pendingFocusId) return;
    setSelectedId(pendingFocusId);
    setReturnScreen("inbox");
    setScreen("detail");
    clearPending();
  }, [pendingFocusId, clearPending]);
  useEffect(() => {
    if (screen === "detail" && !selected) setScreen("inbox");
  }, [screen, selected]);
  const currentNav = screen === "detail" || screen === "compose" ? "inbox" : screen;
  return (
    <div className="op-app">
      <a href="#main-content" className="op-skip-link">
        Skip to content
      </a>
      <aside className="op-sidebar" aria-label="Workspace sidebar">
        <a
          href="/"
          className="op-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
        >
          <Mark />
          <span>
            OrderPilot<span>BUSINESS WORKSPACE</span>
          </span>
        </a>
        <button
          type="button"
          className="op-workspace"
          onClick={() => navigate("business")}
          title={business.name}
        >
          <Avatar name={business.name} small />
          <div>
            <strong>{business.name || "Your business"}</strong>
            <span>Local workspace</span>
          </div>
          <ChevronRight size={14} />
        </button>
        <p className="op-nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {NAV.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`op-nav-item ${currentNav === item.id ? "is-active" : ""}`}
              aria-current={currentNav === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === "inbox" && needsYou > 0 ? <b aria-hidden>{needsYou}</b> : null}
            </button>
          ))}
        </nav>
        <div className="op-sidebar-bottom">
          <div className="op-private-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Your prices. Your call.</strong>
              <p>You review every quote before it goes out.</p>
            </div>
          </div>
          <button type="button" className="op-profile" onClick={() => navigate("business")}>
            <Avatar name={business.ownerName || business.name} small />
            <span>
              <strong>{business.ownerName || "Your workspace"}</strong>
              <small>Business settings</small>
            </span>
            <Settings2 size={15} />
          </button>
        </div>
      </aside>
      <div className="op-main">
        <header className="op-topbar">
          <div className="op-breadcrumb">
            <span className="op-mobile-brand">
              <Mark />
            </span>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{SCREEN_NAMES[screen]}</strong>
          </div>
          <div className="op-top-actions">
            <span className="op-local-badge">
              <span />
              Saved on this device
            </span>
            <button
              type="button"
              aria-label="View follow-ups"
              className="op-icon-button"
              onClick={() => {
                navigate("inbox");
                setFilter("due");
              }}
            >
              <Bell size={19} />
              {followUps.length ? <i /> : null}
            </button>
            <Button onClick={() => navigate("compose")}>
              <Plus size={16} />
              <span>New enquiry</span>
            </Button>
          </div>
        </header>
        <main
          id="main-content"
          className={`op-content ${screen === "detail" ? "op-content--detail" : ""}`}
        >
          {screen === "overview" ? (
            <>
              <div className="op-page-heading">
                <div>
                  <p className="op-eyebrow">YOUR BUSINESS, IN VIEW</p>
                  <h1>
                    Your business, at a glance<span className="op-heading-dot">.</span>
                  </h1>
                  <p>Your enquiries, next steps and quotes. All in one place.</p>
                </div>
                <span className="op-date">
                  {new Date().toLocaleDateString("en-ZA", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              {examples && !introDismissed ? (
                <div className="op-demo-banner">
                  <span className="op-demo-icon">
                    <CircleHelp size={20} />
                  </span>
                  <div>
                    <strong>A little room to explore.</strong>
                    <p>
                      This workspace includes sample enquiries and prices. Make it yours when you’re
                      ready.
                    </p>
                  </div>
                  <button type="button" onClick={() => navigate("business")}>
                    Set up my business <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="op-icon-button"
                    aria-label="Dismiss sample data notice"
                    onClick={dismissIntro}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : null}
              <Overview
                enquiries={enquiries}
                open={open}
                onView={() => navigate("inbox")}
                onNew={() => navigate("compose")}
                onDue={() => {
                  navigate("inbox");
                  setFilter("due");
                }}
              />
            </>
          ) : null}
          {screen === "inbox" || screen === "pipeline" ? (
            <>
              <div className="op-page-heading">
                <div>
                  <p className="op-eyebrow">KEEP THE CONVERSATION MOVING</p>
                  <h1>{screen === "pipeline" ? "Your pipeline" : "Enquiries"}</h1>
                  <p>{enquiries.length} enquiries. Every opportunity has a next step.</p>
                </div>
                <div className="op-view-toggle" aria-label="Enquiry view">
                  <button
                    type="button"
                    aria-label="List view"
                    aria-pressed={screen === "inbox"}
                    onClick={() => setScreen("inbox")}
                  >
                    <List size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Board view"
                    aria-pressed={screen === "pipeline"}
                    onClick={() => setScreen("pipeline")}
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>
              <section className="op-work-panel">
                <div className="op-list-toolbar">
                  <label className="op-search">
                    <Search size={17} />
                    <input
                      aria-label="Search enquiries"
                      placeholder="Search customers, services or places…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query ? (
                      <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                        <X size={15} />
                      </button>
                    ) : null}
                  </label>
                  <label className="op-stage-select">
                    <SlidersHorizontal size={16} />
                    <select
                      aria-label="Filter by stage"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as Filter)}
                    >
                      <option value="all">All stages</option>
                      <option value="due">Follow-ups due</option>
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {screen === "inbox" ? (
                  <EnquiryRows items={visible} open={open} />
                ) : (
                  <div className="op-board">
                    {STAGES.filter((s) => filter === "all" || filter === "due" || filter === s).map(
                      (status) => (
                        <section className="op-board-column" key={status}>
                          <div className="op-board-heading">
                            <StatusPill status={status} />
                            <b>{visible.filter((e) => e.status === status).length}</b>
                          </div>
                          {visible
                            .filter((e) => e.status === status)
                            .map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                className="op-deal-card"
                                onClick={() => open(item)}
                              >
                                <span className="op-deal-person">
                                  <Avatar name={item.customerName} small />
                                  <strong>{item.customerName || "Unnamed customer"}</strong>
                                </span>
                                <p>{item.service || "Service to confirm"}</p>
                                <b>
                                  {item.lines.length
                                    ? formatMoney(
                                        quoteTotal(item.lines),
                                        item.currency ?? business.currency,
                                      )
                                    : "Not priced"}
                                </b>
                                <span className="op-deal-bottom">
                                  {due(item) ? "Follow-up due" : safeAgo(item.updatedAt)}
                                  <ArrowUpRight size={14} />
                                </span>
                              </button>
                            ))}
                          {!visible.some((e) => e.status === status) ? (
                            <p className="op-board-empty">No enquiries here yet</p>
                          ) : null}
                        </section>
                      ),
                    )}
                  </div>
                )}
              </section>
            </>
          ) : null}
          {screen === "compose" ? <Composer onCancel={() => navigate("inbox")} /> : null}
          {screen === "detail" && selected ? (
            <EnquiryDetail
              key={selected.id}
              enquiry={selected}
              onBack={() =>
                navigate(
                  returnScreen === "detail" || returnScreen === "compose" ? "inbox" : returnScreen,
                )
              }
            />
          ) : null}
          {screen === "prices" ? <PricesScreen /> : null}
          {screen === "business" ? <BusinessScreen /> : null}
          <footer className="op-footer">
            <span>
              OrderPilot<span className="op-footer-divider">/</span>Less admin. More work won.
            </span>
            <span>
              <ShieldCheck size={13} /> Prices stay in your control
            </span>
          </footer>
        </main>
        <nav className="op-mobile-nav" aria-label="Mobile navigation">
          {NAV.filter((n) => n.id !== "pipeline").map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={
                currentNav === item.id || (currentNav === "pipeline" && item.id === "inbox")
                  ? "page"
                  : undefined
              }
              onClick={() => navigate(item.id)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
function Overview({
  enquiries,
  open,
  onView,
  onNew,
  onDue,
}: {
  enquiries: Enquiry[];
  open: (e: Enquiry) => void;
  onView: () => void;
  onNew: () => void;
  onDue: () => void;
}) {
  const business = useOrderPilot((s) => s.business);
  const money = (items: Enquiry[]) =>
    formatMoney(
      items
        .filter((e) => (e.currency ?? business.currency) === business.currency)
        .reduce((n, e) => n + quoteTotal(e.lines), 0),
      business.currency,
    );
  const pending = enquiries.filter(active);
  const waits = enquiries.filter((e) => e.status === "sent");
  const paid = enquiries.filter((e) => e.status === "paid");
  const todo = sortEnquiries(
    enquiries.filter((e) => due(e) || e.status === "needs-info" || e.status === "ready"),
  ).slice(0, 4);
  const stats = [
    {
      label: "Open pipeline",
      value: money(pending),
      caption: `${pending.length} active opportunities`,
      icon: TrendingUp,
      tone: "blue",
    },
    {
      label: "Awaiting a reply",
      value: String(waits.length).padStart(2, "0"),
      caption: "Quotes with your customers",
      icon: MessageSquare,
      tone: "violet",
    },
    {
      label: "Jobs won",
      value: String(enquiries.filter((e) => ["won", "paid"].includes(e.status)).length).padStart(
        2,
        "0",
      ),
      caption: "Accepted and paid jobs",
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Marked paid",
      value: money(paid),
      caption: `Manual records · ${business.currency}`,
      icon: Wallet,
      tone: "amber",
    },
  ];
  return (
    <>
      <div className="op-metric-grid">
        {stats.map((stat) => (
          <div className="op-metric" key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <i className={`op-metric-icon tone-${stat.tone}`}>
                <stat.icon size={18} />
              </i>
            </div>
            <strong>{stat.value}</strong>
            <p>{stat.caption}</p>
          </div>
        ))}
      </div>
      <div className="op-overview-grid">
        <section className="op-work-panel">
          <div className="op-panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Your next best actions, without the noise.</p>
            </div>
            <button className="op-text-button" type="button" onClick={onView}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="op-next-actions">
            {todo.length ? (
              todo.map((e) => (
                <button type="button" className="op-next-action" key={e.id} onClick={() => open(e)}>
                  <span className={`op-action-icon ${due(e) ? "tone-amber" : "tone-blue"}`}>
                    {due(e) ? (
                      <Bell size={18} />
                    ) : e.status === "ready" ? (
                      <FileText size={18} />
                    ) : (
                      <MessageSquare size={18} />
                    )}
                  </span>
                  <div>
                    <strong>{e.customerName || "New customer"}</strong>
                    <span>
                      {due(e)
                        ? "A follow-up is due"
                        : e.status === "ready"
                          ? "Your quote is ready to review"
                          : allGaps(e, business.trade)[0]?.ask || "Confirm the job details"}
                    </span>
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))
            ) : (
              <div className="op-empty">
                <CheckCircle2 size={26} />
                <h3>You’re all caught up</h3>
                <p>Add your next customer enquiry to get things moving.</p>
                <Button onClick={onNew}>Add an enquiry</Button>
              </div>
            )}
          </div>
        </section>
        <section className="op-next-job">
          <span className="op-eyebrow">FROM MESSAGE TO MOMENTUM</span>
          <div className="op-message-illustration" aria-hidden>
            <span>
              <MessageSquare size={20} /> “Can you help with this job?”
            </span>
            <i>
              <ArrowDownLeft size={19} />
            </i>
            <span>
              <FileText size={20} /> A clear quote. Your prices.
              <CheckCircle2 size={18} />
            </span>
          </div>
          <h2>
            Your next job starts
            <br />
            with a message.
          </h2>
          <p>Paste the enquiry. We’ll organise the details, so you can focus on the work.</p>
          <Button onClick={onNew}>
            <Plus size={16} />
            New enquiry
          </Button>
        </section>
      </div>
      <section className="op-work-panel op-recent-panel">
        <div className="op-panel-heading">
          <div>
            <h2>Recent enquiries</h2>
            <p>A clear view of what’s moving.</p>
          </div>
          <button className="op-text-button" type="button" onClick={onView}>
            All enquiries <ArrowUpRight size={15} />
          </button>
        </div>
        <EnquiryRows
          items={[...enquiries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)}
          open={open}
        />
      </section>
      {enquiries.some(due) ? (
        <button type="button" className="op-due-strip" onClick={onDue}>
          <Bell size={17} />
          {enquiries.filter(due).length} follow-up{enquiries.filter(due).length === 1 ? "" : "s"}{" "}
          due
          <ArrowRight size={16} />
        </button>
      ) : null}
    </>
  );
}
function EnquiryRows({ items, open }: { items: Enquiry[]; open: (e: Enquiry) => void }) {
  const currency = useOrderPilot((s) => s.business.currency);
  return (
    <div className="op-enquiry-list">
      <div className="op-table-head" aria-hidden>
        <span>Customer / service</span>
        <span>Stage</span>
        <span>Quote value</span>
        <span>Last updated</span>
        <span />
      </div>
      {items.length ? (
        items.map((item) => (
          <button type="button" className="op-enquiry-row" key={item.id} onClick={() => open(item)}>
            <span className="op-customer-cell">
              <Avatar name={item.customerName} />
              <span>
                <strong>{item.customerName || "Unnamed customer"}</strong>
                <small>{item.service || "Service to confirm"}</small>
              </span>
            </span>
            <StatusPill status={item.status} />
            <span className="op-row-amount">
              {item.lines.length
                ? formatMoney(quoteTotal(item.lines), item.currency ?? currency)
                : "Not priced"}
            </span>
            <span className={`op-row-date ${due(item) ? "is-due" : ""}`}>
              {due(item) ? "Follow-up due" : safeAgo(item.updatedAt)}
            </span>
            <ChevronRight size={16} />
          </button>
        ))
      ) : (
        <div className="op-empty">
          <Inbox size={28} />
          <h3>No enquiries to show</h3>
          <p>Try another search or stage, or add a new enquiry.</p>
        </div>
      )}
    </div>
  );
}
function Composer({ onCancel }: { onCancel: () => void }) {
  const business = useOrderPilot((s) => s.business);
  const prices = useOrderPilot((s) => s.prices);
  const add = useOrderPilot((s) => s.addEnquiry);
  const [text, setText] = useState("");
  const preview = useMemo(
    () => (text.trim().length >= 8 ? enquiryFromMessage(text, business, prices, "paste") : null),
    [text, business, prices],
  );
  return (
    <div className="op-compose">
      <button type="button" className="op-back" onClick={onCancel}>
        <ArrowRight size={16} className="rotate-180" />
        Back to enquiries
      </button>
      <div className="op-page-heading">
        <div>
          <p className="op-eyebrow">START WITH THE CONVERSATION</p>
          <h1>One message. A clear next step.</h1>
          <p>Paste a customer enquiry from WhatsApp, email or anywhere else.</p>
        </div>
      </div>
      <div className="op-compose-grid">
        <section className="op-work-panel op-form-panel">
          <div className="op-panel-heading">
            <h2>Customer message</h2>
            <span className="op-count">{text.length} / 6,000</span>
          </div>
          <div className="op-panel-body">
            <TextArea
              aria-label="Customer message"
              maxLength={6000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Hi, I need catering for about 80 people next Saturday. Do you do that?"
            />
            <p className="op-field-hint">
              Keep their original wording. You can edit all the details next.
            </p>
            <div className="op-example-label">OR TRY AN EXAMPLE</div>
            <div className="op-example-buttons">
              {PASTE_EXAMPLES.map((e) => (
                <button type="button" key={e.label} onClick={() => setText(e.text)}>
                  {e.label}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          </div>
          <div className="op-panel-actions">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              disabled={!preview}
              onClick={() => add(enquiryFromMessage(text, business, prices, "paste"))}
            >
              Save and open the quote
              <ArrowRight size={16} />
            </Button>
          </div>
        </section>
        <section className="op-extraction">
          <span className="op-section-icon">
            <FileText size={22} />
          </span>
          <h2>A head start on the details</h2>
          <p>
            OrderPilot organises the enquiry and matches your own price book. You have the final
            say.
          </p>
          {preview ? (
            <>
              <dl>
                {[
                  ["Customer", preview.customerName],
                  ["Service", preview.service],
                  ["Size", preview.quantity ? `${preview.quantity} ${preview.quantityLabel}` : ""],
                  ["When", preview.when],
                  ["Where", preview.location],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || "To confirm"}</dd>
                  </div>
                ))}
              </dl>
              <div className="op-extraction-total">
                <span>Draft quote</span>
                <strong>
                  {preview.lines.length
                    ? formatMoney(quoteTotal(preview.lines), business.currency)
                    : "Not priced yet"}
                </strong>
              </div>
            </>
          ) : (
            <div className="op-extraction-empty">
              <span />
              <span />
              <span />
              <p>Your details will appear here as you type.</p>
            </div>
          )}
          <div className="op-trust-line">
            <ShieldCheck size={16} />
            No invented prices. Nothing sent automatically.
          </div>
        </section>
      </div>
    </div>
  );
}
function safeAgo(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNow(date, { addSuffix: true });
}
