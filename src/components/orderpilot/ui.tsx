import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import type { Status } from "@/lib/orderpilot/types";

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "clay";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-moss text-paper hover:bg-moss-2",
        variant === "secondary" && "bg-card text-ink shadow-card hover:bg-paper",
        variant === "quiet" && "bg-transparent text-ink-soft hover:bg-paper-2",
        variant === "clay" && "bg-clay-soft text-clay hover:bg-clay hover:text-paper",
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-line bg-card px-3 text-base text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-line bg-card px-3 py-3 text-base text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-sm font-semibold", meta.tone)}>
      {meta.label}
    </span>
  );
}

export const STATUS_META: Record<Status, { label: string; tone: string }> = {
  "needs-info": { label: "Needs you", tone: "bg-clay-soft text-clay" },
  ready: { label: "Ready to send", tone: "bg-moss-soft text-moss" },
  sent: { label: "Waiting", tone: "bg-paper-2 text-ink-soft" },
  paid: { label: "Paid", tone: "bg-moss text-paper" },
  won: { label: "Won", tone: "bg-moss text-paper" },
  lost: { label: "Passed", tone: "bg-paper-2 text-muted" },
};

export function Mark() {
  return (
    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-moss">
      <span className="h-4 w-3 rounded-sm bg-card shadow-card" />
    </span>
  );
}
