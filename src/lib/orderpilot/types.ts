export const TRADES = [
  "catering",
  "cleaning",
  "handyman",
  "painting",
  "events",
  "other",
] as const;

export type Trade = (typeof TRADES)[number];

export const CURRENCIES = ["ZAR", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type Unit = "person" | "each" | "hour" | "job" | "day" | "room";

export type Business = {
  name: string;
  ownerName: string;
  trade: Trade;
  phone: string;
  currency: Currency;
  validityDays: number;
};

export type PriceItem = {
  id: string;
  name: string;
  category: string;
  unit: Unit;
  price: number;
  hints: string[];
  softHints: string[];
};

export type QuoteLine = {
  id: string;
  priceItemId: string | null;
  label: string;
  category: string;
  qty: number;
  unit: Unit;
  unitPrice: number;
  assumed: boolean;
};

export type Status = "needs-info" | "ready" | "sent" | "won" | "paid" | "lost";

export type Enquiry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: "paste" | "form" | "sample";
  rawMessage: string;
  customerName: string;
  contact: string;
  service: string;
  quantity: number | null;
  quantityLabel: string;
  when: string;
  location: string;
  notes: string;
  status: Status;
  lines: QuoteLine[];
  linesCustom: boolean;
  forcedReady: boolean;
  customMessage: string | null;
  customFollowUp: string | null;
  extraQuestions: string[];
  sentAt: string | null;
  followUpOn?: string;
  paidAt?: string | null;
  currency?: Currency;
};

export type Gap = {
  id: string;
  ask: string;
  blocking: boolean;
};

export type Fields = {
  customerName: string;
  contact: string;
  service: string;
  quantity: number | null;
  quantityLabel: string;
  when: string;
  location: string;
  notes: string;
};

export function asTrade(value: string): Trade {
  return (TRADES as readonly string[]).includes(value) ? (value as Trade) : "other";
}

export function tradeLabel(trade: Trade): string {
  switch (trade) {
    case "catering":
      return "Catering & baking";
    case "cleaning":
      return "Cleaning";
    case "handyman":
      return "Handyman & trades";
    case "painting":
      return "Painting";
    case "events":
      return "Events & parties";
    default:
      return "Other services";
  }
}
