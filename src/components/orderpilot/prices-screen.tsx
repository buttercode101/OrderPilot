import { useState } from "react";
import { STARTER_LISTS } from "@/lib/orderpilot/presets";
import { currencySymbol, formatMoney } from "@/lib/orderpilot/money";
import { useOrderPilot } from "@/lib/orderpilot/store";
import type { PriceItem, Unit } from "@/lib/orderpilot/types";
import { Button, Field, TextInput } from "./ui";

const UNITS: { id: Unit; label: string }[] = [
  { id: "person", label: "per person" },
  { id: "each", label: "each" },
  { id: "hour", label: "per hour" },
  { id: "job", label: "per job" },
  { id: "day", label: "per day" },
  { id: "room", label: "per room" },
];

export function PricesScreen() {
  const prices = useOrderPilot((state) => state.prices);
  const business = useOrderPilot((state) => state.business);
  const upsertPrice = useOrderPilot((state) => state.upsertPrice);
  const removePrice = useOrderPilot((state) => state.removePrice);
  const setPrices = useOrderPilot((state) => state.setPrices);
  const setBusiness = useOrderPilot((state) => state.setBusiness);
  const [armed, setArmed] = useState<string | null>(null);
  const categories = [...new Set(prices.map((price) => price.category))];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 pb-24">
      <div>
        <h2 className="font-display text-4xl">Your prices</h2>
        <p className="mt-2 text-ink-soft">
          These are the only numbers a quote can use. If a job is not listed, OrderPilot leaves the price blank.
        </p>
      </div>

      {prices.length === 0 ? (
        <p className="rounded-xl bg-card p-4 text-ink-soft shadow-card">No prices yet. Add one, or start from an example list.</p>
      ) : (
        categories.map((category) => (
          <section key={category}>
            <h3 className="font-display text-2xl">{category}</h3>
            <ul className="mt-2 divide-y divide-line">
              {prices
                .filter((price) => price.category === category)
                .map((price) => (
                  <li key={price.id} className="flex flex-wrap items-center gap-3 py-3">
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Name</span>
                      <TextInput
                        value={price.name}
                        aria-label={`${price.name} name`}
                        onChange={(event) => upsertPrice({ ...price, name: event.target.value })}
                      />
                    </label>
                    <label className="flex items-center gap-1">
                      <span className="text-sm text-muted">{currencySymbol(business.currency)}</span>
                      <TextInput
                        type="number"
                        step="0.01"
                        min={0}
                        inputMode="decimal"
                        className="w-28 text-right tabular-nums"
                        value={price.price}
                        aria-label={`${price.name} price`}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next) && next >= 0) upsertPrice({ ...price, price: next });
                        }}
                      />
                    </label>
                    <span className="text-sm text-muted">{UNITS.find((unit) => unit.id === price.unit)?.label}</span>
                    <button
                      type="button"
                      className="min-h-11 px-2 text-sm font-semibold text-clay"
                      onClick={() => removePrice(price.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}

      <AddPrice existingCategories={categories} onAdd={upsertPrice} />

      <section className="rounded-xl bg-card p-4 shadow-card">
        <h3 className="font-display text-2xl">Example lists</h3>
        <p className="mt-1 text-sm text-muted">
          Replace what you have with a starter list. Quotes already written keep their old amounts until you pull latest prices.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {STARTER_LISTS.map((list) => (
            <li key={list.id} className="rounded-lg bg-paper p-3">
              <p className="font-semibold">{list.label}</p>
              <p className="text-sm text-muted">{list.blurb}</p>
              <p className="mt-1 text-sm tabular-nums text-ink-soft">
                {formatMoney(list.prices[0]?.price ?? 0, business.currency)} and up
              </p>
              <Button
                className="mt-3"
                variant={armed === list.id ? "clay" : "secondary"}
                onClick={() => {
                  if (armed !== list.id) {
                    setArmed(list.id);
                    return;
                  }
                  setPrices(list.prices.map((price) => ({ ...price, hints: [...price.hints], softHints: [...price.softHints] })));
                  setBusiness({ trade: list.trade });
                  setArmed(null);
                }}
              >
                {armed === list.id ? "Yes, replace my prices" : `Use ${list.label}`}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AddPrice({
  existingCategories,
  onAdd,
}: {
  existingCategories: string[];
  onAdd: (item: PriceItem) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(existingCategories[0] ?? "Work");
  const [unit, setUnit] = useState<Unit>("job");
  const [price, setPrice] = useState("");

  return (
    <form
      className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const amount = Number(price);
        if (!name.trim() || !category.trim() || !price.trim() || !Number.isFinite(amount) || amount < 0) return;
        const hints = name
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((word) => word.length > 3);
        onAdd({
          id: crypto.randomUUID(),
          name: name.trim(),
          category: category.trim(),
          unit,
          price: amount,
          hints,
          softHints: [],
        });
        setName("");
        setPrice("");
      }}
    >
      <h3 className="font-display text-2xl sm:col-span-2">Add a price</h3>
      <Field label="Name">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Call-out" required />
      </Field>
      <Field label="Group">
        <TextInput value={category} onChange={(event) => setCategory(event.target.value)} list="price-groups" required />
        <datalist id="price-groups">
          {existingCategories.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </Field>
      <Field label="Charged">
        <select
          value={unit}
          onChange={(event) => setUnit(event.target.value as Unit)}
          className="h-11 w-full rounded-lg border border-line bg-card px-3 text-base text-ink"
        >
          {UNITS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Amount">
        <TextInput
          type="number"
                        step="0.01"
          min={0}
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />
      </Field>
      <Button type="submit" className="sm:col-span-2">
        Add this price
      </Button>
    </form>
  );
}
