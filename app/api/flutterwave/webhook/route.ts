import { NextResponse } from 'next/server';
import { processPaymentFulfillment } from '@/lib/payment-fulfillment';

export async function POST(req: Request) {
  const secretHash = (process.env.FLUTTERWAVE_HASH || '').trim();
  const signature = req.headers.get('verif-hash');

  if (secretHash && (!signature || signature !== secretHash)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const payload = await req.json();

    console.log('Flutterwave webhook received:', payload.event, payload.data?.id);

    if (payload.event === 'charge.completed' && payload.data) {
      const data = payload.data;
      if (data.status === 'successful') {
        await processPaymentFulfillment({
          transactionId: String(data.id),
          txRef: data.tx_ref,
          customerEmail: data.customer?.email,
          amountPaid: Number(data.amount),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Flutterwave webhook error:', err);
    return NextResponse.json({ received: true, error: err.message });
  }
}

