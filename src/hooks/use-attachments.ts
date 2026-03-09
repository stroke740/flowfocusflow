import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export function useAttachments(taskId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["attachments", taskId],
    enabled: !!taskId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments" as any)
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TaskAttachment[];
    },
  });
}

export function useAttachmentMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const uploadAttachment = useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      if (!user) throw new Error("Not authenticated");
      const path = `${user.id}/${taskId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("task_attachments" as any)
        .insert({
          task_id: taskId,
          user_id: user.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          content_type: file.type || "application/octet-stream",
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TaskAttachment;
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async ({ id, filePath, taskId }: { id: string; filePath: string; taskId: string }) => {
      await supabase.storage.from("task-attachments").remove([filePath]);
      const { error } = await supabase.from("task_attachments" as any).delete().eq("id", id);
      if (error) throw error;
      return taskId;
    },
    onSuccess: (taskId) => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });

  return { uploadAttachment, deleteAttachment };
}

export function getAttachmentUrl(filePath: string) {
  const { data } = supabase.storage.from("task-attachments").getPublicUrl(filePath);
  return data.publicUrl;
}
