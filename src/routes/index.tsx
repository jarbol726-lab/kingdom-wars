import { createFileRoute } from "@tanstack/react-router";
import { KingdomApp } from "@/components/kingdom-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <KingdomApp />;
}
