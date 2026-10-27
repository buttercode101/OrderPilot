import { addDays, format, nextDay } from "date-fns";
import { formatMoney, lineTotal, quoteTotal, unitPhrase } from "./money";
import type {
  Business,
  Currency,
  Enquiry,
  Fields,
  Gap,
  PriceItem,
  QuoteLine,
  Status,
  Trade,
  Unit,
} from "./types";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const PLACES = [
  "sea point",
  "claremont",
  "observatory",
  "woodstock",
  "gardens",
  "rondebosch",
  "durbanville",
  "stellenbosch",
  "sandton",
  "soweto",
  "rosebank",
  "bryanston",
  "umhlanga",
  "hatfield",
  "brooklyn",
  "camps bay",
  "green point",
  "muizenberg",
  "constantia",
  "hout bay",
  "bellville",
  "parow",
  "goodwood",
  "pinelands",
  "johannesburg",
  "cape town",
  "durban",
  "pretoria",
  "gqeberha",
  "port elizabeth",
];

const PLACE_STOP = new Set([
  ...WEEKDAYS,
  ...MONTHS,
  "the",
  "our",
  "my",
  "your",
  "a",
  "an",
  "next",
  "this",
  "that",
  "today",
  "tomorrow",
  "house",
  "home",
  "office",
  "town",
  "people",
  "person",
  "birthday",
  "party",
  "shower",
  "wedding",
  "catering",
  "please",
  "thanks",
  "thank",
]);

export function parseEnquiry(text: string, trade: Trade): Fields {
  const structured = parseStructured(text);
  if (structured) return structured;
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const quantity = findQuantity(lower);
  return {
    customerName: findName(raw),
    contact: findContact(raw),
    service: findService(lower, trade),
    quantity: quantity?.quantity ?? null,
    quantityLabel: quantity?.label ?? "",
    when: findWhen(lower),
    location: findLocation(raw),
    notes: findNotes(raw),
  };
}

function parseStructured(text: string): Fields | null {
  if (!/orderpilot enquiry/i.test(text)) return null;
  const get = (label: string) => {
    const match = text.match(new RegExp(`^${label}:\\s*(.*)$`, "mi"));
    return match?.[1]?.trim() ?? "";
  };
  const size = get("Size");
  const amount = size.match(/(\d+(?:\.\d+)?)/);
  const quantity = amount ? Number(amount[1]) : null;
  const quantityLabel = size
    .replace(amount?.[0] ?? "", "")
    .replace(/^[\s-]+|[\s-]+$/g, "")
    .trim();
  return {
    customerName: get("Name"),
    contact: get("Contact"),
    service: get("Need"),
    quantity: Number.isFinite(quantity) ? quantity : null,
    quantityLabel: quantityLabel || (quantity ? "people" : ""),
    when: get("When"),
    location: get("Where"),
    notes: get("Notes"),
  };
}

function findName(text: string): string {
  const fromIntro = nameAfter(text, /(?:this is|it is|it's|i am|i'm|my name is)\s+/i);
  const fromSign = nameAfter(text, /(?:thanks|thank you|regards|cheers)[,!]?\s+/i);
  if (fromSign && fromSign.split(" ").length >= fromIntro.split(" ").length) return fromSign;
  return fromIntro || fromSign;
}

function nameAfter(text: string, keyword: RegExp): string {
  const found = keyword.exec(text);
  if (!found || found.index === undefined) return "";
  const rest = text.slice(found.index + found[0].length);
  const match = rest.match(/^([A-Z][a-z'’-]{1,30}(?:\s+[A-Z][a-z'’-]{1,30}){0,2})/);
  return match?.[1] ?? "";
}

function findContact(text: string): string {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phoneMatch = text.match(/(?:\+\d{1,3}[\s-]?)?(?:\d[\s\-()]?){9,}\d/);
  const digits = phoneMatch?.[0].replace(/\D/g, "") ?? "";
  const phone = digits.length >= 10 && digits.length <= 15 ? phoneMatch?.[0].trim() ?? "" : "";
  return [phone, email].filter(Boolean).join(" · ");
}

function findQuantity(lower: string): { quantity: number; label: string } | null {
  const people = lower.match(/\b(\d{1,4})\s*(people|guests|pax|adults|persons)\b/);
  if (people) return { quantity: Number(people[1]), label: "people" };
  const kids = lower.match(/\b(\d{1,4})\s*(children|kids|child)\b/);
  if (kids) return { quantity: Number(kids[1]), label: "children" };
  const beds = lower.match(/\b(\d{1,2})\s*[-\s]?\s*bed(?:room)?s?\b/);
  if (beds) return { quantity: Number(beds[1]), label: "bedrooms" };
  const rooms = lower.match(/\b(\d{1,2})\s+rooms?\b/);
  if (rooms) return { quantity: Number(rooms[1]), label: "rooms" };
  const hours = lower.match(/\b(\d{1,2}(?:\.\d)?)\s*hours?\b/);
  if (hours) return { quantity: Number(hours[1]), label: "hours" };
  const about = lower.match(/\b(?:about|around|roughly|approximately|approx\.?)\s+(\d{1,4})\b/);
  if (about) return { quantity: Number(about[1]), label: "people" };
  return null;
}

function findWhen(lower: string): string {
  const nextDayName = lower.match(
    new RegExp(`\\bnext\\s+(${WEEKDAYS.join("|")})\\b`),
  );
  if (nextDayName) return weekdayPhrase("next", nextDayName[1]);
  const thisDay = lower.match(new RegExp(`\\bthis\\s+(${WEEKDAYS.join("|")})\\b`));
  if (thisDay) return weekdayPhrase("this", thisDay[1]);
  if (/\btomorrow\b/.test(lower)) return `tomorrow (${format(addDays(new Date(), 1), "d MMM")})`;
  if (/\btoday\b/.test(lower)) return `today (${format(new Date(), "d MMM")})`;
  if (/\bthis weekend\b/.test(lower)) return "this weekend";
  if (/\bnext week\b/.test(lower)) return "next week";
  if (/\bnext month\b/.test(lower)) return "next month";
  if (/\bevery second week\b|\bfortnightly\b/.test(lower)) return "every second week";
  if (/\bevery week\b|\bweekly\b/.test(lower)) return "every week";
  const monthList = MONTHS.join("|");
  const dayMonth = lower.match(
    new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthList})\\b`),
  );
  if (dayMonth) return `${Number(dayMonth[1])} ${cap(dayMonth[2])}`;
  const monthDay = lower.match(
    new RegExp(`\\b(${monthList})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`),
  );
  if (monthDay) return `${Number(monthDay[2])} ${cap(monthDay[1])}`;
  const bare = lower.match(/\bon the\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (bare) return `the ${bare[1]}`;
  return "";
}

function weekdayPhrase(prefix: "next" | "this", dayName: string): string {
  const index = WEEKDAYS.indexOf(dayName as (typeof WEEKDAYS)[number]);
  const now = new Date();
  const date =
    prefix === "next"
      ? nextDay(now, index as 0)
      : addDays(now, (index - now.getDay() + 7) % 7);
  return `${prefix} ${cap(dayName)} (${format(date, "d MMM")})`;
}

function findLocation(text: string): string {
  const lower = text.toLowerCase();
  for (const place of PLACES) {
    if (lower.includes(place)) return titleCase(place);
  }
  const re = /\b(?:in|at|near)\s+([A-Za-z][A-Za-z'’.-]+(?:\s+[A-Za-z][A-Za-z'’.-]+){0,2})/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const phrase = match[1].trim();
    const words = phrase.split(/\s+/);
    if (words.some((word) => PLACE_STOP.has(word.toLowerCase()))) continue;
    if (/shower|party|birthday|wedding|catering|people|food/.test(phrase.toLowerCase())) continue;
    return titleCase(phrase);
  }
  return "";
}

function findService(lower: string, trade: Trade): string {
  const geyser = /geyser|hot water cylinder/.test(lower);
  const electrical = /\belectrical\b|\belectric\b|\blights\b|\btripping\b|\bdb board\b|\bfuse\b/.test(
    lower,
  );
  if (geyser && electrical) return "Geyser and electrical";
  if (geyser) return "Geyser";
  if (/plumb|burst pipe|toilet|drain\b|leaking tap/.test(lower)) return "Plumbing";
  if (electrical) return "Electrical";
  if (/exterior|outside/.test(lower) && /paint/.test(lower)) return "Exterior painting";
  if (/paint/.test(lower)) return "Painting";
  if (/deep clean|spring clean/.test(lower)) return "Deep clean";
  if (/\bclean/.test(lower)) return "House cleaning";
  if (/baby shower/.test(lower)) return "Baby shower catering";
  if (/kids|children/.test(lower) && /party|platter|birthday/.test(lower)) return "Kids party";
  if (/birthday/.test(lower)) return "Birthday catering";
  if (/wedding/.test(lower)) return "Wedding catering";
  if (/buffet/.test(lower)) return "Buffet catering";
  if (/cater|platter|food for|high tea|\btea\b/.test(lower)) return "Catering";
  if (/party/.test(lower)) return "Party";
  if (/garden/.test(lower)) return "Garden work";
  if (trade === "catering") return "";
  if (trade === "cleaning") return "";
  return "";
}

function findNotes(text: string): string {
  const lower = text.toLowerCase();
  const bits: string[] = [];
  const theme = lower.match(/\b([a-z][a-z'’-]+)\s+theme\b/);
  if (theme) bits.push(`${titleCase(theme[1])} theme`);
  if (/no dietary|nothing dietary|no special diet/.test(lower)) bits.push("No dietary requirements");
  else if (/no allerg/.test(lower)) bits.push("No allergies");
  else if (/allerg/.test(lower)) bits.push("Allergies — confirm which");
  if (/halaal|\bhalal\b/.test(lower)) bits.push("Halaal");
  if (/vegan/.test(lower)) bits.push("Vegan");
  if (/vegetarian/.test(lower)) bits.push("Vegetarian");
  if (/gluten/.test(lower)) bits.push("Gluten-free");
  if (/every second week|fortnight/.test(lower)) bits.push("Every second week");
  if (/deep clean|spring clean/.test(lower)) bits.push("Deep clean");
  if (/emergency|urgent|asap/.test(lower)) bits.push("Might be urgent");
  const org = text.match(/\bfrom\s+([A-Z][A-Za-z&]+(?:\s+[A-Z][A-Za-z&]+){0,3})/);
  if (org) {
    const name = org[1].trim();
    if (!PLACES.includes(name.toLowerCase())) bits.push(name);
  }
  return unique(bits).join(" · ");
}

const NAME_WORD_SKIP = new Set([
  "with",
  "from",
  "your",
  "this",
  "that",
  "home",
  "each",
  "hour",
  "hours",
  "extra",
  "standard",
  "light",
  "small",
  "full",
  "package",
  "serves",
  "item",
  "rate",
]);

export function suggestLines(text: string, fields: Fields, prices: PriceItem[]): QuoteLine[] {
  const hay = `${text} ${fields.service} ${fields.notes} ${fields.location}`.toLowerCase();
  const hoursMentioned = /\b\d+(?:\.\d+)?\s*hours?\b/.test(hay) || fields.quantityLabel === "hours";
  const ranked = prices
    .map((item) => ({ item, ...scoreItem(item, hay, fields) }))
    .filter((row) => row.strong || (row.item.category === "Food" && row.score >= 2));

  const foods = ranked
    .filter((row) => row.item.category === "Food")
    .sort((a, b) => b.score - a.score);
  const rest = ranked
    .filter((row) => row.item.category !== "Food" && row.strong)
    .sort((a, b) => b.score - a.score);

  const chosen = [...(foods[0] ? [foods[0]] : []), ...rest].slice(0, 5);
  const lines: QuoteLine[] = [];
  for (const row of chosen) {
    const qty = qtyFor(row.item, fields);
    if (!qty) continue;
    const assumed = !row.strong || (row.item.unit === "hour" && !hoursMentioned);
    lines.push(lineFromPrice(row.item, qty, assumed));
  }
  return lines;
}

function scoreItem(
  item: PriceItem,
  hay: string,
  fields: Fields,
): { score: number; strong: boolean } {
  let score = 0;
  let strong = false;
  for (const hint of item.hints) {
    if (includesPhrase(hay, hint)) {
      score += 3;
      strong = true;
    }
  }
  for (const hint of item.softHints) {
    if (includesPhrase(hay, hint)) score += 2;
  }
  for (const word of item.name.toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length > 3 && !NAME_WORD_SKIP.has(word) && includesPhrase(hay, word)) score += 1;
  }
  if (
    (fields.quantityLabel === "bedrooms" || fields.quantityLabel === "rooms") &&
    fields.quantity
  ) {
    const name = item.name.toLowerCase();
    const n = fields.quantity;
    const bedHit =
      fields.quantityLabel === "bedrooms" && new RegExp(`\\b${n}\\s*-?\\s*bed`).test(name);
    const roomHit =
      fields.quantityLabel === "rooms" && new RegExp(`\\b${n}\\s*-?\\s*room`).test(name);
    if (bedHit || roomHit) {
      score += 6;
      strong = true;
    }
  }
  return { score, strong };
}

function qtyFor(item: PriceItem, fields: Fields): number | null {
  if (item.unit === "person") {
    if (!fields.quantity) return null;
    if (fields.quantityLabel === "bedrooms" || fields.quantityLabel === "rooms") return null;
    if (fields.quantityLabel === "hours") return null;
    return fields.quantity;
  }
  if (item.unit === "room") {
    if (fields.quantity && (fields.quantityLabel === "rooms" || fields.quantityLabel === "bedrooms")) {
      return fields.quantity;
    }
    return null;
  }
  if (item.unit === "hour") {
    if (fields.quantity && fields.quantityLabel === "hours") return fields.quantity;
    return 1;
  }
  if (item.unit === "each" && /cake/i.test(item.name) && fields.quantity) {
    const serves = Number(item.name.match(/serves\s+(\d+)/i)?.[1] ?? 0);
    if (serves > 0 && fields.quantityLabel !== "bedrooms") {
      return Math.max(1, Math.ceil(fields.quantity / serves));
    }
  }
  return 1;
}

export function lineFromPrice(item: PriceItem, qty: number, assumed: boolean): QuoteLine {
  return {
    id: crypto.randomUUID(),
    priceItemId: item.id,
    label: item.name,
    category: item.category,
    qty,
    unit: item.unit,
    unitPrice: item.price,
    assumed,
  };
}

export function gaps(enquiry: Pick<Enquiry, "customerName" | "service" | "quantity" | "quantityLabel" | "when" | "location" | "notes" | "rawMessage" | "lines">, trade: Trade): Gap[] {
  const list: Gap[] = [];
  const hay = `${enquiry.rawMessage} ${enquiry.notes} ${enquiry.service}`.toLowerCase();
  if (!enquiry.service.trim()) {
    list.push({ id: "service", ask: "What do you need done?", blocking: true });
  }
  const perUnit = enquiry.lines.some(
    (line) => line.unit === "person" || line.unit === "room" || line.unit === "hour",
  );
  if (!enquiry.quantity) {
    list.push({
      id: "qty",
      ask: perUnit || enquiry.lines.length === 0 ? quantityAsk(trade, enquiry.quantityLabel) : sizeAsk(trade),
      blocking: perUnit || enquiry.lines.length === 0,
    });
  }
  if (!enquiry.when.trim()) {
    list.push({ id: "when", ask: "When do you need it?", blocking: true });
  }
  if (!enquiry.location.trim() && trade !== "other") {
    list.push({
      id: "where",
      ask: whereAsk(trade),
      blocking: trade === "cleaning" || trade === "handyman" || trade === "painting",
    });
  }
  if (trade === "catering") {
    const assumedFood = enquiry.lines.some((line) => line.assumed && line.category === "Food");
    const hasFood = enquiry.lines.some((line) => line.category === "Food");
    if (assumedFood || !hasFood) {
      list.push({
        id: "menu",
        ask: "What style of food would you like — buffet, a light tea, platters, or something else?",
        blocking: true,
      });
    }
    if (!dietaryAnswered(hay)) {
      list.push({
        id: "diet",
        ask: "Any dietary needs or allergies?",
        blocking: false,
      });
    }
  }
  if (trade === "cleaning" && !/deep clean|oven|window|extra|standard clean/.test(hay)) {
    list.push({
      id: "extras",
      ask: "Is a standard clean enough, or do you want extras like ovens, windows, or a deep clean?",
      blocking: false,
    });
  }
  if (trade === "handyman") {
    if (!/emergency|urgent|asap|can wait|not urgent/.test(hay)) {
      list.push({
        id: "emerg",
        ask: "Is this an emergency, or can it wait for a normal slot?",
        blocking: false,
      });
    }
    if (!/photo|picture|pic\b/.test(hay)) {
      list.push({
        id: "photo",
        ask: "Can you send a photo of the problem?",
        blocking: false,
      });
    }
  }
  if (trade === "painting" && !/\bwhite\b|\bgrey\b|\bgray\b|\bcharcoal\b|\bblack\b|colou?rs?\s+(?:is|are|will be)/.test(hay)) {
    list.push({ id: "colour", ask: "Do you already know the colours?", blocking: false });
  }
  if (trade === "events" && !/theme/.test(hay)) {
    list.push({ id: "theme", ask: "Is there a theme?", blocking: false });
  }
  if (!enquiry.customerName.trim()) {
    list.push({ id: "name", ask: "Who should I address the quote to?", blocking: false });
  }
  return list;
}

function dietaryAnswered(hay: string): boolean {
  return /no allerg|no dietary|dietary requirement|nothing dietary|halaal|halal|vegan|vegetarian|gluten|kosher|nut free|no nuts/.test(
    hay,
  );
}

function quantityAsk(trade: Trade, label: string): string {
  if (trade === "cleaning") return "How many bedrooms is the home?";
  if (trade === "painting") return "How many rooms, or roughly how big is it?";
  if (trade === "handyman") return "Roughly how big is the job, or how many hours should I allow?";
  if (label === "children") return "How many children?";
  if (trade === "events") return "How many guests?";
  return "How many people is it for?";
}

function sizeAsk(trade: Trade): string {
  if (trade === "painting") return "How big is the house?";
  if (trade === "cleaning") return "How many bedrooms is the home?";
  if (trade === "handyman") return "Roughly how big is the job?";
  return "Anything I should know about the size of the job?";
}

function whereAsk(trade: Trade): string {
  switch (trade) {
    case "catering":
      return "Where is it, and do you need delivery?";
    case "cleaning":
      return "What's the address or suburb?";
    case "handyman":
      return "Which suburb are you in?";
    case "painting":
      return "What's the address?";
    case "events":
      return "Where is the party?";
    default:
      return "Where should we come?";
  }
}

export function allGaps(enquiry: Enquiry, trade: Trade): Gap[] {
  const base = gaps(enquiry, trade);
  const extras = enquiry.extraQuestions.filter(
    (ask) => !base.some((gap) => gap.ask.toLowerCase() === ask.trim().toLowerCase()),
  );
  return [
    ...base,
    ...extras.map((ask, index) => ({ id: `extra-${index}`, ask: ask.trim(), blocking: false })),
  ];
}

export function freshStatus(enquiry: Enquiry, trade: Trade): Status {
  if (enquiry.lines.length === 0) return "needs-info";
  if (enquiry.lines.some((line) => line.assumed)) return "needs-info";
  if (gaps(enquiry, trade).some((gap) => gap.blocking)) return "needs-info";
  return "ready";
}

export function enquiryFromMessage(
  message: string,
  business: Business,
  prices: PriceItem[],
  source: Enquiry["source"],
): Enquiry {
  const fields = parseEnquiry(message, business.trade);
  const now = new Date().toISOString();
  const draft: Enquiry = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    source,
    currency: business.currency,
    rawMessage: message.trim(),
    customerName: fields.customerName,
    contact: fields.contact,
    service: fields.service,
    quantity: fields.quantity,
    quantityLabel: fields.quantityLabel,
    when: fields.when,
    location: fields.location,
    notes: fields.notes,
    status: "needs-info",
    lines: [],
    linesCustom: false,
    forcedReady: false,
    customMessage: null,
    customFollowUp: null,
    extraQuestions: [],
    sentAt: null,
  };
  draft.lines = suggestLines(draft.rawMessage, draft, prices);
  if (!draft.service && draft.lines.length) draft.service = draft.lines.map(line => line.label).join(", ");
  draft.status = freshStatus(draft, business.trade);
  return draft;
}

export function patchEnquiry(
  enquiry: Enquiry,
  patch: Partial<Enquiry>,
  prices: PriceItem[],
  trade: Trade,
): Enquiry {
  const next: Enquiry = { ...enquiry, ...patch, updatedAt: new Date().toISOString() };
  const affectsMatch = (
    ["quantity", "quantityLabel", "service", "notes", "location", "rawMessage"] as const
  ).some((key) => key in patch);
  const unlock = patch.linesCustom === false && enquiry.linesCustom;

  if ((affectsMatch || unlock) && !next.linesCustom && !("lines" in patch)) {
    next.lines = suggestLines(next.rawMessage, next, prices);
  } else if (
    next.linesCustom &&
    "quantity" in patch &&
    next.quantity &&
    next.quantityLabel !== "bedrooms"
  ) {
    next.lines = next.lines.map((line) =>
      line.unit === "person" || line.unit === "room" ? { ...line, qty: next.quantity as number } : line,
    );
  }

  if ((affectsMatch || unlock) && !("extraQuestions" in patch)) next.extraQuestions = [];
  if ((affectsMatch || unlock) && !("customFollowUp" in patch)) next.customFollowUp = null;
  if (
    (affectsMatch || unlock || "lines" in patch || "customerName" in patch) &&
    !("customMessage" in patch)
  ) {
    next.customMessage = null;
  }

  const terminal = next.status === "sent" || next.status === "won" || next.status === "paid" || next.status === "lost";
  if (!terminal && !next.forcedReady && !("status" in patch)) {
    next.status = freshStatus(next, trade);
  }
  return next;
}

export function mergeReply(
  enquiry: Enquiry,
  reply: string,
  prices: PriceItem[],
  trade: Trade,
): Enquiry {
  const parsed = parseEnquiry(reply, trade);
  const mergedNotes = unique(
    [enquiry.notes, parsed.notes].flatMap((note) => note.split(" · ")).map((note) => note.trim()),
  )
    .filter(Boolean)
    .join(" · ");
  return patchEnquiry(
    enquiry,
    {
      rawMessage: `${enquiry.rawMessage.trim()}\n\n— Their reply —\n${reply.trim()}`,
      customerName: parsed.customerName || enquiry.customerName,
      contact: parsed.contact || enquiry.contact,
      service: parsed.service || enquiry.service,
      quantity: parsed.quantity ?? enquiry.quantity,
      quantityLabel: parsed.quantity ? parsed.quantityLabel : enquiry.quantityLabel,
      when: parsed.when || enquiry.when,
      location: parsed.location || enquiry.location,
      notes: mergedNotes,
      forcedReady: false,
      linesCustom: enquiry.linesCustom,
    },
    prices,
    trade,
  );
}

export type AiReading = {
  customerName: string;
  contact: string;
  service: string;
  quantity: number | null;
  quantityLabel: string;
  when: string;
  location: string;
  notes: string;
  missingQuestions: string[];
  lineItems: { id: string; qty: number }[];
  followUp: string;
};

export function applyReading(
  enquiry: Enquiry,
  reading: AiReading,
  prices: PriceItem[],
  trade: Trade,
): Enquiry {
  const next: Enquiry = {
    ...enquiry,
    customerName: reading.customerName.trim() || enquiry.customerName,
    contact: reading.contact.trim() || enquiry.contact,
    service: reading.service.trim() || enquiry.service,
    quantity: reading.quantity ?? enquiry.quantity,
    quantityLabel: reading.quantityLabel.trim() || enquiry.quantityLabel,
    when: reading.when.trim() || enquiry.when,
    location: reading.location.trim() || enquiry.location,
    notes: reading.notes.trim() || enquiry.notes,
    extraQuestions: reading.missingQuestions.map((q) => q.trim()).filter(Boolean).slice(0, 4),
    customFollowUp: reading.followUp.trim() || null,
    customMessage: null,
    updatedAt: new Date().toISOString(),
  };
  if (!enquiry.linesCustom && reading.lineItems.length) {
    const lines: QuoteLine[] = [];
    for (const item of reading.lineItems) {
      const price = prices.find((entry) => entry.id === item.id);
      if (!price) continue;
      if (!Number.isFinite(item.qty) || item.qty <= 0 || item.qty > 100000) continue;
      lines.push(lineFromPrice(price, item.qty, false));
    }
    if (lines.length) next.lines = lines;
  }
  if (next.status === "needs-info" || next.status === "ready") {
    next.forcedReady = false;
    next.status = freshStatus(next, trade);
  }
  return next;
}

export function followUpText(business: Business, enquiry: Enquiry, trade: Trade): string {
  if (enquiry.customFollowUp) return enquiry.customFollowUp;
  const open = allGaps(enquiry, trade);
  if (!open.length) return "";
  const who = firstName(enquiry.customerName);
  const hello = who ? `Hi ${who}` : "Hello";
  const about = enquiry.service ? sentence(enquiry.service) : "this";
  const questions = open.map((gap, index) => `${index + 1}. ${gap.ask.replace(/\?$/, "")}?`);
  return `${hello}, thanks for the message — happy to help with ${about}.

Before I send the quote, could you tell me:
${questions.join("\n")}

Then I’ll send the numbers straight away.
— ${signOff(business)}`;
}

export function quoteText(business: Business, enquiry: Enquiry): string {
  business = { ...business, currency: enquiry.currency ?? business.currency };
  if (enquiry.customMessage) return enquiry.customMessage;
  const who = firstName(enquiry.customerName);
  const hello = who ? `Hi ${who}` : "Hello";
  const job = describeJob(enquiry);
  const lines = enquiry.lines.map((line) => `• ${describeLine(line, business.currency)}`);
  const total = formatMoney(quoteTotal(enquiry.lines), business.currency);
  const noted = enquiry.notes.trim() ? `\nNoted: ${enquiry.notes.trim()}.\n` : "";
  const cadence = /every second week|fortnight|every week/i.test(`${enquiry.when} ${enquiry.notes}`)
    ? "\nThis is the price per visit.\n"
    : "";
  return `${hello} — thanks for asking about ${job}.

Here’s a quote from ${business.name || "us"}:

${lines.join("\n")}

Total: ${total}
${noted}${cadence}
Valid for ${business.validityDays} days. Nothing is booked until you reply to go ahead.

— ${signOff(business)}`;
}

export function describeLine(line: QuoteLine, currency: Currency): string {
  const amount = formatMoney(lineTotal(line.qty, line.unitPrice), currency);
  if (line.qty === 1 && (line.unit === "job" || line.unit === "each")) {
    return `${line.label} — ${amount}`;
  }
  return `${line.label} — ${line.qty} ${unitPhrase(line.unit, line.qty)} × ${formatMoney(line.unitPrice, currency)} = ${amount}`;
}

function describeJob(enquiry: Enquiry): string {
  const parts: string[] = [];
  parts.push(enquiry.service.trim() ? sentence(enquiry.service.trim()) : "the job");
  if (enquiry.quantity) {
    parts.push(`for ${enquiry.quantity} ${enquiry.quantityLabel || "people"}`);
  }
  if (enquiry.when.trim()) parts.push(whenPhrase(enquiry.when.trim()));
  if (enquiry.location.trim()) parts.push(`in ${enquiry.location.trim()}`);
  return parts.join(" ") || "the job";
}

function whenPhrase(when: string): string {
  if (/^(next|this|tomorrow|today|every)/i.test(when)) return when;
  return `on ${when}`;
}

function signOff(business: Business): string {
  if (business.ownerName && business.name) return `${business.ownerName}, ${business.name}`;
  return business.ownerName || business.name || "OrderPilot";
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

function sentence(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function includesPhrase(hay: string, phrase: string): boolean {
  const cleaned = phrase.trim().toLowerCase();
  if (!cleaned) return false;
  const pattern = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const re = new RegExp(`(?:^|[^a-z0-9])(${pattern})(?=[^a-z0-9]|$)`, "ig");
  let match: RegExpExecArray | null;
  while ((match = re.exec(hay))) {
    const word = match[1];
    if (!word) continue;
    const start = match.index + match[0].lastIndexOf(word);
    const before = hay.slice(Math.max(0, start - 10), start);
    if (/(?:^|[^a-z])(?:no|not|without)\s+$/.test(before)) continue;
    return true;
  }
  return false;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function pullLatestPrices(enquiry: Enquiry, prices: PriceItem[]): Enquiry {
  return {
    ...enquiry,
    updatedAt: new Date().toISOString(),
    customMessage: null,
    lines: enquiry.lines.map((line) => {
      if (!line.priceItemId) return line;
      const price = prices.find((item) => item.id === line.priceItemId);
      if (!price) return line;
      return { ...line, unitPrice: price.price, label: price.name, unit: price.unit as Unit };
    }),
  };
}

export function assumptionNote(lines: QuoteLine[]): string {
  const assumed = lines.filter((line) => line.assumed);
  if (!assumed.length) return "";
  const names = assumed.map((line) => line.label).join(" and ");
  return assumed.length === 1
    ? `${names} is a guess from the wording. Change it before you send a price.`
    : `${names} are guesses from the wording. Change them before you send a price.`;
}

export function displayName(enquiry: Enquiry): string {
  return enquiry.customerName.trim() || "No name yet";
}

export const STATUS_RANK: Record<Status, number> = {
  "needs-info": 0,
  ready: 1,
  sent: 2,
  won: 3,
  paid: 4,
  lost: 5,
};

export function sortEnquiries(list: Enquiry[]): Enquiry[] {
  return [...list].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.updatedAt.localeCompare(a.updatedAt),
  );
}
