import { enquiryFromMessage } from "./engine";
import type { Business, Enquiry, PriceItem, Trade } from "./types";

function item(
  id: string,
  name: string,
  category: string,
  unit: PriceItem["unit"],
  price: number,
  hints: string[],
  softHints: string[] = [],
): PriceItem {
  return { id, name, category, unit, price, hints, softHints };
}

export const CATERING_PRICES: PriceItem[] = [
  item("catering-buffet", "Celebration buffet", "Food", "person", 185, ["buffet"], ["birthday", "catering", "celebration", "wedding"]),
  item("catering-tea", "Light tea and cake", "Food", "person", 95, ["high tea", "light tea", "tea and cake"], ["baby shower", "shower", "tea"]),
  item("catering-kids", "Kids party platters", "Food", "person", 75, ["platter", "platters", "kids party"], ["children", "kids", "dinosaur"]),
  item("catering-diet", "Dietary station", "Extras", "person", 35, ["halaal", "halal", "vegan", "vegetarian", "gluten"]),
  item("catering-cake", "Celebration cake (serves 20)", "Extras", "each", 650, ["a cake", "birthday cake", "celebration cake"]),
  item("catering-delivery", "Delivery and setup", "Logistics", "job", 450, ["delivery", "deliver", "drop-off", "drop off"]),
  item("catering-staff", "Staff on site", "Labour", "hour", 180, ["waiter", "waiters", "waitron", "staff on site", "serving staff"]),
];

export const CLEANING_PRICES: PriceItem[] = [
  item("clean-2", "2-bed home clean", "Packages", "job", 650, [], ["clean", "house"]),
  item("clean-3", "3-bed home clean", "Packages", "job", 850, [], ["clean", "house"]),
  item("clean-4", "4-bed home clean", "Packages", "job", 1100, [], ["clean", "house"]),
  item("clean-deep", "Deep-clean extra", "Extras", "job", 400, ["deep clean", "spring clean"]),
  item("clean-oven", "Oven clean", "Extras", "job", 180, ["oven"]),
  item("clean-windows", "Inside windows", "Extras", "job", 220, ["windows", "window"]),
  item("clean-hour", "Hourly clean", "Labour", "hour", 180, ["hourly", "per hour"]),
];

export const HANDYMAN_PRICES: PriceItem[] = [
  item("handy-callout", "Call-out", "Labour", "job", 450, ["call-out", "call out", "callout"]),
  item("handy-labour", "Labour", "Labour", "hour", 380, ["labour", "labor"]),
  item("handy-geyser", "Geyser inspection", "Work", "job", 650, ["geyser", "hot water"]),
  item("handy-electrical", "Electrical fault find", "Work", "hour", 420, ["electrical", "tripping", "db board", "lights"]),
  item("handy-plumb", "Plumbing repair", "Work", "hour", 400, ["plumb", "leaking tap", "toilet", "drain"], ["leak", "leaking", "tap"]),
];

export const PAINTING_PRICES: PriceItem[] = [
  item("paint-exterior", "Exterior walls", "Work", "job", 8500, ["exterior", "outside"], ["paint", "painted"]),
  item("paint-interior", "Interior room", "Work", "room", 1450, ["interior", "inside"], ["paint", "painted"]),
  item("paint-prep", "Prep and fill", "Work", "job", 1800, ["prep", "cracks", "filling"]),
  item("paint-gutters", "Gutters", "Work", "job", 1200, ["gutter", "gutters"]),
];

export const EVENT_PRICES: PriceItem[] = [
  item("event-kids", "Kids party package", "Packages", "person", 220, ["kids party", "party package"], ["children", "theme"]),
  item("event-decor", "Decor and setup", "Extras", "job", 900, ["decor", "decoration", "decorations", "setup"]),
  item("event-entertain", "Entertainment", "Extras", "job", 1500, ["entertainment", "entertainer", "face paint", "magician"]),
  item("event-cake", "Party cake (serves 20)", "Extras", "each", 480, ["a cake", "birthday cake"]),
];

export const DEMO_BUSINESS: Business = {
  name: "Harbour & Hearth",
  ownerName: "Amina Jacobs",
  trade: "catering",
  phone: "082 555 0142",
  currency: "ZAR",
  validityDays: 7,
};

export const SAMPLE_MESSAGES = {
  birthday:
    "Hi, I need catering for about 80 people next Saturday for a birthday. Do you do that?",
  shower:
    "Hello, this is Lerato Khumalo. Need food for 50 people at a baby shower on the 15th of November in Claremont. Light tea and cake is perfect, no allergies. Please include delivery.",
  kids: "Hi I'm James. Looking for a small kids' party package for 20 children next month in Sea Point. Dinosaur theme. Can you do platters and a cake?",
  office:
    "Hi, it's Priya from Cape Offices. We need a celebration buffet for 30 people this Friday at our office in Woodstock. No dietary requirements.\nThanks, Priya Naidoo",
  geyser:
    "My geyser is leaking and the kitchen lights keep tripping. I'm in Observatory. Is this an emergency call-out?",
  clean:
    "Can you clean a 3-bedroom house every second week? We're in Rondebosch. Standard clean is fine, no oven.",
  paint: "I want the whole house painted outside. It's in Durbanville. Colours still to be decided.",
};

export type StarterList = {
  id: string;
  trade: Trade;
  label: string;
  blurb: string;
  prices: PriceItem[];
};

export const STARTER_LISTS: StarterList[] = [
  {
    id: "catering",
    trade: "catering",
    label: "Catering",
    blurb: "Per-person food, cake, delivery, staff.",
    prices: CATERING_PRICES,
  },
  {
    id: "cleaning",
    trade: "cleaning",
    label: "Cleaning",
    blurb: "Home packages by bedrooms, plus extras.",
    prices: CLEANING_PRICES,
  },
  {
    id: "handyman",
    trade: "handyman",
    label: "Handyman",
    blurb: "Call-out, labour, geyser and electrical.",
    prices: HANDYMAN_PRICES,
  },
  {
    id: "painting",
    trade: "painting",
    label: "Painting",
    blurb: "Exterior, rooms, prep and gutters.",
    prices: PAINTING_PRICES,
  },
  {
    id: "events",
    trade: "events",
    label: "Events",
    blurb: "Party packages, decor and entertainment.",
    prices: EVENT_PRICES,
  },
];

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function sample(message: string, ago: number, status?: Enquiry["status"]): Enquiry {
  const enquiry = enquiryFromMessage(message, DEMO_BUSINESS, CATERING_PRICES, "sample");
  const stamp = daysAgo(ago);
  enquiry.createdAt = stamp;
  enquiry.updatedAt = stamp;
  if (status) {
    enquiry.status = status;
    enquiry.forcedReady = status === "ready";
    if (status === "sent" || status === "won") enquiry.sentAt = stamp;
  }
  return enquiry;
}

export function buildDemo(): { business: Business; prices: PriceItem[]; enquiries: Enquiry[] } {
  return {
    business: DEMO_BUSINESS,
    prices: CATERING_PRICES.map((price) => ({ ...price, hints: [...price.hints], softHints: [...price.softHints] })),
    enquiries: [
      sample(SAMPLE_MESSAGES.birthday, 0),
      sample(SAMPLE_MESSAGES.shower, 1),
      sample(SAMPLE_MESSAGES.kids, 3, "sent"),
      sample(SAMPLE_MESSAGES.office, 12, "won"),
    ],
  };
}

export const PASTE_EXAMPLES: { label: string; text: string }[] = [
  { label: "Birthday for 80", text: SAMPLE_MESSAGES.birthday },
  { label: "Baby shower", text: SAMPLE_MESSAGES.shower },
  { label: "Kids party", text: SAMPLE_MESSAGES.kids },
  { label: "A job you don't price", text: SAMPLE_MESSAGES.geyser },
];
