import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm",
        "placeholder:text-zinc-500 outline-none focus:border-zinc-600",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm",
        "placeholder:text-zinc-500 outline-none focus:border-zinc-600",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm",
        "outline-none focus:border-zinc-600",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  },
) {
  const v = props.variant ?? "primary";
  const cls =
    v === "primary"
      ? "bg-zinc-100 text-zinc-900 hover:bg-white"
      : v === "danger"
        ? "bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30"
        : "bg-transparent text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800";

  return (
    <button
      {...props}
      className={[
        "rounded-xl px-3 py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed",
        cls,
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-xs">
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-300">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </label>
  );
}
