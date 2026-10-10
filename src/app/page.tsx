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
              <p className="sf-kicker">Your setup</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                A complete bag in four taps.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
                Tell us how you play. We match frame weight, head size, stiffness, string and
                tension, explain every pick, and show how the whole setup plays.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/gear" className="sf-btn sf-btn-primary">
                Find my setup
              </Link>
              <Link href="/gear?tab=rackets" className="sf-btn sf-btn-secondary">
                Browse rackets
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
