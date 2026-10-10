"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { profileLooksStarted } from "@/lib/player/onboarding";

export function HomeHeroCtas() {
  const profile = usePlayerStore((s) => s.profile);
  const hydrated = usePlayerStore((s) => s.hydrated);
  const setHydrated = usePlayerStore((s) => s.setHydrated);

  useEffect(() => {
    if (usePlayerStore.persist.hasHydrated()) setHydrated(true);
  }, [setHydrated]);

  const returning = hydrated && profileLooksStarted(profile);

  return (
    <div className="sf-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.18s" }}>
      {returning ? (
        <Link href="/you" className="sf-btn sf-btn-primary sf-btn-glow">
          Open your court
        </Link>
      ) : (
        <Link href="/gear" className="sf-btn sf-btn-primary sf-btn-glow">
          Find my setup
        </Link>
      )}
      <Link href="/lab" className="sf-btn sf-btn-secondary">
        Enter form lab
      </Link>
    </div>
  );
}
