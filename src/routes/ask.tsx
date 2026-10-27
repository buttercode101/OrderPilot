import { createFileRoute } from "@tanstack/react-router";
import { AskForm } from "@/components/orderpilot/ask-form";
import { asTrade } from "@/lib/orderpilot/types";

export const Route = createFileRoute("/ask")({
  validateSearch: (search: Record<string, unknown>) => ({
    biz: typeof search.biz === "string" ? search.biz.slice(0, 80) : "",
    trade: asTrade(typeof search.trade === "string" ? search.trade : ""),
    phone: typeof search.phone === "string" ? search.phone.slice(0, 30) : "",
  }),
  head: () => ({
    meta: [{ title: "Request a quote · OrderPilot" }],
  }),
  component: AskPage,
});

function AskPage() {
  const search = Route.useSearch();
  return <AskForm biz={search.biz} trade={search.trade} phone={search.phone} />;
}
