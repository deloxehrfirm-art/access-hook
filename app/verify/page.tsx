'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, Award, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VerificationStatus } from '@/components/certificate/VerificationStatus';

export default function VerifyPortalPage() {
  const router = useRouter();
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verified' | 'revoked' | 'not_found'>('idle');
  const [certificateData, setCertificateData] = useState<any>(null);
  const [searchedId, setSearchedId] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = certId.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setStatus('loading' as any);
    setSearchedId(cleanId);

    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(cleanId)}`);
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
      console.error('Verification query failed:', err);
      setCertificateData(null);
      setStatus('not_found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131b1a] text-[#E0E6ED] flex flex-col justify-between">
      {/* HEADER */}
      <header className="border-b border-white/5 py-5 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#dbf0de]/10 border border-[#dbf0de]/20 rounded-xl flex items-center justify-center text-[#dbf0de]">
            <Award size={18} />
          </div>
          <span className="font-extrabold text-white tracking-tight text-base sm:text-lg">
            Deloxe <span className="text-[#dbf0de] font-light">Ecosystem</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#dbf0de]/5 border border-[#dbf0de]/10 px-3 py-1.5 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-wider">
          <ShieldCheck size={12} /> Secure Registry
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:py-16 space-y-12 flex flex-col justify-center">
        
        {/* HERO TITLE */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Certificate Verification
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
            Enter a Certificate ID below to verify the authenticity of a Workplace Readiness Professional Certificate.
          </p>
        </div>

        {/* SEARCH FORM */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c2624] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Certificate Identification ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. DELX-2026-000001"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#131b1a] border border-white/10 focus:border-[#dbf0de] text-white placeholder-gray-600 rounded-2xl font-mono text-sm tracking-widest focus:outline-none transition duration-200"
                  required
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !certId.trim()}
              className="w-full py-4 bg-[#dbf0de] hover:bg-[#cbe2ce] disabled:opacity-40 disabled:hover:bg-[#dbf0de] text-[#1a2321] rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition duration-200 shadow-lg"
            >
              Verify Credentials
            </button>
          </form>
        </motion.div>

        {/* RESULTS AREA */}
        <AnimatePresence mode="wait">
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <VerificationStatus
                status={status}
                certificate={certificateData}
                searchedId={searchedId}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* HELP INFO */}
        <div className="bg-[#1c2624]/40 border border-white/5 rounded-2xl p-5 flex gap-3 text-xs leading-relaxed text-gray-400 max-w-lg mx-auto">
          <HelpCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-gray-300">Need help verifying?</span>
            <p>
              Each professional credential is given a unique 14-digit serial. To instantly verify, scan the QR code located in the lower-left corner of the certificate or input the code in the search container above.
            </p>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Deloxe HR. All Rights Reserved. Secure Cryptographic Ledger Verification.</p>
      </footer>
    </div>
  );
}
