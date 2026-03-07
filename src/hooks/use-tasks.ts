import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task, Tag, TaskInsert, TaskUpdate, TaskPriority } from "@/types/task";
import { useToast } from "@/hooks/use-toast";

export function useTasks(status?: "active" | "completed" | "archived") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id, status],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .is("parent_id", null)
        .order("position", { ascending: true });

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch subtasks
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

      // Fetch tags for all tasks
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
    enabled: !!user,
  });
}

export function useTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tags", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });
}

export function useTaskMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const addTask = useMutation({
    mutationFn: async (task: Omit<TaskInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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
    onSuccess: invalidate,
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "completed" as const, completed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
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
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tags")
        .upsert({ user_id: user.id, name, color: color || "#6366f1" }, { onConflict: "user_id,name" })
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
