'use client';
import { useApplicant } from '@/components/ApplicantContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PreferencesPage() {
  const { applicant, isLoading } = useApplicant();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={48} className="animate-spin text-[#DFFF00]" />
      </div>
    );
  }

  if (!applicant) return <div className="text-red-400">Error loading data.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-3 bg-[#26312f] rounded-full hover:bg-[#dbf0de]/10 transition flex items-center justify-center text-[#dbf0de]">
          <ArrowLeft size={22} className="text-[#dbf0de]" />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-white">Preferences</h2>
      </div>
      
      <div className="bg-[#26312f] p-6 md:p-10 rounded-3xl border border-[#dbf0de]/10 shadow-xl space-y-10">
          <div className="border-b border-[#dbf0de]/10 pb-8">
              <h4 className="font-bold mb-6 text-xl text-white">Career Preferences</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DetailItem label="Preferred Industry" value={applicant.preferred_industry} />
                  <DetailItem label="Preferred Role" value={applicant.preferred_role} />
                  <DetailItem label="Preferred Location" value={applicant.preferred_location} />
              </div>
          </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#1a2321] p-4 rounded-xl border border-[#dbf0de]/5">
            <p className="text-[#dbf0de]/60 text-xs mb-1 uppercase tracking-wider">{label}</p>
            <p className="font-semibold text-sm text-white">{value}</p>
        </div>
    )
}
