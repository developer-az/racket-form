"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/lib/nav";
import { NavIcon } from "./NavIcons";

function showOnPath(pathname: string): boolean {
  return pathname === "/" || PRIMARY_NAV.some((l) => l.match(pathname));
}

export function MobileAppNav() {
  const pathname = usePathname() ?? "/";
  const visible = showOnPath(pathname);

  useEffect(() => {
    document.documentElement.dataset.appNav = visible ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.appNav;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <nav className="sf-app-nav" aria-label="Primary">
      {PRIMARY_NAV.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className="sf-app-nav-link"
          >
            <NavIcon name={link.icon} className="h-5 w-5" />
            <span>{link.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
