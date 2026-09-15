"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { PaddleProfile, PlayBias } from "@/types/pickleball";
import { AisleChip, ChipRow, ProductCard, SearchField } from "@/components/gear/CatalogShop";
import { brandAccent } from "@/lib/equipment/media/brandColors";
import { hasExternalPaddlePhoto, paddleImageUrl, photoFirst } from "@/lib/pickleball/media";
import { PaddleInspector } from "./PaddleInspector";

const BIAS_LABEL: Record<PlayBias, string> = {
  control: "Control",
  power: "Power",
  "all-court": "All-court",
  spin: "Spin",
};

const PAGE_SIZE = 24;

function tierBadge(p: PaddleProfile) {
  if (p.catalogTier === "lab-measured") return "Lab";
  if (p.catalogTier === "tour-seed") return "Tour seed";
  return undefined;
}

export function PaddleTechPanel({
  paddles,
  selectedId,
  onSelect,
}: {
  paddles: PaddleProfile[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [bias, setBias] = useState<"all" | PlayBias>("all");
  const [brand, setBrand] = useState<"all" | string>("all");
  const [tier, setTier] = useState<"all" | "lab-measured" | "tour-seed">("all");
  const [localId, setLocalId] = useState(selectedId || paddles[0]?.id || "");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const activeId = selectedId || localId;

  const brands = useMemo(() => {
    const set = new Set(paddles.map((p) => p.brand));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [paddles]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = paddles.filter((p) => {
      if (bias !== "all" && p.bias !== bias) return false;
      if (brand !== "all" && p.brand !== brand) return false;
      if (tier !== "all" && (p.catalogTier ?? "tour-seed") !== tier) return false;
      if (!q) return true;
      const hay = [
        p.brand,
        p.name,
        p.core,
        p.face,
        p.texture,
        p.bestFor,
        p.uniqueTrait,
        p.bias,
        p.tourPresence ?? "",
        p.thicknessMm != null ? `${p.thicknessMm}mm` : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    return [...list].sort((a, b) =>
      photoFirst(hasExternalPaddlePhoto(a.id), hasExternalPaddlePhoto(b.id)),
    );
  }, [paddles, deferredQuery, bias, brand, tier]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredQuery, bias, brand, tier]);

  const shown = filtered.slice(0, visibleCount);
  const selected =
    paddles.find((p) => p.id === activeId) ?? filtered[0] ?? paddles[0] ?? null;

  const selectPaddle = (id: string) => {
    setLocalId(id);
    onSelect?.(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  };

  const setFilter = <T,>(setter: (v: T) => void, value: T) => {
    startTransition(() => setter(value));
  };

  const labCount = paddles.filter((p) => p.catalogTier === "lab-measured").length;
  const tourCount = paddles.length - labCount;

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-6">
      <section className="order-1 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="sf-kicker sf-kicker-muted">Catalog</p>
            <h2 className="sf-section-title mt-1">Paddles players actually use</h2>
            <p className="mt-1 max-w-xl text-xs text-[var(--muted)]">
              {paddles.length} paddles · {labCount} lab-measured · {tourCount} tour-seed. Select a
              paddle — how-to-play stays beside the grid.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Brand, thickness, bias…"
              label="Search paddles"
            />
          </div>
        </div>

        <div className="space-y-3">
          <ChipRow label="Source">
            <AisleChip label="All" active={tier === "all"} onClick={() => setFilter(setTier, "all")} />
            <AisleChip
              label={`Lab (${labCount})`}
              active={tier === "lab-measured"}
              onClick={() => setFilter(setTier, "lab-measured")}
            />
            <AisleChip
              label={`Tour seed (${tourCount})`}
              active={tier === "tour-seed"}
              onClick={() => setFilter(setTier, "tour-seed")}
            />
          </ChipRow>

          <ChipRow label="Play bias">
            <AisleChip label="All" active={bias === "all"} onClick={() => setFilter(setBias, "all")} />
            {(Object.keys(BIAS_LABEL) as PlayBias[]).map((b) => (
              <AisleChip
                key={b}
                label={BIAS_LABEL[b]}
                active={bias === b}
                onClick={() => setFilter(setBias, b)}
              />
            ))}
          </ChipRow>

          <ChipRow label="Brand">
            <AisleChip
              label="All"
              active={brand === "all"}
              onClick={() => setFilter(setBrand, "all")}
            />
            {brands.map((b) => (
              <AisleChip
                key={b}
                label={b}
                active={brand === b}
                onClick={() => setFilter(setBrand, b)}
              />
            ))}
          </ChipRow>
        </div>

        <p className="text-[11px] tracking-wide text-[var(--muted)]">
          Showing {shown.length} of {filtered.length}
          {filtered.length !== paddles.length ? ` · filtered from ${paddles.length}` : ""}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((p) => {
            const accent = brandAccent(p.brand);
            const active = selected?.id === p.id;
            const meta = [
              `${p.weightOz.toFixed(1)} oz`,
              p.thicknessMm != null ? `${p.thicknessMm}mm` : null,
              p.swingweight != null ? `SW ${p.swingweight}` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <ProductCard
                key={p.id}
                image={paddleImageUrl(p)}
                alt={`${p.brand} ${p.name}`}
                brand={p.brand}
                name={p.name}
                badge={tierBadge(p)}
                meta={meta}
                accent={accent}
                accentRail={false}
                selected={active}
                onSelect={() => startTransition(() => selectPaddle(p.id))}
                scores={[
                  { label: "Pwr", value: p.power, color: "var(--chart-power)" },
                  { label: "Ctl", value: p.control, color: "var(--chart-control)" },
                  { label: "Spn", value: p.spin, color: "var(--chart-spin)" },
                ]}
              />
            );
          })}
        </div>

        {visibleCount < filtered.length ? (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              className="sf-btn sf-btn-secondary"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Show more paddles
            </button>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No paddles match that filter.</p>
        ) : null}
      </section>

      <div
        ref={detailRef}
        className="order-2 scroll-mt-20 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:scroll-mt-4"
      >
        {selected ? <PaddleInspector paddle={selected} /> : null}
      </div>
    </div>
  );
}
