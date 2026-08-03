import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, message: 'Book Code is required' }, { status: 400 });
    }

    const cleanCode = code.trim();
    const supabase = getServiceSupabase();

    // Query book_codes table by code_string or code
    const cleanCodeEscaped = cleanCode.replace(/"/g, '');
    let bookCode = null;
    let dbErr = null;

    try {
      const { data, error } = await supabase
        .from('book_codes')
        .select('*')
        .or(`code_string.eq."${cleanCodeEscaped}",code.eq."${cleanCodeEscaped}"`)
        .maybeSingle();

      if (error) {
        dbErr = error;
      } else {
        bookCode = data;
      }
    } catch (e: any) {
      dbErr = e;
    }

    // Fallback: If .or query errored or returned nothing, try querying code_string and code individually
    if (!bookCode) {
      const { data: byCodeString } = await supabase
        .from('book_codes')
        .select('*')
        .eq('code_string', cleanCode)
        .maybeSingle();

      if (byCodeString) {
        bookCode = byCodeString;
      } else {
        const { data: byCode } = await supabase
          .from('book_codes')
          .select('*')
          .eq('code', cleanCode)
          .maybeSingle();

        if (byCode) {
          bookCode = byCode;
        }
      }
    }

    // Scenario 1: Book code does not exist
    if (!bookCode) {
      return NextResponse.json({
        success: false,
        scenario: 'NOT_FOUND',
        message: 'Invalid Book Code.',
      });
    }

    // Scenario 2: Book code already used (is_used === true)
    if (bookCode.is_used) {
      const assignedEmail = (bookCode.email_used || bookCode.assigned_to_email || '').trim().toLowerCase();

      if (!email) {
        return NextResponse.json({
          success: false,
          scenario: 'USED_NEEDS_EMAIL',
          message: 'This Book Code has already been used. Please enter your email to verify ownership.',
          bookCodeId: bookCode.id,
        });
      }

      const inputEmail = String(email).trim().toLowerCase();

      if (assignedEmail && assignedEmail === inputEmail) {
        // Emails match! Check registration progress
        const { data: rp } = await supabase
          .from('registration_progress')
          .select('*')
          .eq('email', inputEmail)
          .maybeSingle();

        const { data: appData } = await supabase
          .from('applicants')
          .select('id, user_id, onboarding_step')
          .eq('email', inputEmail)
          .maybeSingle();

        return NextResponse.json({
          success: true,
          scenario: 'USED_MATCH',
          message: 'Welcome back! Your application is already linked to this Book Code.',
          bookCodeId: bookCode.id,
          email: inputEmail,
          stepReached: rp?.step_reached || appData?.onboarding_step || 1,
          applicationStatus: rp?.application_status || 'Ongoing',
          userId: rp?.user_id || appData?.user_id || null,
        });
      } else {
        // Emails do not match
        return NextResponse.json({
          success: false,
          scenario: 'USED_MISMATCH',
          message: 'This Book Code has already been assigned to another applicant.',
          bookCodeId: bookCode.id,
        });
      }
    }

    // Scenario 3: Valid Book Code (is_used === false)
    return NextResponse.json({
      success: true,
      scenario: 'VALID',
      message: '✓ Book Code Verified',
      bookCodeId: bookCode.id,
      codeString: bookCode.code_string || bookCode.code,
      reservedEmail: bookCode.email_used || bookCode.assigned_to_email || null,
    });
  } catch (err: any) {
    console.error('Verify code API error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
