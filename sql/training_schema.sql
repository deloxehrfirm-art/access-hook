-- SQL for training system
CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_number INT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    module_number INT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(applicant_id, module_number)
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_number INT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_answer TEXT NOT NULL, -- index or text
    point INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    module_number INT NOT NULL,
    score INT NOT NULL,
    passed BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(applicant_id, module_number)
);

CREATE TABLE IF NOT EXISTS public.professional_exam_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE UNIQUE,
    score INT NOT NULL,
    passed BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_exam_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read modules" ON public.training_modules FOR SELECT USING (true);
CREATE POLICY "Public read quiz_questions" ON public.quiz_questions FOR SELECT USING (true);

CREATE POLICY "Users can manage their own training logs" ON public.training_logs
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.applicants WHERE id = applicant_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can manage their own quiz submissions" ON public.quiz_submissions
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.applicants WHERE id = applicant_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can manage their own professional exam submissions" ON public.professional_exam_submissions
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.applicants WHERE id = applicant_id AND user_id = auth.uid())
    );

-- Service Role full access
CREATE POLICY "Service role full access on training_modules" ON public.training_modules TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on training_logs" ON public.training_logs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on quiz_questions" ON public.quiz_questions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on quiz_submissions" ON public.quiz_submissions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on professional_exam_submissions" ON public.professional_exam_submissions TO service_role USING (true) WITH CHECK (true);
