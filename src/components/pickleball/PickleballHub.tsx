"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DoublesLesson, PaddleProfile, PickleballTab, ShotStrategyCard } from "@/types/pickleball";
import { PaddleTechPanel } from "./PaddleTechPanel";
import { PlayCorrectlyPanel } from "./PlayCorrectlyPanel";
import { ShotStrategyPanel } from "./ShotStrategyPanel";

const TABS: { id: PickleballTab; label: string; short: string; blurb: string }[] = [
  {
    id: "paddle-tech",
    label: "Paddle tech",
    short: "Paddles",
    blurb:
      "Lab-measured cores and faces plus a growing tour-seed catalog — pick a paddle and learn it beside the grid.",
  },
  {
    id: "play-correctly",
    label: "Play correctly",
    short: "Doubles",
    blurb:
      "High-level doubles geometry: when to stay back vs go up, transition timing, stacking, kitchen battles, fast hands.",
  },
  {
    id: "shot-strategy",
    label: "Shot strategy",
    short: "Shots",
    blurb:
      "Serve returns, dink patterns, drops, drives, resets, speed-ups, feet/hips targeting, hand battles, Erne awareness.",
  },
];

const TAB_IDS = new Set<PickleballTab>(TABS.map((t) => t.id));
const DEFAULT_TAB: PickleballTab = "paddle-tech";

function parseTab(raw: string | null): PickleballTab {
  if (raw && TAB_IDS.has(raw as PickleballTab)) return raw as PickleballTab;
  return DEFAULT_TAB;
}

export function PickleballHub({
  paddles,
  lessons,
  strategies,
}: {
  paddles: PaddleProfile[];
  lessons: DoublesLesson[];
  strategies: ShotStrategyCard[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = parseTab(searchParams.get("tab"));
  const paddleParam = searchParams.get("paddle");

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (!raw || !TAB_IDS.has(raw as PickleballTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", DEFAULT_TAB);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTab = (id: PickleballTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const selectPaddle = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "paddle-tech");
    params.set("paddle", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeBlurb = TABS.find((t) => t.id === tab)?.blurb;

  return (
    <div className="sf-page">
      <header className="mb-5 border-b border-[var(--line)] pb-6 md:mb-6 md:pb-8">
        <p className="sf-kicker sf-kicker-muted">Court sibling · pickleball</p>
        <h1 className="sf-page-title mt-1 max-w-xl">Pickleball</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Gear that matches how you play, then doubles decisions that win points — when to stay
          back, when to claim the kitchen line, and which shot the ball actually asks for.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tracking-wide text-[var(--muted)]">
          <span>{paddles.length} paddles</span>
          <span aria-hidden className="text-[var(--line-strong)]">
            ·
          </span>
          <span>{lessons.length} doubles lessons</span>
          <span aria-hidden className="text-[var(--line-strong)]">
            ·
          </span>
          <span>{strategies.length} shot plays</span>
        </div>
      </header>

      <div className="sf-sticky-tabs">
        <div className="sf-tab-track" role="tablist" aria-label="Pickleball section">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`pickle-panel-${t.id}`}
                id={`pickle-tab-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(t.id)}
                onKeyDown={(e) => {
                  const idx = TABS.findIndex((x) => x.id === t.id);
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    selectTab(TABS[(idx + 1) % TABS.length].id);
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    selectTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
                  }
                }}
                className="sf-tab"
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
        {activeBlurb ? (
          <p className="max-w-3xl pb-3 pt-1 text-xs leading-relaxed text-[var(--muted)] md:pb-0">
            {activeBlurb}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 mt-4 md:mt-6">
        {tab === "paddle-tech" ? (
          <div
            id="pickle-panel-paddle-tech"
            role="tabpanel"
            aria-labelledby="pickle-tab-paddle-tech"
          >
            <PaddleTechPanel
              paddles={paddles}
              selectedId={paddleParam}
              onSelect={selectPaddle}
            />
          </div>
        ) : null}
        {tab === "play-correctly" ? (
          <div
            id="pickle-panel-play-correctly"
            role="tabpanel"
            aria-labelledby="pickle-tab-play-correctly"
          >
            <PlayCorrectlyPanel lessons={lessons} />
          </div>
        ) : null}
        {tab === "shot-strategy" ? (
          <div
            id="pickle-panel-shot-strategy"
            role="tabpanel"
            aria-labelledby="pickle-tab-shot-strategy"
          >
            <ShotStrategyPanel strategies={strategies} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
