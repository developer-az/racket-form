"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EquipmentTab, GripProfile, RacketCatalogMeta, RacketProfile, StringProfile } from "@/types/equipment";
import { useGearStore } from "@/store/gearStore";
import { MySetupBar } from "./MySetupBar";
import { CombinedSetupPanel, SavedBanner } from "./CombinedSetupPanel";
import { SetupDials } from "./SetupDials";
import { RacketExplorer } from "./RacketExplorer";
import { StringExplorer } from "./StringExplorer";
import { GripExplorer } from "./GripExplorer";
import { LeadTapeLab } from "./LeadTapeLab";
import { AccountabilityStrip } from "./AccountabilityStrip";
import { SetupFinder } from "./SetupFinder";

const TABS: { id: EquipmentTab; label: string; short: string }[] = [
  {
    id: "overview",
    label: "My setup",
    short: "Setup",
  },
  {
    id: "rackets",
    label: "Rackets",
    short: "Frames",
  },
  {
    id: "strings",
    label: "Strings",
    short: "Strings",
  },
  {
    id: "grips",
    label: "Grips",
    short: "Grips",
  },
  {
    id: "lead-tape",
    label: "Lead tape",
    short: "Tape",
  },
];

const TAB_IDS = new Set<EquipmentTab>(TABS.map((t) => t.id));
const SHOW_DIALS = new Set<EquipmentTab>(["overview", "strings"]);

export function GearLab({
  rackets,
  racketMeta,
  strings,
  grips,
}: {
  rackets: RacketProfile[];
  racketMeta: RacketCatalogMeta;
  strings: StringProfile[];
  grips: GripProfile[];
}) {
  const tab = useGearStore((s) => s.tab);
  const setTab = useGearStore((s) => s.setTab);
  const hasSetup = useGearStore((s) => Boolean(s.setup.racketSlug || s.setup.stringId));
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw && TAB_IDS.has(raw as EquipmentTab) && raw !== tab) {
      setTab(raw as EquipmentTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selectTab = (id: EquipmentTab, extra?: Record<string, string | null>) => {
    setTab(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v == null) params.delete(k);
        else params.set(k, v);
      }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const finderParam = searchParams.get("finder") === "1";
  const [resaved, setResaved] = useState(false);
  // Guided quick start is opt-in only (?finder=1); the tool itself is the default
  const showFinder = finderParam;
  const closeFinder = () => {
    setResaved(true);
    selectTab("overview", { finder: null });
    requestAnimationFrame(() =>
      document.getElementById("gear-panel-overview")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <div className="sf-page sf-page-wide">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 md:mb-5">
        <div className="min-w-0">
          <h1 className="sf-page-title">Gear</h1>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            <span className="sf-readout text-[var(--foreground)]">{rackets.length}</span> frames ·{" "}
            <span className="sf-readout text-[var(--foreground)]">{strings.length}</span> strings ·{" "}
            <span className="sf-readout text-[var(--foreground)]">{grips.length}</span> grips, with measured specs
          </p>
        </div>
        {hasSetup ? <MySetupBar onSelectTab={selectTab} /> : null}
      </header>

      <AccountabilityStrip />

      {showFinder ? (
        <div className="mb-6">
          <SetupFinder
            rackets={rackets}
            strings={strings}
            grips={grips}
            onSaved={closeFinder}
            onBrowse={() => {
              selectTab("rackets", { finder: null });
            }}
          />
        </div>
      ) : null}

      {SHOW_DIALS.has(tab) && (hasSetup || tab === "strings") ? (
        <div className="mb-3">
          <SetupDials strings={strings} compact hideStringDials={tab === "strings"} />
        </div>
      ) : null}

      <div className="sf-sticky-tabs">
        <div className="sf-tab-track" role="tablist" aria-label="Equipment category">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`gear-panel-${t.id}`}
                id={`gear-tab-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(t.id)}
                onKeyDown={(e) => {
                  const idx = TABS.findIndex((x) => x.id === t.id);
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    selectTab(TABS[(idx + 1) % TABS.length].id);
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    selectTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
                  }
                }}
                className="sf-tab"
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-4 md:mt-6">
        {tab === "overview" ? (
          <div id="gear-panel-overview" role="tabpanel" aria-labelledby="gear-tab-overview">
            {resaved && hasSetup ? (
              <div className="mb-6">
                <SavedBanner onDismiss={() => setResaved(false)} />
              </div>
            ) : null}
            <CombinedSetupPanel
              rackets={rackets}
              strings={strings}
              grips={grips}
              onSelectTab={selectTab}
            />
          </div>
        ) : null}
        {tab === "rackets" ? (
          <div id="gear-panel-rackets" role="tabpanel" aria-labelledby="gear-tab-rackets">
            <RacketExplorer initialRackets={rackets} meta={racketMeta} onSelectTab={selectTab} />
          </div>
        ) : null}
        {tab === "strings" ? (
          <div id="gear-panel-strings" role="tabpanel" aria-labelledby="gear-tab-strings">
            <StringExplorer strings={strings} onSelectTab={selectTab} />
          </div>
        ) : null}
        {tab === "grips" ? (
          <div id="gear-panel-grips" role="tabpanel" aria-labelledby="gear-tab-grips">
            <GripExplorer grips={grips} onSelectTab={selectTab} />
          </div>
        ) : null}
        {tab === "lead-tape" ? (
          <div id="gear-panel-lead-tape" role="tabpanel" aria-labelledby="gear-tab-lead-tape">
            <LeadTapeLab rackets={rackets} strings={strings} grips={grips} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
