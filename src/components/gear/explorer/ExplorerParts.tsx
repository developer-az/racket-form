"use client";

import type { ReactNode } from "react";
import { Portal } from "./Portal";

/** Shared pieces for the catalog explorers (strings, grips). */

export type SortState<K extends string> = { key: K; dir: 1 | -1 };

export function SearchBox({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <svg
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="sf-input !min-h-10 !pl-9 !text-[14px]"
      />
    </label>
  );
}

export function SortHeader<K extends string>({
  label,
  k,
  sort,
  onSort,
  align = "right",
  title,
}: {
  label: string;
  k: K;
  sort: SortState<K>;
  onSort: (k: K) => void;
  align?: "left" | "right";
  title?: string;
}) {
  const active = sort.key === k;
  return (
    <span
      role="columnheader"
      aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      className={align === "right" ? "text-right whitespace-nowrap" : ""}
      title={title}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`hover:text-[var(--foreground)] ${active ? "text-[var(--foreground)]" : ""}`}
      >
        {label}
        {active ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </span>
  );
}

export function SortControls<K extends string>({
  count,
  total,
  noun,
  sort,
  options,
  onChange,
}: {
  count: number;
  total: number;
  noun: string;
  sort: SortState<K>;
  options: { id: K; label: string }[];
  onChange: (s: SortState<K>) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[12.5px] text-[var(--muted)]">
        <span className="sf-readout text-[var(--foreground)]">{count}</span> of {total} {noun}
      </p>
      <label className="flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
        Sort
        <select
          value={sort.key}
          onChange={(e) => {
            const key = e.target.value as K;
            onChange({ key, dir: key === "name" ? 1 : -1 });
          }}
          className="sf-select !h-8 !min-h-8 !px-2 !text-[12.5px]"
        >
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="sf-icon-btn !min-h-8 !min-w-8"
          onClick={() => onChange({ ...sort, dir: (sort.dir * -1) as 1 | -1 })}
          aria-label={sort.dir === -1 ? "Sorted high to low" : "Sorted low to high"}
        >
          {sort.dir === -1 ? "↓" : "↑"}
        </button>
      </label>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium">{label}</p>
      <div
        className="sf-segmented mt-2 w-full [&>button]:flex-1 [&>button]:!px-1.5"
        role="radiogroup"
        aria-label={label}
      >
        {options.map(([id, text]) => (
          <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onChange(id)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckList({
  label,
  items,
  selected,
  onToggle,
  format = (s) => s,
}: {
  label: string;
  items: [string, number][];
  selected: Set<string>;
  onToggle: (v: string) => void;
  format?: (v: string) => string;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium">{label}</p>
      <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto pr-1">
        {items.map(([v, n]) => (
          <li key={v}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-1.5 py-1 text-[13px] hover:bg-[var(--overlay-hover)]">
              <input
                type="checkbox"
                className="sf-check !h-3.5 !w-3.5"
                checked={selected.has(v)}
                onChange={() => onToggle(v)}
              />
              <span className="flex-1">{format(v)}</span>
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">{n}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function toggleInSet(prev: Set<string>, v: string): Set<string> {
  const next = new Set(prev);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

export function countBy<T>(items: T[], key: (t: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function NumCell({ v, digits = 0 }: { v: number | null; digits?: number }) {
  return (
    <span role="cell" className="sf-rt-num sf-readout text-right text-[13px]">
      {v != null ? v.toFixed(digits) : <span className="text-[var(--muted)]">—</span>}
    </span>
  );
}

export function InBagTag({ children = "In bag" }: { children?: ReactNode }) {
  return (
    <span className="ml-2 shrink-0 align-middle font-[family-name:var(--font-mono)] text-[10px] tracking-[0.08em] text-[var(--muted)] uppercase">
      {children}
    </span>
  );
}

export function MobileSheet({
  label,
  onClose,
  children,
  footer,
  closeLabel = "Close",
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}) {
  return (
    <Portal>
      <div className="sf-sheet-root lg:hidden" role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="sf-sheet-scrim" aria-label={`Close ${label.toLowerCase()}`} onClick={onClose} />
        <div className="sf-sheet">
          {footer ? null : (
            <div className="flex justify-end border-b border-[var(--line)] px-3 py-1.5">
              <button type="button" onClick={onClose} className="sf-btn sf-btn-ghost !min-h-9 !text-[13px]">
                {closeLabel}
              </button>
            </div>
          )}
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer ? <div className="border-t border-[var(--line)] p-3">{footer}</div> : null}
        </div>
      </div>
    </Portal>
  );
}

export function CompareTray({
  items,
  onRemove,
  onOpen,
}: {
  items: { id: string; label: string }[];
  onRemove: (id: string) => void;
  onOpen: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="sf-compare-tray" role="region" aria-label="Compare tray">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {items.map((it) => (
          <span
            key={it.id}
            className="inline-flex max-w-[11rem] min-w-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-1 text-[12px]"
          >
            <span className="truncate">{it.label}</span>
            <button
              type="button"
              onClick={() => onRemove(it.id)}
              aria-label={`Remove ${it.label}`}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        disabled={items.length < 2}
        onClick={onOpen}
        className="sf-btn sf-btn-primary !min-h-9 shrink-0 !px-3 !text-[13px]"
      >
        {items.length < 2 ? "Pick one more" : `Compare ${items.length}`}
      </button>
    </div>
  );
}

/** Yours / This / Change table against what is saved in the bag. */
export function DeltaTable({
  rows,
}: {
  rows: { label: string; yours: number | null; mine: number | null; unit?: string; digits?: number }[];
}) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="sf-spec-label text-left">
          <th className="pb-2 font-medium" />
          <th className="pb-2 text-right font-medium">Yours</th>
          <th className="pb-2 text-right font-medium">This</th>
          <th className="pb-2 text-right font-medium">Change</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
        {rows.map((r) => {
          const d = r.mine != null && r.yours != null ? r.mine - r.yours : null;
          const f = (v: number | null) => (v == null ? "—" : v.toFixed(r.digits ?? 0));
          return (
            <tr key={r.label}>
              <td className="py-2 text-[var(--muted)]">{r.label}</td>
              <td className="sf-readout py-2 text-right text-[var(--muted)]">{f(r.yours)}</td>
              <td className="sf-readout py-2 text-right">{f(r.mine)}</td>
              <td className="sf-readout py-2 text-right">
                {d == null || Math.abs(d) < 0.005 ? (
                  <span className="text-[var(--muted)]">—</span>
                ) : (
                  <span>
                    {d > 0 ? "+" : "−"}
                    {Math.abs(d).toFixed(r.digits ?? 0)}
                    {r.unit ? <span className="ml-0.5 text-[var(--muted)]">{r.unit}</span> : null}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Key/value spec list with hairline dividers. */
export function SpecList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[7rem_1fr] items-baseline gap-3 py-2">
          <dt className="text-[13px] text-[var(--muted)]">{k}</dt>
          <dd className="min-w-0 text-[13.5px]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailTabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (t: T) => void;
  label: string;
}) {
  return (
    <div className="sf-tab-track mt-5 border-b border-[var(--line)]" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className="sf-tab !min-h-10 !px-3 !py-2"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
