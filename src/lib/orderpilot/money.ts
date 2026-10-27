import type { Currency } from "./types";

const SYMBOLS: Record<Currency, string> = {
  ZAR: "R",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export function formatMoney(amount: number, currency: Currency): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const negative = safe < 0;
  const abs = Math.abs(safe);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const locale = currency === "ZAR" ? "en-ZA" : "en-US";
  const num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${negative ? "−" : ""}${SYMBOLS[currency]}${num}`;
}

export function currencySymbol(currency: Currency): string {
  return SYMBOLS[currency];
}

export function lineTotal(qty: number, unitPrice: number): number {
  return roundMoney(qty * unitPrice);
}

export function quoteTotal(lines: { qty: number; unitPrice: number }[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + lineTotal(line.qty, line.unitPrice), 0));
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function unitPhrase(unit: string, qty: number): string {
  switch (unit) {
    case "person":
      return qty === 1 ? "person" : "people";
    case "hour":
      return qty === 1 ? "hour" : "hours";
    case "day":
      return qty === 1 ? "day" : "days";
    case "room":
      return qty === 1 ? "room" : "rooms";
    case "job":
      return qty === 1 ? "job" : "jobs";
    default:
      return qty === 1 ? "item" : "items";
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function whatsappLink(phone: string, text: string): string {
  const candidate = phone.match(/(?:\+?\d[\d ()-]{8,}\d)/)?.[0] ?? "";
  let digits = candidate.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length < 10 || digits.length > 15) digits = "";
  if (digits.startsWith("0") && digits.length === 10) digits = `27${digits.slice(1)}`;
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
