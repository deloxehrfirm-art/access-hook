-- SQL for certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    certificate_id TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    award_date DATE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status TEXT NOT NULL DEFAULT 'verified',
    pdf_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    qr_verification_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view verified certificates" ON public.certificates;
DROP POLICY IF EXISTS "Service role full access on certificates" ON public.certificates;

-- Create Policies
CREATE POLICY "Anyone can view verified certificates" ON public.certificates
    FOR SELECT USING (true);

CREATE POLICY "Service role full access on certificates" ON public.certificates 
    TO service_role USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_certificates_applicant_id ON public.certificates(applicant_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON public.certificates(certificate_id);
