import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { enquiryFromMessage } from "@/lib/orderpilot/engine";
import { copyText, whatsappLink } from "@/lib/orderpilot/money";
import { useOrderPilot, useOrderPilotHydrated } from "@/lib/orderpilot/store";
import { tradeLabel, type Trade } from "@/lib/orderpilot/types";
import { Button, Field, Mark, TextArea, TextInput } from "./ui";

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

  if (!hydrated) return <main className="mx-auto max-w-lg px-4 py-8"><p role="status" className="font-display text-2xl">Opening the enquiry form…</p></main>;

  if (message) {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <div className="h-1 bg-moss" />
        <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 pb-24">
          <Mark />
          <h1 className="font-display text-4xl">Send this to {businessName}</h1>
          <p className="text-ink-soft">
            They’ll turn it into a quote with their own prices. This page does not guess a number.
          </p>
          <p className="whitespace-pre-wrap rounded-xl bg-card p-4 text-sm shadow-card">{message}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                const ok = await copyText(message);
                setCopied(ok);
              }}
            >
              {copied ? "Copied" : "Copy message"}
            </Button>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-card px-4 text-sm font-semibold text-ink shadow-card"
              href={whatsappLink(phoneOnForm, message)}
              target="_blank"
              rel="noreferrer"
            >
              Open WhatsApp
            </a>
          </div>
          <button
            type="button"
            className="min-h-11 text-left text-sm font-semibold text-moss"
            onClick={() => {
              const owner = useOrderPilot.getState();
              addEnquiry(enquiryFromMessage(message, owner.business, owner.prices.length ? owner.prices : prices, "form"));
              navigate({ to: "/" });
            }}
          >
            I run {businessName} — put this in my inbox
          </button>
          <button type="button" className="min-h-11 text-left text-sm text-muted" onClick={() => setMessage("")}>
            Edit answers
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="h-1 bg-moss" />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 pb-24">
        <Link to="/" className="flex items-center gap-3">
          <Mark />
          <span className="font-display text-xl">OrderPilot</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl">Tell {businessName} what you need</h1>
          <p className="mt-2 text-ink-soft">
            {tradeOnForm === "other" ? "A few details" : tradeLabel(tradeOnForm)} — short answers are enough. You’ll get a message to send back, not a price.
          </p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(compose());
          }}
        >
          <Field label="Your name">
            <TextInput value={who} onChange={(event) => setWho(event.target.value)} required autoComplete="name" />
          </Field>
          <Field label="Phone or email">
            <TextInput value={contact} onChange={(event) => setContact(event.target.value)} required autoComplete="tel" />
          </Field>
          <Field label="What do you need?">
            <TextArea value={need} onChange={(event) => setNeed(event.target.value)} required rows={4} />
          </Field>
          <Field label="How many, or how big?">
            <TextInput value={size} onChange={(event) => setSize(event.target.value)} placeholder={SIZE_HINT[tradeOnForm]} />
          </Field>
          <Field label="When?">
            <TextInput value={when} onChange={(event) => setWhen(event.target.value)} placeholder="Next Saturday afternoon" />
          </Field>
          <Field label="Where?">
            <TextInput value={where} onChange={(event) => setWhere(event.target.value)} placeholder="Suburb or venue" />
          </Field>
          <Field label="Anything else?">
            <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Allergies, colours, photos coming…" />
          </Field>
          <Button type="submit">Make my message</Button>
        </form>
      </main>
    </div>
  );
}
