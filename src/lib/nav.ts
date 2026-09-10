/**
 * Primary product tabs — keep AppHeader and MobileAppNav in sync via this list.
 */
export const PRIMARY_NAV = [
  {
    href: "/you",
    label: "You",
    match: (p: string) => p === "/you" || p.startsWith("/profile"),
  },
  {
    href: "/lab",
    label: "Lab",
    match: (p: string) => p === "/lab" || p.startsWith("/lab/"),
  },
  {
    href: "/gear",
    label: "Gear",
    match: (p: string) => p === "/gear" || p.startsWith("/gear/"),
  },
  {
    href: "/pickleball",
    label: "Pickle",
    match: (p: string) => p === "/pickleball" || p.startsWith("/pickleball/"),
  },
] as const;

export type PrimaryNavHref = (typeof PRIMARY_NAV)[number]["href"];
