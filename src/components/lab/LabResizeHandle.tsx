"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Desktop-only resizable side panels for the Form Lab.
 *
 * Widths are clamped so each side panel stays between PANEL_MIN and PANEL_MAX
 * and the 3D viewport keeps at least CANVAS_MIN. They persist per browser in
 * localStorage (best effort: private windows simply fall back to defaults).
 */
export const PANEL_MIN = 240;
export const PANEL_MAX = 480;
export const CANVAS_MIN = 420;
export const DEFAULT_WIDTHS = { left: 300, right: 340 } as const;
const STORAGE_KEY = "racketform-lab-panels-v1";
const KEY_STEP = 16;

export type Side = "left" | "right";
type Widths = { left: number; right: number };

function viewportWidth() {
  return typeof window === "undefined" ? 1440 : window.innerWidth;
}

/** Clamp one side against the bounds and the room the other side leaves. */
function clampSide(side: Side, value: number, w: Widths, vw = viewportWidth()): number {
  const other = side === "left" ? w.right : w.left;
  // Each splitter nets 1px of layout width (9px hit area, -4px margins)
  const room = vw - other - CANVAS_MIN - 2;
  return Math.round(Math.max(PANEL_MIN, Math.min(PANEL_MAX, room, value)));
}

function clampAll(w: Widths): Widths {
  const left = clampSide("left", w.left, w);
  const right = clampSide("right", w.right, { ...w, left });
  return { left, right };
}

function read(): Widths | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Widths>;
    if (typeof v.left !== "number" || typeof v.right !== "number") return null;
    if (!Number.isFinite(v.left) || !Number.isFinite(v.right)) return null;
    return { left: v.left, right: v.right };
  } catch {
    return null;
  }
}

function write(w: Widths) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  } catch {
    /* storage unavailable: widths still apply for this visit */
  }
}

export function useLabPanelWidths() {
  const [widths, setWidths] = useState<Widths>({ ...DEFAULT_WIDTHS });
  const [dragging, setDragging] = useState<Side | null>(null);

  // Hydrate after mount so the server render and first client render agree
  useEffect(() => {
    // Also clamps the defaults on small desktops so the canvas keeps its minimum
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only storage
    setWidths(clampAll(read() ?? { ...DEFAULT_WIDTHS }));
  }, []);

  // Keep the canvas minimum when the window shrinks
  useEffect(() => {
    const onResize = () => setWidths((w) => clampAll(w));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const set = useCallback((side: Side, value: number, persist = true) => {
    setWidths((w) => {
      const next = { ...w, [side]: clampSide(side, value, w) };
      if (persist) write(next);
      return next;
    });
  }, []);

  const reset = useCallback((side: Side) => {
    setWidths((w) => {
      const next = { ...w, [side]: clampSide(side, DEFAULT_WIDTHS[side], w) };
      write(next);
      return next;
    });
  }, []);

  const commit = useCallback(() => {
    setWidths((w) => {
      write(w);
      return w;
    });
  }, []);

  return { widths, set, reset, commit, dragging, setDragging };
}

/**
 * Vertical splitter between a side panel and the viewport. Pointer drag with
 * capture, arrow keys (Shift for larger steps), Home/End, double-click resets.
 */
export function LabResizeHandle({
  side,
  width,
  onResize,
  onReset,
  onCommit,
  onDragChange,
  controls,
  label,
}: {
  side: Side;
  width: number;
  onResize: (side: Side, value: number, persist?: boolean) => void;
  onReset: (side: Side) => void;
  onCommit: () => void;
  onDragChange: (side: Side | null) => void;
  /** id of the panel this handle sizes */
  controls: string;
  label: string;
}) {
  const start = useRef<{ x: number; w: number; id: number } | null>(null);
  const [active, setActive] = useState(false);
  // Dragging right grows the left panel and shrinks the right one
  const dir = side === "left" ? 1 : -1;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, w: width, id: e.pointerId };
    setActive(true);
    onDragChange(side);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    onResize(side, s.w + (e.clientX - s.x) * dir, false);
  };

  const end = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    start.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setActive(false);
    onDragChange(null);
    onCommit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = width - step * dir;
    else if (e.key === "ArrowRight") next = width + step * dir;
    else if (e.key === "Home") next = PANEL_MIN;
    else if (e.key === "End") next = PANEL_MAX;
    else if (e.key === "Enter") {
      e.preventDefault();
      onReset(side);
      return;
    }
    if (next == null) return;
    e.preventDefault();
    onResize(side, next, true);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-controls={controls}
      aria-valuenow={width}
      aria-valuemin={PANEL_MIN}
      aria-valuemax={PANEL_MAX}
      aria-valuetext={`${width} pixels`}
      tabIndex={0}
      title="Drag to resize. Double-click to reset."
      data-active={active ? "true" : "false"}
      data-side={side}
      className="sf-splitter"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onDoubleClick={() => onReset(side)}
      onKeyDown={onKeyDown}
    />
  );
}
