import { parseBackup } from "@/lib/orderpilot/backup";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { buildDemo } from "@/lib/orderpilot/presets";
import { copyText } from "@/lib/orderpilot/money";
import { useOrderPilot } from "@/lib/orderpilot/store";
import { CURRENCIES, TRADES, tradeLabel, type Currency, type Trade } from "@/lib/orderpilot/types";
import { Button, Field, TextInput } from "./ui";

export function BusinessScreen() {
  const business = useOrderPilot((state) => state.business);
  const setBusiness = useOrderPilot((state) => state.setBusiness);
  const replaceAll = useOrderPilot((state) => state.replaceAll);
  const [backupNote, setBackupNote] = useState("");
  const [pendingBackup, setPendingBackup] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [copied, setCopied] = useState(false);
  const [armed, setArmed] = useState<"demo" | "blank" | null>(null);

  async function copyFormLink() {
    const url = new URL("/ask", window.location.origin);
    url.searchParams.set("biz", business.name);
    url.searchParams.set("trade", business.trade);
    if (business.phone) url.searchParams.set("phone", business.phone);
    const ok = await copyText(url.toString());
    setCopied(ok);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 pb-24">
      <div>
        <h2 className="font-display text-4xl">Your business</h2>
        <p className="mt-2 text-ink-soft">
          Quotes sign off as you, and the questions change with the kind of work you do.
        </p>
      </div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <Field label="Business name">
          <TextInput value={business.name} onChange={(event) => setBusiness({ name: event.target.value })} />
        </Field>
        <Field label="Your name">
          <TextInput value={business.ownerName} onChange={(event) => setBusiness({ ownerName: event.target.value })} />
        </Field>
        <Field label="Trade" hint="This only changes the questions, not your prices.">
          <select
            value={business.trade}
            onChange={(event) => setBusiness({ trade: event.target.value as Trade })}
            className="h-11 w-full rounded-lg border border-line bg-card px-3 text-base text-ink"
          >
            {TRADES.map((trade) => (
              <option key={trade} value={trade}>
                {tradeLabel(trade)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="WhatsApp number" hint="Used when a customer opens your form.">
          <TextInput
            value={business.phone}
            inputMode="tel"
            onChange={(event) => setBusiness({ phone: event.target.value })}
            placeholder="082 000 0000"
          />
        </Field>
        <Field label="Currency" hint="Applies to new quotes. Existing quotes keep their currency. Amounts are not converted.">
          <select
            value={business.currency}
            onChange={(event) => setBusiness({ currency: event.target.value as Currency })}
            className="h-11 w-full rounded-lg border border-line bg-card px-3 text-base text-ink"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quote stays valid">
          <TextInput
            type="number"
            min={1}
            max={90}
            value={business.validityDays}
            onChange={(event) => {
              const days = Number(event.target.value);
              if (Number.isFinite(days)) setBusiness({ validityDays: Math.min(90, Math.max(1, days)) });
            }}
          />
        </Field>
      </form>
      <p className="text-ink-soft">
        Sign-off: — {business.ownerName || "Your name"}
        {business.name ? `, ${business.name}` : ""}
      </p>
      <section className="rounded-xl bg-card p-4 shadow-card">
        <h3 className="font-display text-2xl">Customer form</h3>
        <p className="mt-1 text-sm text-muted">
          Share this when you’d rather they fill in the gaps than go back and forth on WhatsApp. They get a message to send you. It does not quote them.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={copyFormLink}>{copied ? "Link copied" : "Copy form link"}</Button>
          <Link
            to="/ask"
            search={{ biz: business.name, trade: business.trade, phone: business.phone }}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-card px-4 text-sm font-semibold text-ink shadow-card"
          >
            Open the form
          </Link>
        </div>
      </section>
      <section className="rounded-xl bg-card p-4 shadow-card">
        <h3 className="font-display text-2xl">Keep a backup</h3>
        <p className="mt-2 text-sm text-muted">Records stay in this browser. Export regularly and before clearing your browser or moving devices. Backups include customer details: keep them private.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => {
            const { business, prices, enquiries } = useOrderPilot.getState();
            const file = new Blob([JSON.stringify({ format: "orderpilot-backup", version: 1, exportedAt: new Date().toISOString(), data: { business, prices, enquiries } }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(file);
            const anchor = document.createElement("a"); anchor.href = url; anchor.download = `OrderPilot-backup-${new Date().toISOString().slice(0,10)}.json`; anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setBackupNote("Backup downloaded. Keep it somewhere safe.");
          }}>Export backup</Button>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-paper px-4 text-sm font-semibold">Choose backup
            <input aria-label="Import backup" type="file" accept=".json,application/json" className="ml-3 w-44 text-sm" onChange={async (event) => {
              const file = event.target.files?.[0]; event.target.value = "";
              setPendingBackup(null); if (!file) return;
              try { if (file.size > 10000000) throw new Error("Backup is too large (maximum 10 MB)."); const parsed = parseBackup(await file.text()); setPendingBackup(parsed); setBackupNote(`Ready to restore ${parsed.enquiries.length} enquiries and ${parsed.prices.length} prices for ${parsed.business.name}. This replaces the data in this browser.`); }
              catch (error) { setBackupNote(error instanceof Error ? error.message : "Could not read that backup."); }
            }} />
          </label>
        </div>
        {backupNote ? <p role="status" className="mt-3 text-sm text-ink-soft">{backupNote}</p> : null}
        {pendingBackup ? <div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => { replaceAll(pendingBackup); setPendingBackup(null); setBackupNote("Backup restored."); }}>Replace with this backup</Button><Button variant="quiet" onClick={() => { setPendingBackup(null); setBackupNote("Restore cancelled."); }}>Cancel restore</Button></div> : null}
      </section>
      <section className="flex flex-col gap-3">
        <Button
          variant={armed === "demo" ? "clay" : "secondary"}
          onClick={() => {
            if (armed !== "demo") {
              setArmed("demo");
              return;
            }
            replaceAll(buildDemo());
            useOrderPilot.setState({ introDismissed: false });
            setArmed(null);
          }}
        >
          {armed === "demo" ? "Yes, restore the caterer demo" : "Restore the Harbour & Hearth demo"}
        </Button>
        <Button
          variant={armed === "blank" ? "clay" : "quiet"}
          onClick={() => {
            if (armed !== "blank") {
              setArmed("blank");
              return;
            }
            replaceAll({
              business: {
                name: "My business",
                ownerName: "",
                trade: "other",
                phone: "",
                currency: "ZAR",
                validityDays: 7,
              },
              prices: [],
              enquiries: [],
            });
            setArmed(null);
          }}
        >
          {armed === "blank" ? "Yes, wipe this device" : "Start blank on this device"}
        </Button>
        <p className="text-sm text-muted">Everything stays in this browser. It is not an account.</p>
      </section>
    </div>
  );
}
