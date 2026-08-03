import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getUserInterview, getEvaluationResult, completeInterviewWithSimulation } from '@/lib/db-interview';

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

    // Retrieve interview and AI results using our dual db adapter
    const interview = await getUserInterview(supabase, user.id);

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const aiResult = await getEvaluationResult(supabase, user.id, interview.id);

    if (!aiResult) {
      return NextResponse.json({ error: 'AI results not found' }, { status: 404 });
    }

    // Retrieve any queued email jobs (safely try/catch in case table doesn't exist)
    let emailJob = null;
    try {
      const { data } = await supabase
        .from('interview_email_queue')
        .select('*')
        .eq('interview_id', interviewId)
        .eq('status', 'pending')
        .maybeSingle();
      emailJob = data;
    } catch (err) {
      console.warn('Could not query interview_email_queue, using direct dispatch fallback:', err);
    }

    const recipientEmail = emailJob ? emailJob.email : user.email;

    let emailSent = false;
    let emailErrorMsg = null;

    // Send email using Nodemailer if configuration exists
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
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

      // Build premium responsive HTML layout for email
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
              ${aiResult.strengths.map((s: string) => `<li><strong>${s}</strong></li>`).join('')}
            </ul>

            <h3 style="color: #ffffff; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-top: 25px;">${isAccepted ? 'Refinement Recommendations' : 'Areas for Improvement'}:</h3>
            <ul style="color: #cbd5e0; font-size: 13px; line-height: 1.6; padding-left: 20px; margin: 10px 0;">
              ${aiResult.weaknesses.map((w: string) => `<li>${w}</li>`).join('')}
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

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'DELOXE HR <noreply@deloxehr.com>',
          to: recipientEmail,
          subject: emailSubject,
          html: emailHtml,
        });
        emailSent = true;
      } catch (sendError: any) {
        console.error('Simulated mail dispatch error:', sendError);
        emailErrorMsg = sendError.message || 'SMTP Dispatch failed';
      }
    } else {
      // SMTP not configured, we'll mark as completed but record error in email
      emailErrorMsg = 'SMTP settings missing in environment configuration';
    }

    // Update email queue status safely if we had a job
    if (emailJob) {
      try {
        await supabase
          .from('interview_email_queue')
          .update({
            status: emailSent ? 'sent' : 'failed',
            sent_at: emailSent ? new Date().toISOString() : null,
            error_message: emailErrorMsg,
            retry_count: emailJob.retry_count + 1
          })
          .eq('id', emailJob.id);
      } catch (err) {
        console.error('Could not update interview_email_queue status:', err);
      }
    }

    // Transition interview status and sync stage using our dual db adapter
    await completeInterviewWithSimulation(supabase, user.id, interview.id, emailSent, emailErrorMsg, aiResult);

    return NextResponse.json({
      success: true,
      emailSent,
      emailErrorMsg,
      message: 'Interview evaluation fast-forward completed successfully!'
    });
  } catch (error: any) {
    console.error('Simulate Complete API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
