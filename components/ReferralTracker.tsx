'use client';
import { useEffect } from 'react';

export default function ReferralTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');

    if (refCode) {
      const verifyReferral = async () => {
        try {
          const path = window.location.pathname;
          const res = await fetch(`/api/referrals/verify?code=${encodeURIComponent(refCode)}&landingPage=${encodeURIComponent(path)}`);
          const data = await res.json();
          if (data.success) {
            console.log(`Successfully tracked referral code: ${refCode}`);
          } else {
            console.warn(`Referral tracking skipped/failed: ${data.message}`);
          }
        } catch (err) {
          console.error('Unexpected error during referral verification:', err);
        } finally {
          // Beautifully strip the ?ref=... parameter from the browser URL
          const url = new URL(window.location.href);
          url.searchParams.delete('ref');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      };

      verifyReferral();
    }
  }, []);

  return null;
}
