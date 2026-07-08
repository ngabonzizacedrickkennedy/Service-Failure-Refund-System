"use client";

import { useEffect, useState } from "react";

/** Tracks the app's light/dark theme (the same `data-theme` attribute Header.tsx toggles). */
export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    check();
    window.addEventListener("themechange", check);
    return () => window.removeEventListener("themechange", check);
  }, []);

  return dark;
}

// Monochrome ramp (dark -> light) — identity within a chart is carried by lightness + the
// direct label (axis tick / legend text), not by hue. Keeps every dashboard chart black/white/gray.
export const MONOCHROME_LIGHT = ["#0F172A", "#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"];
export const MONOCHROME_DARK = ["#F0F6FC", "#C9D1D9", "#8B949E", "#6E7681", "#484F58", "#30363D"];

export const CATEGORICAL_LIGHT = MONOCHROME_LIGHT;
export const CATEGORICAL_DARK = MONOCHROME_DARK;

export function useCategoricalPalette(): string[] {
  return useIsDarkMode() ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

// Fixed slot per status name so distinct statuses within the same chart always land on
// distinct ramp steps (every status list used across the dashboards is a subset of this order).
const MASTER_STATUS_ORDER = [
  "OPEN", "ASSIGNED", "COMPLETED", "FAILED",
  "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "REFUND_INITIATED", "REFUNDED",
  "SUBMITTED", "VALIDATED",
  "ACTIVE", "LOCKED", "INACTIVE",
];

export function statusColor(status: string, dark: boolean): string {
  const ramp = dark ? MONOCHROME_DARK : MONOCHROME_LIGHT;
  const idx = MASTER_STATUS_ORDER.indexOf(status);
  return ramp[(idx >= 0 ? idx : 0) % ramp.length];
}

export function useStatusColor(status: string): string {
  const dark = useIsDarkMode();
  return statusColor(status, dark);
}
