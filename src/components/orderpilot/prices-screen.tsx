import { useState } from "react";
import { ArrowRight, Plus, Search, ShieldCheck, Tag, Trash2 } from "lucide-react";
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
  const prices = useOrderPilot((s) => s.prices),
    business = useOrderPilot((s) => s.business),
    upsert = useOrderPilot((s) => s.upsertPrice),
    remove = useOrderPilot((s) => s.removePrice),
    setPrices = useOrderPilot((s) => s.setPrices),
    setBusiness = useOrderPilot((s) => s.setBusiness);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [adding, setAdding] = useState(false),
    [armed, setArmed] = useState<string | null>(null),
    [removeId, setRemoveId] = useState<string | null>(null);
  const categories = [...new Set(prices.map((p) => p.category))];
  const shown = prices.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="op-prices">
      <div className="op-page-heading">
        <div>
          <p className="op-eyebrow">THE NUMBERS ARE YOURS</p>
          <h1>Your price book</h1>
          <p>One source of truth for what you charge.</p>
        </div>
        <Button onClick={() => setAdding((v) => !v)}>
          <Plus size={16} />
          {adding ? "Close editor" : "Add a price"}
        </Button>
      </div>
      <div className="op-price-summary">
        <div>
          <span className="op-section-icon">
            <Tag size={20} />
          </span>
          <span>
            <strong>{prices.length} services & items</strong>
            <small>
              Across {categories.length} categories · {business.currency}
            </small>
          </span>
        </div>
        <p>
          <ShieldCheck size={16} />
          Quotes use your rates, never invented prices.
        </p>
      </div>
      {adding ? (
        <AddPrice
          categories={categories}
          onAdd={(p) => {
            upsert(p);
            setAdding(false);
            setCategory("all");
            setQuery("");
          }}
          onCancel={() => setAdding(false)}
        />
      ) : null}
      <section className="op-work-panel">
        <div className="op-list-toolbar">
          <label className="op-search">
            <Search size={17} />
            <input
              aria-label="Search prices"
              placeholder="Find a service or item…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <span className="op-count">Changes save automatically</span>
        </div>
        <div className="op-category-tabs">
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            All services <span>{prices.length}</span>
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="op-price-table">
          <div className="op-price-table-head" aria-hidden>
            <span>Service / item</span>
            <span>Rate ({currencySymbol(business.currency)})</span>
            <span>Charged</span>
            <span />
          </div>
          {shown.length ? (
            shown.map((price) => (
              <div className="op-price-row" key={price.id}>
                <div>
                  <TextInput
                    aria-label={`${price.name} name`}
                    value={price.name}
                    onChange={(e) => upsert({ ...price, name: e.target.value })}
                  />
                  <span>{price.category}</span>
                </div>
                <TextInput
                  aria-label={`${price.name} price`}
                  type="number"
                  step="0.01"
                  min={0}
                  value={price.price}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v >= 0) upsert({ ...price, price: v });
                  }}
                />
                <label>
                  <span className="sr-only">{price.name} unit</span>
                  <select
                    className="op-input"
                    value={price.unit}
                    onChange={(e) => upsert({ ...price, unit: e.target.value as Unit })}
                  >
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={`op-price-remove ${removeId === price.id ? "is-armed" : ""}`}
                  aria-label={
                    removeId === price.id ? `Confirm remove ${price.name}` : `Remove ${price.name}`
                  }
                  onClick={() => (removeId === price.id ? remove(price.id) : setRemoveId(price.id))}
                >
                  {removeId === price.id ? "Confirm" : <Trash2 size={15} />}
                </button>
              </div>
            ))
          ) : (
            <div className="op-empty">
              <Tag size={27} />
              <h3>{prices.length ? "No matching services" : "Build your price book"}</h3>
              <p>
                {prices.length
                  ? "Try a different search or category."
                  : "Add your first service or start with an example list below."}
              </p>
              <Button onClick={() => setAdding(true)}>Add a price</Button>
            </div>
          )}
        </div>
      </section>
      <details className="op-template-section">
        <summary>
          <span>
            <strong>Need a starting point?</strong>
            <span>Explore example price lists for common service businesses.</span>
          </span>
          <Plus size={18} />
        </summary>
        <p className="op-template-warning">
          Example rates are placeholders. Set your own prices before quoting a real customer.
          Applying a list replaces your current price book; existing quotes keep their saved rates.
        </p>
        <div className="op-template-grid">
          {STARTER_LISTS.map((list) => (
            <div key={list.id}>
              <span className="op-template-icon">
                <Tag size={18} />
              </span>
              <h3>{list.label}</h3>
              <p>{list.blurb}</p>
              <span>Example from {formatMoney(list.prices[0]?.price ?? 0, business.currency)}</span>
              <Button
                variant={armed === list.id ? "clay" : "secondary"}
                onClick={() => {
                  if (armed !== list.id) {
                    setArmed(list.id);
                    return;
                  }
                  setPrices(
                    list.prices.map((p) => ({
                      ...p,
                      hints: [...p.hints],
                      softHints: [...p.softHints],
                    })),
                  );
                  setBusiness({ trade: list.trade });
                  setArmed(null);
                  setCategory("all");
                }}
              >
                {armed === list.id ? "Yes, replace my prices" : `Use ${list.label}`}
                <ArrowRight size={14} />
              </Button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
function AddPrice({
  categories,
  onAdd,
  onCancel,
}: {
  categories: string[];
  onAdd: (p: PriceItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(""),
    [category, setCategory] = useState(categories[0] ?? "Services"),
    [unit, setUnit] = useState<Unit>("job"),
    [price, setPrice] = useState("");
  return (
    <section className="op-work-panel op-add-price-panel">
      <div className="op-panel-heading">
        <div>
          <h2>Add a service or item</h2>
          <p>Set the price and how you charge for it.</p>
        </div>
        <Tag size={19} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const amount = Number(price);
          if (
            !name.trim() ||
            !category.trim() ||
            !price.trim() ||
            !Number.isFinite(amount) ||
            amount < 0
          )
            return;
          onAdd({
            id: crypto.randomUUID(),
            name: name.trim(),
            category: category.trim(),
            unit,
            price: amount,
            hints: name
              .toLowerCase()
              .split(/[^a-z0-9]+/)
              .filter((w) => w.length > 3),
            softHints: [],
          });
        }}
      >
        <div className="op-panel-body op-form-grid">
          <Field label="Name">
            <TextInput
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Consultation"
            />
          </Field>
          <Field label="Group">
            <TextInput
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="price-groups"
            />
            <datalist id="price-groups">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Amount">
            <TextInput
              required
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Charged">
            <select
              className="op-input"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="op-panel-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Add this price
            <ArrowRight size={15} />
          </Button>
        </div>
      </form>
    </section>
  );
}
