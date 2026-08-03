'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Award, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { VerificationStatus } from '@/components/certificate/VerificationStatus';

export default function AutoVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const certificateId = params?.certificateId as string;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'verified' | 'revoked' | 'not_found'>('loading');
  const [certificateData, setCertificateData] = useState<any>(null);

  useEffect(() => {
    if (!certificateId) return;

    const verifyCertificate = async () => {
      try {
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(certificateId.toUpperCase())}`);
        const data = await res.json();

        if (res.ok && data.status === 'verified') {
          setCertificateData(data.certificate);
          setStatus('verified');
        } else if (data.status === 'revoked') {
          setCertificateData(data.certificate);
          setStatus('revoked');
        } else {
          setCertificateData(null);
          setStatus('not_found');
        }
      } catch (err) {
        console.error('Auto verification failed:', err);
        setCertificateData(null);
        setStatus('not_found');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-[#131b1a] text-[#E0E6ED] flex flex-col justify-between">
      {/* HEADER */}
      <header className="border-b border-white/5 py-5 px-6 md:px-12 flex items-center justify-between">
        <button
          onClick={() => router.push('/verify')}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition duration-200 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Search
        </button>
        <div className="flex items-center gap-1.5 bg-[#dbf0de]/5 border border-[#dbf0de]/10 px-3 py-1.5 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-wider">
          <ShieldCheck size={12} /> Secure Registry
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:py-16 space-y-12 flex flex-col justify-center">
        
        {/* HERO TITLE */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-[#dbf0de]/10 border border-[#dbf0de]/20 rounded-2xl flex items-center justify-center text-[#dbf0de] mx-auto mb-3">
            <Award size={24} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Security Registry
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed font-mono tracking-wider">
            ID: {certificateId?.toUpperCase()}
          </p>
        </div>

        {/* STATUS CONTAINER */}
        <div className="py-4">
          <VerificationStatus
            status={loading ? 'loading' : status}
            certificate={certificateData}
            searchedId={certificateId?.toUpperCase()}
          />
        </div>

        {/* RE-ROUTE OPTIONS */}
        <div className="text-center pt-4">
          <button
            onClick={() => router.push('/verify')}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 transition-all active:scale-[0.98]"
          >
            Verify another certificate ID
          </button>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Deloxe HR. All Rights Reserved. Secure Cryptographic Ledger Verification.</p>
      </footer>
    </div>
  );
}
