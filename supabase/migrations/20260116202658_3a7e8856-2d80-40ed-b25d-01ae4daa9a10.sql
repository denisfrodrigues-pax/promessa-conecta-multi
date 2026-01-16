-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('eventos', 'eventos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload/update/delete event images
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'eventos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'eventos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'eventos' AND has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view event images (public bucket)
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'eventos');