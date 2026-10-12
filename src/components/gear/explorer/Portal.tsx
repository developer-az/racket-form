"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/** Sheets render at <body> so page stacking contexts (sticky tabs, panels) can't sit above them. */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
