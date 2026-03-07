import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface UserPreferences {
  user_id: string;
  theme: string;
  accent_color: string;
  start_of_week: string;
  task_input_position: string;
  completed_task_behavior: string;
  sound_effects: boolean;
  push_notifications: boolean;
  email_reminders: boolean;
  in_app_notifications: boolean;
  daily_digest: boolean;
  daily_digest_time: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  overdue_alerts: boolean;
  reminder_default_minutes: number;
  language: string;
  auto_complete_subtasks: boolean;
}

export function usePreferences() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["preferences", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: newPrefs, error: insertErr } = await supabase
          .from("user_preferences")
          .insert({ user_id: userId! })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return newPrefs as UserPreferences;
      }
      return data as UserPreferences;
    },
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preferences"] }),
  });
}
