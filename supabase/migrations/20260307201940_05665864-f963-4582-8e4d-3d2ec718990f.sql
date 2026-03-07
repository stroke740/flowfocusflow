
ALTER TABLE public.user_preferences
  ADD COLUMN language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN auto_complete_subtasks BOOLEAN NOT NULL DEFAULT false;
