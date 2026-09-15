"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaddleTapePiece } from "@/types/pickleball";

export type PaddleSetup = {
  paddleId: string | null;
  paddleLabel: string | null;
  overgrips: number;
  tape: PaddleTapePiece[];
};

interface PaddleState {
  setup: PaddleSetup;
  setPaddle: (id: string, label: string) => void;
  setOvergrips: (n: number) => void;
  setTape: (tape: PaddleTapePiece[]) => void;
  clearSetup: () => void;
}

const emptySetup: PaddleSetup = {
  paddleId: null,
  paddleLabel: null,
  overgrips: 0,
  tape: [],
};

export const usePaddleStore = create<PaddleState>()(
  persist(
    (set) => ({
      setup: emptySetup,
      setPaddle: (id, label) =>
        set((s) => ({ setup: { ...s.setup, paddleId: id, paddleLabel: label } })),
      setOvergrips: (n) =>
        set((s) => ({
          setup: { ...s.setup, overgrips: Math.max(0, Math.min(2, Math.round(n))) },
        })),
      setTape: (tape) => set((s) => ({ setup: { ...s.setup, tape } })),
      clearSetup: () => set({ setup: emptySetup }),
    }),
    {
      name: "strokeform-paddle-setup",
      partialize: (s) => ({ setup: s.setup }),
      merge: (persisted, current) => {
        const p = persisted as { setup?: Partial<PaddleSetup> } | undefined;
        return {
          ...current,
          setup: { ...emptySetup, ...current.setup, ...p?.setup, tape: p?.setup?.tape ?? [] },
        };
      },
    },
  ),
);
