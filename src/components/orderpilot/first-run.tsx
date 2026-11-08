import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { buildStarterForTrade, TRADE_DESCRIPTIONS, type StarterMode } from "@/lib/orderpilot/presets";
import { useOrderPilot } from "@/lib/orderpilot/store";
import { TRADES, tradeLabel, type Trade } from "@/lib/orderpilot/types";
import { Button } from "./ui";

type Step = 1 | 2 | 3;

/** Trade-first first run (DESIGN_SYSTEM §9.2): 3 steps, skippable in one session. */
export function FirstRun({ onDone }: { onDone: (mode: StarterMode) => void }) {
  const replaceAll = useOrderPilot((s) => s.replaceAll);
  const completeFirstRun = useOrderPilot((s) => s.completeFirstRun);
  const [step, setStep] = useState<Step>(1);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [mode, setMode] = useState<StarterMode | null>(null);

  function finish(next: StarterMode) {
    if (!trade && next !== "demo") return;
    replaceAll(buildStarterForTrade(trade ?? "catering", next));
    completeFirstRun();
    onDone(next);
  }

  function skip() {
    completeFirstRun();
    onDone("demo");
  }

  return (
    <div className="op-first-run" role="dialog" aria-modal="true" aria-label="Set up your workspace">
      <p className="op-eyebrow">SET UP IN UNDER A MINUTE</p>
      <h1>{step === 1 ? "What do you do?" : step === 2 ? "Start with a sample, or from scratch?" : "Paste your first enquiry"}</h1>
      <ol className="op-first-run-steps" aria-label="Setup steps">
        {(["Your trade", "Sample or empty", "First enquiry"] as const).map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? "step" : undefined} className={step === i + 1 ? "is-current" : step > i + 1 ? "is-done" : ""}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div role="radiogroup" aria-label="What do you do?" className="op-trade-grid">
          {TRADES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={trade === t}
              className={`op-trade-card ${trade === t ? "is-selected" : ""}`}
              onClick={() => setTrade(t)}
              onKeyDown={(e) => {
                if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
                e.preventDefault();
                const idx = TRADES.indexOf(t);
                const next =
                  e.key === "Home" ? 0 : e.key === "End" ? TRADES.length - 1 : (idx + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + TRADES.length) % TRADES.length;
                setTrade(TRADES[next]);
                document.querySelectorAll<HTMLButtonElement>(".op-trade-card")[next]?.focus();
              }}
            >
              <strong>{tradeLabel(t)}</strong>
              <span>{TRADE_DESCRIPTIONS[t]}</span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="op-first-run-choices">
          <button type="button" className={`op-trade-card ${mode === "sample" ? "is-selected" : ""}`} onClick={() => setMode("sample")}>
            <strong>Show me with a sample</strong>
            <span>Loads your trade&apos;s price list plus a matching sample enquiry. These are samples so you can see how it works — delete them any time.</span>
          </button>
          <button type="button" className={`op-trade-card ${mode === "empty" ? "is-selected" : ""}`} onClick={() => setMode("empty")}>
            <strong>Start empty</strong>
            <span>An empty workspace, with your trade&apos;s starter price list already loaded so your book is never empty.</span>
          </button>
          <button type="button" className="op-text-button" onClick={() => finish("demo")}>
            Explore the catering demo instead
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <p className="op-first-run-paste">
          You&apos;re set up. Paste a customer&apos;s WhatsApp message and OrderPilot will organise the details — prices always come from your price book.
        </p>
      ) : null}

      <div className="op-first-run-actions">
        {step > 1 ? (
          <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>Back</Button>
        ) : (
          <Button variant="quiet" onClick={skip}>Skip for now</Button>
        )}
        {step === 1 ? (
          <Button disabled={!trade} onClick={() => setStep(2)}>Continue <ArrowRight size={16} /></Button>
        ) : step === 2 ? (
          <Button disabled={!mode} onClick={() => mode && setStep(3)}>Continue <ArrowRight size={16} /></Button>
        ) : (
          <Button onClick={() => mode && finish(mode)}>Paste my first enquiry <ArrowRight size={16} /></Button>
        )}
      </div>
    </div>
  );
}
