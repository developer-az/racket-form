"use client";

import { useState } from "react";

/** Product photo from the media API; an empty neutral well when there is none or it fails. */
export function GearImg({ src, className, alt = "" }: { src: string; className?: string; alt?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return <span className={`sf-photo-none ${className ?? ""}`} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote catalog photo
    <img
      src={src}
      alt={alt}
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
