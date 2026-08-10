-- Add avatar_url to students
ALTER TABLE public.students ADD COLUMN avatar_url TEXT;

-- Create storage bucket for media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update media" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');
