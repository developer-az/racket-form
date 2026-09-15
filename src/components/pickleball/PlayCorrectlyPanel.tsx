"use client";

import { useState } from "react";
import type { DoublesLesson } from "@/types/pickleball";
import { PickleDiagram } from "./PickleDiagrams";

export function PlayCorrectlyPanel({ lessons }: { lessons: DoublesLesson[] }) {
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? "");
  const active = lessons.find((l) => l.id === activeId) ?? lessons[0];

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--line)] pb-5">
        <p className="sf-kicker sf-kicker-muted">Doubles first</p>
        <h2 className="sf-section-title mt-1">Play the geometry</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          High-level doubles decisions — lane ownership, kitchen discipline, serve/return races,
          when to stay back vs go up, stacking with intent, and attack vs reset at the line.
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

      {active ? (
        <section className="sf-panel grid gap-6 p-4 md:grid-cols-2 md:p-6">
          <div>
            <p className="sf-kicker sf-kicker-muted">
              {active.step} · {active.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">{active.blurb}</p>
            <ul className="mt-4 space-y-3">
              {active.points.map((point) => (
                <li
                  key={point}
                  className="border-l border-[var(--line-strong)] pl-3 text-sm leading-relaxed text-[var(--muted)]"
                >
                  <span className="text-[var(--foreground)]/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-viz-stage">
            {active.diagram ? <PickleDiagram kind={active.diagram} /> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
