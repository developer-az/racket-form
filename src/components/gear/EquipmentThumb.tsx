"use client";

import { GearImg } from "@/components/gear/explorer/GearImg";

/** Product photo via media API (TW redirect), or a neutral well when there is none. */
export function EquipmentThumb({
  src,
  alt,
  size = "sm",
}: {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg"
      ? "h-44 w-32 sm:h-52 sm:w-36"
      : size === "md"
        ? "h-28 w-[5.5rem]"
        : "h-[4.5rem] w-14";

  return (
    <span className={`sf-thumb-well relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] ${dim}`}>
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_srgb,var(--foreground)_8%,transparent),transparent_58%)]"
        aria-hidden
      />
      <GearImg src={src} alt={alt} className={`relative z-[1] ${dim} object-contain object-center`} />
    </span>
  );
}
