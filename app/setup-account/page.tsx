'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupAccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/access');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a2321] text-white text-sm font-semibold">
      Redirecting to applicant onboarding portal...
    </div>
  );
}
