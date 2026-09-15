"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PaddleProfile, PlayBias } from "@/types/pickleball";
import { PADDLE_TECH_LEVERS } from "@/data/pickleball/paddles";
import { ScoreGrid, ScoreMeter } from "@/components/gear/ScoreMeter";
import { AisleChip, ChipRow, HScroll, ProductCard, SearchField } from "@/components/gear/CatalogShop";
import { EquipmentThumb } from "@/components/gear/EquipmentThumb";
import { brandAccent } from "@/lib/equipment/media/brandColors";
import {
  hasExternalPaddlePhoto,
  paddleImageUrl,
  photoFirst,
} from "@/lib/pickleball/media";

const BIAS_LABEL: Record<PlayBias, string> = {
  control: "Control",
  power: "Power",
  "all-court": "All-court",
  spin: "Spin",
};

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function balanceLabel(balance: number, balanceMm?: number | null) {
  if (balanceMm != null) {
    const lean = balanceMm >= 245 ? "head-forward" : balanceMm <= 232 ? "handle-biased" : "even";
    return `${balanceMm} mm · ${lean}`;
  }
  if (balance > 0.15) return "Head-forward";
  if (balance < -0.15) return "Handle-biased";
  return "Even";
}

function provenanceLabel(p: PaddleProfile) {
  if (p.specsProvenance === "pickleball-effect-lab") return "Lab-measured specs";
  if (p.specsProvenance === "coaching-estimate") return "Coaching estimate";
  return "Catalog specs";
}

function tierBadge(p: PaddleProfile) {
  if (p.catalogTier === "lab-measured") return "Lab";
  if (p.catalogTier === "tour-seed") return "Tour seed";
  return undefined;
}

export function PaddleTechPanel({ paddles }: { paddles: PaddleProfile[] }) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [bias, setBias] = useState<"all" | PlayBias>("all");
  const [brand, setBrand] = useState<"all" | string>("all");
  const [tier, setTier] = useState<"all" | "lab-measured" | "tour-seed">("all");
  const [selectedId, setSelectedId] = useState(paddles[0]?.id ?? "");
  const deferredQuery = useDeferredValue(query);

  const [leverChoices, setLeverChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(PADDLE_TECH_LEVERS.map((l) => [l.id, l.options[0]?.id ?? ""])),
  );

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

  const selected = filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  const leverEffect = useMemo(() => {
    let control = 70;
    let power = 70;
    const notes: string[] = [];
    for (const lever of PADDLE_TECH_LEVERS) {
      const opt = lever.options.find((o) => o.id === leverChoices[lever.id]);
      if (!opt) continue;
      control += opt.controlDelta;
      power += opt.powerDelta;
      notes.push(`${lever.label}: ${opt.note}`);
    }
    return { control: clampScore(control), power: clampScore(power), notes };
  }, [leverChoices]);

  const ease = [0.22, 1, 0.36, 1] as const;
  const labCount = paddles.filter((p) => p.catalogTier === "lab-measured").length;
  const tourCount = paddles.length - labCount;

  return (
    <div className="space-y-8">
      <section className="sf-panel relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 sf-hero-wash opacity-90" aria-hidden />
        <div className="pointer-events-none absolute inset-0 sf-hero-grid" aria-hidden />
        <div className="relative space-y-4 p-4 md:p-5">
          <div>
            <p className="sf-kicker">Starters · paddle tech</p>
            <h2 className="sf-section-title mt-1">How gear shifts control vs power</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              Flip one lever at a time — core, face, weight, grip/edge — and watch the control/power
              balance move. Then browse the measured lab set plus a growing tour-seed catalog of
              paddles players actually use.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              {PADDLE_TECH_LEVERS.map((lever, li) => (
                <motion.div
                  key={lever.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : li * 0.05, duration: 0.28, ease }}
                >
                  <ChipRow label={lever.label}>
                    {lever.options.map((opt) => (
                      <AisleChip
                        key={opt.id}
                        label={opt.label}
                        active={leverChoices[lever.id] === opt.id}
                        onClick={() =>
                          setLeverChoices((prev) => ({ ...prev, [lever.id]: opt.id }))
                        }
                      />
                    ))}
                  </ChipRow>
                </motion.div>
              ))}
            </div>

            <motion.div
              layout={!reduceMotion}
              className="space-y-4 rounded-md bg-[var(--bg-sunken)]/90 p-4 backdrop-blur-[2px]"
            >
              <p className="sf-kicker !text-[var(--muted)]">Live balance</p>
              <ScoreMeter label="Control" value={leverEffect.control} accent="var(--chart-control)" />
              <ScoreMeter label="Power" value={leverEffect.power} accent="var(--chart-power)" />
              <AnimatePresence mode="popLayout">
                <ul className="space-y-2 pt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {leverEffect.notes.map((n) => (
                    <motion.li
                      key={n}
                      initial={reduceMotion ? false : { opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      className="border-l-2 border-[var(--amber)] pl-2"
                    >
                      {n}
                    </motion.li>
                  ))}
                </ul>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="sf-kicker">Catalog</p>
            <h2 className="sf-section-title mt-1">Paddles players actually use</h2>
            <p className="mt-1 max-w-xl text-xs text-[var(--muted)]">
              {paddles.length} paddles · {labCount} lab-measured · {tourCount} tour-seed. Lab rows
              carry Pickleball Effect weight, swingweight, twist, and spin/power/pop. Tour-seed rows
              fill popular high-level models with catalog/coaching specs so the list can keep
              growing.
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

        <ChipRow label="Source">
          <AisleChip label="All" active={tier === "all"} onClick={() => setTier("all")} />
          <AisleChip
            label={`Lab (${labCount})`}
            active={tier === "lab-measured"}
            onClick={() => setTier("lab-measured")}
          />
          <AisleChip
            label={`Tour seed (${tourCount})`}
            active={tier === "tour-seed"}
            onClick={() => setTier("tour-seed")}
          />
        </ChipRow>

        <ChipRow label="Play bias">
          <AisleChip label="All" active={bias === "all"} onClick={() => setBias("all")} />
          {(Object.keys(BIAS_LABEL) as PlayBias[]).map((b) => (
            <AisleChip
              key={b}
              label={BIAS_LABEL[b]}
              active={bias === b}
              onClick={() => setBias(b)}
            />
          ))}
        </ChipRow>

        <ChipRow label="Brand">
          <AisleChip label="All" active={brand === "all"} onClick={() => setBrand("all")} />
          {brands.map((b) => (
            <AisleChip key={b} label={b} active={brand === b} onClick={() => setBrand(b)} />
          ))}
        </ChipRow>

        <p className="text-[11px] text-[var(--muted)]">
          Showing {filtered.length} of {paddles.length}
        </p>

        <HScroll>
          {filtered.map((p) => {
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
                compact
                image={paddleImageUrl(p)}
                alt={`${p.brand} ${p.name}`}
                brand={p.brand}
                name={p.name}
                badge={tierBadge(p)}
                meta={meta}
                accent={accent}
                selected={active}
                onSelect={() => setSelectedId(p.id)}
                scores={[
                  { label: "Pwr", value: p.power, color: "var(--chart-power)" },
                  { label: "Ctl", value: p.control, color: "var(--chart-control)" },
                  { label: "Spn", value: p.spin, color: "var(--chart-spin)" },
                ]}
              />
            );
          })}
        </HScroll>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.article
              key={selected.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease }}
              className="sf-panel grid gap-6 overflow-hidden p-4 md:grid-cols-[auto_1fr] md:p-6"
            >
              <div
                className="relative flex flex-col items-center gap-3 rounded-md p-3 md:items-start"
                style={{
                  background: `linear-gradient(165deg, color-mix(in srgb, ${brandAccent(selected.brand)} 22%, var(--bg-scene)) 0%, var(--bg-scene) 72%)`,
                }}
              >
                <EquipmentThumb
                  src={paddleImageUrl(selected)}
                  alt={`${selected.brand} ${selected.name}`}
                  size="lg"
                />
                <p className="text-center text-[10px] tracking-[0.1em] text-[var(--muted)] uppercase md:text-left">
                  {selected.shape} · {selected.core} · {selected.texture}
                </p>
                <p className="text-center text-[10px] text-[var(--amber)] md:text-left">
                  {provenanceLabel(selected)}
                  {hasExternalPaddlePhoto(selected.id) ? " · TW photo" : " · SVG portrait"}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <p
                    className="text-[10px] font-bold tracking-[0.14em] uppercase"
                    style={{ color: brandAccent(selected.brand) }}
                  >
                    {selected.brand}
                    {tierBadge(selected) ? ` · ${tierBadge(selected)}` : ""}
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight md:text-2xl">
                    {selected.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{selected.feel}</p>
                  {selected.tourPresence ? (
                    <p className="mt-2 border-l-2 border-[var(--sky)] pl-3 text-xs leading-relaxed text-[var(--foreground)]/85">
                      {selected.tourPresence}
                    </p>
                  ) : null}
                </div>
                <ScoreGrid
                  scores={[
                    { label: "Power", value: selected.power, accent: "var(--chart-power)" },
                    { label: "Control", value: selected.control, accent: "var(--chart-control)" },
                    { label: "Spin", value: selected.spin, accent: "var(--chart-spin)" },
                    { label: "Pop", value: selected.pop, accent: "var(--amber)" },
                    { label: "Sweet spot", value: selected.sweetSpot, accent: "var(--sky)" },
                  ]}
                />
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-[var(--muted)]">Weight</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">{selected.weightOz.toFixed(2)} oz</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Thickness</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">
                      {selected.thicknessMm != null ? `${selected.thicknessMm} mm` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Swingweight</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">
                      {selected.swingweight != null ? selected.swingweight : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Twist weight</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">
                      {selected.twistWeight != null ? selected.twistWeight : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Balance</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">
                      {balanceLabel(selected.balance, selected.balanceMm)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Grip</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">
                      {selected.gripCircumferenceIn}&quot;
                      {selected.gripLengthIn != null ? ` · ${selected.gripLengthIn}" long` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Face / grit</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">
                      {selected.face.replace("-", " ")} · {selected.texture}
                      {selected.measured?.gritType ? ` (${selected.measured.gritType})` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Edge</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">
                      {selected.edgeGuard.replace("-", " ")}
                    </dd>
                  </div>
                  {selected.measured?.spinRpm != null ? (
                    <div>
                      <dt className="text-[var(--muted)]">Measured spin</dt>
                      <dd className="mt-0.5 text-[var(--foreground)]">
                        {selected.measured.spinRpm} RPM
                      </dd>
                    </div>
                  ) : null}
                  {selected.measured?.powerMph != null ? (
                    <div>
                      <dt className="text-[var(--muted)]">Measured power / pop</dt>
                      <dd className="mt-0.5 text-[var(--foreground)]">
                        {selected.measured.powerMph} / {selected.measured.popMph ?? "—"} mph
                      </dd>
                    </div>
                  ) : null}
                  {selected.approval ? (
                    <div>
                      <dt className="text-[var(--muted)]">Approval</dt>
                      <dd className="mt-0.5 text-[var(--foreground)]">{selected.approval}</dd>
                    </div>
                  ) : null}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-[var(--muted)]">Unique</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">{selected.uniqueTrait}</dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-[var(--muted)]">Best for</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">{selected.bestFor}</dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-[var(--muted)]">Notes</dt>
                    <dd className="mt-0.5 text-[var(--foreground)]">{selected.notes}</dd>
                  </div>
                </dl>
              </div>
            </motion.article>
          ) : (
            <p className="text-sm text-[var(--muted)]">No paddles match that filter.</p>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
