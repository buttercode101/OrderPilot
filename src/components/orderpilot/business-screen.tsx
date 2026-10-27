import { handleTabKeys } from "./ui-model";
import { parseBackup } from "@/lib/orderpilot/backup";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  HardDrive,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { buildDemo } from "@/lib/orderpilot/presets";
import { copyText } from "@/lib/orderpilot/money";
import { useOrderPilot } from "@/lib/orderpilot/store";
import { CURRENCIES, TRADES, tradeLabel, type Currency, type Trade } from "@/lib/orderpilot/types";
import { Avatar, Button, Field, TextInput } from "./ui";

export function BusinessScreen() {
  const business = useOrderPilot((state) => state.business);
  const setBusiness = useOrderPilot((state) => state.setBusiness);
  const replaceAll = useOrderPilot((state) => state.replaceAll);
  const [section, setSection] = useState<"profile" | "form" | "data">("profile");
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
    <div className="op-business">
      <div className="op-page-heading">
        <div>
          <p className="op-eyebrow">BUILT AROUND YOUR BUSINESS</p>
          <h1>Make it yours.</h1>
          <p>Your details, customer form and workspace data.</p>
        </div>
      </div>
      <nav
        className="op-settings-tabs"
        role="tablist"
        onKeyDown={handleTabKeys}
        aria-label="Business settings"
      >
        {(
          [
            ["profile", "Business profile"],
            ["form", "Customer form"],
            ["data", "Data & backups"],
          ] as const
        ).map(([id, label]) => (
          <button
            type="button"
            key={id}
            role="tab"
            aria-selected={section === id}
            tabIndex={section === id ? 0 : -1}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {section === "profile" ? (
        <div className="op-business-grid">
          <section className="op-work-panel">
            <div className="op-panel-heading">
              <div>
                <h2>Business details</h2>
                <p>These appear on the quotes you share.</p>
              </div>
              <Building2 size={19} />
            </div>
            <form
              className="op-panel-body op-form-grid"
              onSubmit={(event) => event.preventDefault()}
            >
              <Field label="Business name">
                <TextInput
                  value={business.name}
                  onChange={(event) => setBusiness({ name: event.target.value })}
                />
              </Field>
              <Field label="Your name">
                <TextInput
                  value={business.ownerName}
                  onChange={(event) => setBusiness({ ownerName: event.target.value })}
                />
              </Field>
              <Field label="Trade" hint="This only changes the questions, not your prices.">
                <select
                  value={business.trade}
                  onChange={(event) => setBusiness({ trade: event.target.value as Trade })}
                  className="op-input"
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
              <Field
                label="Currency"
                hint="Applies to new quotes. Existing quotes keep their currency. Amounts are not converted."
              >
                <select
                  value={business.currency}
                  onChange={(event) => setBusiness({ currency: event.target.value as Currency })}
                  className="op-input"
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
                    if (Number.isFinite(days))
                      setBusiness({ validityDays: Math.min(90, Math.max(1, days)) });
                  }}
                />
              </Field>
            </form>
            <div className="op-settings-autosave">
              <CheckCircle2 size={14} />
              Changes save automatically on this device.
            </div>
          </section>
          <aside className="op-profile-preview">
            <p className="op-eyebrow">YOUR SIGN-OFF</p>
            <Avatar name={business.ownerName || business.name} />
            <h2>{business.name || "Your business"}</h2>
            <p>
              — {business.ownerName || "Your name"}
              {business.name ? `, ${business.name}` : ""}
            </p>
            <div>
              <ShieldCheck size={18} />
              <p>
                Every quote is yours to review. Your customer only receives what you choose to send.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
      {section === "form" ? (
        <section className="op-work-panel op-settings-section">
          <div className="op-panel-heading">
            <div>
              <h2>A better first conversation</h2>
              <p>Help your customers give you the details you need.</p>
            </div>
            <Link2 size={20} />
          </div>
          <div className="op-panel-body">
            <div className="op-form-preview-label">
              <span>01</span> Customer details <ArrowRight size={15} />
              <span>02</span> Job details <ArrowRight size={15} />
              <span>03</span> Ready to send
            </div>
            <p className="mt-1 text-sm text-muted">
              Share this when you’d rather they fill in the gaps than go back and forth on WhatsApp.
              They get a message to send you. It does not quote them.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={copyFormLink}>{copied ? "Link copied" : "Copy form link"}</Button>
              <Link
                to="/ask"
                search={{ biz: business.name, trade: business.trade, phone: business.phone }}
                className="op-button op-button--secondary"
              >
                Open the form <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
      {section === "data" ? (
        <div className="op-data-settings">
          <section className="op-work-panel">
            <div className="op-panel-heading">
              <div>
                <h2>Your data, in your hands</h2>
                <p>Download a backup or move to another device.</p>
              </div>
              <HardDrive size={20} />
            </div>
            <div className="op-panel-body">
              <p className="mt-2 text-sm text-muted">
                Records stay in this browser. Export regularly and before clearing your browser or
                moving devices. Backups include customer details: keep them private.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    const { business, prices, enquiries } = useOrderPilot.getState();
                    const file = new Blob(
                      [
                        JSON.stringify(
                          {
                            format: "orderpilot-backup",
                            version: 1,
                            exportedAt: new Date().toISOString(),
                            data: { business, prices, enquiries },
                          },
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    );
                    const url = URL.createObjectURL(file);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `OrderPilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    anchor.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    setBackupNote("Backup downloaded. Keep it somewhere safe.");
                  }}
                >
                  <Download size={15} />
                  Export backup
                </Button>
                <label className="op-import-control">
                  Choose backup
                  <input
                    aria-label="Import backup"
                    type="file"
                    accept=".json,application/json"
                    className="ml-3 w-44 text-sm"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      setPendingBackup(null);
                      if (!file) return;
                      try {
                        if (file.size > 10000000)
                          throw new Error("Backup is too large (maximum 10 MB).");
                        const parsed = parseBackup(await file.text());
                        setPendingBackup(parsed);
                        setBackupNote(
                          `Ready to restore ${parsed.enquiries.length} enquiries and ${parsed.prices.length} prices for ${parsed.business.name}. This replaces the data in this browser.`,
                        );
                      } catch (error) {
                        setBackupNote(
                          error instanceof Error ? error.message : "Could not read that backup.",
                        );
                      }
                    }}
                  />
                </label>
              </div>
              {backupNote ? (
                <p role="status" className="mt-3 text-sm text-ink-soft">
                  {backupNote}
                </p>
              ) : null}
              {pendingBackup ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      replaceAll(pendingBackup);
                      setPendingBackup(null);
                      setBackupNote("Backup restored.");
                    }}
                  >
                    Replace with this backup
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => {
                      setPendingBackup(null);
                      setBackupNote("Restore cancelled.");
                    }}
                  >
                    Cancel restore
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
          <section className="op-work-panel op-reset-section">
            <div className="op-panel-heading">
              <div>
                <h2>Workspace reset</h2>
                <p>Start fresh or restore the examples.</p>
              </div>
            </div>
            <div className="op-panel-body">
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
                {armed === "demo"
                  ? "Yes, restore the caterer demo"
                  : "Restore the Harbour & Hearth demo"}
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
              <p className="op-field-hint">
                This replaces all records on this device. Export a backup first. Your data is stored
                in this browser; there is no cloud account.
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
