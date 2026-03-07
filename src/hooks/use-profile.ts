import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      // Auto-create if missing (for existing users before trigger)
      if (!data) {
        const { data: newProfile, error: insertErr } = await supabase
          .from("profiles")
          .insert({ id: user!.id, display_name: user!.user_metadata?.full_name || "" })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return newProfile as Profile;
      }
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      // Add cache-bust
      const url = `${publicUrl}?t=${Date.now()}`;
      await updateProfile.mutateAsync({ avatar_url: url });
      return url;
    },
  });
}

export function useDeleteAvatar() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async () => {
      // List and delete all avatar files for user
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user!.id);
      if (files && files.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(files.map((f) => `${user!.id}/${f.name}`));
      }
      await updateProfile.mutateAsync({ avatar_url: null });
    },
  });
}
