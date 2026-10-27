import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { enquiryFromMessage } from "@/lib/orderpilot/engine";
import { copyText, whatsappLink } from "@/lib/orderpilot/money";
import { useOrderPilot, useOrderPilotHydrated } from "@/lib/orderpilot/store";
import { tradeLabel, type Trade } from "@/lib/orderpilot/types";
import { Avatar, Button, Field, Mark, TextArea, TextInput } from "./ui";

const SIZE_HINT: Record<Trade, string> = {
  catering: "80 people",
  cleaning: "3 bedrooms",
  handyman: "One geyser, kitchen lights",
  painting: "Whole house, outside",
  events: "20 children",
  other: "How big is the job?",
};

export function AskForm({ biz, trade, phone }: { biz: string; trade: Trade; phone: string }) {
  const hydrated = useOrderPilotHydrated();
  const stored = useOrderPilot((state) => state.business);
  const prices = useOrderPilot((state) => state.prices);
  const addEnquiry = useOrderPilot((state) => state.addEnquiry);
  const navigate = useNavigate();
  const nameOnForm = biz || (hydrated ? stored.name : "");
  const tradeOnForm = biz ? trade : hydrated ? stored.trade : trade;
  const phoneOnForm = phone || (hydrated ? stored.phone : "");
  const [who, setWho] = useState("");
  const [contact, setContact] = useState("");
  const [need, setNeed] = useState("");
  const [size, setSize] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const businessName = nameOnForm || "the business";

  function compose() {
    return [
      "— OrderPilot enquiry —",
      `Name: ${who.trim()}`,
      `Contact: ${contact.trim()}`,
      `Need: ${need.trim()}`,
      `Size: ${size.trim()}`,
      `When: ${when.trim()}`,
      `Where: ${where.trim()}`,
      `Notes: ${notes.trim()}`,
    ].join("\n");
  }

  if (!hydrated)
    return (
      <main className="op-loading">
        <Mark />
        <p role="status">Opening the enquiry form…</p>
      </main>
    );
  return (
    <div className="op-guest">
      <header className="op-guest-header">
        <Link to="/" className="op-guest-brand">
          <Mark />
          <strong>OrderPilot</strong>
        </Link>
        <span>
          <ShieldCheck size={14} />A better first conversation
        </span>
      </header>
      <main className="op-guest-main">
        <div className="op-guest-business">
          <Avatar name={businessName} />
          <div>
            <span>YOU’RE ENQUIRING WITH</span>
            <strong>{businessName}</strong>
          </div>
        </div>
        {message ? (
          <>
            <div className="op-guest-success">
              <span>
                <CheckCircle2 size={26} />
              </span>
              <p className="op-eyebrow">YOUR ENQUIRY IS READY</p>
              <h1>Send this to {businessName}</h1>
              <p>One clear message, with everything they need to prepare your quote.</p>
            </div>
            <section className="op-work-panel">
              <div className="op-panel-heading">
                <h2>Your message</h2>
                <span className="op-count">READY TO SHARE</span>
              </div>
              <div className="op-panel-body">
                <p className="op-guest-message">{message}</p>
              </div>
              <div className="op-guest-actions">
                <a
                  className="op-button op-button--primary"
                  href={whatsappLink(phoneOnForm, message)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send size={16} />
                  Open WhatsApp
                </a>
                <Button
                  variant="secondary"
                  onClick={async () => setCopied(await copyText(message))}
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? "Copied" : "Copy message"}
                </Button>
              </div>
              <p className="op-guest-disclosure">
                This form has not submitted your enquiry. Send the message to {businessName} to
                request a quote.
              </p>
            </section>
            <button type="button" className="op-back" onClick={() => setMessage("")}>
              <ArrowLeft size={15} />
              Edit answers
            </button>
            <details className="op-owner-shortcut">
              <summary>Is this your business?</summary>
              <button
                type="button"
                className="op-text-button"
                onClick={() => {
                  const owner = useOrderPilot.getState();
                  addEnquiry(
                    enquiryFromMessage(
                      message,
                      owner.business,
                      owner.prices.length ? owner.prices : prices,
                      "form",
                    ),
                  );
                  navigate({ to: "/" });
                }}
              >
                I run {businessName} — put this in my inbox
                <ArrowRight size={15} />
              </button>
            </details>
          </>
        ) : (
          <>
            <div className="op-guest-heading">
              <p className="op-eyebrow">LET’S GET YOUR JOB STARTED</p>
              <h1>
                Tell {businessName}
                <br />
                what you need
              </h1>
              <p>
                A few details now. A clearer quote next.
                <br />
                They’ll review your request and come back to you.
              </p>
            </div>
            <form
              className="op-work-panel op-guest-form"
              onSubmit={(e) => {
                e.preventDefault();
                setMessage(compose());
              }}
            >
              <div className="op-panel-heading">
                <div>
                  <span className="op-step-number">01</span>
                  <h2>About you</h2>
                </div>
                <span className="op-count">* REQUIRED</span>
              </div>
              <div className="op-panel-body op-form-grid">
                <Field label="Your name">
                  <TextInput
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Phone or email">
                  <TextInput
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    autoComplete="tel"
                    placeholder="How they can reach you"
                  />
                </Field>
              </div>
              <div className="op-panel-heading">
                <div>
                  <span className="op-step-number">02</span>
                  <h2>The job</h2>
                </div>
                <span className="op-count">
                  {tradeOnForm === "other" ? "YOUR REQUEST" : tradeLabel(tradeOnForm)}
                </span>
              </div>
              <div className="op-panel-body op-form-grid">
                <div className="op-span-2">
                  <Field label="What do you need?">
                    <TextArea
                      value={need}
                      onChange={(e) => setNeed(e.target.value)}
                      required
                      rows={4}
                      placeholder="Tell them a little about the work you have in mind…"
                    />
                  </Field>
                </div>
                <Field label="How many, or how big?">
                  <TextInput
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder={SIZE_HINT[tradeOnForm]}
                  />
                </Field>
                <Field label="When?">
                  <TextInput
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    placeholder="A date or rough timing"
                  />
                </Field>
                <div className="op-span-2">
                  <Field label="Where?">
                    <TextInput
                      value={where}
                      onChange={(e) => setWhere(e.target.value)}
                      placeholder="Suburb, venue or address"
                    />
                  </Field>
                </div>
                <div className="op-span-2">
                  <Field label="Anything else?">
                    <TextArea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Preferences, dietary needs or anything worth knowing"
                    />
                  </Field>
                </div>
              </div>
              <div className="op-guest-submit">
                <p>
                  <ShieldCheck size={16} />
                  You’ll review the message before sending it.
                </p>
                <Button type="submit">
                  Make my message
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          </>
        )}
        <footer className="op-guest-footer">
          <LockKeyhole size={13} />
          <span>No account needed. Your enquiry, your choice.</span>
          <span>
            Powered by <strong>OrderPilot</strong>
          </span>
        </footer>
      </main>
    </div>
  );
}
