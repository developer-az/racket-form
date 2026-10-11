"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { EquipmentTab, GripProfile } from "@/types/equipment";
import { matchesEquipmentSearch, searchMatchScore } from "@/lib/equipment/search";
import { gripImageUrl } from "@/lib/equipment/media/urls";
import { equipmentLabel } from "@/lib/equipment/labels";
import { GRIP_SIZES, type GripSizeCode } from "@/lib/equipment/gripSize";
import {
  MAX_OVERGRIPS,
  canAddGripLayer,
  gripStackEffect,
  type GripLayer,
} from "@/lib/equipment/gripStack";
import { distribution, type Distribution } from "@/lib/equipment/catalogStats";
import { useGearStore } from "@/store/gearStore";
import { RangeFilter } from "./explorer/RangeFilter";
import { Bar } from "./explorer/RacketDetail";
import { GearImg } from "./explorer/GearImg";
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

type ScoreKey = "tackiness" | "cushion" | "absorbency" | "durability" | "thicknessMm";
type SortKey = "relevance" | "name" | ScoreKey | "kind";
type Ranges = Record<ScoreKey, [number, number]>;
type Kind = "all" | GripProfile["kind"];

const RANGES: { key: ScoreKey; label: string; unit?: string; step?: number; digits?: number }[] = [
  { key: "tackiness", label: "Tack" },
  { key: "cushion", label: "Cushion" },
  { key: "absorbency", label: "Sweat absorption" },
  { key: "durability", label: "Durability" },
  { key: "thicknessMm", label: "Thickness", unit: "mm", step: 0.05, digits: 2 },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "tackiness", label: "Tack" },
  { id: "cushion", label: "Cushion" },
  { id: "absorbency", label: "Sweat absorption" },
  { id: "durability", label: "Durability" },
  { id: "thicknessMm", label: "Thickness" },
];

const kindLabel = (k: GripProfile["kind"]) => (k === "overgrip" ? "Overgrip" : "Replacement");
const textureLabel = (t: string) => (t === "dry-tack" ? "Dry tack" : t[0].toUpperCase() + t.slice(1));

export function GripExplorer({
  grips,
  onSelectTab,
}: {
  grips: GripProfile[];
  onSelectTab?: (tab: EquipmentTab) => void;
}) {
  void onSelectTab;
  const setup = useGearStore((s) => s.setup);
  const layers = useMemo(() => setup.gripLayers ?? [], [setup.gripLayers]);
  const setGrip = useGearStore((s) => s.setGrip);
  const addGripLayer = useGearStore((s) => s.addGripLayer);
  const removeGripLayerAt = useGearStore((s) => s.removeGripLayerAt);
  const clearGripLayers = useGearStore((s) => s.clearGripLayers);
  const setGripSize = useGearStore((s) => s.setGripSize);

  const dists = useMemo(
    () =>
      Object.fromEntries(RANGES.map((r) => [r.key, distribution(grips.map((g) => g[r.key]), 16)])) as Record<
        ScoreKey,
        Distribution
      >,
    [grips],
  );
  const full = useMemo(
    () => Object.fromEntries(RANGES.map((r) => [r.key, [dists[r.key].min, dists[r.key].max]])) as Ranges,
    [dists],
  );

  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [textures, setTextures] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<Kind>("all");
  const [ranges, setRanges] = useState<Ranges>(full);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "name", dir: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(
    () => layers[layers.length - 1]?.id ?? setup.gripId ?? null,
  );
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const brandCounts = useMemo(() => countBy(grips, (g) => g.brand), [grips]);
  const textureCounts = useMemo(() => countBy(grips, (g) => g.texture), [grips]);
  const stackFx = useMemo(() => gripStackEffect(layers, grips, setup.gripSize), [layers, grips, setup.gripSize]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim();
    const list = grips.filter((g) => {
      if (brands.size > 0 && !brands.has(g.brand)) return false;
      if (textures.size > 0 && !textures.has(g.texture)) return false;
      if (kind !== "all" && g.kind !== kind) return false;
      for (const r of RANGES) {
        const [lo, hi] = ranges[r.key];
        if (g[r.key] < lo - 1e-9 || g[r.key] > hi + 1e-9) return false;
      }
      if (!q) return true;
      return matchesEquipmentSearch(q, g.brand, g.name, g.texture, g.bestFor, g.uniqueTrait, g.kind);
    });
    const key: SortKey = q && sort.key === "name" ? "relevance" : sort.key;
    return list.sort((a, b) => {
      if (key === "relevance") {
        return (
          searchMatchScore(q, b.brand, b.name, b.id) - searchMatchScore(q, a.brand, a.name, a.id) ||
          a.name.localeCompare(b.name)
        );
      }
      if (key === "name") return (a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)) * sort.dir;
      if (key === "kind") return a.kind.localeCompare(b.kind) * sort.dir || a.name.localeCompare(b.name);
      return (a[key] - b[key]) * sort.dir || a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
    });
  }, [grips, deferredQuery, brands, textures, kind, ranges, sort]);

  const byId = useMemo(() => new Map(grips.map((g) => [g.id, g])), [grips]);
  const selected = (selectedId ? byId.get(selectedId) : null) ?? filtered[0] ?? null;
  const inStackIds = new Set(layers.map((l) => l.id));

  const rangeActive = (k: ScoreKey) => ranges[k][0] > full[k][0] || ranges[k][1] < full[k][1];
  const activeFilterCount =
    brands.size + textures.size + (kind !== "all" ? 1 : 0) + RANGES.filter((r) => rangeActive(r.key)).length;

  const resetFilters = () => {
    setBrands(new Set());
    setTextures(new Set());
    setKind("all");
    setRanges(full);
    setQuery("");
  };

  const replaceStack = (g: GripProfile) =>
    setGrip(g.id, equipmentLabel(g.brand, g.name), {
      tackiness: g.tackiness,
      cushion: g.cushion,
      absorbency: g.absorbency,
      durability: g.durability,
      kind: g.kind,
    });

  const addLayer = (g: GripProfile) => {
    if (layers.length === 0) return replaceStack(g);
    if (!canAddGripLayer(layers, g.kind)) return;
    addGripLayer(
      { id: g.id, label: equipmentLabel(g.brand, g.name), kind: g.kind },
      { tackiness: g.tackiness, cushion: g.cushion, absorbency: g.absorbency, durability: g.durability },
    );
  };

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-MAX_COMPARE)));

  const select = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) setDetailOpen(true);
  };

  const headerSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" || key === "kind" ? 1 : -1 },
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

      <Segmented<Kind>
        label="Kind"
        value={kind}
        onChange={setKind}
        options={[
          ["all", "Any"],
          ["overgrip", "Overgrip"],
          ["replacement", "Replacement"],
        ]}
      />

      {RANGES.map((r) => (
        <RangeFilter
          key={r.key}
          label={r.label}
          unit={r.unit}
          step={r.step}
          dist={dists[r.key]}
          value={ranges[r.key]}
          format={r.digits ? (v) => v.toFixed(r.digits) : undefined}
          onChange={(v) => setRanges((prev) => ({ ...prev, [r.key]: v }))}
        />
      ))}

      <CheckList
        label="Texture"
        items={textureCounts}
        selected={textures}
        onToggle={(t) => setTextures((p) => toggleInSet(p, t))}
        format={textureLabel}
      />

      <CheckList label="Brand" items={brandCounts} selected={brands} onToggle={(b) => setBrands((p) => toggleInSet(p, b))} />
    </div>
  );

  const detail = selected ? (
    <GripDetail
      key={selected.id}
      grip={selected}
      layers={layers}
      gripSize={setup.gripSize}
      stackFx={stackFx}
      baseline={{
        tackiness: setup.gripTackiness ?? (layers.length ? stackFx.tackiness : null),
        cushion: setup.gripCushion ?? (layers.length ? stackFx.cushion : null),
        absorbency: setup.gripAbsorbency ?? (layers.length ? stackFx.absorbency : null),
        durability: setup.gripDurability ?? (layers.length ? stackFx.durability : null),
      }}
      inCompare={compare.includes(selected.id)}
      onAdd={() => addLayer(selected)}
      onReplace={() => replaceStack(selected)}
      onToggleCompare={() => toggleCompare(selected.id)}
      onRemoveLayer={removeGripLayerAt}
      onClearStack={clearGripLayers}
      onGripSize={setGripSize}
    />
  ) : null;

  const compareGrips = compare.map((id) => byId.get(id)).filter((g): g is GripProfile => g != null);

  return (
    <div className="sf-explorer">
      <aside className="sf-explorer-filters hidden lg:block" aria-label="Filters">
        {filters}
      </aside>

      <section className="min-w-0" aria-label="Grips">
        <div className="sf-explorer-toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search grips" label="Search grips" />
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
          total={grips.length}
          noun="grips"
          sort={sort}
          options={SORTS}
          onChange={setSort}
        />

        <div className="sf-rtable mt-3" role="table" aria-label="Grip results">
          <div className="sf-rtable-head" role="row">
            <span role="columnheader" />
            <SortHeader label="Grip" k="name" sort={sort} onSort={headerSort} align="left" />
            <SortHeader label="Tack" k="tackiness" sort={sort} onSort={headerSort} />
            <SortHeader label="Cush" k="cushion" sort={sort} onSort={headerSort} title="Cushion" />
            <SortHeader label="Abs" k="absorbency" sort={sort} onSort={headerSort} title="Sweat absorption" />
            <SortHeader label="Dur" k="durability" sort={sort} onSort={headerSort} title="Durability" />
            <SortHeader label="mm" k="thicknessMm" sort={sort} onSort={headerSort} title="Thickness" />
            <SortHeader label="Kind" k="kind" sort={sort} onSort={headerSort} />
          </div>
          {filtered.map((g) => {
            const isSel = g.id === selected?.id;
            return (
              <div
                key={g.id}
                role="row"
                aria-selected={isSel}
                className="sf-rtable-row"
                data-selected={isSel}
                onClick={() => select(g.id)}
              >
                <span role="cell" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="sf-check !h-3.5 !w-3.5"
                    checked={compare.includes(g.id)}
                    onChange={() => toggleCompare(g.id)}
                    aria-label={`Compare ${g.brand} ${g.name}`}
                  />
                </span>
                <span role="cell" className="flex min-w-0 items-center gap-3">
                  <GearImg src={gripImageUrl(g)} className="h-9 w-9 shrink-0 object-contain" />
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-baseline text-[13.5px] font-medium">
                      <span className="truncate">{g.name}</span>
                      {inStackIds.has(g.id) ? <InBagTag /> : null}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">
                      {g.brand} · {textureLabel(g.texture).toLowerCase()}
                      <span className="sf-rt-inline">{` · ${g.kind === "overgrip" ? "overgrip" : "replacement"}`}</span>
                    </span>
                    <span className="sf-rt-inline block truncate text-[11.5px] text-[var(--muted)] tabular-nums">
                      Tack {g.tackiness} · Cushion {g.cushion} · Dur {g.durability} · {g.thicknessMm.toFixed(2)} mm
                    </span>
                  </span>
                </span>
                <NumCell v={g.tackiness} />
                <NumCell v={g.cushion} />
                <NumCell v={g.absorbency} />
                <NumCell v={g.durability} />
                <NumCell v={g.thicknessMm} digits={2} />
                <span role="cell" className="sf-rt-num text-right text-[12.5px] text-[var(--muted)]">
                  {g.kind === "overgrip" ? "Over" : "Repl."}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-[14px] font-medium">No grips match</p>
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
          Tack, cushion, sweat absorption and durability are 0 to 100. Thickness is per layer.
        </p>
      </section>

      <aside className="sf-explorer-detail hidden lg:block" aria-label="Selected grip">
        {detail ?? <p className="text-[13px] text-[var(--muted)]">Select a grip to see its specs.</p>}
      </aside>

      <CompareTray
        items={compareGrips.map((g) => ({ id: g.id, label: g.name }))}
        onRemove={toggleCompare}
        onOpen={() => setCompareOpen(true)}
      />

      {compareOpen && compareGrips.length >= 2 ? (
        <Portal>
          <SpecCompareSheet
            noun="grips"
            items={compareGrips.map((g) => ({
              id: g.id,
              kicker: g.brand,
              title: g.name,
              note: kindLabel(g.kind),
              image: gripImageUrl(g),
              inBag: inStackIds.has(g.id),
            }))}
            groups={[
              {
                label: "Feel",
                rows: [
                  { label: "Tack", values: compareGrips.map((g) => g.tackiness), best: "high", bar: true },
                  { label: "Cushion", values: compareGrips.map((g) => g.cushion), best: "high", bar: true },
                  { label: "Sweat absorption", values: compareGrips.map((g) => g.absorbency), best: "high", bar: true },
                  { label: "Durability", values: compareGrips.map((g) => g.durability), best: "high", bar: true },
                ],
              },
              {
                label: "Specs",
                rows: [
                  { label: "Thickness mm", values: compareGrips.map((g) => g.thicknessMm), digits: 2 },
                  { label: "Kind", values: compareGrips.map((g) => kindLabel(g.kind)) },
                  { label: "Texture", values: compareGrips.map((g) => textureLabel(g.texture)) },
                ],
              },
            ]}
            onClose={() => setCompareOpen(false)}
            onRemove={toggleCompare}
            onSave={(id) => {
              const g = byId.get(id);
              if (g) replaceStack(g);
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
              Show {filtered.length} grips
            </button>
          }
        >
          {filters}
        </MobileSheet>
      ) : null}

      {detailOpen && detail ? (
        <MobileSheet label="Grip details" onClose={() => setDetailOpen(false)}>
          {detail}
        </MobileSheet>
      ) : null}
    </div>
  );
}

type DetailTab = "specs" | "handle" | "vs";
type StackFx = ReturnType<typeof gripStackEffect>;

function GripDetail({
  grip: g,
  layers,
  gripSize,
  stackFx,
  baseline,
  inCompare,
  onAdd,
  onReplace,
  onToggleCompare,
  onRemoveLayer,
  onClearStack,
  onGripSize,
}: {
  grip: GripProfile;
  layers: GripLayer[];
  gripSize: GripSizeCode | null;
  stackFx: StackFx;
  baseline: { tackiness: number | null; cushion: number | null; absorbency: number | null; durability: number | null };
  inCompare: boolean;
  onAdd: () => void;
  onReplace: () => void;
  onToggleCompare: () => void;
  onRemoveLayer: (i: number) => void;
  onClearStack: () => void;
  onGripSize: (s: GripSizeCode | null) => void;
}) {
  const [tab, setTab] = useState<DetailTab>("specs");
  const inStack = layers.some((l) => l.id === g.id);
  const canAdd = layers.length > 0 && canAddGripLayer(layers, g.kind);
  const hasBaseline = baseline.tackiness != null;
  const tabs: { id: DetailTab; label: string }[] = [
    { id: "specs", label: "Specs" },
    { id: "handle", label: "Your handle" },
    ...(hasBaseline && !(inStack && layers.length === 1) ? [{ id: "vs" as const, label: "Vs your grip" }] : []),
  ];
  const active = tabs.some((t) => t.id === tab) ? tab : "specs";

  let primary: { label: string; onClick?: () => void; done?: boolean };
  if (layers.length === 0) primary = { label: "Add to bag", onClick: onReplace };
  else if (canAdd) primary = { label: inStack ? "Add another layer" : "Add as a layer", onClick: onAdd };
  else if (inStack) primary = { label: "✓ On your handle", done: true };
  else primary = { label: "Replace your grip", onClick: onReplace };

  return (
    <article className="flex flex-col" aria-label={`${g.brand} ${g.name}`}>
      <div className="flex gap-4">
        <div className="sf-thumb-well flex h-28 w-28 shrink-0 items-center justify-center rounded-[var(--radius)]">
          <GearImg src={gripImageUrl(g)} className="h-24 w-24 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="sf-spec-label">
            {g.brand} · {kindLabel(g.kind)}
          </p>
          <h2 className="mt-1 text-[1.4rem] leading-tight font-semibold tracking-[-0.025em]">{g.name}</h2>
          <p className="mt-1.5 text-[13px] text-[var(--muted)]">{g.uniqueTrait}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={primary.onClick}
              disabled={primary.done}
              className={`sf-btn !min-h-9 !px-3 !text-[13px] ${primary.done ? "sf-btn-secondary" : "sf-btn-primary"}`}
            >
              {primary.label}
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
          {canAdd ? (
            <button
              type="button"
              onClick={onReplace}
              className="mt-2 text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Or use it on its own
            </button>
          ) : null}
        </div>
      </div>

      <DetailTabs tabs={tabs} active={active} onChange={setTab} label="Grip details" />

      <div className="pt-4" role="tabpanel">
        {active === "specs" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Bar label="Tack" value={g.tackiness} />
              <Bar label="Cushion" value={g.cushion} />
              <Bar label="Sweat absorption" value={g.absorbency} />
              <Bar label="Durability" value={g.durability} />
            </div>
            <SpecList
              rows={[
                ["Kind", kindLabel(g.kind)],
                ["Texture", textureLabel(g.texture)],
                ["Thickness", <span key="t" className="sf-readout">{g.thicknessMm.toFixed(2)} mm</span>],
                ["Feel", g.feel],
                ["Best for", g.bestFor],
              ]}
            />
            {g.notes ? <p className="text-[13px] leading-relaxed text-[var(--muted)]">{g.notes}</p> : null}
          </div>
        ) : null}

        {active === "handle" ? (
          <div className="space-y-5">
            <div>
              <p className="sf-spec-label">Handle size</p>
              <div className="sf-segmented mt-2 w-full [&>button]:flex-1" role="radiogroup" aria-label="Handle size">
                {GRIP_SIZES.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    role="radio"
                    aria-checked={gripSize === s.code}
                    title={`${s.label}. ${s.hint}`}
                    onClick={() => onGripSize(gripSize === s.code ? null : s.code)}
                    className="sf-readout"
                  >
                    {s.code}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] text-[var(--muted)]">
                {gripSize
                  ? `${GRIP_SIZES.find((x) => x.code === gripSize)?.label}. Printed on the butt cap.`
                  : "Printed on the butt cap. Pick yours."}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="sf-spec-label">Layers, inside out</p>
                {layers.length > 0 ? (
                  <button
                    type="button"
                    onClick={onClearStack}
                    className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {layers.length === 0 ? (
                <p className="mt-2 text-[13px] text-[var(--muted)]">Nothing saved yet. Add a grip to start.</p>
              ) : (
                <ol className="mt-2 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {layers.map((l, i) => (
                    <li key={`${l.id}-${i}`} className="flex items-center gap-3 py-2 text-[13px]">
                      <span className="sf-readout w-4 shrink-0 text-[var(--muted)]">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {l.label}
                        <span className="text-[var(--muted)]"> · {l.kind === "overgrip" ? "overgrip" : "replacement"}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveLayer(i)}
                        className="shrink-0 text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
                        aria-label={`Remove ${l.label}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {layers.length > 0 ? (
              <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)]">
                {[
                  ["Build", `${stackFx.thicknessMm.toFixed(2)} mm`],
                  ["Size", gripSize ?? "—"],
                  ["Overgrips", `${stackFx.overgripCount}/${MAX_OVERGRIPS}`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[var(--panel)] px-3 py-2.5">
                    <dt className="sf-spec-label">{k}</dt>
                    <dd className="sf-readout mt-1 text-[15px]">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {layers.length > 0 ? (
              <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">{stackFx.buildNote}</p>
            ) : null}
          </div>
        ) : null}

        {active === "vs" ? (
          <DeltaTable
            rows={[
              { label: "Tack", yours: baseline.tackiness, mine: g.tackiness },
              { label: "Cushion", yours: baseline.cushion, mine: g.cushion },
              { label: "Sweat absorption", yours: baseline.absorbency, mine: g.absorbency },
              { label: "Durability", yours: baseline.durability, mine: g.durability },
            ]}
          />
        ) : null}
      </div>
    </article>
  );
}
