import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = getServiceSupabase();

    // Check registration_progress table
    const { data: rp } = await supabase
      .from('registration_progress')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    // Check applicants table
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, user_id, email, onboarding_step, progress_percent, status_tag')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (rp || applicant) {
      const status = rp?.application_status || (applicant ? 'Submitted' : 'Ongoing');
      const step = rp?.step_reached || applicant?.onboarding_step || 1;

      return NextResponse.json({
        exists: true,
        applicationStatus: status,
        stepReached: step,
        progressPercent: rp?.progress_percent || applicant?.progress_percent || 0,
        userId: rp?.user_id || applicant?.user_id || null,
      });
    }

    return NextResponse.json({
      exists: false,
      applicationStatus: null,
      stepReached: 1,
    });
  } catch (err: any) {
    console.error('Check account API error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
