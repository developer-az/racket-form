"use client";

import type { RacketProfile } from "@/types/equipment";
import { racketImageUrl } from "@/lib/equipment/media/urls";

/** Catalog photo that falls back to the generated SVG portrait when the remote image fails. */
export function RacketImg({ racket, className }: { racket: Pick<RacketProfile, "slug">; className?: string }) {
  const src = racketImageUrl(racket);
  const fallback = (img: HTMLImageElement) => {
    if (img.dataset.fallback === "1") return;
    img.dataset.fallback = "1";
    img.src = `${src}${src.includes("?") ? "&" : "?"}format=svg`;
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote catalog photo with SVG fallback
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={className}
      // A server-rendered image can fail before hydration attaches onError
      ref={(img) => {
        if (img && img.complete && img.naturalWidth === 0) fallback(img);
      }}
      onError={(e) => fallback(e.currentTarget)}
    />
  );
}
