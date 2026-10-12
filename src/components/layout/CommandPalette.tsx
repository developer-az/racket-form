"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Portal } from "@/components/gear/explorer/Portal";
import { searchMatchScore } from "@/lib/equipment/search";
import { equipmentLabel } from "@/lib/equipment/labels";
import { SearchIcon } from "./NavIcons";

export const OPEN_SEARCH_EVENT = "rf:open-search";

export function openSearchPalette() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

type SearchIndex = {
  athletes: { id: string; name: string; nationality: string; dominantHand: string; backhandStyle: string }[];
  rackets: { slug: string; brand: string; model: string; year: number | null; weightG: number | null; headSizeSqIn: number | null; photo: boolean }[];
  strings: { id: string; brand: string; name: string; material: string }[];
  grips: { id: string; brand: string; name: string; kind: string }[];
};

type Item = {
  key: string;
  group: string;
  title: string;
  meta?: string;
  href: string;
  /** Racket rows: photo URL, or null to keep the row aligned without a fake image. */
  thumb?: string | null;
};

const PAGES: Item[] = [
  { key: "p-lab", group: "Pages", title: "Form Lab", meta: "3D stroke models", href: "/lab" },
  { key: "p-rackets", group: "Pages", title: "Rackets", meta: "Gear", href: "/gear?tab=rackets" },
  { key: "p-strings", group: "Pages", title: "Strings", meta: "Gear", href: "/gear?tab=strings" },
  { key: "p-grips", group: "Pages", title: "Grips", meta: "Gear", href: "/gear?tab=grips" },
  { key: "p-tape", group: "Pages", title: "Lead tape", meta: "Gear", href: "/gear?tab=lead-tape" },
  { key: "p-setup", group: "Pages", title: "My setup", meta: "Gear overview", href: "/gear?tab=overview" },
  { key: "p-you", group: "Pages", title: "You", meta: "Profile, bag, history", href: "/you" },
  { key: "p-pickle", group: "Pages", title: "Pickleball", meta: "Paddles", href: "/pickleball" },
];

const MATERIAL: Record<string, string> = {
  polyester: "Poly",
  "co-poly": "Co-poly",
  multifilament: "Multifilament",
  "synthetic-gut": "Synthetic gut",
  "natural-gut": "Natural gut",
  hybrid: "Hybrid",
};

function pageScore(q: string, p: Item): number {
  const t = p.title.toLowerCase();
  const ql = q.toLowerCase();
  if (t.startsWith(ql)) return 90;
  if (t.includes(ql)) return 60;
  if ((p.meta ?? "").toLowerCase().includes(ql)) return 30;
  return 0;
}

function top<T>(rows: T[], score: (r: T) => number, n: number): T[] {
  const scored: { r: T; s: number }[] = [];
  for (const r of rows) {
    const s = score(r);
    if (s > 0) scored.push({ r, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, n).map((x) => x.r);
}

function buildItems(q: string, index: SearchIndex | null): Item[] {
  const query = q.trim();
  const athletes = (index?.athletes ?? []).map<Item>((a) => ({
    key: `a-${a.id}`,
    group: "Athletes",
    title: a.name,
    meta: `${a.nationality} · ${a.dominantHand === "left" ? "left" : "right"}-handed · ${a.backhandStyle === "oneHanded" ? "one" : "two"}-handed backhand`,
    href: `/lab?player=${a.id}`,
  }));

  if (!query) return [...PAGES, ...athletes];

  const out: Item[] = [];
  out.push(...top(PAGES, (p) => pageScore(query, p), 3));
  out.push(
    ...top(
      athletes,
      (a) => {
        const n = a.title.toLowerCase();
        const ql = query.toLowerCase();
        return n.includes(ql) ? (n.split(" ").some((w) => w.startsWith(ql)) ? 80 : 50) : 0;
      },
      4,
    ),
  );
  if (index) {
    out.push(
      ...top(index.rackets, (r) => searchMatchScore(query, r.brand, r.model, r.slug), 8).map<Item>((r) => ({
        key: `r-${r.slug}`,
        group: "Rackets",
        title: equipmentLabel(r.brand, r.model),
        meta: [r.year, r.weightG != null ? `${r.weightG} g` : null, r.headSizeSqIn != null ? `${r.headSizeSqIn} in²` : null]
          .filter(Boolean)
          .join(" · "),
        href: `/gear?tab=rackets&racket=${encodeURIComponent(r.slug)}`,
        thumb: r.photo ? `/api/equipment/rackets/${encodeURIComponent(r.slug)}/image` : null,
      })),
    );
    out.push(
      ...top(index.strings, (s) => searchMatchScore(query, s.brand, s.name, s.id), 5).map<Item>((s) => ({
        key: `s-${s.id}`,
        group: "Strings",
        title: equipmentLabel(s.brand, s.name),
        meta: MATERIAL[s.material] ?? s.material,
        href: `/gear?tab=strings&item=${encodeURIComponent(s.id)}`,
      })),
    );
    out.push(
      ...top(index.grips, (g) => searchMatchScore(query, g.brand, g.name, g.id), 5).map<Item>((g) => ({
        key: `g-${g.id}`,
        group: "Grips",
        title: equipmentLabel(g.brand, g.name),
        meta: g.kind === "overgrip" ? "Overgrip" : "Replacement grip",
        href: `/gear?tab=grips&item=${encodeURIComponent(g.id)}`,
      })),
    );
  }
  return out;
}

/**
 * Global search: pages, athletes and the whole equipment catalog in one box.
 * Opens with ⌘K / Ctrl+K or "/" (outside text fields), or from the header button.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const loadStarted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    // Load the index lazily on first open; retry after a failure
    if (loadStarted.current) return;
    loadStarted.current = true;
    setLoadState("loading");
    fetch("/api/search-index")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: SearchIndex) => {
        setIndex(d);
        setLoadState("ready");
      })
      .catch(() => {
        loadStarted.current = false;
        setLoadState("error");
      });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    restoreFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else show();
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
    };
  }, [open, show, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const items = useMemo(() => buildItems(query, index), [query, index]);
  const activeIdx = Math.min(active, Math.max(0, items.length - 1));

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const go = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    setQuery("");
    setActive(0);
    router.push(item.href);
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[activeIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <Portal>
      <div className="sf-cmdk-root" role="presentation">
        <div className="sf-cmdk-scrim" onClick={close} aria-hidden />
        <div className="sf-cmdk" role="dialog" aria-modal="true" aria-label="Search">
          <div className="sf-cmdk-input-row">
            <SearchIcon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
              placeholder="Search rackets, strings, grips, athletes"
              className="sf-cmdk-input"
              role="combobox"
              aria-expanded="true"
              aria-controls="sf-cmdk-list"
              aria-activedescendant={items[activeIdx] ? `cmdk-${items[activeIdx].key}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" onClick={close} className="sf-kbd sf-cmdk-esc" aria-label="Close search">
              Esc
            </button>
          </div>

          <div ref={listRef} id="sf-cmdk-list" role="listbox" className="sf-cmdk-list">
            {items.map((it, i) => {
              const header = i === 0 || items[i - 1]!.group !== it.group ? it.group : null;
              return (
                <div key={it.key}>
                  {header ? <div className="sf-cmdk-group sf-spec-label">{header}</div> : null}
                  <button
                    type="button"
                    id={`cmdk-${it.key}`}
                    data-idx={i}
                    role="option"
                    aria-selected={i === activeIdx}
                    className="sf-cmdk-item"
                    onMouseMove={() => i !== activeIdx && setActive(i)}
                    onClick={() => go(it)}
                  >
                    {it.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.thumb}
                        alt=""
                        loading="lazy"
                        className="sf-cmdk-thumb"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : it.thumb === null ? (
                      <span className="sf-cmdk-thumb" aria-hidden />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{it.title}</span>
                    {it.meta ? <span className="sf-cmdk-meta">{it.meta}</span> : null}
                  </button>
                </div>
              );
            })}
            {hasQuery && loadState === "loading" ? <p className="sf-cmdk-empty">Loading the catalog…</p> : null}
            {loadState === "error" ? <p className="sf-cmdk-empty">The catalog could not be loaded. Pages still work.</p> : null}
            {hasQuery && loadState === "ready" && items.length === 0 ? (
              <p className="sf-cmdk-empty">Nothing matches “{query.trim()}”.</p>
            ) : null}
          </div>

          <div className="sf-cmdk-foot sf-spec-label">
            <span>
              <kbd className="sf-kbd">↑</kbd>
              <kbd className="sf-kbd">↓</kbd> move
            </span>
            <span>
              <kbd className="sf-kbd">↵</kbd> open
            </span>
            <span className="ml-auto">
              {index ? `${index.rackets.length} rackets · ${index.strings.length} strings · ${index.grips.length} grips` : ""}
            </span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
