"use client";

/** Product photo from the media API that falls back to its generated SVG portrait. */
export function GearImg({ src, className, alt = "" }: { src: string; className?: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote catalog photo with SVG fallback
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.dataset.fallback === "1" || !src.includes("/api/equipment/")) return;
        img.dataset.fallback = "1";
        img.src = `${src}${src.includes("?") ? "&" : "?"}format=svg`;
      }}
    />
  );
}
