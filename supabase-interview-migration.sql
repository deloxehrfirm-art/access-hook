-- Supabase Migration: AI Interview System
-- Highly optimized, secure, and production-ready.

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    current_question INT NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    overall_score NUMERIC(5,2),
    recommendation VARCHAR(50),
    ai_review_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    email_status VARCHAR(50) NOT NULL DEFAULT 'unscheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_interview UNIQUE (user_id),
    CONSTRAINT check_status CHECK (status IN ('pending', 'in_progress', 'review_ongoing', 'completed')),
    CONSTRAINT check_current_question CHECK (current_question BETWEEN 1 AND 4),
    CONSTRAINT check_ai_status CHECK (ai_review_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT check_email_status CHECK (email_status IN ('unscheduled', 'queued', 'sent', 'failed'))
);

CREATE TABLE IF NOT EXISTS public.interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    question TEXT NOT NULL,
    transcript TEXT,
    video_url TEXT NOT NULL,
    duration_seconds INT,
    upload_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    transcription_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_question_per_interview UNIQUE (interview_id, question_number),
    CONSTRAINT check_question_number CHECK (question_number BETWEEN 1 AND 3),
    CONSTRAINT check_upload_status CHECK (upload_status IN ('pending', 'uploaded', 'failed')),
    CONSTRAINT check_transcription_status CHECK (transcription_status IN ('pending', 'transcribed', 'failed'))
);

CREATE TABLE IF NOT EXISTS public.interview_ai_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE UNIQUE,
    communication_score INT NOT NULL,
    confidence_score INT NOT NULL,
    professionalism_score INT NOT NULL,
    career_alignment_score INT NOT NULL,
    knowledge_score INT NOT NULL,
    motivation_score INT NOT NULL,
    internship_readiness_score INT NOT NULL,
    overall_score INT NOT NULL,
    recommendation VARCHAR(50) NOT NULL,
    strengths TEXT[] NOT NULL,
    weaknesses TEXT[] NOT NULL,
    summary TEXT NOT NULL,
    detailed_feedback TEXT NOT NULL,
    ai_model VARCHAR(100) NOT NULL,
    processing_time INT NOT NULL, -- in milliseconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interview_email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- 'accepted' or 'rejected'
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_queue_status CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE TABLE IF NOT EXISTS public.interview_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON public.interviews(created_at);
CREATE INDEX IF NOT EXISTS idx_interviews_current_question ON public.interviews(current_question);
CREATE INDEX IF NOT EXISTS idx_interviews_recommendation ON public.interviews(recommendation);
CREATE INDEX IF NOT EXISTS idx_interviews_ai_review_status ON public.interviews(ai_review_status);
CREATE INDEX IF NOT EXISTS idx_interviews_email_status ON public.interviews(email_status);

CREATE INDEX IF NOT EXISTS idx_answers_interview_id ON public.interview_answers(interview_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON public.interview_answers(user_id);

CREATE INDEX IF NOT EXISTS idx_queue_scheduled_for ON public.interview_email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.interview_email_queue(status);

-- 3. Row-Level Security (RLS) policies
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_status_history ENABLE ROW LEVEL SECURITY;

-- Students can read/create/update their own interviews, but can't modify completed ones (handled in code/policies)
CREATE POLICY "Students can view their own interviews" ON public.interviews
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Students can create their own interviews" ON public.interviews
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own interviews" ON public.interviews
    FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status != 'completed');

-- Answers policy
CREATE POLICY "Students can view their own answers" ON public.interview_answers
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own answers" ON public.interview_answers
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- AI results policy
CREATE POLICY "Students can view their own AI results" ON public.interview_ai_results
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.interviews 
            WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
        )
    );

-- Enable full read/write for service_role / administrators
CREATE POLICY "Service role full access on interviews" ON public.interviews TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on answers" ON public.interview_answers TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on ai_results" ON public.interview_ai_results TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on email_queue" ON public.interview_email_queue TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on history" ON public.interview_status_history TO service_role USING (true) WITH CHECK (true);

-- 4. Helper Functions and Procedures

-- Function: start_interview()
CREATE OR REPLACE FUNCTION public.start_interview()
RETURNS public.interviews AS $$
DECLARE
    v_user_id UUID;
    v_interview public.interviews;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Retrieve or insert the interview
    INSERT INTO public.interviews (user_id, status, started_at, current_question)
    VALUES (v_user_id, 'in_progress', NOW(), 1)
    ON CONFLICT (user_id) DO UPDATE
    SET status = CASE 
                    WHEN interviews.status = 'pending' THEN 'in_progress'
                    ELSE interviews.status
                 END,
        started_at = COALESCE(interviews.started_at, NOW())
    RETURNING * INTO v_interview;

    RETURN v_interview;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: submit_interview_answer()
CREATE OR REPLACE FUNCTION public.submit_interview_answer(
    p_question_number INT,
    p_question TEXT,
    p_video_url TEXT,
    p_duration_seconds INT,
    p_transcript TEXT DEFAULT NULL
)
RETURNS public.interview_answers AS $$
DECLARE
    v_user_id UUID;
    v_interview_id UUID;
    v_answer public.interview_answers;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get active interview
    SELECT id INTO v_interview_id 
    FROM public.interviews 
    WHERE user_id = v_user_id AND status = 'in_progress';

    IF v_interview_id IS NULL THEN
        RAISE EXCEPTION 'No active in-progress interview found for this user';
    END IF;

    -- Insert or update the answer
    INSERT INTO public.interview_answers (
        interview_id, user_id, question_number, question, video_url, duration_seconds, transcript, upload_status, transcription_status
    )
    VALUES (
        v_interview_id, v_user_id, p_question_number, p_question, p_video_url, p_duration_seconds, p_transcript, 'uploaded', 
        CASE WHEN p_transcript IS NULL THEN 'pending' ELSE 'transcribed' END
    )
    ON CONFLICT (interview_id, question_number) DO UPDATE
    SET video_url = EXCLUDED.video_url,
        duration_seconds = EXCLUDED.duration_seconds,
        transcript = COALESCE(EXCLUDED.transcript, interview_answers.transcript),
        transcription_status = CASE WHEN EXCLUDED.transcript IS NOT NULL THEN 'transcribed' ELSE interview_answers.transcription_status END,
        updated_at = NOW()
    RETURNING * INTO v_answer;

    RETURN v_answer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: complete_interview()
CREATE OR REPLACE FUNCTION public.complete_interview()
RETURNS public.interviews AS $$
DECLARE
    v_user_id UUID;
    v_interview public.interviews;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Update interview status to review_ongoing and record submission timestamp
    UPDATE public.interviews
    SET status = 'review_ongoing',
        completed_at = NOW(),
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE user_id = v_user_id AND status = 'in_progress'
    RETURNING * INTO v_interview;

    RETURN v_interview;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_interview_progress()
CREATE OR REPLACE FUNCTION public.get_interview_progress()
RETURNS TABLE (
    interview_id UUID,
    status VARCHAR(50),
    current_question INT,
    completed_answers_count INT,
    completed_questions_list INT[]
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT 
        i.id AS interview_id,
        i.status,
        i.current_question,
        COALESCE(COUNT(a.id)::INT, 0) AS completed_answers_count,
        COALESCE(array_agg(a.question_number ORDER BY a.question_number), '{}'::INT[]) AS completed_questions_list
    FROM public.interviews i
    LEFT JOIN public.interview_answers a ON i.id = a.interview_id
    WHERE i.user_id = v_user_id
    GROUP BY i.id, i.status, i.current_question;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update_interview_status()
CREATE OR REPLACE FUNCTION public.update_interview_status(
    p_interview_id UUID,
    p_new_status VARCHAR(50),
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.interviews
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: queue_interview_email()
CREATE OR REPLACE FUNCTION public.queue_interview_email(
    p_interview_id UUID,
    p_user_id UUID,
    p_email TEXT,
    p_email_type VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.interview_email_queue (
        interview_id, user_id, email, email_type, scheduled_for, status
    )
    VALUES (
        p_interview_id, p_user_id, p_email, p_email_type, NOW() + INTERVAL '40 minutes', 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Triggers for automation

-- Trigger Function: Update public.interviews.current_question & mark completed
CREATE OR REPLACE FUNCTION public.tr_on_answer_submitted()
RETURNS TRIGGER AS $$
DECLARE
    v_answers_count INT;
BEGIN
    -- Calculate total answers for this interview
    SELECT COUNT(*) INTO v_answers_count
    FROM public.interview_answers
    WHERE interview_id = NEW.interview_id;

    -- Update interviews table: progress the current_question counter
    UPDATE public.interviews
    SET current_question = LEAST(v_answers_count + 1, 4),
        -- If count is 3, transition status to review_ongoing automatically
        status = CASE WHEN v_answers_count >= 3 THEN 'review_ongoing' ELSE status END,
        completed_at = CASE WHEN v_answers_count >= 3 THEN NOW() ELSE completed_at END,
        submitted_at = CASE WHEN v_answers_count >= 3 THEN NOW() ELSE submitted_at END,
        updated_at = NOW()
    WHERE id = NEW.interview_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_on_answer_submitted
    AFTER INSERT OR UPDATE ON public.interview_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_on_answer_submitted();


-- Trigger Function: Log interview status changes
CREATE OR REPLACE FUNCTION public.tr_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.interview_status_history (
            interview_id, previous_status, new_status, changed_by, reason
        )
        VALUES (
            NEW.id, OLD.status, NEW.status, 'system', 'Trigger-based status transition'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_status_change
    AFTER UPDATE ON public.interviews
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_log_status_change();


-- Trigger Function: Queue email when AI evaluation completes
CREATE OR REPLACE FUNCTION public.tr_on_ai_evaluation_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    -- Get user_id and email from interviews & auth.users
    SELECT i.user_id, u.email INTO v_user_id, v_email
    FROM public.interviews i
    JOIN auth.users u ON i.user_id = u.id
    WHERE i.id = NEW.interview_id;

    -- Queue email
    PERFORM public.queue_interview_email(
        NEW.interview_id,
        v_user_id,
        v_email,
        NEW.recommendation
    );

    -- Update interview email_status
    UPDATE public.interviews
    SET email_status = 'queued',
        status = 'completed',
        updated_at = NOW()
    WHERE id = NEW.interview_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_on_ai_evaluation_complete
    AFTER INSERT ON public.interview_ai_results
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_on_ai_evaluation_complete();


-- Trigger Function: Keep updated_at synchronized
CREATE OR REPLACE FUNCTION public.tr_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_timestamp_interviews
    BEFORE UPDATE ON public.interviews
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_update_timestamp();

CREATE TRIGGER trigger_update_timestamp_answers
    BEFORE UPDATE ON public.interview_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_update_timestamp();


-- 6. Supabase Storage bucket policy declarations
-- Note: Supabase Buckets can be configured via SQL in the active `storage` schema.
INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-videos', 'interview-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy definitions for Storage Objects:
CREATE POLICY "Students can upload their own videos" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'interview-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Students can view their own videos" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'interview-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Service role has complete control over storage" ON storage.objects
    TO service_role USING (true) WITH CHECK (true);
