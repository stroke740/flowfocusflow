import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Task, Tag, TaskInsert, TaskUpdate, TaskPriority } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval: number;
  weekdays?: number[];
  endDate?: string;
  occurrences?: number;
}

function getNextOccurrence(current: Date, rule: RecurrenceRule): Date | null {
  if (rule.occurrences !== undefined && rule.occurrences <= 0) return null;
  if (rule.endDate && new Date(rule.endDate) < current) return null;

  switch (rule.frequency) {
    case "daily": return addDays(current, rule.interval);
    case "weekly": return addWeeks(current, rule.interval);
    case "monthly": return addMonths(current, rule.interval);
    case "yearly": return addYears(current, rule.interval);
    default: return addDays(current, rule.interval);
  }
}

export function useTasks(status?: "active" | "completed" | "archived") {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["tasks", userId, status],
    enabled: !!userId,
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId!)
        .is("parent_id", null)
        .order("position", { ascending: true });

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      const taskIds = (data || []).map((t) => t.id);
      let subtasks: Task[] = [];
      if (taskIds.length) {
        const { data: subs } = await supabase
          .from("tasks")
          .select("*")
          .in("parent_id", taskIds)
          .order("position");
        subtasks = subs || [];
      }

      const allIds = [...taskIds, ...subtasks.map((s) => s.id)];
      let taskTags: { task_id: string; tag_id: string }[] = [];
      let tags: Tag[] = [];
      if (allIds.length) {
        const { data: tt } = await supabase
          .from("task_tags")
          .select("task_id, tag_id")
          .in("task_id", allIds);
        taskTags = tt || [];

        const tagIds = [...new Set(taskTags.map((t) => t.tag_id))];
        if (tagIds.length) {
          const { data: t } = await supabase.from("tags").select("*").in("id", tagIds);
          tags = t || [];
        }
      }

      const tagMap = new Map(tags.map((t) => [t.id, t]));
      const getTagsForTask = (taskId: string) =>
        taskTags.filter((tt) => tt.task_id === taskId).map((tt) => tagMap.get(tt.tag_id)!).filter(Boolean);

      return (data || []).map((task) => ({
        ...task,
        tags: getTagsForTask(task.id),
        subtasks: subtasks
          .filter((s) => s.parent_id === task.id)
          .map((s) => ({ ...s, tags: getTagsForTask(s.id), subtasks: [] })),
      })) as Task[];
    },
  });
}

export function useTags() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["tags", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", userId!)
        .order("name");
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useTaskMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const addTask = useMutation({
    mutationFn: async (task: Omit<TaskInsert, "user_id">) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (newTask) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", userId, "active"]);
      qc.setQueryData(["tasks", userId, "active"], (old: Task[] | undefined) => [
        ...(old || []),
        { ...newTask, id: crypto.randomUUID(), user_id: userId, status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), position: 0, tags: [], subtasks: [] } as Task,
      ]);
      return { prev };
    },
    onError: (e, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", userId, "active"], ctx.prev);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
    onSettled: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", userId, "active"]);
      qc.setQueryData(["tasks", userId, "active"], (old: Task[] | undefined) =>
        (old || []).filter((t) => t.id !== id)
      );
      return { prev };
    },
    onError: (e, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", userId, "active"], ctx.prev);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
    onSettled: invalidate,
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { data: task, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "completed" as const, completed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (task.recurrence_rule) {
        try {
          const rule = JSON.parse(task.recurrence_rule);
          const nextDate = getNextOccurrence(task.due_date ? new Date(task.due_date) : new Date(), rule);
          if (nextDate) {
            await supabase.from("tasks").insert({
              user_id: task.user_id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              project: task.project,
              project_id: task.project_id,
              parent_id: task.parent_id,
              due_date: nextDate.toISOString(),
              recurrence_rule: task.recurrence_rule,
              recurrence_end_date: task.recurrence_end_date,
              recurrence_count: task.recurrence_count ? task.recurrence_count - 1 : null,
              reminder_minutes: task.reminder_minutes,
            });
          }
        } catch {}
      }

      return data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", userId, "active"]);
      qc.setQueryData(["tasks", userId, "active"], (old: Task[] | undefined) =>
        (old || []).filter((t) => t.id !== id)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", userId, "active"], ctx.prev);
    },
    onSettled: invalidate,
  });

  const uncompleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "active" as const, completed_at: null })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const reorderTasks = useMutation({
    mutationFn: async (tasks: { id: string; position: number }[]) => {
      for (const t of tasks) {
        await supabase.from("tasks").update({ position: t.position }).eq("id", t.id);
      }
    },
    onSuccess: invalidate,
  });

  const addTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tags")
        .upsert({ user_id: userId, name, color: color || "#6366f1" }, { onConflict: "user_id,name" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  const setTaskTags = useMutation({
    mutationFn: async ({ taskId, tagIds }: { taskId: string; tagIds: string[] }) => {
      await supabase.from("task_tags").delete().eq("task_id", taskId);
      if (tagIds.length) {
        const { error } = await supabase
          .from("task_tags")
          .insert(tagIds.map((tag_id) => ({ task_id: taskId, tag_id })));
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  return { addTask, updateTask, deleteTask, completeTask, uncompleteTask, reorderTasks, addTag, setTaskTags };
}
