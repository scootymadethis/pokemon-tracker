"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { InventoryCard, Sale } from "@/lib/types";
import {
  Button,
  Card,
  Input,
  SectionTitle,
  Select,
  Textarea,
  Pill,
  Field,
} from "@/components/ui";

export default function SalesView() {
  const [inventory, setInventory] = useState<InventoryCard[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    inventory_id: "",
    card_name_snapshot: "",
    quantity: 1,
    platform: "Cardmarket",
    sold_price_eur: 0,
    shipping_eur: 0,
    fees_eur: 0,
    notes: "",
  });

  async function loadAll() {
    setLoading(true);

    const inv = await supabase
      .from("inventory_cards")
      .select("*")
      .order("name");
    const sal = await supabase
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false });

    if (!inv.error && inv.data) setInventory(inv.data as InventoryCard[]);
    if (!sal.error && sal.data) setSales(sal.data as Sale[]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();

    const ch1 = supabase
      .channel("realtime-sales")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => loadAll(),
      )
      .subscribe();

    const ch2 = supabase
      .channel("realtime-inventory-for-sales")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_cards" },
        () => loadAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => inventory.find((x) => x.id === form.inventory_id),
    [inventory, form.inventory_id],
  );

  const buyUnit = selected ? Number(selected.buy_price_eur) : 0;
  const profit = useMemo(() => {
    const sold = Number(form.sold_price_eur || 0);
    const ship = Number(form.shipping_eur || 0);
    const fees = Number(form.fees_eur || 0);
    const qty = Number(form.quantity || 1);
    const cost = buyUnit * qty;
    return sold + ship - fees - cost;
  }, [form, buyUnit]);

  async function addSale() {
    const qty = Number(form.quantity || 1);
    const inv = selected;

    const cardName = inv ? inv.name : form.card_name_snapshot.trim();
    if (!cardName) return;

    const payload = {
      inventory_id: inv ? inv.id : null,
      card_name_snapshot: cardName,
      quantity: qty,
      platform: form.platform || null,
      sold_price_eur: Number(form.sold_price_eur || 0),
      shipping_eur: Number(form.shipping_eur || 0),
      fees_eur: Number(form.fees_eur || 0),
      notes: form.notes.trim() || null,
    };

    const { error } = await supabase.from("sales").insert(payload);
    if (!error) {
      // opzionale: scala quantità inventario
      if (inv) {
        await supabase
          .from("inventory_cards")
          .update({ quantity: Math.max(0, inv.quantity - qty) })
          .eq("id", inv.id);
      }

      setForm({
        inventory_id: "",
        card_name_snapshot: "",
        quantity: 1,
        platform: "Cardmarket",
        sold_price_eur: 0,
        shipping_eur: 0,
        fees_eur: 0,
        notes: "",
      });
    }
  }

  async function remove(id: string) {
    await supabase.from("sales").delete().eq("id", id);
  }

  return (
    <div className="p-4 sm:p-6">
      <SectionTitle
        title="Vendite"
        subtitle="Registra una vendita e calcola profitto. (Opzionale: scala quantità inventario)"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Nuova vendita</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Select
                value={form.inventory_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, inventory_id: e.target.value }))
                }
              >
                <option value="">
                  Seleziona carta da inventario (opzionale)
                </option>
                {inventory.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} — qty {x.quantity}
                  </option>
                ))}
              </Select>
              {!form.inventory_id && (
                <div className="mt-2">
                  <Input
                    value={form.card_name_snapshot}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        card_name_snapshot: e.target.value,
                      }))
                    }
                    placeholder="Oppure scrivi nome carta (se non è in inventario)"
                  />
                </div>
              )}
            </div>

            <Field label="Quantità">
              <Input
                type="number"
                inputMode="numeric"
                value={String(form.quantity)}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quantity: Number(e.target.value) }))
                }
                placeholder="es. 1"
                min={1}
              />
            </Field>

            <Select
              value={form.platform}
              onChange={(e) =>
                setForm((p) => ({ ...p, platform: e.target.value }))
              }
            >
              {["Cardmarket", "eBay", "Instagram", "Vinted", "Altro"].map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ),
              )}
            </Select>

            <Field label="Prezzo vendita (€)">
              <Input
                type="number"
                inputMode="decimal"
                value={String(form.sold_price_eur)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    sold_price_eur: Number(e.target.value),
                  }))
                }
                placeholder="es. 49.90"
                min={0}
                step="0.01"
              />
            </Field>

            <Field label="Spedizione incassata (€)">
              <Input
                type="number"
                inputMode="decimal"
                value={String(form.shipping_eur)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    shipping_eur: Number(e.target.value),
                  }))
                }
                placeholder="es. 4.90"
                min={0}
                step="0.01"
              />
            </Field>

            <Field label="Fee (€)">
              <Input
                type="number"
                inputMode="decimal"
                value={String(form.fees_eur)}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fees_eur: Number(e.target.value) }))
                }
                placeholder="es. 2.50"
                min={0}
                step="0.01"
              />
            </Field>

            <div className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Note (opzionale)"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-400">
              Costo stimato:{" "}
              <Pill>€{(buyUnit * Number(form.quantity || 1)).toFixed(2)}</Pill>{" "}
              Profitto:{" "}
              <Pill>
                {profit >= 0 ? "+" : ""}€{profit.toFixed(2)}
              </Pill>
            </div>
            <Button
              onClick={addSale}
              disabled={!selected && !form.card_name_snapshot.trim()}
            >
              Salva vendita
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold">Storico</h3>

          <div className="space-y-3">
            {sales.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {s.card_name_snapshot}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                      <Pill>qty {s.quantity}</Pill>
                      <Pill>{s.platform ?? "?"}</Pill>
                      <Pill>sell €{Number(s.sold_price_eur).toFixed(2)}</Pill>
                      <Pill>ship €{Number(s.shipping_eur).toFixed(2)}</Pill>
                      <Pill>fee €{Number(s.fees_eur).toFixed(2)}</Pill>
                    </div>
                    {s.notes && (
                      <div className="mt-2 text-xs text-zinc-400">
                        {s.notes}
                      </div>
                    )}
                  </div>
                  <Button variant="danger" onClick={() => remove(s.id)}>
                    Elimina
                  </Button>
                </div>
              </div>
            ))}

            {!loading && sales.length === 0 && (
              <div className="text-sm text-zinc-500">
                Nessuna vendita registrata.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
