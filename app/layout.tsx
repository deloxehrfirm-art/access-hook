import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ApplicantProvider } from '@/components/ApplicantContext';
import ReferralTracker from '@/components/ReferralTracker';
import PaymentPoller from '@/components/PaymentPoller';

export const metadata: Metadata = {
  title: 'Deloxe HR Ecosystem',
  description: 'Dual-portal ecosystem for Deloxe HR Consulting: Shop Books & My Library.',
  icons: {
    icon: 'https://i.ibb.co/pjxqNW0p/favicon.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="relative bg-[#1a2321] min-h-screen text-[#E0E6ED] font-sans antialiased" suppressHydrationWarning>
        {/* Scattered Shapes */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
          <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-[#d9f0dd] rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-[#DFFF00] rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
          <div className="absolute top-[50%] left-[30%] w-48 h-48 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse delay-700"></div>
          <div className="absolute bottom-[20%] left-[20%] w-72 h-72 bg-[#dbf0de] rounded-full mix-blend-screen filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        <ApplicantProvider>
            <ReferralTracker />
            <PaymentPoller />
            <div className="relative z-10">{children}</div>
        </ApplicantProvider>
      </body>
    </html>
  );
}

