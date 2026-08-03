import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { processPaymentFulfillment } from '@/lib/payment-fulfillment';

export async function GET() {
  return await runPendingPaymentPoll();
}

export async function POST() {
  return await runPendingPaymentPoll();
}

async function runPendingPaymentPoll() {
  try {
    const flwSecretKey = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (!flwSecretKey) {
      return NextResponse.json({ success: true, message: 'FLUTTERWAVE_SECRET_KEY is not configured', processedCount: 0 });
    }

    const supabase = getServiceSupabase();

    // Find all pending purchases
    const { data: pendingPurchases, error: dbErr } = await supabase
      .from('purchases')
      .select('*')
      .or('status_update.eq.pending,status_update.is.null')
      .neq('status_update', 'paid');

    if (dbErr) {
      return NextResponse.json({ success: true, message: 'No active pending payment check needed', processedCount: 0 });
    }

    if (!pendingPurchases || pendingPurchases.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payments found.',
        processedCount: 0,
      });
    }

    const results: any[] = [];

    for (const purchase of pendingPurchases) {
      const txId = purchase.transaction_id;
      if (!txId) continue;

      let isSuccessful = false;
      let flwData: any = null;

      try {
        if (/^\d+$/.test(txId)) {
          const res = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
            headers: { Authorization: `Bearer ${flwSecretKey}` },
          });
          if (res.ok) {
            const json = await res.json();
            if (json.status === 'success' && json.data?.status === 'successful') {
              isSuccessful = true;
              flwData = json.data;
            }
          }
        } else {
          const res = await fetch(`https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txId)}`, {
            headers: { Authorization: `Bearer ${flwSecretKey}` },
          });
          if (res.ok) {
            const json = await res.json();
            if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
              const matched = json.data.find((t: any) => t.status === 'successful' || t.status === 'paid');
              if (matched) {
                isSuccessful = true;
                flwData = matched;
              }
            }
          }
        }

        if (isSuccessful && flwData) {
          const fulfillment = await processPaymentFulfillment({
            purchaseId: purchase.id,
            transactionId: flwData.id ? String(flwData.id) : txId,
            txRef: txId,
            customerEmail: flwData.customer?.email || purchase.customer_email,
            amountPaid: Number(flwData.amount || purchase.amount_paid),
            referralCode: purchase.referrcode || undefined,
          });

          results.push({
            purchaseId: purchase.id,
            txId,
            status: 'verified_and_processed',
            bookingCode: fulfillment.code,
          });
        } else {
          results.push({
            purchaseId: purchase.id,
            txId,
            status: 'still_pending',
          });
        }
      } catch (pollErr: any) {
        results.push({
          purchaseId: purchase.id,
          txId,
          status: 'error',
          error: pollErr.message || String(pollErr),
        });
      }
    }

    const processedCount = results.filter((r) => r.status === 'verified_and_processed').length;

    return NextResponse.json({
      success: true,
      totalPendingChecked: pendingPurchases.length,
      processedCount,
      results,
    });
  } catch (err) {
    return NextResponse.json({ success: true, processedCount: 0 });
  }
}
