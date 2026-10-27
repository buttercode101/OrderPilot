import { createFileRoute } from "@tanstack/react-router";
import { OrderPilotDesk } from "@/components/orderpilot/desk";

export const Route = createFileRoute("/")({ component: OrderPilotDesk });
