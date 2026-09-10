/** Theme colors readable from JS (SVG / Three). Mirrors CSS tokens. */

export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  background: string;
  foreground: string;
  panel: string;
  bgScene: string;
  bgSunken: string;
  muted: string;
  line: string;
  accent: string;
  accentFg: string;
  amber: string;
  sky: string;
  court: string;
  silhouette: string;
  silhouetteRim: string;
  chartPower: string;
  chartSpin: string;
  chartControl: string;
  chartComfort: string;
  chartFill: string;
};

const LIGHT: ThemeColors = {
  background: "#eef6f1",
  foreground: "#04150e",
  panel: "#ffffff",
  bgScene: "#c8ddd2",
  bgSunken: "#dcebe3",
  muted: "#3d564a",
  line: "rgba(4, 21, 14, 0.11)",
  accent: "#12a84a",
  accentFg: "#ffffff",
  amber: "#e09a12",
  sky: "#0b9bb8",
  court: "#0f7a3a",
  silhouette: "#0d2418",
  silhouetteRim: "#2a4a38",
  chartPower: "#e09a12",
  chartSpin: "#0b9bb8",
  chartControl: "#12a84a",
  chartComfort: "#c9921a",
  chartFill: "rgba(18, 168, 74, 0.16)",
};

const DARK: ThemeColors = {
  background: "#0b1410",
  foreground: "#eef7f1",
  panel: "#132019",
  bgScene: "#0f1c16",
  bgSunken: "#08110d",
  muted: "#9ab5a6",
  line: "rgba(238, 247, 241, 0.1)",
  accent: "#3ddc75",
  accentFg: "#04150e",
  amber: "#f0b03a",
  sky: "#4ec8e0",
  court: "#1a8f4a",
  silhouette: "#c5ddd0",
  silhouetteRim: "#e4f2ea",
  chartPower: "#f0b03a",
  chartSpin: "#4ec8e0",
  chartControl: "#3ddc75",
  chartComfort: "#e8c45a",
  chartFill: "rgba(61, 220, 117, 0.2)",
};

export const THEME_STORAGE_KEY = "strokeform-theme";

export function themeColors(mode: ThemeMode): ThemeColors {
  return mode === "light" ? LIGHT : DARK;
}

/** Read current theme from the document (client only). */
export function getThemeColors(): ThemeColors {
  if (typeof document === "undefined") return LIGHT;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return themeColors(attr);
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
}

export function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
