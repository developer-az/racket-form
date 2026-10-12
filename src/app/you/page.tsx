import type { Metadata } from "next";
import { YouHub } from "@/components/you/YouHub";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { loadRackets } from "@/lib/equipment/rackets";
import { STRINGS } from "@/data/equipment/strings";
import { GRIPS } from "@/data/equipment/grips";
import { PLAYERS } from "@/data/players";

export const metadata: Metadata = {
  title: "You",
  description: "Your player card: build, grips, bag and every logged session.",
};

export default async function YouPage() {
  const { rackets } = await loadRackets();
  return (
    <div className="flex flex-1 flex-col">
      <YouHub
        rackets={rackets}
        strings={STRINGS}
        grips={GRIPS}
        pros={PLAYERS.map((p) => ({
          id: p.id,
          name: p.name,
          shortName: p.shortName,
          heightM: p.anthropometrics.heightM,
          dominantHand: p.dominantHand,
          backhandStyle: p.backhandStyle,
        }))}
      />
      <SiteFooter />
    </div>
  );
}
