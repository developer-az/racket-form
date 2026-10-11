"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  EquipmentTab,
  RacketCatalogMeta,
  RacketProfile,
} from "@/types/equipment";
import {
  matchesEquipmentSearch,
  searchMatchScore,
} from "@/lib/equipment/search";
import { equipmentLabel } from "@/lib/equipment/labels";
import {
  cleanSpecs,
  distribution,
  patternBand,
  type Distribution,
  type NumericKey,
} from "@/lib/equipment/catalogStats";
import { useGearStore } from "@/store/gearStore";
import { RangeFilter } from "./explorer/RangeFilter";
import { CatalogScatter, AXES, type AxisKey } from "./explorer/CatalogScatter";
import { RacketDetail, type CatalogDists } from "./explorer/RacketDetail";
import { CompareSheet } from "./explorer/CompareSheet";
import { RacketImg } from "./explorer/RacketImg";
import { Portal } from "./explorer/Portal";

const PAGE = 60;
const MAX_COMPARE = 4;
const RECENT_YEAR = 2024;

type SortKey =
  | "relevance"
  | "newest"
  | NumericKey
  | "power"
  | "spin"
  | "control"
  | "comfort";
type Pattern = "all" | "16x19" | "18x20" | "other";
type Ranges = Record<NumericKey, [number, number]>;

const NUMERIC: {
  key: NumericKey;
  label: string;
  unit?: string;
  step?: number;
}[] = [
  { key: "weightG", label: "Weight", unit: "g" },
  { key: "swingweight", label: "Swingweight" },
  { key: "stiffnessRa", label: "Stiffness", unit: "RA" },
  { key: "headSizeSqIn", label: "Head size", unit: "in²" },
  { key: "balanceMm", label: "Balance", unit: "mm" },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "weightG", label: "Weight" },
  { id: "swingweight", label: "Swingweight" },
  { id: "stiffnessRa", label: "Stiffness" },
  { id: "headSizeSqIn", label: "Head size" },
  { id: "balanceMm", label: "Balance" },
  { id: "power", label: "Power" },
  { id: "spin", label: "Spin" },
  { id: "control", label: "Control" },
  { id: "comfort", label: "Comfort" },
];

function fullRanges(d: CatalogDists): Ranges {
  return Object.fromEntries(
    NUMERIC.map((n) => [n.key, [d[n.key].min, d[n.key].max]]),
  ) as Ranges;
}

function sortValue(r: RacketProfile, key: SortKey): number {
  switch (key) {
    case "newest":
      return r.year;
    case "power":
    case "spin":
    case "control":
    case "comfort":
      return r[key];
    case "relevance":
      return 0;
    default:
      return r[key] ?? Number.NaN;
  }
}

export function RacketExplorer({
  initialRackets: rawRackets,
  meta,
  onSelectTab,
}: {
  initialRackets: RacketProfile[];
  meta: RacketCatalogMeta;
  onSelectTab?: (
    tab: EquipmentTab,
    extra?: Record<string, string | null>,
  ) => void;
}) {
  const liveCatalog = meta.live === true;
  const initialRackets = useMemo(
    () => rawRackets.map(cleanSpecs),
    [rawRackets],
  );
  const searchParams = useSearchParams();
  const setup = useGearStore((s) => s.setup);
  const setRacket = useGearStore((s) => s.setRacket);
  const setTab = useGearStore((s) => s.setTab);
  const bagSlug = setup.racketSlug;

  const dists = useMemo<CatalogDists>(
    () =>
      Object.fromEntries(
        NUMERIC.map((n) => [
          n.key,
          distribution(
            initialRackets.map((r) => r[n.key]),
            28,
          ),
        ]),
      ) as Record<NumericKey, Distribution>,
    [initialRackets],
  );

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [ranges, setRanges] = useState<Ranges>(() => fullRanges(dists));
  const [pattern, setPattern] = useState<Pattern>("all");
  const [recentOnly, setRecentOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "newest",
    dir: -1,
  });
  const [view, setView] = useState<"list" | "map">("list");
  const [axes, setAxes] = useState<{ x: AxisKey; y: AxisKey }>({
    x: "weightG",
    y: "balanceMm",
  });
  const [limit, setLimit] = useState(PAGE);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    () => searchParams.get("racket") ?? bagSlug ?? null,
  );
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  // Follow deep links (?racket=, ?q=) when the URL changes after mount
  const paramKey = `${searchParams.get("racket") ?? ""}|${searchParams.get("q") ?? ""}`;
  const [lastParamKey, setLastParamKey] = useState(paramKey);
  if (lastParamKey !== paramKey) {
    setLastParamKey(paramKey);
    const slug = searchParams.get("racket");
    if (slug && initialRackets.some((r) => r.slug === slug))
      setSelectedSlug(slug);
    const q = searchParams.get("q");
    if (q != null) setQuery(q);
  }

  const brandCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of initialRackets) m.set(r.brand, (m.get(r.brand) ?? 0) + 1);
    return [...m.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [initialRackets]);

  const full = useMemo(() => fullRanges(dists), [dists]);
  const rangeActive = (k: NumericKey) =>
    ranges[k][0] > full[k][0] || ranges[k][1] < full[k][1];

  const filtered = useMemo(() => {
    const q = deferredQuery.trim();
    const list = initialRackets.filter((r) => {
      if (brands.size > 0 && !brands.has(r.brand)) return false;
      if (pattern !== "all" && patternBand(r.stringPattern) !== pattern)
        return false;
      if (recentOnly && r.year < RECENT_YEAR) return false;
      for (const n of NUMERIC) {
        const [lo, hi] = ranges[n.key];
        const v = r[n.key];
        const isFull = lo <= full[n.key][0] && hi >= full[n.key][1];
        if (v == null) {
          if (!isFull) return false;
        } else if (v < lo || v > hi) return false;
      }
      if (!q) return true;
      return matchesEquipmentSearch(
        q,
        r.brand,
        r.model,
        r.slug,
        r.year,
        r.style,
        r.stringPattern,
        r.summary,
      );
    });
    const key: SortKey = q && sort.key === "newest" ? "relevance" : sort.key;
    return list.sort((a, b) => {
      if (key === "relevance") {
        const d =
          searchMatchScore(q, b.brand, b.model, b.slug) -
          searchMatchScore(q, a.brand, a.model, a.slug);
        return d || b.year - a.year;
      }
      const va = sortValue(a, key);
      const vb = sortValue(b, key);
      // Unknown values always sink, whichever direction
      if (Number.isNaN(va) !== Number.isNaN(vb))
        return Number.isNaN(va) ? 1 : -1;
      return (
        (va - vb) * sort.dir ||
        a.brand.localeCompare(b.brand) ||
        a.model.localeCompare(b.model)
      );
    });
  }, [
    initialRackets,
    deferredQuery,
    brands,
    pattern,
    recentOnly,
    ranges,
    full,
    sort,
  ]);

  const filterKey = `${deferredQuery}|${[...brands].join()}|${pattern}|${recentOnly}|${JSON.stringify(ranges)}|${sort.key}${sort.dir}`;
  const [lastKey, setLastKey] = useState(filterKey);
  if (lastKey !== filterKey) {
    setLastKey(filterKey);
    setLimit(PAGE);
  }

  const inFilter = useMemo(
    () => new Set(filtered.map((r) => r.slug)),
    [filtered],
  );
  const bySlug = useMemo(
    () => new Map(initialRackets.map((r) => [r.slug, r])),
    [initialRackets],
  );
  const selected =
    (selectedSlug ? bySlug.get(selectedSlug) : null) ?? filtered[0] ?? null;
  const bag = bagSlug ? (bySlug.get(bagSlug) ?? null) : null;
  const compareRackets = compare
    .map((s) => bySlug.get(s))
    .filter((r): r is RacketProfile => r != null);
  const activeFilterCount =
    brands.size +
    (pattern !== "all" ? 1 : 0) +
    (recentOnly ? 1 : 0) +
    NUMERIC.filter((n) => rangeActive(n.key)).length;

  const save = (r: RacketProfile) =>
    setRacket(r.slug, equipmentLabel(r.brand, r.model), {
      idealLaunchAngleDeg: r.idealLaunchAngleDeg,
      idealSwingPathDeg: r.idealSwingPathDeg,
      power: r.power,
      spin: r.spin,
      control: r.control,
      comfort: r.comfort,
      weightG: r.weightG,
      swingweight: r.swingweight,
      balanceMm: r.balanceMm,
    });

  const toggleCompare = (slug: string) =>
    setCompare((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug].slice(-MAX_COMPARE),
    );

  const select = (slug: string) => {
    setSelectedSlug(slug);
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setDetailOpen(true);
    }
  };

  const resetFilters = () => {
    setBrands(new Set());
    setRanges(full);
    setPattern("all");
    setRecentOnly(false);
    setQuery("");
  };

  const headerSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: (s.dir * -1) as 1 | -1 }
        : { key, dir: key === "newest" ? -1 : -1 },
    );

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Filters</p>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Reset ({activeFilterCount})
          </button>
        ) : null}
      </div>

      {NUMERIC.map((n) => (
        <RangeFilter
          key={n.key}
          label={n.label}
          unit={n.unit}
          dist={dists[n.key]}
          value={ranges[n.key]}
          onChange={(v) => setRanges((r) => ({ ...r, [n.key]: v }))}
        />
      ))}

      <div>
        <p className="text-[13px] font-medium">String pattern</p>
        <div
          className="sf-segmented mt-2"
          role="radiogroup"
          aria-label="String pattern"
        >
          {(
            [
              ["all", "Any"],
              ["16x19", "16×19"],
              ["18x20", "18×20"],
              ["other", "Other"],
            ] as [Pattern, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={pattern === id}
              onClick={() => setPattern(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-[13px] font-medium">Current models only</span>
        <input
          type="checkbox"
          className="sf-switch"
          checked={recentOnly}
          onChange={(e) => setRecentOnly(e.target.checked)}
        />
      </label>

      <div>
        <p className="text-[13px] font-medium">Brand</p>
        <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto pr-1">
          {brandCounts.map(([b, n]) => (
            <li key={b}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-1.5 py-1 text-[13px] hover:bg-[var(--overlay-hover)]">
                <input
                  type="checkbox"
                  className="sf-check !h-3.5 !w-3.5"
                  checked={brands.has(b)}
                  onChange={() =>
                    setBrands((prev) => {
                      const next = new Set(prev);
                      if (next.has(b)) next.delete(b);
                      else next.add(b);
                      return next;
                    })
                  }
                />
                <span className="flex-1">{b}</span>
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                  {n}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const extraCol = (
    ["power", "spin", "control", "comfort"] as SortKey[]
  ).includes(sort.key)
    ? sort.key
    : null;

  const detail = selected ? (
    <RacketDetail
      key={selected.slug}
      racket={selected}
      dists={dists}
      bag={bag}
      inBag={selected.slug === bagSlug}
      inCompare={compare.includes(selected.slug)}
      liveCatalog={liveCatalog}
      onSave={() => save(selected)}
      onToggleCompare={() => toggleCompare(selected.slug)}
      onTune={() => {
        if (onSelectTab) onSelectTab("lead-tape", { mold: selected.slug });
        else setTab("lead-tape");
      }}
    />
  ) : null;

  return (
    <div className="sf-explorer">
      <aside
        className="sf-explorer-filters hidden lg:block"
        aria-label="Filters"
      >
        {filters}
      </aside>

      <section className="min-w-0" aria-label="Rackets">
        <div className="sf-explorer-toolbar">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search rackets</span>
            <svg
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <circle
                cx="7"
                cy="7"
                r="5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11 11l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rackets"
              className="sf-input !min-h-10 !pl-9 !text-[14px]"
            />
          </label>
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="sf-btn sf-btn-secondary !min-h-10 !px-3 !text-[13px]"
            >
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
          <div
            className="sf-segmented hidden sm:inline-flex"
            role="radiogroup"
            aria-label="View"
          >
            <button
              type="button"
              role="radio"
              aria-checked={view === "list"}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={view === "map"}
              onClick={() => setView("map")}
            >
              Map
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] text-[var(--muted)]">
            <span className="sf-readout text-[var(--foreground)]">
              {filtered.length}
            </span>{" "}
            of {initialRackets.length} frames
          </p>
          <label className="flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
            Sort
            <select
              value={sort.key}
              onChange={(e) =>
                setSort({ key: e.target.value as SortKey, dir: -1 })
              }
              className="sf-select !h-8 !min-h-8 !px-2 !text-[12.5px]"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="sf-icon-btn !min-h-8 !min-w-8"
              onClick={() =>
                setSort((s) => ({ ...s, dir: (s.dir * -1) as 1 | -1 }))
              }
              aria-label={
                sort.dir === -1 ? "Sorted high to low" : "Sorted low to high"
              }
            >
              {sort.dir === -1 ? "↓" : "↑"}
            </button>
          </label>
        </div>

        {view === "map" ? (
          <div className="mt-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-3">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[12.5px] text-[var(--muted)]">
              {(["x", "y"] as const).map((ax) => (
                <label key={ax} className="flex items-center gap-2">
                  {ax === "x" ? "Across" : "Up"}
                  <select
                    value={axes[ax]}
                    onChange={(e) =>
                      setAxes((a) => ({
                        ...a,
                        [ax]: e.target.value as AxisKey,
                      }))
                    }
                    className="sf-select !h-8 !min-h-8 !px-2 !text-[12.5px]"
                  >
                    {(Object.keys(AXES) as AxisKey[]).map((k) => (
                      <option key={k} value={k}>
                        {AXES[k].label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <span className="ml-auto hidden items-center gap-3 sm:flex">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--foreground)] opacity-60" />
                  matches
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-dashed border-[var(--foreground)]" />
                  your bag
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-[var(--accent)]" />
                  comparing
                </span>
              </span>
            </div>
            <CatalogScatter
              rackets={initialRackets}
              inFilter={inFilter}
              x={axes.x}
              y={axes.y}
              selectedSlug={selected?.slug ?? null}
              bagSlug={bagSlug}
              compareSlugs={compare}
              onSelect={select}
            />
          </div>
        ) : (
          <div
            className="sf-rtable mt-3"
            role="table"
            aria-label="Racket results"
          >
            <div className="sf-rtable-head" role="row">
              <span role="columnheader" />
              <HeaderCell
                label="Frame"
                k="newest"
                sort={sort}
                onSort={headerSort}
                align="left"
              />
              <HeaderCell
                label="Weight"
                k="weightG"
                sort={sort}
                onSort={headerSort}
              />
              <HeaderCell
                label="SW"
                k="swingweight"
                sort={sort}
                onSort={headerSort}
              />
              <HeaderCell
                label="RA"
                k="stiffnessRa"
                sort={sort}
                onSort={headerSort}
              />
              <HeaderCell
                label="Head"
                k="headSizeSqIn"
                sort={sort}
                onSort={headerSort}
              />
              <HeaderCell
                label="Bal."
                k="balanceMm"
                sort={sort}
                onSort={headerSort}
              />
              <span role="columnheader" className="sf-rt-num text-right">
                {extraCol
                  ? SORTS.find((s) => s.id === extraCol)?.label
                  : "Pattern"}
              </span>
            </div>
            {filtered.slice(0, limit).map((r) => {
              const isSel = r.slug === selected?.slug;
              const inCmp = compare.includes(r.slug);
              return (
                <div
                  key={r.slug}
                  role="row"
                  aria-selected={isSel}
                  className="sf-rtable-row"
                  data-selected={isSel}
                  onClick={() => select(r.slug)}
                >
                  <span role="cell" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="sf-check !h-3.5 !w-3.5"
                      checked={inCmp}
                      onChange={() => toggleCompare(r.slug)}
                      aria-label={`Compare ${r.brand} ${r.model}`}
                    />
                  </span>
                  <span role="cell" className="flex min-w-0 items-center gap-3">
                    <RacketImg
                      racket={r}
                      className="h-9 w-7 shrink-0 object-contain"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">
                        {r.model}
                        {r.slug === bagSlug ? (
                          <span className="ml-2 align-middle text-[10px] font-[family-name:var(--font-mono)] tracking-[0.08em] text-[var(--muted)] uppercase">
                            In bag
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--muted)]">
                        {r.brand} · {r.year}
                        <span className="sf-rt-inline">
                          {" · "}
                          {[
                            r.weightG && `${r.weightG}g`,
                            r.swingweight && `SW ${r.swingweight}`,
                            r.stiffnessRa && `RA ${r.stiffnessRa}`,
                            r.headSizeSqIn && `${r.headSizeSqIn}in²`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </span>
                  </span>
                  <Num v={r.weightG} />
                  <Num v={r.swingweight} />
                  <Num v={r.stiffnessRa} />
                  <Num v={r.headSizeSqIn} />
                  <Num v={r.balanceMm} />
                  <span
                    role="cell"
                    className="sf-rt-num sf-readout text-right text-[12.5px] text-[var(--muted)]"
                  >
                    {extraCol
                      ? sortValue(r, extraCol)
                      : r.stringPattern?.replace("x", "×")}
                  </span>
                </div>
              );
            })}
            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[14px] font-medium">No frames match</p>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  Widen a range or clear a filter.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="sf-btn sf-btn-secondary mt-4 !min-h-9 !text-[13px]"
                >
                  Reset filters
                </button>
              </div>
            ) : null}
          </div>
        )}

        {view === "list" && limit < filtered.length ? (
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="sf-btn sf-btn-secondary mt-3 w-full !text-[13px]"
          >
            Show {Math.min(PAGE, filtered.length - limit)} more
          </button>
        ) : null}
      </section>

      <aside
        className="sf-explorer-detail hidden lg:block"
        aria-label="Selected frame"
      >
        {detail ?? (
          <p className="text-[13px] text-[var(--muted)]">
            Select a frame to see its specs.
          </p>
        )}
      </aside>

      {compare.length > 0 ? (
        <div
          className="sf-compare-tray"
          role="region"
          aria-label="Compare tray"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {compareRackets.map((r) => (
              <span
                key={r.slug}
                className="inline-flex max-w-[11rem] min-w-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-1 text-[12px]"
              >
                <span className="truncate">{r.model}</span>
                <button
                  type="button"
                  onClick={() => toggleCompare(r.slug)}
                  aria-label={`Remove ${r.model}`}
                  className="text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            disabled={compare.length < 2}
            onClick={() => setCompareOpen(true)}
            className="sf-btn sf-btn-primary !min-h-9 shrink-0 !px-3 !text-[13px]"
          >
            {compare.length < 2 ? "Pick one more" : `Compare ${compare.length}`}
          </button>
        </div>
      ) : null}

      {compareOpen && compareRackets.length >= 2 ? (
        <Portal>
          <CompareSheet
            rackets={compareRackets}
            bagSlug={bagSlug}
            onClose={() => setCompareOpen(false)}
            onRemove={(s) => toggleCompare(s)}
            onSave={save}
          />
        </Portal>
      ) : null}

      {filtersOpen ? (
        <Portal>
          <div
            className="sf-sheet-root lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <button
              type="button"
              className="sf-sheet-scrim"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="sf-sheet">
              <div className="overflow-y-auto px-5 py-5">{filters}</div>
              <div className="border-t border-[var(--line)] p-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="sf-btn sf-btn-primary w-full"
                >
                  Show {filtered.length} frames
                </button>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}

      {detailOpen && detail ? (
        <Portal>
          <div
            className="sf-sheet-root lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Frame details"
          >
            <button
              type="button"
              className="sf-sheet-scrim"
              aria-label="Close details"
              onClick={() => setDetailOpen(false)}
            />
            <div className="sf-sheet">
              <div className="flex justify-end border-b border-[var(--line)] px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="sf-btn sf-btn-ghost !min-h-9 !text-[13px]"
                >
                  Close
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-5">{detail}</div>
            </div>
          </div>
        </Portal>
      ) : null}
    </div>
  );
}

function Num({ v }: { v: number | null }) {
  return (
    <span role="cell" className="sf-rt-num sf-readout text-right text-[13px]">
      {v != null ? (
        Math.round(v)
      ) : (
        <span className="text-[var(--muted)]">—</span>
      )}
    </span>
  );
}

function HeaderCell({
  label,
  k,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  return (
    <span
      role="columnheader"
      aria-sort={
        active ? (sort.dir === 1 ? "ascending" : "descending") : "none"
      }
      className={align === "right" ? "text-right" : ""}
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
