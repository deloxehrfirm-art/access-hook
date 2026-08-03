-- SQL for applicants table and RLS policies
-- Ensure the table exists and has the correct columns
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    gender TEXT,
    date_of_birth DATE,
    profile_picture TEXT,
    cv_resume_url TEXT,
    educational_cert_url TEXT,
    nysc_cert_url TEXT,
    institution_name TEXT,
    course_of_study TEXT,
    degree TEXT,
    graduation_year INT,
    residential_address TEXT,
    skills JSONB DEFAULT '[]',
    competitive_edge TEXT,
    preferred_industry TEXT,
    preferred_role TEXT,
    preferred_location TEXT,
    progress_percent INT DEFAULT 0,
    current_stage TEXT DEFAULT '1',
    status_tag TEXT DEFAULT 'Student',
    used_book_code_id UUID,
    readiness_certificate_id TEXT,
    readiness_certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own applicant data" ON public.applicants;
DROP POLICY IF EXISTS "Users can insert their own applicant data" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own applicant data" ON public.applicants;

-- Create Policies
CREATE POLICY "Users can view their own applicant data" ON public.applicants
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applicant data" ON public.applicants
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applicant data" ON public.applicants
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create Policy for Service Role
CREATE POLICY "Service role full access on applicants" ON public.applicants TO service_role USING (true) WITH CHECK (true);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON public.applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);
