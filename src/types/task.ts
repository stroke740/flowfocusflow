import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Task = Tables<"tasks"> & {
  tags?: Tag[];
  subtasks?: Task[];
};

export type Tag = Tables<"tags">;

export type TaskInsert = TablesInsert<"tasks">;
export type TaskUpdate = TablesUpdate<"tasks">;
export type TagInsert = TablesInsert<"tags">;

export type TaskPriority = "p1" | "p2" | "p3" | "p4";
export type TaskStatus = "active" | "completed" | "archived";
export type ViewType = "today" | "inbox" | "upcoming" | "all" | "completed" | "settings" | "analytics";

export type SortOption = "manual" | "due_asc" | "due_desc" | "priority" | "created" | "alpha";

export interface FilterState {
  priorities: TaskPriority[];
  tagIds: string[];
  tagLogic: "and" | "or";
  projects: string[];
  dueDateRange: "today" | "this_week" | "next_week" | "no_date" | "custom" | null;
  customDateFrom?: Date;
  customDateTo?: Date;
  status: TaskStatus | null;
  sort: SortOption;
}

export const DEFAULT_FILTERS: FilterState = {
  priorities: [],
  tagIds: [],
  tagLogic: "or",
  projects: [],
  dueDateRange: null,
  status: null,
  sort: "manual",
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; emoji: string }> = {
  p1: { label: "Urgent", color: "hsl(var(--destructive))", emoji: "🔴" },
  p2: { label: "High", color: "hsl(var(--warning))", emoji: "🟠" },
  p3: { label: "Medium", color: "hsl(38, 92%, 50%)", emoji: "🟡" },
  p4: { label: "Low", color: "transparent", emoji: "" },
};
