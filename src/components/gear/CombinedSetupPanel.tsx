"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { EquipmentTab, GripProfile, RacketProfile, StringProfile } from "@/types/equipment";
import { synthesizeCombinedSetup } from "@/lib/equipment/setupSynthesis";
import { LEAD_TAPE_ZONES } from "@/lib/equipment/leadTape";
import { findSimilarStrings } from "@/lib/equipment/strings";
import { modelWithoutBrand } from "@/lib/equipment/labels";
import { brandAccent } from "@/lib/equipment/media/brandColors";
import {
  stringMaterialShortLabel,
  stringShapeShortLabel,
} from "@/lib/equipment/shopAisles";
import { gripSizeLabel } from "@/lib/equipment/gripSize";
import { summarizeGripLayers } from "@/lib/equipment/gripStack";
import { useGearStore } from "@/store/gearStore";
import { usePlayerStore } from "@/store/playerStore";
import { prefersArmFriendlySetup } from "@/lib/player/constraints";
import { EquipmentThumb } from "./EquipmentThumb";
import { SetupFinder } from "./SetupFinder";
import { InBandImproveSection } from "./InBandImproveSection";
import { CourtReadyVerdict } from "./CourtReadyVerdict";
import { LaunchAngleVisual, SwingPathVisual, StrikeCoachingBullets, strikeZoneForFrame, ForehandGripBevelVisual, FaceAngleAtContactVisual, ContactGeometryVisual } from "./RacketVisuals";
import { LeadTapeRacketDiagram } from "./LeadTapeRacketDiagram";
import { gripImageUrl, racketImageUrl, stringImageUrl } from "@/lib/equipment/media/urls";

export function CombinedSetupPanel({
  rackets,
  strings,
  grips,
  onSelectTab,
}: {
  rackets: RacketProfile[];
  strings: StringProfile[];
  grips: GripProfile[];
  onSelectTab?: (tab: EquipmentTab) => void;
}) {
  const setup = useGearStore((s) => s.setup);
  const setTab = useGearStore((s) => s.setTab);
  const playerGrip = usePlayerStore((s) => s.profile.grips.forehand);
  const armFriendly = usePlayerStore((s) => prefersArmFriendlySetup(s.profile));
  const generatesOwnPower = usePlayerStore((s) => s.profile.preferences.generatesOwnPower);
  const valuesDurability = usePlayerStore((s) => s.profile.preferences.valuesDurability);

  const racket = useMemo(
    () => rackets.find((r) => r.slug === setup.racketSlug) ?? null,
    [rackets, setup.racketSlug],
  );
  const string = useMemo(
    () => strings.find((s) => s.id === setup.stringId) ?? null,
    [strings, setup.stringId],
  );
  const grip = useMemo(() => {
    const outerId =
      setup.gripLayers?.[setup.gripLayers.length - 1]?.id ?? setup.gripId;
    return outerId ? grips.find((g) => g.id === outerId) ?? null : null;
  }, [grips, setup.gripId, setup.gripLayers]);

  const gripStackLabel = useMemo(
    () =>
      summarizeGripLayers(setup.gripLayers ?? [], setup.gripSize) ||
      setup.gripLabel,
    [setup.gripLayers, setup.gripSize, setup.gripLabel],
  );

  const [justSaved, setJustSaved] = useState(false);
  const [quickStart, setQuickStart] = useState(false);
  const insight = useMemo(
    () =>
      synthesizeCombinedSetup(setup, racket, string, grip, grips, {
        playerGrip,
        armFriendly,
        generatesOwnPower,
        valuesDurability,
      }),
    [setup, racket, string, grip, grips, playerGrip, armFriendly, generatesOwnPower, valuesDurability],
  );

  const stringAlts = useMemo(
    () => (string ? findSimilarStrings(string, strings, { limit: 4 }) : []),
    [string, strings],
  );

  const go = (tab: EquipmentTab) => {
    if (onSelectTab) onSelectTab(tab);
    else setTab(tab);
  };

  const tapeByZone = useMemo(() => {
    const map: Partial<Record<string, number>> = {};
    for (const p of setup.leadTape?.pieces ?? []) {
      map[p.zone] = (map[p.zone] ?? 0) + p.massG;
    }
    return map;
  }, [setup.leadTape]);

  const setupZone = racket
    ? strikeZoneForFrame({
        ...racket,
        idealLaunchAngleDeg: insight.launchAngleDeg ?? racket.idealLaunchAngleDeg,
        idealSwingPathDeg: insight.swingPathDeg ?? racket.idealSwingPathDeg,
      })
    : strikeZoneForFrame({
        idealLaunchAngleDeg: insight.launchAngleDeg,
        idealSwingPathDeg: insight.swingPathDeg,
        spin: insight.scores.spin,
        control: insight.scores.control,
        power: insight.scores.power,
      });

  if (!insight.hasAny) {
    if (quickStart) {
      return (
        <div className="mb-8">
          <SetupFinder
            rackets={rackets}
            strings={strings}
            grips={grips}
            onBrowse={() => go("rackets")}
            onSaved={() => {
              setQuickStart(false);
              setJustSaved(true);
              requestAnimationFrame(() =>
                document.getElementById("gear-panel-overview")?.scrollIntoView({ behavior: "smooth", block: "start" }),
              );
            }}
          />
        </div>
      );
    }
    return (
      <div className="mb-8 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        {(
          [
            ["rackets", "01", "Frame", `${rackets.length} frames with weight, swingweight, stiffness and balance. Filter by range, plot the market, compare up to four.`],
            ["strings", "02", "String", `${strings.length} strings. Set tension and gauge and the scores update.`],
            ["grips", "03", "Grip", `${grips.length} replacement and overgrips, layered the way you actually wrap them.`],
          ] as [EquipmentTab, string, string, string][]
        ).map(([tab, n, label, body]) => (
          <button
            key={tab}
            type="button"
            onClick={() => go(tab)}
            className="group flex flex-col items-start bg-[var(--panel)] p-5 text-left transition hover:bg-[var(--overlay-hover)]"
          >
            <span className="sf-spec-label">{n} · Empty</span>
            <span className="mt-3 text-[15px] font-semibold tracking-[-0.01em]">Choose a {label.toLowerCase()}</span>
            <span className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">{body}</span>
            <span className="mt-4 text-[12.5px] font-medium text-[var(--accent)] group-hover:underline">Browse →</span>
          </button>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--panel)] px-5 py-3 sm:col-span-3">
          <p className="text-[12.5px] text-[var(--muted)]">
            Once a frame is in your bag, this tab shows how the full setup plays together.
          </p>
          <button type="button" onClick={() => setQuickStart(true)} className="sf-text-link text-[12.5px]">
            New to this? Quick start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-6" style={{ animation: "rise 0.5s ease-out both" }}>
      {justSaved ? <SavedBanner onDismiss={() => setJustSaved(false)} /> : null}
      <div className="sf-panel p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[min(100%,18rem)] flex-1">
            <p className="sf-spec-label">Your setup plays like</p>
            <h2 className="mt-1.5 text-[1.5rem] leading-tight font-semibold tracking-[-0.025em]">
              {insight.playstyle.split(" · ")[0]}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button type="button" onClick={() => go("lead-tape")} className="sf-btn sf-btn-secondary !min-h-9 !px-3 !text-[13px]">
              Tune with lead
            </button>
            <Link href="/lab" className="sf-btn sf-btn-ghost !min-h-9 !px-3 !text-[13px]">
              Open lab
            </Link>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
          {(
            [
              ["Court-ready", `${insight.playability.score}`, "/100"],
              ["Launch", insight.launchAngleDeg != null ? `${insight.launchAngleDeg.toFixed(1)}°` : "—", insight.baseLaunchDeg != null ? `stock ${insight.baseLaunchDeg.toFixed(1)}°` : ""],
              ["Over net", insight.flight ? `${insight.flight.netClearIn.toFixed(0)}″` : "—", ""],
              ["Complete", `${insight.completeness}%`, ""],
            ] as const
          ).map(([k, v, sub]) => (
            <div key={k} className="bg-[var(--panel)] px-4 py-3">
              <dt className="sf-spec-label">{k}</dt>
              <dd className="mt-1">
                <span className="sf-readout text-[1.25rem]">{v}</span>
                {sub ? <span className="ml-1.5 text-[12px] text-[var(--muted)]">{sub}</span> : null}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          <PieceCard
            label="Frame"
            filled={insight.hasRacket}
            onClick={() => go("rackets")}
            thumb={
              setup.racketSlug ? (
                <EquipmentThumb
                  src={racketImageUrl({ slug: setup.racketSlug })}
                  alt={setup.racketLabel ?? "Racket"}
                  size="md"
                />
              ) : null
            }
            title={setup.racketLabel ?? "Add a racket"}
            meta={
              insight.baseLaunchDeg != null
                ? `Stock ${insight.baseLaunchDeg.toFixed(1)}° launch`
                : "Not chosen"
            }
          />
          <PieceCard
            label="String"
            filled={insight.hasString}
            onClick={() => go("strings")}
            thumb={
              setup.stringId ? (
                <EquipmentThumb
                  src={stringImageUrl({ id: setup.stringId })}
                  alt={setup.stringLabel ?? "String"}
                  size="md"
                />
              ) : null
            }
            title={setup.stringLabel ?? "Add a string"}
            meta={
              setup.tensionLbs != null
                ? `${setup.tensionLbs} lbs${setup.gaugeMm != null ? ` · ${setup.gaugeMm} mm` : ""}`
                : "Not chosen"
            }
          />
          <PieceCard
            label="Grip"
            filled={insight.hasGrip}
            onClick={() => go("grips")}
            thumb={
              setup.gripId ? (
                <EquipmentThumb
                  src={gripImageUrl({ id: setup.gripId })}
                  alt={gripStackLabel ?? "Grip"}
                  size="md"
                />
              ) : null
            }
            title={gripStackLabel ?? "Add grip / overgrips"}
            meta={
              setup.gripSize
                ? gripSizeLabel(setup.gripSize)
                : "Not chosen"
            }
          />
          <PieceCard
            label="Lead tape"
            filled={insight.hasTape}
            onClick={() => go("lead-tape")}
            thumb={
              <div
                className="sf-thumb-well sf-readout flex h-28 w-[5.5rem] items-center justify-center rounded-[var(--radius)] text-[15px]"
              >
                {insight.hasTape
                  ? `+${(setup.leadTape?.pieces ?? []).reduce((n, p) => n + p.massG, 0)}g`
                  : "0g"}
              </div>
            }
            title={insight.hasTape ? "Custom balance" : "No tape yet"}
            meta={
              insight.hasTape
                ? Object.entries(tapeByZone)
                    .map(([z, g]) => `${LEAD_TAPE_ZONES[z as keyof typeof LEAD_TAPE_ZONES]?.label?.split(" ")[0] ?? z} ${g}g`)
                    .join(" · ")
                : "Optional"
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(insight.scores.power != null || insight.scores.comfort != null) && (
          <section className="sf-panel p-5 md:p-6">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Scores</h3>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">Frame, string, grip and tape combined. Change is against the stock frame.</p>
            <dl className="mt-4 space-y-3.5">
              {(
                [
                  ["Power", insight.scores.power, insight.scoreDeltas.total.power],
                  ["Spin", insight.scores.spin, insight.scoreDeltas.total.spin],
                  ["Control", insight.scores.control, insight.scoreDeltas.total.control],
                  ["Comfort", insight.scores.comfort, insight.scoreDeltas.total.comfort],
                ] as const
              ).map(([label, v, delta]) => (
                <div key={label} className="grid grid-cols-[5rem_1fr_2.5rem_3rem] items-center gap-3">
                  <dt className="text-[13px] text-[var(--muted)]">{label}</dt>
                  <dd className="h-[3px] bg-[var(--line)]">
                    <span className="block h-full bg-[var(--foreground)] opacity-70 transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, v ?? 0))}%` }} />
                  </dd>
                  <dd className="sf-readout text-right text-[14px]">{v ?? "—"}</dd>
                  <dd className={`sf-readout text-right text-[12px] ${Math.abs(delta) < 0.5 ? "text-[var(--muted)]" : "text-[var(--accent)]"}`}>
                    {Math.abs(delta) < 0.5 ? "0" : `${delta > 0 ? "+" : ""}${Math.round(delta)}`}
                  </dd>
                </div>
              ))}
            </dl>
            {(insight.hasString || insight.hasGrip || insight.hasTape) && (
              <table className="mt-5 w-full text-[12px]">
                <thead>
                  <tr className="sf-spec-label text-left">
                    <th className="pb-1.5 font-normal">From</th>
                    <th className="pb-1.5 text-right font-normal">Power</th>
                    <th className="pb-1.5 text-right font-normal">Spin</th>
                    <th className="pb-1.5 text-right font-normal">Control</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["String", insight.scoreDeltas.string],
                      ["Grip", insight.scoreDeltas.grip],
                      ["Tape", insight.scoreDeltas.tape],
                    ] as const
                  ).map(([k, d]) => (
                    <tr key={k} className="border-t border-[var(--line)]">
                      <td className="py-1.5 text-[var(--muted)]">{k}</td>
                      <td className="sf-readout py-1.5 text-right">{fmtDelta(d.power)}</td>
                      <td className="sf-readout py-1.5 text-right">{fmtDelta(d.spin)}</td>
                      <td className="sf-readout py-1.5 text-right">{fmtDelta(d.control)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        <section className="sf-panel p-5 md:p-6">
          {insight.launchAngleDeg != null ? (
            <LaunchAngleVisual
              degrees={insight.launchAngleDeg}
              pathDeg={insight.swingPathDeg ?? undefined}
              spin={insight.scores.spin}
              power={insight.scores.power}
              control={insight.scores.control}
              flight={insight.flight}
              zone={setupZone}
              faceClosedDeg={insight.forehand?.face.closedDeg ?? 8}
              label="Ball flight with this setup"
            />
          ) : (
            <p className="text-[13px] text-[var(--muted)]">Add a frame to model ball flight.</p>
          )}
        </section>
      </div>

      <CourtReadyVerdict playability={insight.playability} />

      <InBandImproveSection plan={insight.inBand} />

      <details className="group space-y-6">
        <summary className="cursor-pointer list-none text-sm text-[var(--muted)] hover:text-[var(--foreground)] [&::-webkit-details-marker]:hidden">
          <span className="underline-offset-2 group-open:text-[var(--foreground)]">Technique notes for this setup</span>
          <span className="ml-2 text-[10px] uppercase tracking-[0.12em] opacity-70">expand</span>
        </summary>
        <div className="mt-4 space-y-6">

      <div className="border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {insight.swingPathDeg != null ? (
            <SwingPathVisual
              degrees={insight.swingPathDeg}
              zone={
                racket
                  ? strikeZoneForFrame({
                      ...racket,
                      idealLaunchAngleDeg: insight.launchAngleDeg ?? racket.idealLaunchAngleDeg,
                      idealSwingPathDeg: insight.swingPathDeg,
                    })
                  : strikeZoneForFrame({
                      idealLaunchAngleDeg: insight.launchAngleDeg,
                      idealSwingPathDeg: insight.swingPathDeg,
                      spin: insight.scores.spin,
                      control: insight.scores.control,
                      power: insight.scores.power,
                    })
              }
              faceClosedDeg={insight.forehand?.face.closedDeg ?? 8}
              label="Contact height"
            />
          ) : (
            <div>
              <p className="sf-kicker sf-kicker-amber">
                Where to strike
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">Needs a frame base to draw strike heights.</p>
            </div>
          )}
        </div>
        <StrikeCoachingBullets
          launchDeg={insight.launchAngleDeg}
          pathDeg={insight.swingPathDeg}
          spin={insight.scores.spin}
          control={insight.scores.control}
          power={insight.scores.power}
          headSizeSqIn={racket?.headSizeSqIn}
          zone={
            racket
              ? strikeZoneForFrame({
                  ...racket,
                  idealLaunchAngleDeg: insight.launchAngleDeg ?? racket.idealLaunchAngleDeg,
                  idealSwingPathDeg: insight.swingPathDeg ?? racket.idealSwingPathDeg,
                })
              : undefined
          }
        />
      </div>

      {insight.forehand ? (
        <div className="border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:p-6">
          <p className="sf-kicker sf-kicker-amber">
            Forehand grip & face
          </p>
          <p className="mt-1 max-w-2xl text-xs text-[var(--muted)]">
            Best bevel and how closed the face should be for this path and leave.
          </p>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <ForehandGripBevelVisual advice={insight.forehand} />
            <FaceAngleAtContactVisual advice={insight.forehand} />
          </div>
          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <ContactGeometryVisual advice={insight.forehand} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="sf-kicker">
                Practice this grip + face
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--foreground)]/85">
                {insight.forehand.practice.map((p) => (
                  <li key={p} className="border-l border-[var(--line-strong)] pl-2.5">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="sf-kicker sf-kicker-amber">
                Don’t do this
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--foreground)]/85">
                {insight.forehand.avoid}
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
                <span className="text-[var(--sky)]">Science — </span>
                Grip sets face lean; path loads spin. Opening the face sends the ball up without
                adding drop — that’s how clean hits sail long.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delta breakdown moved to the compact header */}

      {insight.tuneTips.length > 0 ? (
        <div className="border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:p-6">
          <p className="sf-kicker">
            Perfect the mold
          </p>
          <p className="mt-1 max-w-2xl text-xs text-[var(--muted)]">
            String dials and lead-tape placements. Raising one score usually costs another.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {insight.tuneTips.map((tip) => {
              const accent =
                tip.score === "spin"
                  ? "var(--chart-spin)"
                  : tip.score === "power"
                    ? "var(--chart-power)"
                    : tip.score === "comfort"
                      ? "var(--chart-comfort)"
                      : "var(--chart-control)";
              const verdictLabel =
                tip.verdict === "low"
                  ? "Room to raise"
                  : tip.verdict === "high"
                    ? "May be hot — can dial back"
                    : "In a healthy band";
              return (
                <article
                  key={tip.score}
                  className="rounded-md p-3"
                  style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className="font-[family-name:var(--font-display)] text-lg capitalize tracking-tight"
                      style={{ color: accent }}
                    >
                      {tip.score}
                      {tip.current != null ? (
                        <span className="ml-2 text-sm tabular-nums text-[var(--foreground)]/80">
                          {tip.current}
                        </span>
                      ) : null}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {verdictLabel}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="sf-kicker">
                        String / grip — raise
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-[var(--foreground)]/85">
                        {tip.raise.slice(0, 3).map((r) => (
                          <li key={r}>· {r}</li>
                        ))}
                      </ul>
                      {tip.tapeRaise?.length ? (
                        <>
                          <p className="sf-kicker sf-kicker-sky mt-2.5">
                            Lead tape — raise
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-[var(--foreground)]/85">
                            {tip.tapeRaise.slice(0, 2).map((r) => (
                              <li key={r}>· {r}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                    <div>
                      <p className="sf-kicker sf-kicker-amber">
                        String / grip — lower
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-[var(--foreground)]/85">
                        {tip.lower.slice(0, 3).map((r) => (
                          <li key={r}>· {r}</li>
                        ))}
                      </ul>
                      {tip.tapeLower?.length ? (
                        <>
                          <p className="sf-kicker sf-kicker-sky mt-2.5">
                            Lead tape — lower
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-[var(--foreground)]/85">
                            {tip.tapeLower.slice(0, 2).map((r) => (
                              <li key={r}>· {r}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 border-t border-[var(--line)] pt-2 text-xs leading-relaxed text-[var(--muted)]">
                    <span className="text-[var(--amber)]">Tradeoff — </span>
                    {tip.tradeoff}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--foreground)]/70">
                    <span className="text-[var(--sky)]">Science — </span>
                    {tip.science}
                  </p>
                  <button
                    type="button"
                    onClick={() => go("lead-tape")}
                    className="mt-2 text-[11px] font-medium text-[var(--sky)]"
                  >
                    Open lead tape lab →
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {insight.weakPoints.length > 0 ? (
        <div className="border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:p-6">
          <p className="sf-kicker sf-kicker-amber">
            Frame weak points
          </p>
          <p className="mt-1 max-w-2xl text-xs text-[var(--muted)]">
            What holds this mold back — and what to practice.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {insight.weakPoints.map((wp) => (
              <article
                key={wp.title}
                className="rounded-md p-3"
                style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}
              >
                <h3 className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--amber)]">
                  {wp.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/90">
                  <span className="text-[var(--amber)]">Holding you back — </span>
                  {wp.holdingBack}
                </p>
                <p className="sf-kicker mt-3">
                  Practice this
                </p>
                <ul className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-[var(--foreground)]/85">
                  {wp.practice.map((p) => (
                    <li key={p} className="border-l border-[var(--line-strong)] pl-2.5">
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          {insight.gripBuildNote ? (
            <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs leading-relaxed text-[var(--muted)]">
              <span className="text-[var(--amber)]">Handle build — </span>
              {insight.gripBuildNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {insight.scienceNotes.length > 0 ? (
        <div className="border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:p-6">
          <p className="sf-kicker sf-kicker-sky">
            What your numbers mean
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Where this setup sits — not a generic either/or.
          </p>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--foreground)]/85">
            {insight.scienceNotes.map((n) => (
              <li key={n} className="border-l-2 border-[var(--sky)]/40 pl-3">
                {n}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Tape zone diagram when present */}
      {insight.hasTape ? (
        <div className="border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:p-6">
          <p className="sf-kicker">
            Lead tape map
          </p>
          <div className="mt-4 grid items-start gap-6 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <LeadTapeRacketDiagram pieces={setup.leadTape?.pieces ?? []} interactive={false} />
            <ul className="min-w-0 space-y-2 text-sm">
              {Object.entries(tapeByZone).map(([zone, g]) => (
                <li key={zone} className="flex justify-between gap-3 border-b border-[var(--line)] pb-1.5">
                  <span className="text-[var(--foreground)]/90">
                    {LEAD_TAPE_ZONES[zone as keyof typeof LEAD_TAPE_ZONES]?.label ?? zone}
                  </span>
                  <span className="text-[var(--accent)]">+{g}g</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {stringAlts.length > 0 ? (
        <div className="border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:p-6">
          <p className="sf-kicker sf-kicker-sky">
            Similar string feel — shop around
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Close substitutes if your exact bed is pricey or out of stock. Search the shop query
            online at a local stringer or retailer.
          </p>
          <ul className="mt-3 space-y-2">
            {stringAlts.map((a) => {
              const accent = brandAccent(a.string.brand);
              return (
              <li
                key={a.string.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2 text-sm last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <EquipmentThumb src={stringImageUrl(a.string)} alt="" size="sm" />
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-display)] tracking-tight text-[var(--foreground)]">
                      <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: accent }}>
                        {a.string.brand}{" "}
                      </span>
                      {modelWithoutBrand(a.string.brand, a.string.name)}
                      <span className="ml-2 text-[11px] tabular-nums text-[var(--sky)]">
                        {a.score}%
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                      <span
                        className="mr-1.5 inline-block rounded-sm px-1 py-0.5 text-[9px] font-semibold"
                        style={{
                          color: accent,
                          background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                        }}
                      >
                        {stringMaterialShortLabel(a.string.material)} ·{" "}
                        {stringShapeShortLabel(a.string.shape)}
                      </span>
                      {a.why}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(a.shopQuery);
                    go("strings");
                  }}
                  className="shrink-0 rounded-md px-2.5 py-1.5 text-[11px] text-[var(--sky)]"
                  style={{ boxShadow: "0 0 0 1px color-mix(in srgb, var(--sky) 40%, transparent)" }}
                  title="Copy shop search and open Strings"
                >
                  Copy search
                </button>
              </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => go("strings")}
            className="mt-3 text-xs font-medium text-[var(--accent)]"
          >
            Browse strings →
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 border border-[var(--line)] bg-[var(--panel)]/90 p-5 md:grid-cols-2 md:p-6">
        <div>
          <p className="sf-kicker">
            Pros of this mold
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--foreground)]/90">
            {insight.pros.map((p) => (
              <li key={p} className="border-l border-[var(--line-strong)] pl-3">
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="sf-kicker sf-kicker-amber">
            Tradeoffs / cons
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--foreground)]/85">
            {insight.cons.map((c) => (
              <li key={c} className="border-l-2 border-[var(--amber)]/40 pl-3">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Chip active={insight.hasRacket} onClick={() => go("rackets")}>
          {insight.hasRacket ? `Frame · ${setup.racketLabel}` : "Add racket"}
        </Chip>
        <Chip active={insight.hasString} onClick={() => go("strings")}>
          {insight.hasString
            ? `String · ${setup.stringLabel}${setup.tensionLbs != null ? ` @ ${setup.tensionLbs}` : ""}`
            : "Add string"}
        </Chip>
        <Chip active={insight.hasGrip} onClick={() => go("grips")}>
          {insight.hasGrip
            ? `Grip · ${gripStackLabel ?? setup.gripLabel}`
            : "Add grip / overgrips"}
        </Chip>
        <Chip active={insight.hasTape} onClick={() => go("lead-tape")}>
          {insight.hasTape
            ? `Tape · +${(setup.leadTape?.pieces ?? []).reduce((n, p) => n + p.massG, 0)}g`
            : "Customize tape"}
        </Chip>
      </div>
    </div>
  );
}

function fmtDelta(n: number): string {
  if (Math.abs(n) < 0.05) return "0";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs transition ${
        active
          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
          : "text-[var(--muted)] hover:bg-[var(--overlay-hover)] hover:text-[var(--foreground)]"
      }`}
      style={active ? undefined : { boxShadow: "0 0 0 1px var(--line)" }}
    >
      {children}
    </button>
  );
}

function PieceCard({
  label,
  title,
  meta,
  filled,
  onClick,
  thumb,
}: {
  label: string;
  title: string;
  meta: string;
  filled: boolean;
  onClick: () => void;
  thumb: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex gap-3 bg-[var(--panel)] p-3 text-left transition hover:bg-[var(--overlay-hover)]"
    >
      {thumb}
      <div className="min-w-0 flex-1">
        <p className="sf-label">{label}</p>
        <p className={`mt-0.5 truncate text-sm ${filled ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{meta}</p>
      </div>
    </button>
  );
}

export function SavedBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="sf-alert sf-alert-accent flex flex-wrap items-center justify-between gap-3" role="status">
      <p>
        <span className="font-semibold">Your bag is saved.</span> Below is how it plays together.
        Nudge tension above or swap any piece from the tabs.
      </p>
      <button type="button" onClick={onDismiss} className="sf-text-link shrink-0 text-xs">
        Got it
      </button>
    </div>
  );
}
