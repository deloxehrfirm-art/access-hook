import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

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

    if (userId) applicantUpdates.user_id = userId;

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
          applicantUpdates[key] = formData[key];
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
