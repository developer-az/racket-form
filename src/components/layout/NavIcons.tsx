import type { NavIconKey } from "@/lib/nav";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Ball trajectory over a baseline — the Form Lab's motion capture. */
export function LabIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 19h18" />
      <path d="M4 15c3-8 9-10 16-6" strokeDasharray="0.1 3.2" />
      <circle cx="19.5" cy="9" r="2" />
      <path d="M6 19v-3M12 19v-2M18 19v-1" opacity="0.6" />
    </svg>
  );
}

/** Racket glyph, held diagonally. */
export function GearIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <ellipse cx="14.5" cy="9.5" rx="5" ry="6.2" transform="rotate(45 14.5 9.5)" />
      <path d="M12 7l5 5M14.5 5.5l-3 3M17.5 8.5l-3 3" opacity="0.55" />
      <path d="M10.2 13.8L4 20" strokeWidth="2.2" />
    </svg>
  );
}

export function YouIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20.2c1.2-3.6 4-5.4 7.2-5.4s6 1.8 7.2 5.4" />
    </svg>
  );
}

/** Perforated pickleball. */
export function PickleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.4" cy="13.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="13.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="8" width="17" height="11.5" rx="2.5" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      <path d="M3.5 12.5h17" opacity="0.6" />
    </svg>
  );
}

export function NavIcon({ name, className }: { name: NavIconKey; className?: string }) {
  switch (name) {
    case "lab":
      return <LabIcon className={className} />;
    case "gear":
      return <GearIcon className={className} />;
    case "you":
      return <YouIcon className={className} />;
    case "pickle":
      return <PickleIcon className={className} />;
  }
}
