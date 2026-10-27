import { z } from "zod";
import { CURRENCIES, TRADES } from "./types";

const text = z.string().max(20000);
const id = z.string().min(1).max(100);
const amount = z.number().finite().min(0).max(100000000);
const unit = z.enum(["person", "each", "hour", "job", "day", "room"]);
const schema = z.object({
  format: z.literal("orderpilot-backup"),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: z.object({
    business: z.object({ name: text, ownerName: text, trade: z.enum(TRADES), phone: text, currency: z.enum(CURRENCIES), validityDays: z.number().int().min(1).max(90) }),
    prices: z.array(z.object({ id, name: text, category: text, unit, price: amount, hints: z.array(text).max(100), softHints: z.array(text).max(100) })).max(10000),
    enquiries: z.array(z.object({
      id, createdAt: z.string().datetime(), updatedAt: z.string().datetime(), source: z.enum(["paste", "form", "sample"]), rawMessage: text,
      customerName: text, contact: text, service: text, quantity: z.number().finite().positive().max(1000000).nullable(), quantityLabel: text, when: text, location: text, notes: text,
      status: z.enum(["needs-info", "ready", "sent", "won", "paid", "lost"]),
      lines: z.array(z.object({ id, priceItemId: id.nullable(), label: text, category: text, qty: z.number().finite().positive().max(1000000), unit, unitPrice: amount, assumed: z.boolean() })).max(1000),
      linesCustom: z.boolean(), forcedReady: z.boolean(), customMessage: text.nullable(), customFollowUp: text.nullable(), extraQuestions: z.array(text).max(100), sentAt: z.string().datetime().nullable(),
      followUpOn: z.string().refine(v => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v)).optional(), paidAt: z.string().datetime().nullable().optional(), currency: z.enum(CURRENCIES).optional(),
    })).max(10000),
  }),
});

export function parseBackup(raw: string) {
  if (raw.length > 10000000) throw new Error("Backup is too large (maximum 10 MB).");
  const result = schema.safeParse(JSON.parse(raw));
  if (!result.success) throw new Error("This is not a valid OrderPilot backup. Your current data has not changed.");
  for (const collection of [result.data.data.prices, result.data.data.enquiries]) {
    if (new Set(collection.map(item => item.id)).size !== collection.length) throw new Error("Backup contains duplicate records. Your current data has not changed.");
  }
  return result.data.data;
}
