import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { STATUS_META } from "./ui-model";
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
      className={cn("op-button", `op-button--${variant}`, className)}
      {...props}
    />
  );
}
export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("op-input", className)} {...props} />;
}
export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("op-input op-textarea", className)} {...props} />;
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
    <label className="op-field">
      <span className="op-field-label">{label}</span>
      {children}
      {hint ? <span className="op-field-hint">{hint}</span> : null}
    </label>
  );
}
export function StatusPill({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span className={`op-status op-status--${meta.tone}`}>
      <span aria-hidden />
      {meta.label}
    </span>
  );
}
export function Mark() {
  return (
    <span className="op-mark" aria-hidden>
      <ArrowUpRight size={22} strokeWidth={2.7} />
    </span>
  );
}
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span className={`op-avatar ${small ? "op-avatar--small" : ""}`} aria-hidden>
      {initials}
    </span>
  );
}
