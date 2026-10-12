/**
 * Primary product tabs — keep AppHeader and MobileAppNav in sync via this list.
 */
export type NavIconKey = "lab" | "gear" | "you" | "pickle";

export const PRIMARY_NAV = [
  {
    href: "/lab",
    label: "Form Lab",
    shortLabel: "Lab",
    icon: "lab" as NavIconKey,
    match: (p: string) => p === "/lab" || p.startsWith("/lab/"),
  },
  {
    href: "/gear",
    label: "Gear",
    shortLabel: "Gear",
    icon: "gear" as NavIconKey,
    match: (p: string) => p === "/gear" || p.startsWith("/gear/"),
  },
  {
    href: "/you",
    label: "You",
    shortLabel: "You",
    icon: "you" as NavIconKey,
    match: (p: string) => p === "/you" || p.startsWith("/profile"),
  },
  {
    href: "/pickleball",
    label: "Pickleball",
    shortLabel: "Pickle",
    icon: "pickle" as NavIconKey,
    match: (p: string) => p === "/pickleball" || p.startsWith("/pickleball/"),
  },
] as const;

export type PrimaryNavHref = (typeof PRIMARY_NAV)[number]["href"];
