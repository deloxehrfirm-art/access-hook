import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import {
  getUserInterview,
  createUserInterview,
  getInterviewAnswers,
  getEvaluationResult
} from '@/lib/db-interview';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = getServerSupabase(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's interview using our adapter
    const interview = await getUserInterview(supabase, user.id);

    if (!interview) {
      return NextResponse.json({ exists: false });
    }

    // Fetch user's submitted answers using our adapter
    const answers = await getInterviewAnswers(supabase, user.id, interview.id);

    // Fetch AI results if completed or review is ongoing using our adapter
    let aiResult = null;
    if (interview.status === 'completed' || interview.status === 'review_ongoing') {
      aiResult = await getEvaluationResult(supabase, user.id, interview.id);
    }

    return NextResponse.json({
      exists: true,
      interview,
      answers,
      aiResult
    });
  } catch (error: any) {
    console.error('Interview status GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = getServerSupabase(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if interview already exists using our adapter
    const existingInterview = await getUserInterview(supabase, user.id);

    if (existingInterview) {
      return NextResponse.json({
        success: true,
        interview: existingInterview,
        message: 'Resumed existing interview session'
      });
    }

    // Create new interview session using our adapter (which also handles status logs)
    const newInterview = await createUserInterview(supabase, user.id);

    return NextResponse.json({
      success: true,
      interview: newInterview,
      message: 'Created new interview session'
    });
  } catch (error: any) {
    console.error('Interview status POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

