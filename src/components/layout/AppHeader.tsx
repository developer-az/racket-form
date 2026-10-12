"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SyncStatusPill } from "@/components/auth/SyncStatusPill";
import { authDisplayLabel, useAuthStore } from "@/store/authStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PRIMARY_NAV } from "@/lib/nav";
import { BagButton, useHydrated } from "./BagButton";
import { CommandPalette, openSearchPalette } from "./CommandPalette";
import { NavIcon, SearchIcon, YouIcon } from "./NavIcons";

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function AppHeader() {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const account = useAuthStore((s) => s.account);
  const cloudReady = isSupabaseConfigured();
  const hydrated = useHydrated();
  const isMac = hydrated && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const fullName = account ? `${account.firstName} ${account.lastName}`.trim() : "";
  const accountLabel = user ? fullName || authDisplayLabel(account, user) : "Sign in";

  return (
    <header
      className={`sf-header sticky top-0 z-50 shrink-0 ${isHome ? "sf-header-home" : ""}`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        height: "var(--header-h)",
      }}
    >
      <div className="sf-header-bar mx-auto h-[var(--header-bar)] w-full max-w-[var(--page-max)] px-[max(1rem,env(safe-area-inset-left))] md:max-w-[var(--page-max-wide)] md:px-8">
        <Link href="/" className="sf-nav-brand group flex min-w-0 items-center gap-2.5" aria-label="Racket Form home">
          <svg className="sf-nav-mark" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <defs>
              <clipPath id="rf-mark-head">
                <ellipse cx="11" cy="8.5" rx="5.6" ry="6.8" />
              </clipPath>
            </defs>
            <g clipPath="url(#rf-mark-head)" stroke="currentColor" strokeWidth="0.9" opacity="0.55">
              <path d="M8.2 0v17M11 0v17M13.8 0v17M3 5.6h16M3 8.5h16M3 11.4h16" />
            </g>
            <ellipse cx="11" cy="8.5" rx="5.6" ry="6.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 15.3V21" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="sf-nav-wordmark whitespace-nowrap text-[15px] font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            Racket Form
          </span>
        </Link>

        {/* Small screens use the bottom bar on product pages */}
        <nav className="sf-nav-tabs hidden md:flex" aria-label="Primary">
          {PRIMARY_NAV.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="sf-nav-tab"
              >
                <NavIcon name={link.icon} className="h-4 w-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <button type="button" onClick={openSearchPalette} className="sf-search-trigger" aria-label="Search" title={isMac ? "Search (⌘K)" : "Search (Ctrl+K)"}>
            <SearchIcon className="h-4 w-4 shrink-0" />
            <span className="sf-search-trigger-text">Search</span>
            <kbd className="sf-kbd sf-search-trigger-kbd">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>

          {user ? (
            <span className="hidden xl:inline-flex">
              <SyncStatusPill compact />
            </span>
          ) : null}

          <BagButton />
          <ThemeToggle />

          {initialized ? (
            <Link
              href={user ? "/account" : "/account/login"}
              className="sf-icon-btn"
              aria-label={user ? `Account: ${accountLabel}` : "Sign in"}
              title={cloudReady ? accountLabel : "Local court — sign in when cloud is configured"}
            >
              {user ? (
                <span className="sf-avatar">{initials(accountLabel) || "·"}</span>
              ) : (
                <YouIcon className="h-[18px] w-[18px]" />
              )}
            </Link>
          ) : (
            <span className="sf-icon-btn" aria-hidden />
          )}
        </div>
      </div>
      <CommandPalette />
    </header>
  );
}
