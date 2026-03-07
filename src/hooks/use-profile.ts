import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ANONYMOUS_USER_ID } from "@/lib/constants";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile", ANONYMOUS_USER_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", ANONYMOUS_USER_ID)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: newProfile, error: insertErr } = await supabase
          .from("profiles")
          .insert({ id: ANONYMOUS_USER_ID, display_name: "" })
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

  return useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", ANONYMOUS_USER_ID);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUploadAvatar() {
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${ANONYMOUS_USER_ID}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await updateProfile.mutateAsync({ avatar_url: url });
      return url;
    },
  });
}

export function useDeleteAvatar() {
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async () => {
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(ANONYMOUS_USER_ID);
      if (files && files.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(files.map((f) => `${ANONYMOUS_USER_ID}/${f.name}`));
      }
      await updateProfile.mutateAsync({ avatar_url: null });
    },
  });
}
