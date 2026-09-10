"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DoublesLesson } from "@/types/pickleball";
import { PickleDiagram } from "./PickleDiagrams";

export function PlayCorrectlyPanel({ lessons }: { lessons: DoublesLesson[] }) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? "");
  const active = lessons.find((l) => l.id === activeId) ?? lessons[0];

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="sf-kicker">Doubles first</p>
        <h2 className="sf-section-title mt-1">How to play correctly</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Progression for real matches — court jobs, kitchen awareness, third-shot selection,
          stacking when it helps, kitchen battles, and moving as a unit.
        </p>
      </header>

      <ol className="flex flex-wrap gap-1" aria-label="Lesson steps">
        {lessons.map((lesson) => {
          const on = lesson.id === active?.id;
          return (
            <li key={lesson.id}>
              <button
                type="button"
                onClick={() => setActiveId(lesson.id)}
                aria-current={on ? "step" : undefined}
                aria-selected={on}
                role="tab"
                className="sf-tab inline-flex items-center gap-2"
              >
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--muted)]">
                  {lesson.step}
                </span>
                <span className="max-w-[9rem] truncate sm:max-w-none">{lesson.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.section
            key={active.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="sf-panel grid gap-6 p-4 md:grid-cols-2 md:p-6"
          >
            <div>
              <p className="sf-kicker !text-[var(--muted)]">
                {active.step} · {active.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">{active.blurb}</p>
              <ul className="mt-4 space-y-3">
                {active.points.map((point, i) => (
                  <motion.li
                    key={point}
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduceMotion ? 0 : 0.04 * i, duration: 0.25 }}
                    className="border-l-2 border-[var(--accent)] pl-3 text-sm leading-relaxed text-[var(--muted)]"
                  >
                    <span className="text-[var(--foreground)]/90">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="rounded-md bg-[var(--bg-sunken)] p-3 md:p-4">
              {active.diagram ? (
                <PickleDiagram kind={active.diagram} />
              ) : (
                <div className="flex h-full min-h-[160px] flex-col justify-center gap-2 p-4">
                  <p className="sf-kicker">Unit movement</p>
                  <p className="text-sm text-[var(--muted)]">
                    After every neutralizing ball, take one step in together.
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
