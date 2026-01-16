"use client";

import { useMemo, useState } from "react";
import { Boxes, LineChart, Eye, ShoppingCart } from "lucide-react";
import InventoryView from "@/components/inventory/InventoryView";
import SalesView from "@/components/sales/SalesView";
import WatchlistView from "@/components/watchlist/WatchlistView";
import DashboardView from "@/components/dashboard/DashboardView";

type Tab = "dashboard" | "inventory" | "sales" | "watchlist";

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs = useMemo(
    () => [
      { id: "dashboard" as const, label: "Dashboard", icon: LineChart },
      { id: "inventory" as const, label: "Inventario", icon: Boxes },
      { id: "sales" as const, label: "Vendite", icon: ShoppingCart },
      { id: "watchlist" as const, label: "Watchlist", icon: Eye },
    ],
    [],
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Poké Inventory
          </h1>
          <p className="text-sm text-zinc-400">
            Inventario, vendite e annunci da tenere d’occhio — aggiornamenti
            real-time.
          </p>
        </div>

        <nav className="flex w-full gap-2 overflow-x-auto rounded-2xl bg-zinc-900/50 p-2 sm:w-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-transparent text-zinc-200 hover:bg-zinc-800/60",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="rounded-3xl border border-zinc-800 bg-zinc-950">
        {tab === "dashboard" && <DashboardView />}
        {tab === "inventory" && <InventoryView />}
        {tab === "sales" && <SalesView />}
        {tab === "watchlist" && <WatchlistView />}
      </main>

      <footer className="mt-4 text-xs text-zinc-500">
        Suggerimento: senza login chiunque con il link può modificare. Se vuoi,
        aggiungo un PIN condiviso.
      </footer>
    </div>
  );
}
