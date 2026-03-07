import { useMemo } from "react";
import { Task, FilterState, SortOption, TaskPriority } from "@/types/task";
import {
  isToday, isBefore, isAfter, startOfDay, endOfDay,
  startOfWeek, endOfWeek, addWeeks, startOfTomorrow,
} from "date-fns";

const PRIORITY_ORDER: Record<TaskPriority, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };

function sortTasks(tasks: Task[], sort: SortOption): Task[] {
  const sorted = [...tasks];
  switch (sort) {
    case "priority":
      return sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    case "due_asc":
      return sorted.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    case "due_desc":
      return sorted.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      });
    case "created":
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "alpha":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted.sort((a, b) => a.position - b.position);
  }
}

export function useFilteredTasks(tasks: Task[], filters: FilterState): Task[] {
  return useMemo(() => {
    let filtered = tasks;

    // Priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter((t) => filters.priorities.includes(t.priority));
    }

    // Tag filter
    if (filters.tagIds.length > 0) {
      filtered = filtered.filter((t) => {
        const taskTagIds = t.tags?.map((tag) => tag.id) || [];
        if (filters.tagLogic === "and") {
          return filters.tagIds.every((id) => taskTagIds.includes(id));
        }
        return filters.tagIds.some((id) => taskTagIds.includes(id));
      });
    }

    // Project filter
    if (filters.projects.length > 0) {
      filtered = filtered.filter((t) => t.project && filters.projects.includes(t.project));
    }

    // Due date filter
    if (filters.dueDateRange) {
      const now = new Date();
      filtered = filtered.filter((t) => {
        if (filters.dueDateRange === "no_date") return !t.due_date;
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        switch (filters.dueDateRange) {
          case "today":
            return isToday(d) || isBefore(d, startOfTomorrow());
          case "this_week":
            return isBefore(d, endOfWeek(now, { weekStartsOn: 1 })) && isAfter(d, startOfWeek(now, { weekStartsOn: 1 }));
          case "next_week": {
            const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
            const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
            return isAfter(d, nextWeekStart) && isBefore(d, nextWeekEnd);
          }
          case "custom":
            if (filters.customDateFrom && isBefore(d, startOfDay(filters.customDateFrom))) return false;
            if (filters.customDateTo && isAfter(d, endOfDay(filters.customDateTo))) return false;
            return true;
          default:
            return true;
        }
      });
    }

    return sortTasks(filtered, filters.sort);
  }, [tasks, filters]);
}
