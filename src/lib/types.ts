// ── Type definitions for Viyan — Personal Dashboard ──────────

// ── Dashboard ────────────────────────────────────────────────
export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export type DashboardLayouts = {
  lg: WidgetLayout[];
  md: WidgetLayout[];
  sm: WidgetLayout[];
};

// ── Google Calendar ──────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  htmlLink?: string;
}

// ── Google Tasks ─────────────────────────────────────────────
export interface TaskList {
  id: string;
  title: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: string;
  completed?: string;
  position: string;
}

// ── Finance ──────────────────────────────────────────────────
export type TransactionType = "INCOME" | "EXPENSE";

export type TransactionCategory =
  | "FOOD"
  | "RENT"
  | "TRANSPORT"
  | "SAAS_SUBSCRIPTIONS"
  | "SALARY"
  | "FREELANCE"
  | "MISC";

export interface TransactionFormData {
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: Date;
  note?: string;
}

export interface MonthlyKPI {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
}

export interface BudgetProgress {
  category: TransactionCategory;
  spent: number;
  limit: number;
  percentage: number;
}

// ── Bookmarks ────────────────────────────────────────────────
export interface BookmarkFormData {
  label: string;
  url: string;
  icon?: string;
  category: string;
}

// ── Settings ─────────────────────────────────────────────────
export interface UserSettingsData {
  theme: "dark" | "light";
  currency: string;
  timezone: string;
}
