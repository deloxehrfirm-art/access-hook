import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getInterviewAnswers, saveEvaluationResult } from '@/lib/db-interview';

// Lazily get Groq client
let groqClient: Groq | null = null;
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is required for interview evaluation.');
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function getServerSupabase(cookieStore: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = getServerSupabase(cookieStore);

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = await req.json();
    if (!interviewId) {
      return NextResponse.json({ error: 'Missing interview ID' }, { status: 400 });
    }

    // Retrieve all three submitted answers using our dual db adapter
    const answers = await getInterviewAnswers(supabase, user.id, interviewId);

    if (!answers || answers.length < 3) {
      return NextResponse.json({ 
        error: `Could not retrieve all 3 answers for this interview. Found ${answers?.length || 0} answers.` 
      }, { status: 400 });
    }

    // Merge transcripts with question labels
    const mergedTranscript = answers.map(ans => {
      return `[Question ${ans.question_number}]: ${ans.question}\n[Candidate Answer]: ${ans.transcript || '(Silence / No Verbal Response)'}`;
    }).join('\n\n');

    const startTime = Date.now();

    // Call Llama 3.1 8b via Groq with evaluation request
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert executive talent recruiter and placement director.
Evaluate the student placement interview transcripts on the following parameters:
- Communication Skills (communication_score: 1 to 100)
- Confidence (confidence_score: 1 to 100)
- Professionalism (professionalism_score: 1 to 100)
- Career Alignment (career_alignment_score: 1 to 100)
- Understanding of Internship Training / Knowledge (knowledge_score: 1 to 100)
- Motivation (motivation_score: 1 to 100)
- Internship Readiness (internship_readiness_score: 1 to 100)
- Overall weighted average score (overall_score: 1 to 100)
- Recommendation (recommendation: strictly "accepted" or "rejected")
- Strengths (strengths: array of exactly 3 bullet points identifying key career/technical strengths)
- Weaknesses (weaknesses: array of exactly 3 bullet points identifying areas for improvement)
- Summary (summary: 2-3 sentence executive summary)
- Detailed Feedback (detailed_feedback: comprehensive constructive advice)

You must return a raw JSON object matching this TypeScript interface exactly:
interface EvaluationResponse {
  communication_score: number;
  confidence_score: number;
  professionalism_score: number;
  career_alignment_score: number;
  knowledge_score: number;
  motivation_score: number;
  internship_readiness_score: number;
  overall_score: number;
  recommendation: 'accepted' | 'rejected';
  strengths: string[];
  weaknesses: string[];
  summary: string;
  detailed_feedback: string;
}

Ensure your scores are realistic, based on the transcript's clarity, motivation, depth, and professionalism. Use 'accepted' if overall_score >= 70, otherwise 'rejected'.`
        },
        {
          role: 'user',
          content: `Please evaluate the following transcript and return the JSON object:
          
${mergedTranscript}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 1536,
      response_format: { type: 'json_object' }
    });

    const processingTimeMs = Date.now() - startTime;
    const resultJsonStr = chatCompletion.choices[0]?.message?.content?.trim();
    if (!resultJsonStr) {
      throw new Error('Groq model returned empty evaluation results');
    }

    const evalResult = JSON.parse(resultJsonStr);

    // Save evaluation using our dual db adapter (handles result persistence, interview status transition, and logs)
    const aiResult = await saveEvaluationResult(supabase, user.id, interviewId, {
      interview_id: interviewId,
      communication_score: Number(evalResult.communication_score),
      confidence_score: Number(evalResult.confidence_score),
      professionalism_score: Number(evalResult.professionalism_score),
      career_alignment_score: Number(evalResult.career_alignment_score),
      knowledge_score: Number(evalResult.knowledge_score),
      motivation_score: Number(evalResult.motivation_score),
      internship_readiness_score: Number(evalResult.internship_readiness_score),
      overall_score: Number(evalResult.overall_score),
      recommendation: evalResult.recommendation,
      strengths: evalResult.strengths,
      weaknesses: evalResult.weaknesses,
      summary: evalResult.summary,
      detailed_feedback: evalResult.detailed_feedback,
      ai_model: 'llama-3.1-8b-instant',
      processing_time: processingTimeMs
    });

    return NextResponse.json({
      success: true,
      aiResult,
      evalResult
    });
  } catch (error: any) {
    console.error('Evaluate API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
