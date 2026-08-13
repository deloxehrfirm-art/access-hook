import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';
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

    // Send email of finalized result
    let emailSent = false;
    let emailErrorMsg: string | null = null;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const isAccepted = aiResult.recommendation === 'accepted';
        const emailSubject = isAccepted 
          ? `Congratulations! You passed your Deloxe HR Placement Interview (Score: ${aiResult.overall_score}%)`
          : `Deloxe HR Placement Interview Feedback & Review`;

        const recipientEmail = user.email;

        const emailHtml = `
          <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f1412; color: #dbf0de; padding: 40px 20px; text-align: left; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(223,255,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #DFFF00; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -1px;">DELOXE HR</h1>
              <p style="color: #a0aec0; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">Placement readiness report</p>
            </div>
            
            <div style="background-color: #1e2624; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 25px;">
              <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 700;">Hi ${recipientEmail},</h2>
              <p style="color: #cbd5e0; line-height: 1.6; font-size: 14px;">
                ${isAccepted 
                  ? `Fantastic news! You have successfully passed your interactive placement readiness interview. Our AI evaluation engine and matchmaking committee have approved your candidacy.` 
                  : `Thank you for completing your interactive placement readiness interview. We have processed your submission and generated a detailed feedback report to help you prepare for corporate matching.`}
              </p>
              
              <div style="background-color: #0f1412; border-left: 4px solid #DFFF00; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <span style="font-size: 11px; text-transform: uppercase; color: #a0aec0; font-weight: bold; display: block;">Overall Readiness Score</span>
                <span style="font-size: 32px; font-weight: 900; color: #DFFF00;">${aiResult.overall_score}%</span>
              </div>

              <h3 style="color: #ffffff; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-top: 25px;">Your Top Strengths:</h3>
              <ul style="color: #cbd5e0; font-size: 13px; line-height: 1.6; padding-left: 20px; margin: 10px 0;">
                ${(aiResult.strengths || []).map((s: string) => `<li><strong>${s}</strong></li>`).join('')}
              </ul>

              <h3 style="color: #ffffff; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-top: 25px;">${isAccepted ? 'Refinement Recommendations' : 'Areas for Improvement'}:</h3>
              <ul style="color: #cbd5e0; font-size: 13px; line-height: 1.6; padding-left: 20px; margin: 10px 0;">
                ${(aiResult.weaknesses || []).map((w: string) => `<li>${w}</li>`).join('')}
              </ul>

              <h3 style="color: #ffffff; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-top: 25px;">Executive Summary:</h3>
              <p style="color: #cbd5e0; font-size: 13px; line-height: 1.6; font-style: italic;">
                "${aiResult.summary}"
              </p>

              <h3 style="color: #ffffff; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-top: 25px;">Detailed Advice:</h3>
              <p style="color: #cbd5e0; font-size: 13px; line-height: 1.6;">
                ${aiResult.detailed_feedback}
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              ${isAccepted 
                ? `<p style="color: #cbd5e0; font-size: 13px; margin-bottom: 20px;">The Job Pool is now open! Log back into your Deloxe dashboard to start exploring placements.</p>
                   <a href="${process.env.APP_URL || 'https://deloxehr.com'}/dashboard/job-pool" style="background-color: #DFFF00; color: #1a2321; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Access Job Pool Now</a>`
                : `<p style="color: #cbd5e0; font-size: 13px; margin-bottom: 20px;">Use this feedback to continue practice. Keep refining your pitch to unlock matchmaking access.</p>
                   <a href="${process.env.APP_URL || 'https://deloxehr.com'}/dashboard" style="background-color: rgba(255,255,255,0.1); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; border: 1px solid rgba(255,255,255,0.2);">Return to Dashboard</a>`}
            </div>

            <p style="text-align: center; color: #718096; font-size: 11px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
              &copy; 2026 Deloxe HR Technologies. This is an automated email evaluation.
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'DELOXE HR <noreply@deloxehr.com>',
          to: recipientEmail,
          subject: emailSubject,
          html: emailHtml,
        });
        emailSent = true;
      } catch (sendErr: any) {
        console.error('Mail dispatch error during evaluation:', sendErr);
        emailErrorMsg = sendErr.message || 'SMTP Dispatch failed';
      }
    } else {
      emailErrorMsg = 'SMTP settings missing in environment configuration';
    }

    return NextResponse.json({
      success: true,
      aiResult,
      evalResult,
      emailSent,
      emailErrorMsg
    });
  } catch (error: any) {
    console.error('Evaluate API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
