import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // 1. Reset in Supabase
  const supabase = getServiceSupabase();
  await supabase
    .from('interviews')
    .update({ status: 'in_progress', current_question: 1 })
    .eq('user_id', userId);

  // 2. Reset in Firestore
  await db.collection('interviews').doc(userId).set({
    status: 'in_progress',
    current_question: 1,
    updated_at: new Date().toISOString()
  }, { merge: true });

  return NextResponse.json({ success: true });
}
