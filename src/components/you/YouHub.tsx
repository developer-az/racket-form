"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GripProfile, RacketProfile, StringProfile } from "@/types/equipment";
import { usePlayerStore } from "@/store/playerStore";
import { hasAnyGear, setupSummary, useGearStore } from "@/store/gearStore";
import { derivePatterns, recentBodyTrend } from "@/lib/player/patterns";
import { synthesizeCombinedSetup, previewSetupWithString } from "@/lib/equipment/setupSynthesis";
import { prefersArmFriendlySetup } from "@/lib/player/constraints";
import { PlayerCardSheet } from "@/components/you/PlayerCardSheet";
import { InBandImproveSection } from "@/components/gear/InBandImproveSection";
import { CourtReadyVerdict } from "@/components/gear/CourtReadyVerdict";
import { strikeZoneForFrame } from "@/components/gear/RacketVisuals";
import { SetupVisualStory } from "./SetupVisualStory";
import { YouStringCompare } from "./YouStringCompare";
import { BagTab } from "./BagTab";
import { AfterPlayTab } from "./AfterPlayTab";
import { HistoryTab } from "./HistoryTab";
import { WorkOnThis } from "./WorkOnThis";
import { YouIdentity, type ProBuild } from "./YouIdentity";
import { CourtEmpty, CourtLoading } from "@/components/ui/CourtState";

type HubTab = "today" | "bag" | "play" | "history";

export function YouHub({
  rackets,
  strings,
  grips,
  pros,
}: {
  rackets: RacketProfile[];
  strings: StringProfile[];
  grips: GripProfile[];
  pros: ProBuild[];
}) {
  const profile = usePlayerStore((s) => s.profile);
  const hydrated = usePlayerStore((s) => s.hydrated);
  const setHydrated = usePlayerStore((s) => s.setHydrated);
  const setup = useGearStore((s) => s.setup);

  const [tab, setTab] = useState<HubTab>("today");
  const [playerCardOpen, setPlayerCardOpen] = useState(false);
  const bagKey = `${setup.stringId ?? ""}|${setup.racketSlug ?? ""}|${setup.tensionLbs ?? ""}|${setup.gaugeMm ?? ""}|${JSON.stringify(setup.leadTape ?? null)}`;
  const [preview, setPreview] = useState<{ bagKey: string; id: string | null }>({
    bagKey,
    id: null,
  });
  const previewStringId = preview.bagKey === bagKey ? preview.id : null;
  const setPreviewStringId = (id: string | null) => setPreview({ bagKey, id });

  useEffect(() => {
    if (usePlayerStore.persist.hasHydrated()) setHydrated(true);
  }, [setHydrated]);

  const racket = useMemo(
    () => rackets.find((r) => r.slug === setup.racketSlug) ?? null,
    [rackets, setup.racketSlug],
  );
  const string = useMemo(
    () => strings.find((s) => s.id === setup.stringId) ?? null,
    [strings, setup.stringId],
  );
  const grip = useMemo(() => {
    const outerId = setup.gripLayers?.[setup.gripLayers.length - 1]?.id ?? setup.gripId;
    return outerId ? grips.find((g) => g.id === outerId) ?? null : null;
  }, [grips, setup.gripId, setup.gripLayers]);
  const armFriendly = prefersArmFriendlySetup(profile);

  const previewString = useMemo(
    () => (previewStringId ? strings.find((s) => s.id === previewStringId) ?? null : null),
    [previewStringId, strings],
  );
  const activeString = previewString ?? string;
  const stringPreviewing = Boolean(
    previewString && (!string || previewString.id !== string.id),
  );
  const activeSetup = useMemo(
    () => (previewString ? previewSetupWithString(setup, previewString) : setup),
    [previewString, setup],
  );

  const insight = useMemo(
    () =>
      synthesizeCombinedSetup(setup, racket, string, grip, grips, {
        playerGrip: profile.grips.forehand,
        armFriendly,
        generatesOwnPower: profile.preferences.generatesOwnPower,
        valuesDurability: profile.preferences.valuesDurability,
      }),
    [
      setup,
      racket,
      string,
      grip,
      grips,
      profile.grips.forehand,
      armFriendly,
      profile.preferences.generatesOwnPower,
      profile.preferences.valuesDurability,
    ],
  );

  const displayInsight = useMemo(
    () =>
      stringPreviewing
        ? synthesizeCombinedSetup(activeSetup, racket, activeString, grip, grips, {
            playerGrip: profile.grips.forehand,
            armFriendly,
            generatesOwnPower: profile.preferences.generatesOwnPower,
            valuesDurability: profile.preferences.valuesDurability,
          })
        : insight,
    [
      stringPreviewing,
      activeSetup,
      racket,
      activeString,
      grip,
      grips,
      profile.grips.forehand,
      armFriendly,
      profile.preferences.generatesOwnPower,
      profile.preferences.valuesDurability,
      insight,
    ],
  );

  const strikeZone = useMemo(
    () =>
      strikeZoneForFrame({
        ...(racket ?? {}),
        idealLaunchAngleDeg: displayInsight.launchAngleDeg,
        idealSwingPathDeg: displayInsight.swingPathDeg,
        spin: displayInsight.scores.spin,
        control: displayInsight.scores.control,
        power: displayInsight.scores.power,
      }),
    [racket, displayInsight.launchAngleDeg, displayInsight.swingPathDeg, displayInsight.scores],
  );
  const patterns = useMemo(() => derivePatterns(profile).slice(0, 3), [profile]);
  const pending = profile.decisions.filter((d) => d.result === "pending");
  const needsGrip = !profile.grips.forehand;
  const needsBag = !hasAnyGear(setup);

  if (!hydrated) {
    return <CourtLoading label="Loading your court…" />;
  }


  return (
    <div className="sf-page">
      <div className="mb-6">
        <YouIdentity profile={profile} setup={setup} pros={pros} onEdit={() => setPlayerCardOpen(true)} />
      </div>

      <div className="sf-sticky-tabs">
      <div className="sf-tab-track" role="tablist" aria-label="You">
        {(
          [
            ["today", "Today"],
            ["bag", "Bag"],
            ["play", "Play"],
            ["history", "History"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="sf-tab"
          >
            {label}
          </button>
        ))}
      </div>
      </div>

      <div className="mt-8">
        {tab === "today" && needsBag && (
          <div className="space-y-4">
            <div className="sf-panel flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div className="min-w-0">
                <p className="sf-spec-label">Bag · Empty</p>
                <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.01em]">Add a frame to see how your setup plays</p>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {rackets.length} frames, {strings.length} strings and {grips.length} grips with measured specs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/gear?tab=rackets" className="sf-btn sf-btn-primary !min-h-10 !text-[13px]">
                  Open racket database
                </Link>
                <Link href="/gear?tab=overview&finder=1" className="sf-text-link text-[13px]">
                  Quick start
                </Link>
              </div>
            </div>
          </div>
        )}

        {tab === "today" && !needsBag && (
          <div className="space-y-6">
            {needsGrip ? (
              <button
                type="button"
                onClick={() => setPlayerCardOpen(true)}
                className="sf-alert sf-alert-accent w-full text-left"
              >
                Tell us your forehand grip to see your racket-face angle at contact (optional).
              </button>
            ) : null}

            <WorkOnThis insight={displayInsight} />


            {displayInsight.hasAny ? (
              <CourtReadyVerdict playability={displayInsight.playability} compact />
            ) : null}

            <div className="sf-panel px-4 py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="sf-label">Bag</p>
                  <p className="mt-0.5 text-sm">{hasAnyGear(setup) ? setupSummary(setup) : "No bag yet"}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setTab("bag")} className="sf-text-link">
                    Tweak bag
                  </button>
                  <Link href="/lab" className="sf-text-link">
                    Lab
                  </Link>
                  <Link href="/gear?tab=lead-tape" className="sf-text-link">
                    Tape
                  </Link>
                </div>
              </div>
            </div>

            {insight.hasAny || racket ? (
              <>
                {(insight.hasRacket || racket) && (
                  <YouStringCompare
                    setup={setup}
                    string={string}
                    strings={strings}
                    baseline={insight}
                    preview={displayInsight}
                    previewStringId={previewStringId}
                    onSelectPreviewId={setPreviewStringId}
                  />
                )}
                <SetupVisualStory
                  scores={displayInsight.scores}
                  stock={displayInsight.stockScores}
                  role={displayInsight.playstyle}
                  flight={displayInsight.flight}
                  launchDeg={displayInsight.launchAngleDeg}
                  pathDeg={displayInsight.swingPathDeg}
                  zone={strikeZone}
                  forehand={displayInsight.forehand}
                  pieces={setup.leadTape?.pieces ?? []}
                  hasRacket={displayInsight.hasRacket}
                  racket={racket}
                  string={activeString}
                  moldDeltas={displayInsight.deltas}
                  scoreDeltas={displayInsight.scoreDeltas}
                  hasTape={displayInsight.hasTape}
                  previewing={stringPreviewing}
                />
              </>
            ) : (
              <CourtEmpty
                kicker="One piece missing"
                title="Add a racket to see how your bag plays"
                body="With a frame saved we calculate launch, spin window, and whether the whole setup is court-ready."
                primary={{ href: "/gear?tab=rackets", label: "Browse rackets" }}
                secondary={{ href: "/lab", label: "Open form lab" }}
              />
            )}

            {displayInsight.hasAny ? (
              <InBandImproveSection plan={displayInsight.inBand} compact />
            ) : null}

            {pending.length > 0 && (
              <button
                type="button"
                onClick={() => setTab("history")}
                className="sf-alert w-full text-left"
              >
                Resolve pending decision: {pending[0].changeSummary}
              </button>
            )}

            <button
              type="button"
              onClick={() => setTab("play")}
              className="sf-btn sf-btn-primary w-full"
            >
              Log last hit
            </button>

            {patterns.length > 0 && (
              <div className="space-y-2">
                {patterns.map((p) => (
                  <p key={p.id} className="sf-panel px-3 py-2.5 text-sm">
                    <span className="font-medium">{p.title}.</span>{" "}
                    <span className="text-[var(--muted)]">{p.detail}</span>
                  </p>
                ))}
              </div>
            )}
            <p className="text-xs text-[var(--muted)]">{recentBodyTrend(profile.sessions)}</p>
          </div>
        )}

        {tab === "bag" && (
          <BagTab rackets={rackets} strings={strings} grips={grips} />
        )}
        {tab === "play" && <AfterPlayTab />}
        {tab === "history" && <HistoryTab />}
      </div>

      {playerCardOpen ? (
        <PlayerCardSheet
          rackets={rackets}
          strings={strings}
          grips={grips}
          pros={pros}
          onClose={() => setPlayerCardOpen(false)}
        />
      ) : null}
    </div>
  );
}

