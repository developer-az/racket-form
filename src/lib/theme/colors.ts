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
  background: "#f5f6f7",
  foreground: "#0c0e11",
  panel: "#ffffff",
  bgScene: "#eceef0",
  bgSunken: "#eceef0",
  muted: "#5a626d",
  line: "rgba(12, 14, 17, 0.085)",
  accent: "#2b4fe0",
  accentFg: "#ffffff",
  amber: "#a86a12",
  sky: "#0f7f93",
  court: "#c9cdd2",
  silhouette: "#4b535d",
  silhouetteRim: "#c2c8cf",
  chartPower: "#b8622a",
  chartSpin: "#0f7f93",
  chartControl: "#2b4fe0",
  chartComfort: "#7b5cc4",
  chartFill: "rgba(43, 79, 224, 0.1)",
};

const DARK: ThemeColors = {
  background: "#0a0b0d",
  foreground: "#e9ebee",
  panel: "#111316",
  bgScene: "#0d0f12",
  bgSunken: "#070809",
  muted: "#8b939e",
  line: "rgba(233, 235, 238, 0.075)",
  accent: "#7390ff",
  accentFg: "#0a0b0d",
  amber: "#d9a046",
  sky: "#4cc0d1",
  court: "#23272d",
  silhouette: "#cfd4da",
  silhouetteRim: "#eef0f3",
  chartPower: "#e08d55",
  chartSpin: "#4cc0d1",
  chartControl: "#7390ff",
  chartComfort: "#a78bef",
  chartFill: "rgba(115, 144, 255, 0.14)",
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
