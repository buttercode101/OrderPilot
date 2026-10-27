import type { KeyboardEvent } from "react";
import type { Status } from "@/lib/orderpilot/types";

export const STATUS_META: Record<Status, { label: string; tone: string }> = {
  "needs-info": { label: "Needs details", tone: "amber" },
  ready: { label: "Ready to send", tone: "blue" },
  sent: { label: "Awaiting reply", tone: "violet" },
  won: { label: "Won", tone: "green" },
  paid: { label: "Paid", tone: "green" },
  lost: { label: "Closed", tone: "neutral" },
};

export function handleTabKeys(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
  if (!target) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const current = tabs.indexOf(target);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next]?.focus();
  tabs[next]?.click();
}
