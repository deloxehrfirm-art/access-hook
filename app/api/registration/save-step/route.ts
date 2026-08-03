import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

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

export async function POST(req: NextRequest) {
  try {
    const { email, userId, step, formData } = await req.json();

    if (!email || !step) {
      return NextResponse.json({ success: false, message: 'Email and step are required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const stepNum = Number(step) || 1;
    const progressPercent = Math.min(100, Math.max(11, Math.round((stepNum / 9) * 100)));

    const supabase = getServiceSupabase();

    // Determine status tag based on current_stage if present
    let statusTag = undefined;
    if (formData?.current_stage) {
      if (formData.current_stage === 'Completed NYSC') {
        statusTag = 'Job-Ready';
      } else if (formData.current_stage === 'Waiting for NYSC' || formData.current_stage === 'Currently Serving (NYSC)' || formData.current_stage === 'Currently Serving NYSC') {
        statusTag = 'Graduate';
      } else {
        statusTag = 'Student';
      }
    }

    // Build update object for applicants table
    const applicantUpdates: Record<string, any> = {
      email: cleanEmail,
      onboarding_step: stepNum,
      progress_percent: progressPercent,
    };

    const validUserId = parseUuidOrNull(userId);
    if (validUserId) applicantUpdates.user_id = validUserId;

    // Map known form fields
    const allowedKeys = [
      'full_name', 'gender', 'date_of_birth', 'phone_number', 'residential_address',
      'institution_name', 'course_of_study', 'degree', 'graduation_year', 'current_stage',
      'nysc_completion_date', 'profile_picture', 'passport_photo_url', 'educational_cert_url',
      'cv_resume_url', 'nysc_cert_url', 'skills', 'competitive_edge', 'preferred_industry',
      'preferred_role', 'preferred_location', 'availability', 'used_book_code_id'
    ];

    if (formData && typeof formData === 'object') {
      for (const key of allowedKeys) {
        if (formData[key] !== undefined) {
          let val = formData[key];
          if (key === 'date_of_birth' || key === 'nysc_completion_date') {
            val = parseDateOrNull(val);
          } else if (key === 'used_book_code_id') {
            val = parseUuidOrNull(val);
          } else if (key === 'graduation_year') {
            val = parseIntOrNull(val);
          }
          applicantUpdates[key] = val;
        }
      }
    }

    if (statusTag) {
      applicantUpdates.status_tag = statusTag;
    }

    // 1. Update applicants table
    const { error: appErr } = await supabase
      .from('applicants')
      .upsert(applicantUpdates, { onConflict: 'email' });

    if (appErr) {
      console.error('Error saving step to applicants:', appErr);
    }

    // 2. Update registration_progress table
    const { error: rpErr } = await supabase
      .from('registration_progress')
      .upsert({
        email: cleanEmail,
        user_id: userId || null,
        step_reached: stepNum,
        progress_percent: progressPercent,
        application_status: 'Ongoing',
        form_data: formData || {},
        last_updated: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (rpErr) {
      console.error('Error saving step to registration_progress:', rpErr);
    }

    return NextResponse.json({
      success: true,
      stepReached: stepNum,
      progressPercent,
      message: 'Progress auto-saved successfully.',
    });
  } catch (err: any) {
    console.error('Save step API error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
