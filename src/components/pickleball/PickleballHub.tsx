"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
      "Measured cores, faces, swingweight, and real product photos — how gear trades control for power.",
  },
  {
    id: "play-correctly",
    label: "Play correctly",
    short: "Doubles",
    blurb:
      "Doubles geometry, kitchen battles, third-shot selection, stacking when it helps, unit transitions.",
  },
  {
    id: "shot-strategy",
    label: "Shot strategy",
    short: "Shots",
    blurb:
      "Dink patterns, drops, drives, resets, speed-ups, feet/hips targeting, Erne/ATP awareness.",
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
  const reduceMotion = useReducedMotion();
  const tab = parseTab(searchParams.get("tab"));

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

  const activeBlurb = TABS.find((t) => t.id === tab)?.blurb;

  return (
    <div className="sf-page">
      <header className="mb-5 border-b border-[var(--line)] pb-5 md:mb-6">
        <p className="sf-kicker">Court sibling · pickleball</p>
        <h1 className="sf-page-title mt-1">Pickleball</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Start with paddle tech, then learn doubles the right way, then build a smart shot toolkit —
          dinks, drops, drives, and resets that win points without banging every ball.
        </p>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "paddle-tech" ? (
              <div
                id="pickle-panel-paddle-tech"
                role="tabpanel"
                aria-labelledby="pickle-tab-paddle-tech"
              >
                <PaddleTechPanel paddles={paddles} />
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
