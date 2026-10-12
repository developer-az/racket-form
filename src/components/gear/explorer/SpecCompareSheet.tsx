"use client";

import { useEffect } from "react";
import { GearImg } from "./GearImg";

export interface CompareItem {
  id: string;
  kicker: string;
  title: string;
  /** Small line under the title, e.g. the tension a score is taken at */
  note?: string;
  image: string;
  inBag: boolean;
}

export interface CompareRow {
  label: string;
  values: (number | string | null)[];
  /** Which end leads; null/undefined = no leader (trade-off or text) */
  best?: "high" | "low" | null;
  /** Draw a 0–100 bar next to the number */
  bar?: boolean;
  digits?: number;
}

export interface CompareGroup {
  label: string;
  rows: CompareRow[];
}

/** Side-by-side sheet for any catalog with 0–100 scores plus plain specs. */
export function SpecCompareSheet({
  noun,
  items,
  groups,
  onClose,
  onRemove,
  onSave,
}: {
  noun: string;
  items: CompareItem[];
  groups: CompareGroup[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onSave: (id: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sf-sheet-root" role="dialog" aria-modal="true" aria-label={`Compare ${noun}`}>
      <button type="button" className="sf-sheet-scrim" aria-label="Close compare" onClick={onClose} />
      <div className="sf-sheet sf-sheet-wide !max-w-5xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
          <p className="text-[15px] font-semibold tracking-[-0.01em]">
            Compare {items.length} {noun}
          </p>
          <button type="button" onClick={onClose} className="sf-btn sf-btn-ghost !min-h-9 text-[13px]">
            Close
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[34rem] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] w-32 bg-[var(--panel)]" />
                {items.map((it) => (
                  <th key={it.id} className="border-l border-[var(--line)] px-4 pt-4 pb-3 text-left align-bottom font-normal">
                    <div className="sf-thumb-well mb-3 flex h-20 items-center justify-center rounded-[var(--radius)]">
                      <GearImg src={it.image} className="h-16 w-16 object-contain" />
                    </div>
                    <p className="sf-spec-label">{it.kicker}</p>
                    <p className="mt-0.5 text-[14px] leading-snug font-semibold">{it.title}</p>
                    {it.note ? <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">{it.note}</p> : null}
                    <div className="mt-2 flex gap-3 text-[12px]">
                      <button type="button" className="sf-text-link !text-[12px]" onClick={() => onSave(it.id)}>
                        {it.inBag ? "In your bag" : "Add to bag"}
                      </button>
                      <button
                        type="button"
                        className="text-[var(--muted)] hover:text-[var(--foreground)]"
                        onClick={() => onRemove(it.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.label}>
                <tr>
                  <td
                    colSpan={items.length + 1}
                    className="sf-spec-label border-t border-[var(--line)] bg-[var(--bg-sunken)] px-4 py-2"
                  >
                    {g.label}
                  </td>
                </tr>
                {g.rows.map((row) => {
                  const nums = row.values.filter((v): v is number => typeof v === "number");
                  const spread = nums.length > 1 ? Math.max(...nums) - Math.min(...nums) : 0;
                  const target =
                    row.best === "high" ? Math.max(...nums) : row.best === "low" ? Math.min(...nums) : null;
                  return (
                    <tr key={row.label} className="border-t border-[var(--line)]">
                      <td className="sticky left-0 z-[1] bg-[var(--panel)] px-4 py-2.5 text-[var(--muted)]">
                        {row.label}
                      </td>
                      {row.values.map((v, i) => {
                        const lead = target != null && v === target && spread > 0;
                        return (
                          <td key={items[i]?.id ?? i} className="border-l border-[var(--line)] px-4 py-2.5">
                            {v == null ? (
                              <span className="text-[var(--muted)]">—</span>
                            ) : typeof v === "string" ? (
                              <span>{v}</span>
                            ) : row.bar ? (
                              <div className="flex items-center gap-3">
                                <span className={`sf-readout w-7 ${lead ? "text-[var(--accent)]" : ""}`}>
                                  {Math.round(v)}
                                </span>
                                <span className="h-[3px] flex-1 bg-[var(--line)]">
                                  <span
                                    className="block h-full"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, v))}%`,
                                      background: lead ? "var(--accent)" : "var(--foreground)",
                                      opacity: lead ? 1 : 0.55,
                                    }}
                                  />
                                </span>
                              </div>
                            ) : (
                              <span className={`sf-readout ${lead ? "text-[var(--accent)]" : ""}`}>
                                {v.toFixed(row.digits ?? 0)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
        <p className="border-t border-[var(--line)] px-5 py-3 text-[11.5px] text-[var(--muted)]">
          Blue marks the leader in each scored row.
        </p>
      </div>
    </div>
  );
}
