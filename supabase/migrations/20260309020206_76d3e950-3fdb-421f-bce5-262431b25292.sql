
-- Task attachments table
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own attachments"
ON public.task_attachments
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true);

-- Storage policies for task attachments bucket
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own task attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own task attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view task attachments"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'task-attachments');

-- Sections table for projects
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sections"
ON public.sections
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add section_id to tasks
ALTER TABLE public.tasks ADD COLUMN section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL;
