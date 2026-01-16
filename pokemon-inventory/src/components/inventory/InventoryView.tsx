"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { InventoryCard } from "@/lib/types";
import {
  Button,
  Card,
  Input,
  Pill,
  SectionTitle,
  Select,
  Textarea,
  Field,
} from "@/components/ui";

const CONDITIONS = ["MT", "NM", "EX", "GD", "LP", "PL", "PO"];
const VARIANTS = ["normal", "holo", "reverse", "1st", "promo", "other"];

export default function InventoryView() {
  const [items, setItems] = useState<InventoryCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) =>
      [x.name, x.set_name, x.card_number, x.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s),
    );
  }, [items, q]);

  const [form, setForm] = useState<Partial<InventoryCard>>({
    name: "",
    set_name: "",
    card_number: "",
    variant: "normal",
    language: "IT",
    condition: "NM",
    quantity: 1,
    buy_price_eur: 0,
  });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_cards")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setItems(data as InventoryCard[]);
    setLoading(false);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("realtime-inventory")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_cards" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addItem() {
    const payload = {
      name: (form.name ?? "").trim(),
      set_name: form.set_name?.trim() || null,
      card_number: form.card_number?.trim() || null,
      variant: form.variant ?? "normal",
      language: form.language ?? "IT",
      condition: form.condition ?? "NM",
      graded: !!form.graded,
      grade_company: form.grade_company?.trim() || null,
      grade_value: form.grade_value?.trim() || null,
      quantity: Number(form.quantity ?? 1),
      buy_price_eur: Number(form.buy_price_eur ?? 0),
      buy_date: form.buy_date || null,
      current_value_eur:
        form.current_value_eur != null ? Number(form.current_value_eur) : null,
      target_value_eur:
        form.target_value_eur != null ? Number(form.target_value_eur) : null,
      location: form.location?.trim() || null,
      tags: form.tags?.trim() || null,
      notes: form.notes?.trim() || null,
      image_url: form.image_url?.trim() || null,
    };

    if (!payload.name) return;

    const { error } = await supabase.from("inventory_cards").insert(payload);
    if (!error) {
      await load();
      setForm({
        name: "",
        set_name: "",
        card_number: "",
        variant: "normal",
        language: "IT",
        condition: "NM",
        quantity: 1,
        buy_price_eur: 0,
      });
    }
  }

  async function remove(id: string) {
    await supabase.from("inventory_cards").delete().eq("id", id);
  }

  return (
    <div className="p-4 sm:p-6">
      <SectionTitle
        title="Inventario"
        subtitle="Aggiungi carte e aggiorna quantità/prezzi. Tutto in real-time."
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca (nome, set, numero, tag)..."
        />
        <div className="text-xs text-zinc-500 sm:ml-2">
          {loading ? "Caricamento..." : `${filtered.length} / ${items.length}`}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Nuova carta</h3>
            <Pill>quick add</Pill>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nome carta (es. Charizard)"
              />
            </div>

            <Input
              value={form.set_name ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, set_name: e.target.value }))
              }
              placeholder="Set (es. Base Set)"
            />
            <Input
              value={form.card_number ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, card_number: e.target.value }))
              }
              placeholder="Numero (es. 4/102)"
            />

            <Select
              value={form.variant ?? "normal"}
              onChange={(e) =>
                setForm((p) => ({ ...p, variant: e.target.value }))
              }
            >
              {VARIANTS.map((v) => (
                <option key={v} value={v}>
                  Variante: {v}
                </option>
              ))}
            </Select>

            <Select
              value={form.condition ?? "NM"}
              onChange={(e) =>
                setForm((p) => ({ ...p, condition: e.target.value }))
              }
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  Condizione: {c}
                </option>
              ))}
            </Select>

            <Field label="Quantità">
              <Input
                type="number"
                inputMode="numeric"
                value={String(form.quantity ?? 1)}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quantity: Number(e.target.value) }))
                }
                placeholder="es. 1"
              />
            </Field>

            <Field label="Prezzo acquisto (€)">
              <Input
                type="number"
                inputMode="decimal"
                value={String(form.buy_price_eur ?? 0)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    buy_price_eur: Number(e.target.value),
                  }))
                }
                placeholder="es. 12.50"
              />
            </Field>

            <Input
              value={form.location ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="Posizione (binder/box)"
            />
            <Input
              value={form.tags ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              placeholder="Tag (es. vintage, zard)"
            />

            <div className="sm:col-span-2">
              <Input
                value={form.image_url ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, image_url: e.target.value }))
                }
                placeholder="Foto URL (opzionale)"
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Note (opzionale)"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={addItem}
              disabled={!String(form.name ?? "").trim()}
            >
              Aggiungi
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setForm({
                  name: "",
                  set_name: "",
                  card_number: "",
                  variant: "normal",
                  language: "IT",
                  condition: "NM",
                  quantity: 1,
                  buy_price_eur: 0,
                })
              }
            >
              Reset
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold">Elenco</h3>

          <div className="space-y-3">
            {filtered.map((x) => (
              <div
                key={x.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{x.name}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                      {x.set_name && <Pill>{x.set_name}</Pill>}
                      {x.card_number && <Pill>{x.card_number}</Pill>}
                      {x.variant && <Pill>{x.variant}</Pill>}
                      {x.condition && <Pill>{x.condition}</Pill>}
                      <Pill>qty {x.quantity}</Pill>
                      <Pill>buy €{Number(x.buy_price_eur).toFixed(2)}</Pill>
                      {x.current_value_eur != null && (
                        <Pill>
                          now €{Number(x.current_value_eur).toFixed(2)}
                        </Pill>
                      )}
                    </div>
                    {x.tags && (
                      <div className="mt-2 text-xs text-zinc-500">
                        #{x.tags}
                      </div>
                    )}
                    {x.notes && (
                      <div className="mt-2 text-xs text-zinc-400">
                        {x.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {x.image_url && (
                      <a
                        className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs hover:bg-zinc-800/60"
                        href={x.image_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Foto
                      </a>
                    )}
                    <Button variant="danger" onClick={() => remove(x.id)}>
                      Elimina
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="text-sm text-zinc-500">Nessun risultato.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
