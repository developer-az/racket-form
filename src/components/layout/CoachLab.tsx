"use client";

import { useEffect, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import {
  PlayerStrokePicker,
  PlaybackControls,
  PlaybackDock,
  ViewToggles,
} from "@/components/ui/Controls";
import { MetricsPanel, SciencePanel, SetupBridge } from "@/components/ui/MetricsPanel";
import { PlayerGripCue } from "@/components/lab/PlayerGripCue";
import { LabPhaseOverlay } from "@/components/lab/LabPhaseOverlay";
import { AthleteSpecSheet } from "@/components/lab/AthleteSpecSheet";
import { LabResizeHandle, useLabPanelWidths } from "@/components/lab/LabResizeHandle";
import { CourtLoading } from "@/components/ui/CourtState";

const FormCanvas = dynamic(
  () => import("@/components/scene/FormCanvas").then((m) => m.FormCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center bg-[var(--bg-scene)] lg:min-h-[420px]">
        <CourtLoading
          label="Loading biomechanics viewport…"
          detail="Keyframed joint rails and court scale. Orbit when ready."
        />
      </div>
    ),
  },
);

export function CoachLab() {
  const panels = useLabPanelWidths();
  const { widths, dragging } = panels;

  // While dragging a splitter: column cursor everywhere, no text selection
  useEffect(() => {
    if (!dragging) return;
    const root = document.documentElement;
    root.classList.add("sf-resizing");
    return () => root.classList.remove("sf-resizing");
  }, [dragging]);

  const vars = {
    "--lab-left": `${widths.left}px`,
    "--lab-right": `${widths.right}px`,
  } as CSSProperties;

  return (
    <div
      className="flex min-h-full flex-1 flex-col pb-[var(--app-nav-h)] lg:h-full lg:min-h-0 lg:overflow-hidden lg:pb-0"
      style={vars}
    >
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <aside
          id="lab-panel-left"
          aria-label="Athlete, stroke and playback"
          className="sf-lab-panel order-2 flex w-full shrink-0 flex-col gap-6 border-b border-[var(--line)] bg-[var(--panel)] p-4 lg:order-1 lg:w-[var(--lab-left)] lg:border-b-0 lg:px-5 lg:py-5"
        >
          <PlayerStrokePicker />
          <div className="hidden lg:block">
            <PlaybackControls />
          </div>
          <ViewToggles />
          <PlayerGripCue />
        </aside>

        <div className="hidden lg:order-1 lg:block">
          <LabResizeHandle
            side="left"
            width={widths.left}
            onResize={panels.set}
            onReset={panels.reset}
            onCommit={panels.commit}
            onDragChange={panels.setDragging}
            controls="lab-panel-left"
            label="Resize controls panel"
          />
        </div>

        <section
          aria-label="3D stroke viewport"
          className="relative order-1 z-10 h-[calc(100svh-var(--header-h)-var(--app-nav-h)-10.5rem)] min-h-[280px] w-full shrink-0 overflow-hidden bg-[var(--bg-scene)] max-lg:sticky max-lg:top-0 lg:order-2 lg:z-auto lg:h-auto lg:min-h-0 lg:min-w-0 lg:flex-1 lg:shrink"
        >
          <FormCanvas />
          <LabPhaseOverlay />
          <div className="absolute inset-x-0 bottom-0 z-20 lg:hidden">
            <p className="pointer-events-none px-3 pb-1 text-center text-[11px] text-[var(--muted)]">
              Drag to orbit · pinch to zoom · swipe athletes below
            </p>
            <PlaybackDock />
          </div>
        </section>

        <div className="hidden lg:order-2 lg:block">
          <LabResizeHandle
            side="right"
            width={widths.right}
            onResize={panels.set}
            onReset={panels.reset}
            onCommit={panels.commit}
            onDragChange={panels.setDragging}
            controls="lab-panel-right"
            label="Resize metrics panel"
          />
        </div>

        <aside
          id="lab-panel-right"
          aria-label="Measurements and athlete data"
          className="sf-lab-panel order-3 flex w-full shrink-0 flex-col gap-8 border-t border-[var(--line)] bg-[var(--panel)] p-4 lg:w-[var(--lab-right)] lg:border-t-0 lg:px-5 lg:py-5"
        >
          <MetricsPanel />
          <AthleteSpecSheet />
          <SciencePanel />
          <SetupBridge />
        </aside>
      </div>
    </div>
  );
}
