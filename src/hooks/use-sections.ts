import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Section {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string;
}

export function useSections(projectId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sections", projectId],
    enabled: !!projectId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sections" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("position");
      if (error) throw error;
      return (data || []) as unknown as Section[];
    },
  });
}

export function useSectionMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const addSection = useMutation({
    mutationFn: async ({ projectId, name, position }: { projectId: string; name: string; position?: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("sections" as any)
        .insert({ project_id: projectId, user_id: user.id, name, position: position ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Section;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["sections", (data as any).project_id] });
    },
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("sections" as any).update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sections"] });
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      // Clear section_id from tasks first
      await supabase.from("tasks").update({ section_id: null } as any).eq("section_id", id);
      const { error } = await supabase.from("sections" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return { addSection, updateSection, deleteSection };
}
