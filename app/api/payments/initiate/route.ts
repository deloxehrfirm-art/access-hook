import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { PRICES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phoneNumber, currency } = await req.json();

    if (!email || !name || !phoneNumber) {
      return NextResponse.json({ error: 'Name, email, and phone number are required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanPhone = String(phoneNumber).trim();
    const currKey = (currency || 'NGN') as keyof typeof PRICES;
    const amount = PRICES[currKey] || PRICES.NGN;

    const referralCode = req.cookies.get('referral_code')?.value || '';

    // Generate fresh dynamic tx_ref for each purchase attempt
    const txRef = `deloxe-tx-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const supabase = getServiceSupabase();

    // Create pending purchase record in DB
    const { data: purchase, error: pErr } = await supabase
      .from('purchases')
      .insert({
        transaction_id: txRef,
        customer_email: cleanEmail,
        amount_paid: amount,
        referrcode: referralCode || null,
        status_update: 'pending',
        reward_processed: false,
      })
      .select('id')
      .single();

    if (pErr) {
      console.error('Error recording pending purchase:', pErr);
    }

    const flwPublicKey = (process.env.NEXT_PUBLIC_FL_PUBLIC_KEY || '')
      .trim()
      .replace(/^["']|["']$/g, '');

    return NextResponse.json({
      success: true,
      txRef,
      publicKey: flwPublicKey,
      amount,
      currency: currKey,
      customer: {
        email: cleanEmail,
        name: cleanName,
        phone_number: cleanPhone,
      },
      purchaseId: purchase?.id,
    });
  } catch (err: any) {
    console.error('Initiate payment error:', err);
    return NextResponse.json({ error: err.message || 'Payment initiation failed' }, { status: 500 });
  }
}
