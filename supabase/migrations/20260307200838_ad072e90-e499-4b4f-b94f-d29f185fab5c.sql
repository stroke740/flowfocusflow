
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'reminder',
  title text NOT NULL,
  body text,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
ON public.notifications FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Recurrence fields on tasks
ALTER TABLE public.tasks
  ADD COLUMN recurrence_rule text,
  ADD COLUMN recurrence_end_date timestamptz,
  ADD COLUMN recurrence_count integer,
  ADD COLUMN reminder_minutes integer[] DEFAULT '{}';
