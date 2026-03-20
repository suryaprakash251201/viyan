import type { LayoutItem, ResponsiveLayouts } from "react-grid-layout";

export type DashboardLayouts = ResponsiveLayouts;

export const DASHBOARD_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

export const DASHBOARD_COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
} as const;

export const DEFAULT_DASHBOARD_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: "calendar", x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: "tasks", x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: "notes", x: 0, y: 6, w: 8, h: 8, minW: 4, minH: 5 },
    { i: "finance", x: 8, y: 6, w: 4, h: 8, minW: 3, minH: 5 },
    { i: "bookmarks", x: 0, y: 14, w: 12, h: 5, minW: 4, minH: 4 },
  ],
  md: [
    { i: "calendar", x: 0, y: 0, w: 5, h: 6, minW: 3, minH: 4 },
    { i: "tasks", x: 5, y: 0, w: 5, h: 6, minW: 3, minH: 4 },
    { i: "notes", x: 0, y: 6, w: 6, h: 8, minW: 3, minH: 5 },
    { i: "finance", x: 6, y: 6, w: 4, h: 8, minW: 3, minH: 5 },
    { i: "bookmarks", x: 0, y: 14, w: 10, h: 5, minW: 4, minH: 4 },
  ],
  sm: [
    { i: "calendar", x: 0, y: 0, w: 6, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 6, h: 5, minW: 2, minH: 4 },
    { i: "notes", x: 0, y: 10, w: 6, h: 7, minW: 2, minH: 5 },
    { i: "finance", x: 0, y: 17, w: 6, h: 7, minW: 2, minH: 5 },
    { i: "bookmarks", x: 0, y: 24, w: 6, h: 5, minW: 2, minH: 4 },
  ],
  xs: [
    { i: "calendar", x: 0, y: 0, w: 4, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 4, h: 5, minW: 2, minH: 4 },
    { i: "notes", x: 0, y: 10, w: 4, h: 7, minW: 2, minH: 5 },
    { i: "finance", x: 0, y: 17, w: 4, h: 7, minW: 2, minH: 5 },
    { i: "bookmarks", x: 0, y: 24, w: 4, h: 5, minW: 2, minH: 4 },
  ],
  xxs: [
    { i: "calendar", x: 0, y: 0, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "notes", x: 0, y: 10, w: 2, h: 7, minW: 2, minH: 5 },
    { i: "finance", x: 0, y: 17, w: 2, h: 7, minW: 2, minH: 5 },
    { i: "bookmarks", x: 0, y: 24, w: 2, h: 5, minW: 2, minH: 4 },
  ],
};

function isLayoutItem(value: unknown): value is LayoutItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.i === "string" &&
    typeof item.x === "number" &&
    typeof item.y === "number" &&
    typeof item.w === "number" &&
    typeof item.h === "number"
  );
}

export function isValidDashboardLayouts(value: unknown): value is DashboardLayouts {
  if (!value || typeof value !== "object") {
    return false;
  }

  const layouts = value as Record<string, unknown>;

  return Object.values(layouts).every(
    (breakpointLayout) =>
      Array.isArray(breakpointLayout) && breakpointLayout.every(isLayoutItem)
  );
}