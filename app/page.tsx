'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Key, LogIn, ChevronRight, Mail, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [showSupportNote, setShowSupportNote] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleAuthCode = async () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        setIsVerifying(true);
        setVerificationError('');
        try {
          const supabase = getSupabase();
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setVerificationError(error.message);
          } else if (data?.session) {
            // Successfully exchanged code! Let's redirect to reset password
            router.push('/reset-password');
          } else {
            setVerificationError('Could not verify your reset link. Please try again.');
          }
        } catch (err) {
          setVerificationError('An unexpected error occurred during verification.');
        } finally {
          setIsVerifying(false);
        }
      }
    };

    handleAuthCode();
  }, [router]);

  const containerVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.15,
        ease: "easeOut"
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  if (isVerifying) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#1a2321] text-[#dbf0de]">
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-12 max-w-md w-full shadow-2xl text-center space-y-6">
          <Loader2 className="animate-spin text-[#dbf0de] mx-auto" size={48} />
          <h2 className="text-xl font-bold">Verifying Reset Link</h2>
          <p className="text-sm text-white/70">
            Securing your connection and preparing the reset portal. Please wait...
          </p>
        </div>
      </main>
    );
  }

  if (verificationError) {
    const isPkceError = verificationError.toLowerCase().includes('pkce') || verificationError.toLowerCase().includes('verifier');

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#1a2321] text-[#dbf0de]">
        <div className={`bg-white/5 backdrop-blur-md rounded-3xl border ${isPkceError ? 'border-[#dbf0de]/20 max-w-xl' : 'border-red-500/30 max-w-md'} p-8 sm:p-12 w-full shadow-2xl text-center space-y-6`}>
          <div className={`w-16 h-16 ${isPkceError ? 'bg-[#dbf0de]/10 border border-[#dbf0de]/30 text-[#dbf0de]' : 'bg-red-500/10 border border-red-500/30 text-red-400'} rounded-full flex items-center justify-center mx-auto`}>
            {isPkceError ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
          </div>
          <h2 className={`text-xl font-bold ${isPkceError ? 'text-[#dbf0de]' : 'text-red-200'}`}>
            {isPkceError ? 'Environment Domain Mismatch' : 'Verification Failed'}
          </h2>

          {isPkceError ? (
            <div className="text-left text-sm space-y-4 text-white/80 border-t border-b border-white/10 py-6">
              <p className="font-semibold text-[#dbf0de]">Why did this happen?</p>
              <p>
                You requested the password reset from a <strong>development server</strong> (your AI Studio preview), but Supabase redirected you to the <strong>production domain</strong> (<code className="bg-black/30 px-1.5 py-0.5 rounded text-red-300 font-mono text-xs">ecosystem.deloxehr.com</code>).
              </p>
              <p>
                Due to modern security standards (PKCE), the verification code can only be exchanged on the <strong>exact same domain</strong> where you initiated the request.
              </p>
              <p className="font-semibold text-[#dbf0de] mt-2">How to test and fix this:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>To test in production:</strong> Go directly to <a href="https://www.ecosystem.deloxehr.com/login" className="underline text-[#dbf0de] hover:text-white" target="_blank" rel="noopener noreferrer">ecosystem.deloxehr.com/login</a>, request the password reset link from there, and click the email link. It will work perfectly!
                </li>
                <li>
                  <strong>To test in development:</strong> You must add your development URL to your Supabase Dashboard under <strong>Project Settings → Auth → URL Configuration → Redirect URLs</strong>.
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-sm text-white/70 animate-pulse">
              {verificationError}
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setVerificationError('');
                router.push('/login');
              }}
              className="flex-1 px-6 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold hover:shadow-lg transition-all hover:scale-105"
            >
              Go to Login Page
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#1a2321] text-[#dbf0de] relative overflow-hidden py-10 sm:py-16 md:py-20">
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl flex flex-col items-center"
      >
        {/* Upper Brand Badge */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbf0de]/5 border border-[#dbf0de]/10 mb-5 sm:mb-6 backdrop-blur-sm"
        >
          <CheckCircle size={12} className="text-[#dbf0de]" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-widest text-[#dbf0de]">Deloxe Consulting Group</span>
        </motion.div>

        {/* Logo & Headline */}
        <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8 flex flex-col items-center">
          <div className="relative mb-3 sm:mb-4 group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#dbf0de] to-green-400 rounded-full blur-lg opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <Image 
              src="https://i.ibb.co/pjxqNW0p/favicon.png" 
              alt="Deloxe HR Logo" 
              width={76} 
              height={76} 
              className="relative rounded-full border border-[#dbf0de]/10 sm:w-[84px] sm:h-[84px]" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
            Deloxe <span className="text-[#dbf0de]">HR Ecosystem</span>
          </h1>
          <p className="text-[#dbf0de]/70 text-xs sm:text-sm md:text-base max-w-md mx-auto px-2">
            A premium portal for career acceleration and skills empowerment.
          </p>
        </motion.div>

        {/* Key Information Panel */}
        <motion.div 
          variants={itemVariants}
          className="w-full bg-[#dbf0de]/5 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-[#dbf0de]/10 backdrop-blur-lg shadow-2xl mb-5 sm:mb-6 relative overflow-hidden"
        >
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#dbf0de] rounded-full filter blur-[80px] opacity-10 pointer-events-none"></div>
          
          <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
            <div className="p-2 sm:p-3 bg-[#dbf0de]/10 rounded-xl sm:rounded-2xl border border-[#dbf0de]/10">
              <BookOpen size={20} className="text-[#dbf0de] sm:w-[24px] sm:h-[24px]" />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-white">Get Hired Handbook Portal</h3>
              <p className="text-xs sm:text-sm text-[#dbf0de]/80 leading-relaxed max-w-sm">
                Unlock training modules, tests, and active job placements by securing the handbook. Registrations require your unique handbook access code.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Pathways */}
        <motion.div 
          variants={itemVariants} 
          className="w-full flex flex-col gap-3 sm:gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link 
              href="/sales" 
              className="group flex flex-col justify-between p-4 sm:p-5 bg-[#dbf0de] text-[#1a2321] rounded-xl sm:rounded-2xl font-bold transition duration-300 hover:shadow-[0_0_20px_rgba(219,240,222,0.3)] hover:-translate-y-0.5"
              id="btn-get-handbook"
            >
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#1a2321]/60 block mb-0.5 sm:mb-1">Step 1</span>
                <span className="text-base sm:text-lg md:text-xl font-extrabold">Get Handbook</span>
              </div>
              <div className="flex items-center justify-between mt-4 sm:mt-6 pt-2 border-t border-[#1a2321]/10">
                <span className="text-xs font-semibold">Buy Copy & Get Code</span>
                <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform sm:w-[16px] sm:h-[16px]" />
              </div>
            </Link>

            <Link 
              href="/access" 
              className="group flex flex-col justify-between p-4 sm:p-5 bg-[#dbf0de]/5 border border-[#dbf0de]/10 hover:border-[#dbf0de]/20 rounded-xl sm:rounded-2xl text-white transition duration-300 hover:bg-[#dbf0de]/10 hover:-translate-y-0.5"
              id="btn-redeem-code"
            >
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#dbf0de]/60 block mb-0.5 sm:mb-1">Step 2</span>
                <span className="text-base sm:text-lg md:text-xl font-extrabold">Start Journey</span>
              </div>
              <div className="flex items-center justify-between mt-4 sm:mt-6 pt-2 border-t border-[#dbf0de]/10">
                <span className="text-xs font-semibold text-[#dbf0de]/60">Use Access Code</span>
                <Key size={14} className="text-[#dbf0de] transform group-hover:translate-x-1 transition-transform sm:w-[16px] sm:h-[16px]" />
              </div>
            </Link>
          </div>

          <Link 
            href="/login" 
            className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl bg-[#dbf0de]/5 border border-[#dbf0de]/10 hover:bg-[#1a2321] transition duration-300 group"
            id="btn-login"
          >
            <div className="flex items-center gap-3">
              <LogIn size={16} className="text-[#dbf0de]/60 group-hover:text-[#dbf0de] transition-colors sm:w-[18px] sm:h-[18px]" />
              <div className="text-left">
                <span className="text-[10px] text-[#dbf0de]/60 block">Already Registered?</span>
                <span className="text-xs sm:text-sm font-semibold text-white">Sign In to Your Workspace</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#dbf0de]/60 group-hover:text-white transform group-hover:translate-x-1 transition-all sm:w-[18px] sm:h-[18px]" />
          </Link>
        </motion.div>

        {/* Footer info lockup */}
        <motion.p 
          variants={itemVariants}
          className="text-[10px] text-[#dbf0de]/40 mt-8 sm:mt-12 text-center select-none"
        >
          Secured with Deloxe Professional Services &copy; {new Date().getFullYear()}
        </motion.p>
      </motion.div>

      {/* Footer Support */}
      <footer className="mt-auto pt-8 pb-4 relative z-10 w-full flex justify-center">
        <div 
          className="relative inline-block group"
          onMouseEnter={() => setShowSupportNote(true)}
          onMouseLeave={() => setShowSupportNote(false)}
        >
          <a href="mailto:support@deloxehr.com" className="flex items-center gap-2 text-[#dbf0de]/60 hover:text-[#DFFF00] transition-colors text-xs font-medium">
            <Mail size={16} />
            support@deloxehr.com
          </a>
          
          {/* Note Popup */}
          {showSupportNote && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#dbf0de] text-[#1a2321] rounded-lg shadow-xl w-64 text-center text-xs font-semibold leading-relaxed animate-in fade-in zoom-in duration-200">
              For any technical help or anything concerning the ecosystem, please contact us at support@deloxehr.com.
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
