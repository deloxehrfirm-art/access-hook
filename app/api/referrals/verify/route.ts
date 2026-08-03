import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const path = searchParams.get('landingPage') || searchParams.get('path') || '/';

    if (!code) {
      return NextResponse.json({ success: false, message: 'No referral code provided' }, { status: 400 });
    }

    // 1. Validate against Firebase partners collection
    const partnersRef = db.collection('partners');
    const snapshot = await partnersRef.where('referralCode', '==', code).get();

    if (snapshot.empty) {
      return NextResponse.json({ success: false, message: 'Invalid referral code' }, { status: 404 });
    }

    // Since referralCode is unique, take the first document
    const partnerDoc = snapshot.docs[0];
    const partnerData = partnerDoc.data();
    const partnerId = partnerData.partnerId;

    // 2. Parse visitor metadata
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'Unknown';

    // Basic Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Device detection
    let device = 'Desktop';
    if (/mobile|android|iphone|phone/i.test(userAgent)) {
      device = 'Mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      device = 'Tablet';
    }

    // Check for duplicate click (same partnerId, ip, and device)
    const duplicateQuery = await db.collection('referral_clicks')
      .where('partnerId', '==', partnerId)
      .where('ip', '==', ip)
      .where('device', '==', device)
      .limit(1)
      .get();

    const isDuplicate = !duplicateQuery.empty;

    if (!isDuplicate) {
      // Generate a human-readable clickId beginning with DELX_CLI_
      const randomHex = Math.random().toString(36).substring(2, 12).toUpperCase();
      const clickId = `DELX_CLI_${randomHex}`;

      // 3. Create referral_clicks document
      const clickRef = db.collection('referral_clicks').doc(clickId);
      await clickRef.set({
        clickId,
        partnerId,
        referralCode: code,
        browser,
        device,
        country,
        ip,
        landingPage: path,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 4. Update corresponding partner_stats document
      const statsRef = db.collection('partner_stats').doc(partnerId);
      const statsDoc = await statsRef.get();

      if (!statsDoc.exists) {
        await statsRef.set({
          partnerId,
          totalClicks: 1,
          totalPurchases: 0,
          totalCommission: 0,
          balance: 0,
          lastUpdated: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await statsRef.update({
          totalClicks: FieldValue.increment(1),
          lastUpdated: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // 4b. Create in-app notification for the partner
      const notificationRef = db.collection('notifications').doc();
      const notificationId = notificationRef.id;
      await notificationRef.set({
        notificationId,
        partnerId,
        title: 'New Referral Click',
        message: `Someone visited your referral link from ${country} using ${browser} on ${device}.`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // 5. Store referral code securely in an HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      partnerId,
      referralCode: code,
      rewardRate: partnerData.rewardRate,
      payoutFrequency: partnerData.payoutFrequency,
      isDuplicate,
    });

    response.cookies.set('referral_code', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Error in referral verification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
