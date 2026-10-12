"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { hasAnyGear, setupSummary, useGearStore } from "@/store/gearStore";
import { usePlayerStore } from "@/store/playerStore";
import { BagIcon } from "./NavIcons";

const noopSubscribe = () => () => {};

/** True after hydration; persisted stores differ from the server render until then. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Header bag button: count of pieces in the bag, with an amber mark when a
 * logged gear change still needs a verdict. Full setup in the tooltip.
 */
export function BagButton() {
  const hydrated = useHydrated();
  const setup = useGearStore((s) => s.setup);
  // Stable selector ref — never return a fresh .filter() array from a store selector
  const decisions = usePlayerStore((s) => s.profile?.decisions);

  const pending = useMemo(() => (decisions ?? []).filter((d) => d.result === "pending"), [decisions]);

  const count = useMemo(() => {
    if (!setup) return 0;
    const grip = (setup.gripLayers?.length ?? 0) > 0 || Boolean(setup.gripId);
    return [setup.racketSlug, setup.stringId, grip].filter(Boolean).length;
  }, [setup]);

  const filled = hydrated && setup && hasAnyGear(setup);
  const title = !hydrated
    ? "Your bag"
    : pending.length > 0
      ? `Gear change to review: ${pending[0].changeSummary}`
      : filled
        ? setupSummary(setup)
        : "Bag empty — pick a racket";

  return (
    <Link
      href={filled || pending.length > 0 ? "/you" : "/gear?tab=rackets"}
      className="sf-icon-btn sf-bag-btn"
      aria-label={title}
      title={title}
    >
      <BagIcon className="h-[18px] w-[18px]" />
      {hydrated && count > 0 ? <span className="sf-bag-count sf-readout">{count}</span> : null}
      {hydrated && pending.length > 0 ? <span className="sf-bag-alert" aria-hidden /> : null}
    </Link>
  );
}
