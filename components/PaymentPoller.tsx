'use client';

import { useEffect } from 'react';

export default function PaymentPoller() {
  useEffect(() => {
    // Initial run on page mount
    const pollPendingPayments = async () => {
      try {
        const res = await fetch('/api/payments/poll-pending', { method: 'POST' });
        if (!res.ok) return;
      } catch {
        // Silently catch network or polling failures
      }
    };

    pollPendingPayments();

    // Poll every 30 seconds
    const interval = setInterval(pollPendingPayments, 30000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
