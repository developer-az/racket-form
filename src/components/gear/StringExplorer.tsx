"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { EquipmentTab, StringProfile } from "@/types/equipment";
import {
  GAUGE_FILTER_OPTIONS,
  findSimilarStrings,
  gaugeLabel,
  isPolyFamily,
  materialLabel,
  parseGaugeFromQuery,
  parsePolyIntent,
  shapeLabel,
  stringHasGauge,
  tensionOutcome,
  tensionRangeOverlaps,
} from "@/lib/equipment/strings";
import { matchesEquipmentSearch, searchMatchScore } from "@/lib/equipment/search";
import { stringImageUrl } from "@/lib/equipment/media/urls";
import { equipmentLabel } from "@/lib/equipment/labels";
import { distribution, type Distribution } from "@/lib/equipment/catalogStats";
import { analyzeString } from "@/lib/equipment/strokeformIntel";
import { useGearStore } from "@/store/gearStore";
import { RangeFilter } from "./explorer/RangeFilter";
import { Bar } from "./explorer/RacketDetail";
import { GearImg } from "./explorer/GearImg";
import { TensionChart } from "./explorer/TensionChart";
import { SpecCompareSheet } from "./explorer/SpecCompareSheet";
import { Portal } from "./explorer/Portal";
import {
  CheckList,
  CompareTray,
  DeltaTable,
  DetailTabs,
  InBagTag,
  MobileSheet,
  NumCell,
  SearchBox,
  Segmented,
  SortControls,
  SortHeader,
  SpecList,
  countBy,
  toggleInSet,
  type SortState,
} from "./explorer/ExplorerParts";

const MAX_COMPARE = 4;

type ScoreKey = "power" | "spin" | "control" | "comfort" | "durability" | "tensionMaintenance" | "recommendedTensionLbs";
type SortKey = "relevance" | "name" | ScoreKey;
type Ranges = Record<ScoreKey, [number, number]>;
type ShapeBand = "all" | "round" | "shaped";

const RANGES: { key: ScoreKey; label: string; unit?: string; step?: number }[] = [
  { key: "power", label: "Power" },
  { key: "spin", label: "Spin" },
  { key: "control", label: "Control" },
  { key: "comfort", label: "Comfort" },
  { key: "durability", label: "Durability" },
  { key: "tensionMaintenance", label: "Holds tension" },
  { key: "recommendedTensionLbs", label: "Suggested tension", unit: "lbs", step: 0.5 },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "power", label: "Power" },
  { id: "spin", label: "Spin" },
  { id: "control", label: "Control" },
  { id: "comfort", label: "Comfort" },
  { id: "durability", label: "Durability" },
  { id: "tensionMaintenance", label: "Holds tension" },
  { id: "recommendedTensionLbs", label: "Suggested tension" },
];

const MATERIAL_SHORT: Record<StringProfile["material"], string> = {
  polyester: "Poly",
  "co-poly": "Co-poly",
  multifilament: "Multi",
  "synthetic-gut": "Syn gut",
  "natural-gut": "Gut",
  hybrid: "Hybrid",
};

export function StringExplorer({
  strings,
  onSelectTab,
}: {
  strings: StringProfile[];
  onSelectTab?: (tab: EquipmentTab) => void;
}) {
  void onSelectTab;
  const setup = useGearStore((s) => s.setup);
  const setString = useGearStore((s) => s.setString);
  const setTensionStore = useGearStore((s) => s.setTension);
  const setGaugeStore = useGearStore((s) => s.setGauge);
  const bagId = setup.stringId;

  const dists = useMemo(
    () =>
      Object.fromEntries(RANGES.map((r) => [r.key, distribution(strings.map((s) => s[r.key]), 20)])) as Record<
        ScoreKey,
        Distribution
      >,
    [strings],
  );
  const full = useMemo(
    () => Object.fromEntries(RANGES.map((r) => [r.key, [dists[r.key].min, dists[r.key].max]])) as Ranges,
    [dists],
  );

  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [materials, setMaterials] = useState<Set<string>>(new Set());
  const [shape, setShape] = useState<ShapeBand>("all");
  const [gaugeFilter, setGaugeFilter] = useState("all");
  const [fitsMine, setFitsMine] = useState(false);
  const [ranges, setRanges] = useState<Ranges>(full);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "name", dir: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(
    bagId && strings.some((s) => s.id === bagId) ? bagId : null,
  );
  const [tensionById, setTensionById] = useState<Record<string, number>>(() =>
    bagId && setup.tensionLbs != null ? { [bagId]: setup.tensionLbs } : {},
  );
  const [gaugeById, setGaugeById] = useState<Record<string, number>>(() =>
    bagId && setup.gaugeMm != null ? { [bagId]: setup.gaugeMm } : {},
  );
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const brandCounts = useMemo(() => countBy(strings, (s) => s.brand), [strings]);
  const materialCounts = useMemo(() => countBy(strings, (s) => s.material), [strings]);
  const myTension = setup.tensionLbs;

  const filtered = useMemo(() => {
    const q = deferredQuery.trim();
    const gaugeFromQuery = parseGaugeFromQuery(q);
    const polyFromQuery = parsePolyIntent(q);
    const gaugeTarget = gaugeFilter !== "all" ? parseFloat(gaugeFilter) : gaugeFromQuery;
    // Gauge and "poly" tokens become filters, so they should not also have to match the name
    const textQuery = q
      .replace(/\b(1\.\d{1,2}|16g|17g|17l|15g|15l|18g)\b/gi, " ")
      .replace(/\b(poly|polyester|co-?poly|copoly)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const list = strings.filter((s) => {
      if (brands.size > 0 && !brands.has(s.brand)) return false;
      if (materials.size > 0 && !materials.has(s.material)) return false;
      if (polyFromQuery && !isPolyFamily(s.material)) return false;
      if (shape === "round" && s.shape !== "round") return false;
      if (shape === "shaped" && s.shape === "round") return false;
      if (gaugeTarget != null && !stringHasGauge(s, gaugeTarget)) return false;
      if (fitsMine && myTension != null && !tensionRangeOverlaps(s, myTension, 2)) return false;
      for (const r of RANGES) {
        const [lo, hi] = ranges[r.key];
        if (s[r.key] < lo || s[r.key] > hi) return false;
      }
      if (!textQuery) return true;
      return matchesEquipmentSearch(textQuery, s.brand, s.name, s.material, s.shape, s.bestFor, s.feel);
    });
    const key: SortKey = textQuery && sort.key === "name" ? "relevance" : sort.key;
    return list.sort((a, b) => {
      if (key === "relevance") {
        return (
          searchMatchScore(textQuery, b.brand, b.name, b.id) - searchMatchScore(textQuery, a.brand, a.name, a.id) ||
          a.name.localeCompare(b.name)
        );
      }
      if (key === "name") {
        return (a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)) * sort.dir;
      }
      return (a[key] - b[key]) * sort.dir || a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
    });
  }, [strings, deferredQuery, brands, materials, shape, gaugeFilter, fitsMine, myTension, ranges, sort]);

  const byId = useMemo(() => new Map(strings.map((s) => [s.id, s])), [strings]);
  const selected = (selectedId ? byId.get(selectedId) : null) ?? filtered[0] ?? null;
  const bag = bagId ? (byId.get(bagId) ?? null) : null;

  const tensionFor = (s: StringProfile) => tensionById[s.id] ?? s.recommendedTensionLbs;
  const gaugeFor = (s: StringProfile) => gaugeById[s.id] ?? s.gaugesMm[0] ?? 1.25;

  const rangeActive = (k: ScoreKey) => ranges[k][0] > full[k][0] || ranges[k][1] < full[k][1];
  const activeFilterCount =
    brands.size +
    materials.size +
    (shape !== "all" ? 1 : 0) +
    (gaugeFilter !== "all" ? 1 : 0) +
    (fitsMine ? 1 : 0) +
    RANGES.filter((r) => rangeActive(r.key)).length;

  const resetFilters = () => {
    setBrands(new Set());
    setMaterials(new Set());
    setShape("all");
    setGaugeFilter("all");
    setFitsMine(false);
    setRanges(full);
    setQuery("");
  };

  const save = (s: StringProfile) => {
    const t = tensionFor(s);
    const g = gaugeFor(s);
    const o = tensionOutcome(s, t, g);
    setString(s.id, equipmentLabel(s.brand, s.name), {
      tensionLbs: t,
      gaugeMm: g,
      power: o.power,
      spin: o.spin,
      control: o.control,
      comfort: o.comfort,
    });
  };

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-MAX_COMPARE)));

  const select = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) setDetailOpen(true);
  };

  const headerSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" ? 1 : -1 }));

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

      <CheckList
        label="Material"
        items={materialCounts}
        selected={materials}
        onToggle={(m) => setMaterials((p) => toggleInSet(p, m))}
        format={(m) => materialLabel(m as StringProfile["material"])}
      />

      <Segmented<ShapeBand>
        label="Shape"
        value={shape}
        onChange={setShape}
        options={[
          ["all", "Any"],
          ["round", "Round"],
          ["shaped", "Shaped"],
        ]}
      />

      <label className="block">
        <span className="text-[13px] font-medium">Gauge</span>
        <select
          value={gaugeFilter}
          onChange={(e) => setGaugeFilter(e.target.value)}
          className="sf-select mt-2 !h-9 !min-h-9 w-full !text-[13px]"
        >
          <option value="all">Any gauge</option>
          {GAUGE_FILTER_OPTIONS.map((g) => (
            <option key={g} value={String(g)}>
              {g.toFixed(2)} mm · {gaugeLabel(g)}
            </option>
          ))}
        </select>
      </label>

      {myTension != null ? (
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Plays at my {myTension} lbs</span>
          <input
            type="checkbox"
            className="sf-switch"
            checked={fitsMine}
            onChange={(e) => setFitsMine(e.target.checked)}
          />
        </label>
      ) : null}

      {RANGES.map((r) => (
        <RangeFilter
          key={r.key}
          label={r.label}
          unit={r.unit}
          step={r.step}
          dist={dists[r.key]}
          value={ranges[r.key]}
          onChange={(v) => setRanges((prev) => ({ ...prev, [r.key]: v }))}
        />
      ))}

      <CheckList
        label="Brand"
        items={brandCounts}
        selected={brands}
        onToggle={(b) => setBrands((p) => toggleInSet(p, b))}
      />
    </div>
  );

  const detail = selected ? (
    <StringDetail
      key={selected.id}
      string={selected}
      catalog={strings}
      bag={bag}
      bagScores={{
        power: setup.stringPower,
        spin: setup.stringSpin,
        control: setup.stringControl,
        comfort: setup.stringComfort,
        tension: setup.tensionLbs,
        gauge: setup.gaugeMm,
      }}
      inBag={selected.id === bagId}
      inCompare={compare.includes(selected.id)}
      tension={tensionFor(selected)}
      gauge={gaugeFor(selected)}
      onTension={(v) => {
        setTensionById((p) => ({ ...p, [selected.id]: v }));
        if (selected.id === bagId) setTensionStore(v);
      }}
      onGauge={(g) => {
        setGaugeById((p) => ({ ...p, [selected.id]: g }));
        if (selected.id === bagId) setGaugeStore(g);
      }}
      onSave={() => save(selected)}
      onToggleCompare={() => toggleCompare(selected.id)}
      onSelect={(id) => setSelectedId(id)}
    />
  ) : null;

  const compareStrings = compare.map((id) => byId.get(id)).filter((s): s is StringProfile => s != null);
  const compareOutcomes = compareStrings.map((s) => tensionOutcome(s, tensionFor(s), gaugeFor(s)));

  return (
    <div className="sf-explorer">
      <aside className="sf-explorer-filters hidden lg:block" aria-label="Filters">
        {filters}
      </aside>

      <section className="min-w-0" aria-label="Strings">
        <div className="sf-explorer-toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search name, brand, poly 1.25" label="Search strings" />
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="sf-btn sf-btn-secondary !min-h-10 !px-3 !text-[13px]"
            >
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
        </div>

        <SortControls
          count={filtered.length}
          total={strings.length}
          noun="strings"
          sort={sort}
          options={SORTS}
          onChange={setSort}
        />

        <div className="sf-rtable mt-3" role="table" aria-label="String results">
          <div className="sf-rtable-head" role="row">
            <span role="columnheader" />
            <SortHeader label="String" k="name" sort={sort} onSort={headerSort} align="left" />
            <SortHeader label="Power" k="power" sort={sort} onSort={headerSort} />
            <SortHeader label="Spin" k="spin" sort={sort} onSort={headerSort} />
            <SortHeader label="Ctrl" k="control" sort={sort} onSort={headerSort} title="Control" />
            <SortHeader label="Comf" k="comfort" sort={sort} onSort={headerSort} title="Comfort" />
            <SortHeader label="Dur" k="durability" sort={sort} onSort={headerSort} title="Durability" />
            <SortHeader label="Hold" k="tensionMaintenance" sort={sort} onSort={headerSort} title="Holds tension" />
          </div>
          {filtered.map((s) => {
            const isSel = s.id === selected?.id;
            return (
              <div
                key={s.id}
                role="row"
                aria-selected={isSel}
                className="sf-rtable-row"
                data-selected={isSel}
                onClick={() => select(s.id)}
              >
                <span role="cell" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="sf-check !h-3.5 !w-3.5"
                    checked={compare.includes(s.id)}
                    onChange={() => toggleCompare(s.id)}
                    aria-label={`Compare ${s.brand} ${s.name}`}
                  />
                </span>
                <span role="cell" className="flex min-w-0 items-center gap-3">
                  <GearImg src={stringImageUrl(s)} className="h-9 w-9 shrink-0 object-contain" />
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-baseline text-[13.5px] font-medium">
                      <span className="truncate">{s.name}</span>
                      {s.id === bagId ? <InBagTag /> : null}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">
                      {s.brand} · {MATERIAL_SHORT[s.material]}
                      {s.shape !== "round" ? ` · ${shapeLabel(s.shape).toLowerCase()}` : ""}
                    </span>
                    <span className="sf-rt-inline block truncate text-[11.5px] text-[var(--muted)] tabular-nums">
                      Power {s.power} · Spin {s.spin} · Control {s.control} · Comfort {s.comfort}
                    </span>
                  </span>
                </span>
                <NumCell v={s.power} />
                <NumCell v={s.spin} />
                <NumCell v={s.control} />
                <NumCell v={s.comfort} />
                <NumCell v={s.durability} />
                <NumCell v={s.tensionMaintenance} />
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-[14px] font-medium">No strings match</p>
              <p className="mt-1 text-[13px] text-[var(--muted)]">Widen a range or clear a filter.</p>
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
        <p className="mt-2 text-[11.5px] text-[var(--muted)]">
          Scores are 0 to 100 at the suggested tension and middle gauge. Pick a string to tune both.
        </p>
      </section>

      <aside className="sf-explorer-detail hidden lg:block" aria-label="Selected string">
        {detail ?? <p className="text-[13px] text-[var(--muted)]">Select a string to see its specs.</p>}
      </aside>

      <CompareTray
        items={compareStrings.map((s) => ({ id: s.id, label: s.name }))}
        onRemove={toggleCompare}
        onOpen={() => setCompareOpen(true)}
      />

      {compareOpen && compareStrings.length >= 2 ? (
        <Portal>
          <SpecCompareSheet
            noun="strings"
            items={compareStrings.map((s) => ({
              id: s.id,
              kicker: s.brand,
              title: s.name,
              note: `at ${tensionFor(s)} lbs · ${gaugeFor(s).toFixed(2)} mm`,
              image: stringImageUrl(s),
              inBag: s.id === bagId,
            }))}
            groups={[
              {
                label: "At your tension and gauge",
                rows: (["power", "spin", "control", "comfort", "durability"] as const).map((k) => ({
                  label: k[0].toUpperCase() + k.slice(1),
                  values: compareOutcomes.map((o) => o[k]),
                  best: "high" as const,
                  bar: true,
                })),
              },
              {
                label: "Specs",
                rows: [
                  {
                    label: "Holds tension",
                    values: compareStrings.map((s) => s.tensionMaintenance),
                    best: "high",
                    bar: true,
                  },
                  { label: "Stiffness", values: compareOutcomes.map((o) => o.stiffness), bar: true },
                  { label: "Material", values: compareStrings.map((s) => materialLabel(s.material)) },
                  { label: "Shape", values: compareStrings.map((s) => shapeLabel(s.shape)) },
                  {
                    label: "Gauges",
                    values: compareStrings.map((s) => s.gaugesMm.map((g) => g.toFixed(2)).join(", ")),
                  },
                  {
                    label: "Tension range",
                    values: compareStrings.map((s) => `${s.tensionRangeLbs[0]}–${s.tensionRangeLbs[1]} lbs`),
                  },
                ],
              },
            ]}
            onClose={() => setCompareOpen(false)}
            onRemove={toggleCompare}
            onSave={(id) => {
              const s = byId.get(id);
              if (s) save(s);
            }}
          />
        </Portal>
      ) : null}

      {filtersOpen ? (
        <MobileSheet
          label="Filters"
          onClose={() => setFiltersOpen(false)}
          footer={
            <button type="button" onClick={() => setFiltersOpen(false)} className="sf-btn sf-btn-primary w-full">
              Show {filtered.length} strings
            </button>
          }
        >
          {filters}
        </MobileSheet>
      ) : null}

      {detailOpen && detail ? (
        <MobileSheet label="String details" onClose={() => setDetailOpen(false)}>
          {detail}
        </MobileSheet>
      ) : null}
    </div>
  );
}

type DetailTab = "specs" | "tension" | "similar" | "bag";

function StringDetail({
  string: s,
  catalog,
  bag,
  bagScores,
  inBag,
  inCompare,
  tension,
  gauge,
  onTension,
  onGauge,
  onSave,
  onToggleCompare,
  onSelect,
}: {
  string: StringProfile;
  catalog: StringProfile[];
  bag: StringProfile | null;
  bagScores: {
    power: number | null;
    spin: number | null;
    control: number | null;
    comfort: number | null;
    tension: number | null;
    gauge: number | null;
  };
  inBag: boolean;
  inCompare: boolean;
  tension: number;
  gauge: number;
  onTension: (v: number) => void;
  onGauge: (g: number) => void;
  onSave: () => void;
  onToggleCompare: () => void;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<DetailTab>("specs");
  const [copied, setCopied] = useState<string | null>(null);
  const o = useMemo(() => tensionOutcome(s, tension, gauge), [s, tension, gauge]);
  const intel = useMemo(() => analyzeString(s), [s]);
  const similar = useMemo(() => findSimilarStrings(s, catalog, { limit: 6 }), [s, catalog]);
  const bagO = useMemo(
    () => (bag ? tensionOutcome(bag, bagScores.tension ?? bag.recommendedTensionLbs, bagScores.gauge ?? undefined) : null),
    [bag, bagScores.tension, bagScores.gauge],
  );
  const [lo, hi] = s.tensionRangeLbs;
  const showBag = bag != null && !inBag;
  const tabs: { id: DetailTab; label: string }[] = [
    { id: "specs", label: "Specs" },
    { id: "tension", label: "Tension" },
    { id: "similar", label: "Similar" },
    ...(showBag ? [{ id: "bag" as const, label: "Vs your string" }] : []),
  ];
  const active = tabs.some((t) => t.id === tab) ? tab : "specs";
  const setT = (v: number) => {
    if (Number.isFinite(v)) onTension(Math.max(lo, Math.min(hi, Math.round(v * 2) / 2)));
  };

  return (
    <article className="flex flex-col" aria-label={`${s.brand} ${s.name}`}>
      <div className="flex gap-4">
        <div className="sf-thumb-well flex h-28 w-28 shrink-0 items-center justify-center rounded-[var(--radius)]">
          <GearImg src={stringImageUrl(s)} className="h-24 w-24 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="sf-spec-label">
            {s.brand} · {materialLabel(s.material)}
          </p>
          <h2 className="mt-1 text-[1.4rem] leading-tight font-semibold tracking-[-0.025em]">{s.name}</h2>
          <p className="mt-1.5 text-[13px] text-[var(--muted)]">{s.feel}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              className={`sf-btn !min-h-9 !px-3 !text-[13px] ${inBag ? "sf-btn-secondary" : "sf-btn-primary"}`}
            >
              {inBag ? "✓ In your bag" : "Add to bag"}
            </button>
            <button
              type="button"
              onClick={onToggleCompare}
              aria-pressed={inCompare}
              className="sf-btn sf-btn-secondary !min-h-9 !px-3 !text-[13px]"
            >
              {inCompare ? "✓ Comparing" : "Compare"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-sunken)] p-3">
        {s.gaugesMm.length > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="sf-spec-label">Gauge</span>
            <div className="sf-segmented" role="radiogroup" aria-label="Gauge">
              {s.gaugesMm.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={g === gauge}
                  onClick={() => onGauge(g)}
                  className="sf-readout !px-2"
                  title={gaugeLabel(g)}
                >
                  {g.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="sf-spec-label">Tension</span>
            <span className="flex items-center gap-1.5">
              <input
                type="number"
                min={lo}
                max={hi}
                step={0.5}
                value={tension}
                onChange={(e) => setT(parseFloat(e.target.value))}
                className="sf-input sf-readout !h-8 !min-h-8 w-[4.5rem] !px-2 text-right !text-[13px]"
                aria-label="Tension in pounds"
              />
              <span className="text-[12px] text-[var(--muted)]">lbs</span>
            </span>
          </div>
          <input
            type="range"
            min={lo}
            max={hi}
            step={0.5}
            value={tension}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
            aria-label="Tension slider"
          />
          <div className="flex justify-between font-[family-name:var(--font-mono)] text-[10.5px] text-[var(--muted)]">
            <span>{lo}</span>
            <span>suggested {s.recommendedTensionLbs}</span>
            <span>{hi}</span>
          </div>
        </div>
      </div>

      <DetailTabs tabs={tabs} active={active} onChange={setTab} label="String details" />

      <div className="pt-4" role="tabpanel">
        {active === "specs" ? (
          <div className="space-y-5">
            <div>
              <p className="sf-spec-label">
                At {tension} lbs · {gauge.toFixed(2)} mm
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
                <Bar label="Power" value={o.power} />
                <Bar label="Spin" value={o.spin} />
                <Bar label="Control" value={o.control} />
                <Bar label="Comfort" value={o.comfort} />
                <Bar label="Durability" value={o.durability} />
                <Bar label="Holds tension" value={s.tensionMaintenance} />
                <Bar label="Stiffness" value={o.stiffness} hint="Higher feels firmer and more direct" />
              </div>
            </div>
            <SpecList
              rows={[
                ["Material", materialLabel(s.material)],
                ["Shape", shapeLabel(s.shape)],
                [
                  "Gauges",
                  <span key="g" className="sf-readout">
                    {s.gaugesMm.map((g) => `${g.toFixed(2)} (${gaugeLabel(g)})`).join(", ")}
                  </span>,
                ],
                [
                  "Tension",
                  <span key="t" className="sf-readout">
                    {lo}–{hi} lbs · suggested {s.recommendedTensionLbs}
                  </span>,
                ],
                ["Type", intel.familyRole],
                ["Best for", s.bestFor],
                ["Frame match", intel.bestFrameMatch],
              ]}
            />
            {s.notes ? <p className="text-[13px] leading-relaxed text-[var(--muted)]">{s.notes}</p> : null}
          </div>
        ) : null}

        {active === "tension" ? (
          <div className="space-y-4">
            <TensionChart string={s} tension={tension} gaugeMm={gauge} />
            <p className="-mt-1 text-[11.5px] text-[var(--muted)]">
              <span className="text-[var(--accent)]">Blue line</span>: your tension. Dotted: suggested. Drag the
              slider above to move it.
            </p>
            <dl className="grid grid-cols-4 gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)]">
              {(
                [
                  ["Power", o.power],
                  ["Spin", o.spin],
                  ["Control", o.control],
                  ["Comfort", o.comfort],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="bg-[var(--panel)] px-2.5 py-2">
                  <dt className="sf-spec-label">{k}</dt>
                  <dd className="sf-readout mt-1 text-[15px]">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="space-y-1.5 text-[13px] leading-relaxed">
              <li>{o.dwellHint}</li>
              <li className="text-[var(--muted)]">{o.launchHint}</li>
              <li className="text-[var(--muted)]">{o.gaugeHint}</li>
            </ul>
          </div>
        ) : null}

        {active === "similar" ? (
          similar.length === 0 ? (
            <p className="text-[13px] text-[var(--muted)]">Nothing in the catalog plays close to this one.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {similar.map((a) => (
                <li key={a.string.id} className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSelect(a.string.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left hover:text-[var(--accent)]"
                  >
                    <span className="sf-readout w-8 shrink-0 text-[13px]">{a.score}%</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">{a.string.name}</span>
                      <span className="block truncate text-[12px] text-[var(--muted)]">
                        {a.string.brand} · {a.why}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(a.shopQuery);
                      setCopied(a.string.id);
                    }}
                    className="shrink-0 text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    {copied === a.string.id ? "Copied" : "Copy name"}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {active === "bag" && bag ? (
          <div className="space-y-2">
            <p className="text-[12.5px] text-[var(--muted)]">
              Against {bag.brand} {bag.name}
              {bagScores.tension != null ? ` at ${bagScores.tension} lbs` : ""}.
            </p>
            <DeltaTable
              rows={[
                { label: "Power", yours: bagScores.power ?? bagO?.power ?? null, mine: o.power },
                { label: "Spin", yours: bagScores.spin ?? bagO?.spin ?? null, mine: o.spin },
                { label: "Control", yours: bagScores.control ?? bagO?.control ?? null, mine: o.control },
                { label: "Comfort", yours: bagScores.comfort ?? bagO?.comfort ?? null, mine: o.comfort },
                { label: "Durability", yours: bagO?.durability ?? null, mine: o.durability },
                { label: "Holds tension", yours: bag.tensionMaintenance, mine: s.tensionMaintenance },
                { label: "Tension", yours: bagScores.tension, mine: tension, unit: "lbs", digits: 1 },
                { label: "Gauge", yours: bagScores.gauge, mine: gauge, unit: "mm", digits: 2 },
              ]}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
