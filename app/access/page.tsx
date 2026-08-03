'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import RegistrationWorkflow from '@/components/RegistrationWorkflow';

export default function AccessPortalPage() {
  return (
    <main className="min-h-screen text-[#E0E6ED] py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0d1412] via-[#121a17] to-[#0f1715]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#dbf0de]/10 border border-[#dbf0de]/20 text-[#dbf0de] inline-block">
            Deloxe HR Talent Ecosystem
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#dbf0de] tracking-tight">
            Applicant Portal
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-lg mx-auto">
            Decoupled multi-stage registration & onboarding workflow.
          </p>
        </div>

        <ToastProvider>
          <RegistrationWorkflow />
        </ToastProvider>
      </div>
    </main>
  );
}
