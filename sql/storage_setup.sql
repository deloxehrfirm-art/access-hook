-- Ensure all storage buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('Edu_cert', 'Edu_cert', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cv_resume', 'cv_resume', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('nysc_cert', 'nysc_cert', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-videos', 'interview-videos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('allcertification', 'allcertification', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for buckets (simple versions)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('profile-pictures', 'Edu_cert', 'cv_resume', 'nysc_cert', 'allcertification'));
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('profile-pictures', 'Edu_cert', 'cv_resume', 'nysc_cert', 'interview-videos', 'allcertification'));
CREATE POLICY "Owner Access" ON storage.objects FOR ALL TO authenticated USING (auth.uid()::text = (storage.foldername(name))[1]);
