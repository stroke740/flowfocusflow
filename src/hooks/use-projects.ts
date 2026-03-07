import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;

export function useProjects() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["projects", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId!)
        .order("position");
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProjectTaskCounts() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["project-task-counts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("project_id, status")
        .eq("user_id", userId!)
        .not("project_id", "is", null);
      if (error) throw error;

      const counts = new Map<string, { total: number; completed: number }>();
      for (const t of data || []) {
        const pid = t.project_id as string;
        const curr = counts.get(pid) || { total: 0, completed: 0 };
        curr.total++;
        if (t.status === "completed") curr.completed++;
        counts.set(pid, curr);
      }
      return counts;
    },
  });
}

export function useProjectMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project-task-counts"] });
  };

  const addProject = useMutation({
    mutationFn: async (project: Omit<ProjectInsert, "user_id">) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: invalidate,
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: invalidate,
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteProject = useMutation({
    mutationFn: async ({ id, deleteTasks }: { id: string; deleteTasks: boolean }) => {
      if (deleteTasks) {
        await supabase.from("tasks").delete().eq("project_id", id);
      } else {
        await supabase.from("tasks").update({ project_id: null }).eq("project_id", id);
      }
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return { addProject, updateProject, deleteProject };
}
