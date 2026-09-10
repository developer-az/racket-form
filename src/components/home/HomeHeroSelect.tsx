"use client";

import Link from "next/link";
import { PLAYERS } from "@/data/players";
import { useCoachStore } from "@/store/coachStore";

/** Personalization beat — after prowess (3D + racket), invite choosing a model athlete. */
export function HomeHeroSelect() {
  const setPlayer = useCoachStore((s) => s.setPlayer);

  return (
    <section id="athletes" className="relative overflow-hidden">
      <div className="sf-hero-select-wash pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto w-full max-w-[var(--page-max-wide)] px-6 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="max-w-2xl">
          <p className="sf-kicker">Select your hero</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-5xl">
            Whose rail do you want to scrub?
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--muted)] md:text-base">
            Pick a model athlete. Form Lab loads their stroke keyframes — same biomechanics, distinct
            mechanical fingerprint.
          </p>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLAYERS.map((p, i) => (
            <li key={p.id} className="sf-rise" style={{ animationDelay: `${0.04 * i}s` }}>
              <Link
                href={`/lab?player=${p.id}`}
                onClick={() => setPlayer(p.id)}
                className="sf-hero-pick group flex h-full flex-col justify-between"
              >
                <div>
                  <span
                    className="sf-hero-pick-swatch"
                    style={{ background: p.color, boxShadow: `0 0 0 2px ${p.accent}` }}
                    aria-hidden
                  />
                  <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight transition group-hover:text-[var(--accent)]">
                    {p.name}
                  </p>
                  <p className="mt-1 text-xs tracking-[0.12em] text-[var(--muted)] uppercase">
                    {p.nationality} · {p.era}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
                    {p.playingStyle}
                  </p>
                </div>
                <p className="mt-6 text-xs font-semibold tracking-[0.1em] text-[var(--accent)] uppercase">
                  Scrub in lab →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
