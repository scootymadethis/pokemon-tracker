"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WatchItem } from "@/lib/types";
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

export default function WatchlistView() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) =>
      [x.title, x.source, x.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s),
    );
  }, [items, q]);

  const [form, setForm] = useState({
    title: "",
    link: "",
    source: "eBay",
    seen_price_eur: "",
    target_price_eur: "",
    status: "active",
    notes: "",
  });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setItems(data as WatchItem[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("realtime-watchlist")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "watchlist" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    const payload = {
      title: form.title.trim(),
      link: form.link.trim() || null,
      source: form.source || null,
      seen_price_eur: form.seen_price_eur ? Number(form.seen_price_eur) : null,
      target_price_eur: form.target_price_eur
        ? Number(form.target_price_eur)
        : null,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    if (!payload.title) return;

    const { error } = await supabase.from("watchlist").insert(payload);
    if (!error) {
      setForm({
        title: "",
        link: "",
        source: "eBay",
        seen_price_eur: "",
        target_price_eur: "",
        status: "active",
        notes: "",
      });
    }
  }

  async function setStatus(id: string, status: string) {
    await supabase.from("watchlist").update({ status }).eq("id", id);
  }

  async function remove(id: string) {
    await supabase.from("watchlist").delete().eq("id", id);
  }

  return (
    <div className="p-4 sm:p-6">
      <SectionTitle
        title="Watchlist"
        subtitle="Tieni d’occhio annunci con link e target price. Real-time."
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca..."
        />
        <div className="text-xs text-zinc-500 sm:ml-2">
          {loading ? "Caricamento..." : `${filtered.length} / ${items.length}`}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Nuovo annuncio</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Titolo">
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="es. Charizard Base Set NM"
                />
              </Field>
            </div>

            <Field label="Link (opzionale)">
              <Input
                value={form.link}
                onChange={(e) =>
                  setForm((p) => ({ ...p, link: e.target.value }))
                }
                placeholder="https://..."
              />
            </Field>

            <Field label="Sorgente">
              <Select
                value={form.source}
                onChange={(e) =>
                  setForm((p) => ({ ...p, source: e.target.value }))
                }
              >
                {["eBay", "Cardmarket", "Subito", "Vinted", "Altro"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </Select>
            </Field>

            <Field label="Prezzo visto (€)">
              <Input
                value={form.seen_price_eur}
                onChange={(e) =>
                  setForm((p) => ({ ...p, seen_price_eur: e.target.value }))
                }
                placeholder="es. 25.00"
                inputMode="decimal"
              />
            </Field>

            <Field label="Target (€)">
              <Input
                value={form.target_price_eur}
                onChange={(e) =>
                  setForm((p) => ({ ...p, target_price_eur: e.target.value }))
                }
                placeholder="es. 18.00"
                inputMode="decimal"
              />
            </Field>

            <Field label="Stato">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
              >
                {["active", "bought", "closed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Note (opzionale)">
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Dettagli, condizioni, scadenza..."
                />
              </Field>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={add} disabled={!form.title.trim()}>
              Aggiungi a watchlist
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
                    <div className="truncate font-medium">{x.title}</div>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                      {x.source && <Pill>{x.source}</Pill>}
                      <Pill>{x.status}</Pill>
                      {x.seen_price_eur != null && (
                        <Pill>seen €{Number(x.seen_price_eur).toFixed(2)}</Pill>
                      )}
                      {x.target_price_eur != null && (
                        <Pill>
                          target €{Number(x.target_price_eur).toFixed(2)}
                        </Pill>
                      )}
                    </div>

                    {x.link && (
                      <a
                        className="mt-2 block truncate text-xs text-zinc-300 underline decoration-zinc-600 hover:decoration-zinc-300"
                        href={x.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apri link
                      </a>
                    )}

                    {x.notes && (
                      <div className="mt-2 text-xs text-zinc-400">
                        {x.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Select
                      value={x.status}
                      onChange={(e) => setStatus(x.id, e.target.value)}
                    >
                      {["active", "bought", "closed"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    <Button variant="danger" onClick={() => remove(x.id)}>
                      Elimina
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="text-sm text-zinc-500">
                Nessun elemento in watchlist.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
