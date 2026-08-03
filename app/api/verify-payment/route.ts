import { NextRequest, NextResponse } from 'next/server';
import { processPaymentFulfillment } from '@/lib/payment-fulfillment';

export async function POST(req: NextRequest) {
  try {
    const { transaction_id, tx_ref, expectedCurrency, userEmail } = await req.json();

    const flwSecretKey = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim().replace(/^["']|["']$/g, '');
    const txId = transaction_id || tx_ref;

    if (!txId) {
      return NextResponse.json({ success: false, message: 'Transaction ID is required' }, { status: 400 });
    }

    // Get referral code from HttpOnly cookie
    const referralCode = req.cookies.get('referral_code')?.value || '';

    let isVerified = false;
    let txAmount = 0;
    let txEmail = userEmail || '';

    if (flwSecretKey) {
      if (/^\d+$/.test(String(txId))) {
        // Verify with Flutterwave by numeric transaction ID
        const res = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
          headers: { Authorization: `Bearer ${flwSecretKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data?.status === 'successful') {
            isVerified = true;
            txAmount = data.data.amount;
            txEmail = data.data.customer?.email || userEmail;
          }
        }
      } else {
        // Query Flutterwave by tx_ref
        const res = await fetch(`https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(String(txId))}`, {
          headers: { Authorization: `Bearer ${flwSecretKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
            const matched = data.data.find((t: any) => t.status === 'successful' || t.status === 'paid');
            if (matched) {
              isVerified = true;
              txAmount = matched.amount;
              txEmail = matched.customer?.email || userEmail;
            }
          }
        }
      }
    } else {
      // If FLW Secret Key is not configured in environment, assume verified for development
      isVerified = true;
    }

    if (!isVerified) {
      return NextResponse.json({ success: false, message: 'Payment verification failed' });
    }

    // Process fulfillment using shared helper
    const result = await processPaymentFulfillment({
      transactionId: String(txId),
      txRef: String(tx_ref || txId),
      customerEmail: txEmail || userEmail,
      amountPaid: txAmount,
      referralCode,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'Fulfillment error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, code: result.code });
  } catch (err: any) {
    console.error('Verify payment route error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}

