import { HomeHeroDemo } from "@/components/home/HomeHeroDemo";
import { HomeHeroSelect } from "@/components/home/HomeHeroSelect";
import { HomeRacketShowcase } from "@/components/home/HomeRacketShowcase";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { pickRandomFeaturedRacket } from "@/lib/home/featuredRacket";
import { loadRackets } from "@/lib/equipment/rackets";
import Link from "next/link";

export default async function Home() {
  const { rackets } = await loadRackets();
  const featured = pickRandomFeaturedRacket(rackets);

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1">
        <HomeHeroDemo />

        {featured ? <HomeRacketShowcase racket={featured} /> : null}

        <HomeHeroSelect />

        <section className="border-t border-[var(--line)] bg-[var(--bg-sunken)]/70">
          <div className="mx-auto flex w-full max-w-[var(--page-max-wide)] flex-col gap-8 px-6 py-16 md:flex-row md:items-end md:justify-between md:px-10 md:py-20 lg:px-14">
            <div className="max-w-xl">
              <p className="sf-kicker">Gear database</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                Every spec, side by side.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
                Filter {rackets.length} frames by weight, swingweight, stiffness and balance. Plot the
                whole market on any two specs, compare up to four frames, and see how each one launches
                the ball.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/gear?tab=rackets" className="sf-btn sf-btn-primary">
                Open racket database
              </Link>
              <Link href="/gear?tab=strings" className="sf-btn sf-btn-secondary">
                Strings
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
