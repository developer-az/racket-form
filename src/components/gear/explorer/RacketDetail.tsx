"use client";

import { useMemo, useState } from "react";
import type { RacketProfile } from "@/types/equipment";
import { RacketImg } from "./RacketImg";
import { computeFrameSpecPhysics, parseExpertScores } from "@/lib/equipment/playability";
import { computeFlightMetrics } from "@/lib/equipment/setupSynthesis";
import { analyzeFrame } from "@/lib/equipment/strokeformIntel";
import { derivePlayerFit } from "@/lib/equipment/playerFit";
import { M_TO_FT } from "@/lib/equipment/ballFlight";
import {
  formatBalance,
  patternBand,
  percentile,
  type Distribution,
  type NumericKey,
} from "@/lib/equipment/catalogStats";
import { strikeZoneForFrame } from "../RacketVisuals";
import { FlightChart, type FlightInput } from "./FlightChart";

export type CatalogDists = Record<NumericKey, Distribution>;

type Tab = "specs" | "court" | "fit" | "bag";

const SPEC_ROWS: {
  key: NumericKey;
  label: string;
  fmt: (r: RacketProfile) => string;
  /** Phrase for "higher than N% of frames" */
  higher: string;
}[] = [
  { key: "weightG", label: "Weight", fmt: (r) => (r.weightG != null ? `${r.weightG} g` : "—"), higher: "heavier" },
  { key: "swingweight", label: "Swingweight", fmt: (r) => (r.swingweight != null ? `${r.swingweight}` : "—"), higher: "higher" },
  { key: "stiffnessRa", label: "Stiffness", fmt: (r) => (r.stiffnessRa != null ? `${r.stiffnessRa} RA` : "—"), higher: "stiffer" },
  { key: "balanceMm", label: "Balance", fmt: (r) => formatBalance(r.balanceMm), higher: "more head-heavy" },
  { key: "headSizeSqIn", label: "Head size", fmt: (r) => (r.headSizeSqIn != null ? `${r.headSizeSqIn} in²` : "—"), higher: "larger" },
];

export function flightFor(r: RacketProfile): FlightInput {
  const z = strikeZoneForFrame(r);
  const m = computeFlightMetrics({
    launchDeg: r.idealLaunchAngleDeg,
    pathDeg: r.idealSwingPathDeg,
    power: r.power,
    spin: r.spin,
    control: r.control,
    swingweight: r.swingweight,
  });
  return {
    launchDeg: m.launchDeg,
    netClearIn: m.netClearIn,
    contactHeightM: z.heightM,
    contactLoM: z.heightLoM,
    contactHiM: z.heightHiM,
    outFrontM: z.outFrontM,
  };
}

export function Bar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div title={hint}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] text-[var(--muted)]">{label}</span>
        <span className="sf-readout text-[13px]">{Math.round(value)}</span>
      </div>
      <div className="sf-meter-track mt-1">
        <div className="h-full bg-[var(--foreground)]" style={{ width: `${Math.max(3, Math.min(100, value))}%`, opacity: 0.8 }} />
      </div>
    </div>
  );
}

export function RacketDetail({
  racket,
  dists,
  bag,
  inBag,
  inCompare,
  liveCatalog,
  onSave,
  onToggleCompare,
  onTune,
}: {
  racket: RacketProfile;
  dists: CatalogDists;
  bag: RacketProfile | null;
  inBag: boolean;
  inCompare: boolean;
  liveCatalog: boolean;
  onSave: () => void;
  onToggleCompare: () => void;
  onTune: () => void;
}) {
  const [tab, setTab] = useState<Tab>("specs");
  const physics = useMemo(
    () => computeFrameSpecPhysics(racket, parseExpertScores(racket.summary)),
    [racket],
  );
  const intel = useMemo(() => analyzeFrame(racket, { liveCatalog }), [racket, liveCatalog]);
  const fit = useMemo(() => derivePlayerFit(racket), [racket]);
  const flight = useMemo(() => flightFor(racket), [racket]);
  const bagFlight = useMemo(() => (bag && !inBag ? flightFor(bag) : null), [bag, inBag]);
  const zone = useMemo(() => strikeZoneForFrame(racket), [racket]);
  const pros = [...racket.atpPlayers, ...racket.wtaPlayers];
  const showBag = bag != null && !inBag;
  const tabs: { id: Tab; label: string }[] = [
    { id: "specs", label: "Specs" },
    { id: "court", label: "On court" },
    { id: "fit", label: "Who it suits" },
    ...(showBag ? [{ id: "bag" as const, label: "Vs your bag" }] : []),
  ];
  const active = tabs.some((t) => t.id === tab) ? tab : "specs";
  const ft = (m: number) => `${(m * M_TO_FT).toFixed(1)} ft`;

  return (
    <article className="flex flex-col" aria-label={`${racket.brand} ${racket.model}`}>
      <div className="flex gap-4">
        <div className="sf-thumb-well flex h-36 w-28 shrink-0 items-center justify-center rounded-[var(--radius)]">
          <RacketImg racket={racket} className="h-32 w-24 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="sf-spec-label">
            {racket.brand} · {racket.year}
          </p>
          <h2 className="mt-1 text-[1.4rem] leading-tight font-semibold tracking-[-0.025em]">{racket.model}</h2>
          <p className="mt-1.5 text-[13px] text-[var(--muted)]">{fit.courtRole}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onSave} className={`sf-btn !min-h-9 !px-3 !text-[13px] ${inBag ? "sf-btn-secondary" : "sf-btn-primary"}`}>
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
            <button type="button" onClick={onTune} className="sf-btn sf-btn-ghost !min-h-9 !px-2 !text-[13px]">
              Tune with lead
            </button>
          </div>
        </div>
      </div>

      <div className="sf-tab-track mt-5 border-b border-[var(--line)]" role="tablist" aria-label="Frame details">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setTab(t.id)}
            className="sf-tab !min-h-10 !px-3 !py-2"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-4" role="tabpanel">
        {active === "specs" ? (
          <div className="space-y-5">
            <dl className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {SPEC_ROWS.map((row) => {
                const v = racket[row.key];
                const p = percentile(dists[row.key], v);
                return (
                  <div key={row.key} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 py-2.5">
                    <dt className="text-[13px] text-[var(--muted)]">{row.label}</dt>
                    <dd className="flex min-w-0 items-center gap-3">
                      <span className="sf-readout w-[8.5rem] shrink-0 text-[13.5px]">{row.fmt(racket)}</span>
                      {p != null ? (
                        <span className="flex min-w-0 flex-1 items-center gap-2" title={`${row.higher} than ${p}% of frames`}>
                          <span className="relative h-[3px] flex-1 bg-[var(--line)]">
                            <span className="absolute top-1/2 h-2.5 w-[2px] -translate-y-1/2 bg-[var(--foreground)]" style={{ left: `${p}%` }} />
                          </span>
                          <span className="w-9 shrink-0 text-right font-[family-name:var(--font-mono)] text-[10.5px] text-[var(--muted)]">
                            P{p}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">not published</span>
                      )}
                    </dd>
                  </div>
                );
              })}
              <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3 py-2.5">
                <dt className="text-[13px] text-[var(--muted)]">Pattern</dt>
                <dd className="sf-readout text-[13.5px]">
                  {racket.stringPattern?.replace("x", "×") ?? "—"}
                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                    {patternBand(racket.stringPattern) === "16x19"
                      ? "open, more spin"
                      : patternBand(racket.stringPattern) === "18x20"
                        ? "dense, more control"
                        : "specialty"}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="-mt-3 text-[11.5px] text-[var(--muted)]">
              P = percentile among frames with that spec published. P50 is the middle of the market.
            </p>

            <div>
              <p className="sf-spec-label">Character</p>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
                <Bar label="Power" value={racket.power} />
                <Bar label="Stability" value={physics.plow} hint="How well the frame holds against heavy balls (mass and swingweight)" />
                <Bar label="Spin" value={racket.spin} />
                <Bar label="Maneuverability" value={physics.whip} hint="How easily the head accelerates (balance and weight)" />
                <Bar label="Control" value={racket.control} />
                <Bar label="Forgiveness" value={physics.forgiveness} hint="How much off-centre hits are tolerated (head size, pattern, flex)" />
                <Bar label="Comfort" value={racket.comfort} />
                <Bar label="Arm shock" value={physics.armLoad} hint="Higher means more shock to the arm (stiffness and swingweight)" />
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--muted)]">
                Scores are calculated from weight, swingweight, stiffness, balance, head size and pattern, not from the model name.
              </p>
            </div>
          </div>
        ) : null}

        {active === "court" ? (
          <div className="space-y-4">
            <FlightChart flight={flight} compare={bagFlight} />
            {bagFlight ? (
              <p className="-mt-2 text-[11.5px] text-[var(--muted)]">
                <span className="text-[var(--accent)]">Solid</span>: this frame. Dashed: {bag?.model} in your bag.
              </p>
            ) : null}
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)]">
              {[
                ["Launch", `${flight.launchDeg.toFixed(1)}°`],
                ["Over net", `${flight.netClearIn.toFixed(0)}″`],
                ["Contact height", `${(zone.heightLoM * M_TO_FT).toFixed(1)}–${ft(zone.heightHiM)}`],
                ["Out in front", ft(zone.outFrontM)],
              ].map(([k, v]) => (
                <div key={k} className="bg-[var(--panel)] px-3 py-2.5">
                  <dt className="sf-spec-label">{k}</dt>
                  <dd className="sf-readout mt-1 text-[15px]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[13.5px] leading-relaxed text-[var(--foreground)]/90">{zone.detail}</p>
            <p className="text-[11.5px] leading-relaxed text-[var(--muted)]">
              Modelled from the frame&apos;s launch and swing-path tendencies on a centre hit. Your own swing moves these numbers more than the frame does.
            </p>
          </div>
        ) : null}

        {active === "fit" ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                ["Level", fit.skill],
                ["Game style", fit.courtRole],
                ["Weight class", fit.weightClass],
                ["Head", fit.headFeel],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="sf-spec-label">{k}</dt>
                  <dd className="mt-1 text-[13.5px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            {intel.quirks.length > 0 ? (
              <div>
                <p className="sf-spec-label">What to know</p>
                <ul className="mt-2 space-y-3">
                  {intel.quirks.slice(0, 3).map((q) => (
                    <li key={q.id} className="grid grid-cols-[0.5rem_1fr] gap-3">
                      <span
                        className="mt-[7px] h-1.5 w-1.5"
                        style={{
                          background:
                            q.polarity === "strength" ? "var(--accent)" : q.polarity === "tradeoff" ? "var(--amber)" : "var(--danger)",
                        }}
                        aria-hidden
                      />
                      <div>
                        <p className="text-[13.5px] font-medium">{q.title}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--muted)]">{q.meaning}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {intel.skipIf.length > 0 ? (
              <div>
                <p className="sf-spec-label">Probably not for you if</p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[var(--muted)]">
                  {intel.skipIf.slice(0, 3).map((s) => (
                    <li key={s}>– {s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="sf-spec-label">Strings that suit it</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">{intel.stringPairing}</p>
            </div>

            {pros.length > 0 ? (
              <div>
                <p className="sf-spec-label">Played by</p>
                <p className="mt-1.5 text-[13px] text-[var(--foreground)]/90">{pros.slice(0, 8).join(", ")}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {active === "bag" && bag ? <VsBag racket={racket} bag={bag} /> : null}
      </div>
    </article>
  );
}

function VsBag({ racket, bag }: { racket: RacketProfile; bag: RacketProfile }) {
  const rows: { label: string; a: number | null; b: number | null; unit?: string; digits?: number }[] = [
    { label: "Weight", a: racket.weightG, b: bag.weightG, unit: "g" },
    { label: "Swingweight", a: racket.swingweight, b: bag.swingweight },
    { label: "Stiffness", a: racket.stiffnessRa, b: bag.stiffnessRa, unit: "RA" },
    { label: "Balance", a: racket.balanceMm, b: bag.balanceMm, unit: "mm" },
    { label: "Head size", a: racket.headSizeSqIn, b: bag.headSizeSqIn, unit: "in²" },
    { label: "Power", a: racket.power, b: bag.power },
    { label: "Spin", a: racket.spin, b: bag.spin },
    { label: "Control", a: racket.control, b: bag.control },
    { label: "Comfort", a: racket.comfort, b: bag.comfort },
    { label: "Launch", a: racket.idealLaunchAngleDeg, b: bag.idealLaunchAngleDeg, unit: "°", digits: 1 },
  ];
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
          const d = r.a != null && r.b != null ? r.a - r.b : null;
          const f = (v: number | null) => (v == null ? "—" : v.toFixed(r.digits ?? 0));
          return (
            <tr key={r.label}>
              <td className="py-2 text-[var(--muted)]">{r.label}</td>
              <td className="sf-readout py-2 text-right text-[var(--muted)]">{f(r.b)}</td>
              <td className="sf-readout py-2 text-right">{f(r.a)}</td>
              <td className="sf-readout py-2 text-right">
                {d == null || Math.abs(d) < 0.05 ? (
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
