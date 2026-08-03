'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import RegistrationWorkflow from '@/components/RegistrationWorkflow';

export default function RegistrationForm({ bookCodeId = '', initialBookCode = '' }: { bookCodeId?: string; initialBookCode?: string }) {
  return (
    <ToastProvider>
      <RegistrationWorkflow initialBookCode={initialBookCode} />
    </ToastProvider>
  );
}
