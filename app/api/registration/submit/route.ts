import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

function parseDateOrNull(val: any): string | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (!str || str === '' || str === 'null' || str === 'undefined') return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function parseUuidOrNull(val: any): string | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  return null;
}

function parseIntOrNull(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num);
}

function parseTextOrEmpty(val: any, defaultVal = ''): string {
  if (val === undefined || val === null) return defaultVal;
  return String(val).trim();
}

export async function POST(req: NextRequest) {
  try {
    const { email, userId, bookCodeId, formData } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required for final submission' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const supabase = getServiceSupabase();

    const { data: existingApp } = await supabase
      .from('applicants')
      .select('current_stage')
      .eq('email', cleanEmail)
      .maybeSingle();

    const currentDashboardStage = existingApp?.current_stage && !isNaN(Number(existingApp.current_stage)) ? existingApp.current_stage : '1';
    const careerStage = parseTextOrEmpty(formData?.current_ac_stage || formData?.current_stage, 'Final Year Student');

    let statusTag = 'Student';
    if (careerStage === 'Completed NYSC') {
      statusTag = 'Job-Ready';
    } else if (careerStage === 'Waiting for NYSC' || careerStage === 'Currently Serving (NYSC)' || careerStage === 'Currently Serving NYSC') {
      statusTag = 'Graduate';
    }

    const now = new Date().toISOString();

    const finalApplicantData = {
      email: cleanEmail,
      user_id: parseUuidOrNull(userId),
      full_name: parseTextOrEmpty(formData?.full_name),
      gender: parseTextOrEmpty(formData?.gender) || null,
      date_of_birth: parseDateOrNull(formData?.date_of_birth),
      phone_number: parseTextOrEmpty(formData?.phone_number),
      residential_address: parseTextOrEmpty(formData?.residential_address),
      institution_name: parseTextOrEmpty(formData?.institution_name),
      course_of_study: parseTextOrEmpty(formData?.course_of_study),
      degree: parseTextOrEmpty(formData?.degree),
      graduation_year: parseIntOrNull(formData?.graduation_year) || new Date().getFullYear(),
      current_ac_stage: careerStage,
      current_stage: currentDashboardStage,
      nysc_completion_date: parseDateOrNull(formData?.nysc_completion_date),
      profile_picture: parseTextOrEmpty(formData?.profile_picture) || parseTextOrEmpty(formData?.passport_photo_url),
      passport_photo_url: parseTextOrEmpty(formData?.passport_photo_url) || parseTextOrEmpty(formData?.profile_picture),
      educational_cert_url: parseTextOrEmpty(formData?.educational_cert_url),
      cv_resume_url: parseTextOrEmpty(formData?.cv_resume_url),
      nysc_cert_url: parseTextOrEmpty(formData?.nysc_cert_url) || null,
      skills: Array.isArray(formData?.skills) ? formData.skills : [],
      competitive_edge: parseTextOrEmpty(formData?.competitive_edge),
      preferred_industry: parseTextOrEmpty(formData?.preferred_industry),
      preferred_role: parseTextOrEmpty(formData?.preferred_role),
      preferred_location: parseTextOrEmpty(formData?.preferred_location),
      availability: parseTextOrEmpty(formData?.availability),
      used_book_code_id: parseUuidOrNull(bookCodeId || formData?.used_book_code_id),
      status_tag: statusTag,
      progress_percent: 100,
      onboarding_step: 9,
    };

    // 1. Upsert completed applicant record
    const { data: updatedApplicant, error: appErr } = await supabase
      .from('applicants')
      .upsert(finalApplicantData, { onConflict: 'email' })
      .select('*')
      .single();

    if (appErr) {
      console.error('Error submitting applicant record:', appErr);
      return NextResponse.json({ success: false, message: `Submission error: ${appErr.message}` }, { status: 500 });
    }

    // 2. Update registration_progress to Submitted
    const { error: rpErr } = await supabase
      .from('registration_progress')
      .upsert({
        email: cleanEmail,
        user_id: userId || null,
        step_reached: 9,
        progress_percent: 100,
        application_status: 'Submitted',
        form_data: formData || {},
        last_updated: now,
      }, { onConflict: 'email' });

    if (rpErr) {
      console.error('Error updating registration_progress on submit:', rpErr);
    }

    // 3. Fully consume the Book Code (is_used = true)
    const effectiveBookCodeId = bookCodeId || formData?.used_book_code_id;
    if (effectiveBookCodeId) {
      const { error: bcErr } = await supabase
        .from('book_codes')
        .update({
          is_used: true,
          email_used: cleanEmail,
          assigned_to_email: cleanEmail,
        })
        .eq('id', effectiveBookCodeId);

      if (bcErr) {
        console.warn('Error marking book code as used:', bcErr.message);
      }
    }

    // 4. Send Welcome Email
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Deloxe HR" <no-reply@deloxehr.com>',
          to: cleanEmail,
          subject: 'Welcome to the Deloxe HR Ecosystem! 🚀',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #0f1715; color: #E0E6ED; border-radius: 12px;">
              <h1 style="color: #dbf0de; font-size: 24px; margin-bottom: 16px;">Welcome to Deloxe HR, ${formData?.full_name || 'Applicant'}! 🎉</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Your professional application has been successfully submitted and verified.</p>
              <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">You can now log in to your dashboard anytime to track your progress, access career training modules, and receive job placement updates.</p>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://access.deloxehr.com'}/dashboard" style="background-color: #dbf0de; color: #1a2321; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 9999px; display: inline-block;">Go to My Dashboard</a>
              </div>
              <br/>
              <p style="font-size: 14px; color: #94a3b8;">Best Regards,<br/><strong>The Deloxe HR Ecosystem Team</strong></p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.warn('Email sending skipped or failed:', emailErr);
    }

    return NextResponse.json({
      success: true,
      applicant: updatedApplicant,
      message: 'Application submitted successfully!',
    });
  } catch (err: any) {
    console.error('Submit application API error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
