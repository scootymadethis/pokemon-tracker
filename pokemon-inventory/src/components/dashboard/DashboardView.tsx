"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { InventoryCard, Sale, WatchItem } from "@/lib/types";
import { Card, SectionTitle, Pill } from "@/components/ui";

export default function DashboardView() {
  const [inv, setInv] = useState<InventoryCard[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [watch, setWatch] = useState<WatchItem[]>([]);

  async function load() {
    const a = await supabase.from("inventory_cards").select("*");
    const b = await supabase.from("sales").select("*");
    const c = await supabase.from("watchlist").select("*");

    if (!a.error && a.data) setInv(a.data as InventoryCard[]);
    if (!b.error && b.data) setSales(b.data as Sale[]);
    if (!c.error && c.data) setWatch(c.data as WatchItem[]);
  }

  useEffect(() => {
    load();

    const ch = supabase
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_cards" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "watchlist" },
        load,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const totalQty = inv.reduce((s, x) => s + Number(x.quantity || 0), 0);
    const totalCost = inv.reduce(
      (s, x) => s + Number(x.buy_price_eur || 0) * Number(x.quantity || 0),
      0,
    );
    const totalNow = inv.reduce(
      (s, x) =>
        s +
        (x.current_value_eur != null
          ? Number(x.current_value_eur) * Number(x.quantity || 0)
          : 0),
      0,
    );

    const revenue = sales.reduce(
      (s, x) => s + Number(x.sold_price_eur || 0) + Number(x.shipping_eur || 0),
      0,
    );
    const fees = sales.reduce((s, x) => s + Number(x.fees_eur || 0), 0);

    const activeWatch = watch.filter((w) => w.status === "active").length;

    return { totalQty, totalCost, totalNow, revenue, fees, activeWatch };
  }, [inv, sales, watch]);

  return (
    <div className="p-4 sm:p-6">
      <SectionTitle
        title="Dashboard"
        subtitle="Panoramica rapida (real-time)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="text-sm text-zinc-400">Carte totali</div>
          <div className="mt-2 text-2xl font-semibold">{stats.totalQty}</div>
        </Card>

        <Card>
          <div className="text-sm text-zinc-400">Costo inventario</div>
          <div className="mt-2 text-2xl font-semibold">
            €{stats.totalCost.toFixed(2)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-zinc-400">
            Valore attuale (solo se compilato)
          </div>
          <div className="mt-2 text-2xl font-semibold">
            €{stats.totalNow.toFixed(2)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-zinc-400">Ricavi vendite</div>
          <div className="mt-2 text-2xl font-semibold">
            €{stats.revenue.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Fee totali: <Pill>€{stats.fees.toFixed(2)}</Pill>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-zinc-400">Watchlist attiva</div>
          <div className="mt-2 text-2xl font-semibold">{stats.activeWatch}</div>
        </Card>
      </div>
    </div>
  );
}
