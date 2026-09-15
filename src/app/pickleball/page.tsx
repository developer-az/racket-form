import { Suspense } from "react";
import type { Metadata } from "next";
import { PickleballHub } from "@/components/pickleball/PickleballHub";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CourtLoading } from "@/components/ui/CourtState";
import { loadPaddles } from "@/lib/pickleball/paddles";
import { DOUBLES_LESSONS } from "@/data/pickleball/doublesLessons";
import { SHOT_STRATEGIES } from "@/data/pickleball/shotStrategy";

export const metadata: Metadata = {
  title: "Pickleball",
  description:
    "Pickleball hub: lab-measured and tour-seed paddles, high-level doubles geometry, and shot strategy — serve returns, dinks, drops, drives, and resets.",
};

export default function PickleballPage() {
  const { paddles } = loadPaddles();

  return (
    <div className="flex flex-1 flex-col">
      <Suspense
        fallback={
          <div className="sf-page">
            <CourtLoading
              label="Loading pickleball…"
              detail="Paddle tech, doubles geometry, and shot strategy."
            />
          </div>
        }
      >
        <PickleballHub paddles={paddles} lessons={DOUBLES_LESSONS} strategies={SHOT_STRATEGIES} />
      </Suspense>

      <SiteFooter
        note={
          "Lab-measured paddles use Pickleball Effect static specs, swingweight, twist, balance, spin RPM, and power/pop MPH; score bars map those percentiles for coaching compare. Tour-seed paddles are a local curated catalog (no public tour-paddle API) with manufacturer/coaching estimates so popular high-level models can grow here. Product photos redirect from Tennis Warehouse CDN when matched — otherwise a crafted SVG portrait. Coaching lessons are teaching context, not USA Pickleball rulebook substitutes."
        }
      />
    </div>
  );
}
