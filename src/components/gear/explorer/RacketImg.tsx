"use client";

import { useState } from "react";
import type { RacketProfile } from "@/types/equipment";
import { racketImageUrl } from "@/lib/equipment/media/urls";

/**
 * Catalog photo. Frames with no known photo, or whose photo fails to load, get an
 * empty neutral well rather than a drawn stand-in.
 */
export function RacketImg({
  racket,
  className,
}: {
  racket: Pick<RacketProfile, "slug"> & { hasPhoto?: boolean };
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = racketImageUrl(racket);
  if (racket.hasPhoto === false || failedSrc === src) {
    return <span className={`sf-photo-none ${className ?? ""}`} aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote catalog photo
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={className}
      // A server-rendered image can fail before hydration attaches onError
      ref={(img) => {
        if (img && img.complete && img.naturalWidth === 0) setFailedSrc(src);
      }}
      onError={() => setFailedSrc(src)}
    />
  );
}
