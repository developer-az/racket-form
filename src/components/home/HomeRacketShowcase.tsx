"use client";

import Link from "next/link";
import type { FeaturedRacket } from "@/lib/home/featuredRacket";

export function HomeRacketShowcase({ racket }: { racket: FeaturedRacket }) {
  const summary = racket.summary.replace(/\s+/g, " ").trim();
  const shortSummary =
    summary.length <= 160
      ? summary
      : `${summary.slice(0, Math.max(summary.slice(0, 160).lastIndexOf(" "), 80)).trim()}...`;

  return (
    <section className="sf-racket-stage relative overflow-hidden border-y border-[var(--line)]">
      <div className="sf-racket-stage-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-[var(--page-max-wide)] items-center gap-10 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:px-10 md:py-28 lg:px-14">
        <div className="sf-rise order-2 md:order-1">
          <p className="sf-kicker">Gear intelligence</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-5xl">
            Real frames.
            <br />
            Real photos.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--muted)] md:text-base">
            {racket.brand} {racket.model} — pulled live from the catalog with a product photo, not a
            placeholder silhouette.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--foreground)]/80">
            {shortSummary}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/gear?tab=rackets&racket=${encodeURIComponent(racket.slug)}`}
              className="sf-btn sf-btn-primary"
            >
              Open this frame
            </Link>
            <Link href="/gear?tab=rackets" className="sf-btn sf-btn-secondary">
              Browse rackets
            </Link>
          </div>
        </div>

        <div className="sf-rise order-1 md:order-2" style={{ animationDelay: "0.1s" }}>
          <Link
            href={`/gear?tab=rackets&racket=${encodeURIComponent(racket.slug)}`}
            className="sf-racket-feature group block focus-visible:outline-none"
          >
            <div className="sf-racket-feature-plane">
              {/* eslint-disable-next-line @next/next/no-img-element -- TW JPEG redirects + mixed hosts */}
              <img
                src={racket.imageUrl}
                alt={`${racket.brand} ${racket.model}`}
                width={420}
                height={560}
                className="sf-racket-feature-img"
                decoding="async"
              />
            </div>
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight transition group-hover:text-[var(--accent)] md:text-2xl">
                  {racket.brand} {racket.model}
                </p>
                <p className="mt-1 text-xs tracking-[0.12em] text-[var(--muted)] uppercase">
                  {racket.year} · {racket.style}
                </p>
              </div>
              <p className="text-xs font-semibold tracking-[0.1em] text-[var(--accent)] uppercase">
                View →
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
