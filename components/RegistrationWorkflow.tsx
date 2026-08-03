'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound, CheckCircle2, Lock, ArrowRight, ShieldCheck, UserCheck,
  Building2, GraduationCap, Briefcase, FileText, Sparkles, AlertCircle,
  Eye, EyeOff, Camera, Plus, Trash2, Edit3, ArrowLeft, Send, Check
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import CameraCapture from '@/components/CameraCapture';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

export default function RegistrationWorkflow({ initialBookCode = '' }: { initialBookCode?: string }) {
  const router = useRouter();
  const { showToast, showModal } = useToast();

  // Workflow Stages: 1 = Code Verification, 2 = Create Account, 2.5 = Account Success, 3 = Onboarding Form (Steps 1..9)
  const [stage, setStage] = useState<1 | 2 | 2.5 | 3>(1);

  // Stage 1 State
  const [bookCode, setBookCode] = useState(initialBookCode);
  const [bookCodeId, setBookCodeId] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeErrorScenario, setCodeErrorScenario] = useState<'NOT_FOUND' | 'USED_NEEDS_EMAIL' | 'USED_MISMATCH' | null>(null);
  const [usedCodeEmail, setUsedCodeEmail] = useState('');

  // Stage 2 State (Account Creation)
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ id: string; email: string; fullName: string } | null>(null);

  // Stage 3 State (Onboarding Multi-Step Form)
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [savingStep, setSavingStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Full Applicant Form Data
  const [profileData, setProfileData] = useState({
    gender: '',
    date_of_birth: '',
    residential_address: '',
    institution_name: '',
    course_of_study: '',
    degree: '',
    graduation_year: new Date().getFullYear(),
    current_stage: 'Final Year Student',
    nysc_completion_date: '',
    profile_picture: '',
    passport_photo_url: '',
    educational_cert_url: '',
    cv_resume_url: '',
    nysc_cert_url: '',
    skills: [{ course_name: '', platform: '', year: new Date().getFullYear() }],
    competitive_edge: '',
    preferred_industry: '',
    preferred_role: '',
    preferred_location: '',
    availability: '',
  });

  // Check active auth session on mount
  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCreatedUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || '',
        });

        // Check if registration is in progress
        fetch('/api/registration/check-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.exists && data.applicationStatus === 'Ongoing') {
              setOnboardingStep(data.stepReached || 1);
              setStage(3);
            } else if (data.exists && data.applicationStatus === 'Submitted') {
              router.push('/dashboard');
            }
          })
          .catch((err) => console.warn('Check session progress error:', err));
      }
    });
  }, [router]);

  // Stage 1 Handler: Verify Book Code
  const handleVerifyBookCode = async () => {
    if (!bookCode.trim()) {
      showToast('Please enter your Book Code to continue.', 'warning');
      return;
    }

    setVerifyingCode(true);
    setCodeErrorScenario(null);

    try {
      const res = await fetch('/api/registration/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: bookCode, email: usedCodeEmail }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.scenario === 'NOT_FOUND') {
          setCodeErrorScenario('NOT_FOUND');
          showToast('Invalid Book Code.', 'error', 'Verification Failed');
        } else if (data.scenario === 'USED_NEEDS_EMAIL') {
          setCodeErrorScenario('USED_NEEDS_EMAIL');
          setBookCodeId(data.bookCodeId || '');
          showToast('This Book Code has already been used. Please enter your email to verify ownership.', 'warning');
        } else if (data.scenario === 'USED_MISMATCH') {
          setCodeErrorScenario('USED_MISMATCH');
          showToast('This Book Code has already been assigned to another applicant.', 'error');
        } else {
          showToast(data.message || 'Verification error', 'error');
        }
      } else {
        // Verification Succeeded!
        setBookCodeId(data.bookCodeId);
        setIsCodeVerified(true);
        showToast('✓ Book Code Verified', 'success');

        if (data.scenario === 'USED_MATCH') {
          // Welcome back!
          showToast('Welcome back! Your application is already linked to this Book Code.', 'info', 'Welcome Back');
          if (data.userId) {
            setCreatedUser({ id: data.userId, email: data.email, fullName: '' });
          }
          if (data.applicationStatus === 'Submitted') {
            router.push('/dashboard');
            return;
          }
          setOnboardingStep(data.stepReached || 1);
          setStage(3);
        } else {
          // Move to Stage 2 (Create Account)
          setStage(2);
        }
      }
    } catch (err: any) {
      console.error('Verify code error:', err);
      showToast('Network error verifying Book Code.', 'error');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-rose-500', width: '25%' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (score === 3) return { label: 'Good', color: 'bg-cyan-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  // Stage 2 Handler: Create Ecosystem Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountForm.fullName || !accountForm.email || !accountForm.phoneNumber || !accountForm.password) {
      showToast('All fields are required.', 'warning');
      return;
    }

    if (accountForm.password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      showToast('Password and Confirm Password do not match.', 'error');
      return;
    }

    setCreatingAccount(true);

    try {
      const res = await fetch('/api/registration/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: accountForm.fullName,
          email: accountForm.email,
          phone_number: accountForm.phoneNumber,
          password: accountForm.password,
          bookCodeId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.isExistingAccount) {
          if (data.applicationStatus === 'Ongoing') {
            showModal({
              title: 'Welcome Back!',
              message: 'An application with this email is already in progress. Would you like to resume your application?',
              type: 'info',
              primaryAction: {
                label: 'Continue Application',
                onClick: async () => {
                  // Attempt auto login or redirect to step
                  const supabase = getSupabase();
                  const { error: loginErr } = await supabase.auth.signInWithPassword({
                    email: accountForm.email,
                    password: accountForm.password,
                  });
                  if (!loginErr) {
                    setCreatedUser({ id: data.userId || '', email: accountForm.email, fullName: accountForm.fullName });
                    setOnboardingStep(data.stepReached || 1);
                    setStage(3);
                  } else {
                    router.push('/login');
                  }
                },
              },
              secondaryAction: {
                label: 'Login',
                onClick: () => router.push('/login'),
              },
              tertiaryAction: {
                label: 'Forgot Password',
                onClick: () => router.push('/reset-password'),
              },
            });
          } else if (data.applicationStatus === 'Submitted') {
            showModal({
              title: 'Application Already Submitted',
              message: 'Your application has already been submitted and verified.',
              type: 'success',
              primaryAction: {
                label: 'Go to Dashboard',
                onClick: () => router.push('/dashboard'),
              },
              secondaryAction: {
                label: 'Login',
                onClick: () => router.push('/login'),
              },
            });
          }
        } else {
          showToast(data.message || 'Error creating account.', 'error');
        }
      } else {
        // Authenticate the user session client-side
        const supabase = getSupabase();
        await supabase.auth.signInWithPassword({
          email: accountForm.email,
          password: accountForm.password,
        });

        setCreatedUser({
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
        });

        // Show Success Screen
        setStage(2.5);
      }
    } catch (err: any) {
      console.error('Create account error:', err);
      showToast('Failed to create account. Please try again.', 'error');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Stage 3 Handler: Save Step & Advance
  const handleNextStep = async () => {
    // Validate Current Step
    if (onboardingStep === 1) {
      if (!profileData.gender || !profileData.date_of_birth || !profileData.residential_address) {
        showToast('Please complete all personal information fields.', 'warning');
        return;
      }
    } else if (onboardingStep === 2) {
      if (!profileData.institution_name || !profileData.course_of_study || !profileData.degree) {
        showToast('Please complete all education fields.', 'warning');
        return;
      }
    } else if (onboardingStep === 4) {
      if (!profileData.profile_picture && !profileData.passport_photo_url) {
        showToast('Please capture or upload a passport photograph to continue.', 'warning');
        return;
      }
    } else if (onboardingStep === 5) {
      if (!profileData.educational_cert_url || !profileData.cv_resume_url) {
        showToast('Educational certificate and CV / Resume are required.', 'warning');
        return;
      }
      if (profileData.current_stage === 'Completed NYSC' && !profileData.nysc_cert_url) {
        showToast('NYSC Certificate is required for applicants who completed NYSC.', 'warning');
        return;
      }
    } else if (onboardingStep === 7) {
      if (!profileData.competitive_edge || profileData.competitive_edge.length < 20) {
        showToast('Please describe your competitive edge (min 20 characters).', 'warning');
        return;
      }
      if (!profileData.preferred_industry || !profileData.preferred_role || !profileData.preferred_location) {
        showToast('Please complete all professional preferences.', 'warning');
        return;
      }
    }

    setSavingStep(true);

    try {
      const email = createdUser?.email || accountForm.email;
      const userId = createdUser?.id;

      // Auto-save to database
      await fetch('/api/registration/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userId,
          step: onboardingStep,
          formData: profileData,
        }),
      });

      const nextStep = Math.min(9, onboardingStep + 1);
      setOnboardingStep(nextStep);
    } catch (err) {
      console.warn('Auto-save step error:', err);
    } finally {
      setSavingStep(false);
    }
  };

  const handlePrevStep = () => {
    setOnboardingStep((prev) => Math.max(1, prev - 1));
  };

  // File upload handler for certificates & documents
  const handleDocumentUpload = async (file: File, bucket: string, targetKey: keyof typeof profileData) => {
    try {
      showToast(`Uploading ${file.name}...`, 'info');
      const supabase = getSupabase();
      
      let userId = createdUser?.id || '';
      if (!userId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) userId = user.id;
        } catch (e) {
          console.warn('Could not retrieve current user for upload:', e);
        }
      }

      const ext = file.name.split('.').pop() || 'pdf';
      const fileName = userId ? `${userId}/${targetKey}-${crypto.randomUUID()}.${ext}` : `${targetKey}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      setProfileData((prev) => ({ ...prev, [targetKey]: publicUrl }));
      showToast('Document uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('File upload error:', err);
      showToast(`Upload failed: ${err.message}`, 'error');
    }
  };

  // Final Submission Handler
  const handleFinalSubmit = async () => {
    setSubmitting(true);

    try {
      const email = createdUser?.email || accountForm.email;
      const userId = createdUser?.id;

      const res = await fetch('/api/registration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userId,
          bookCodeId,
          formData: {
            ...profileData,
            full_name: createdUser?.fullName || accountForm.fullName,
            phone_number: accountForm.phoneNumber,
          },
        }),
      });

      const data = await res.json();

      if (!data.success) {
        showToast(data.message || 'Submission failed.', 'error');
      } else {
        confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 } });
        showToast('Application Submitted Successfully! 🎉', 'success', 'Congratulations');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Final submit error:', err);
      showToast('Submission failed. Please check your connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4">
      <AnimatePresence mode="wait">
        {/* STAGE 1: BOOK CODE VERIFICATION */}
        {stage === 1 && (
          <motion.div
            key="stage1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-[#dbf0de]/10 border border-[#dbf0de]/20 rounded-2xl text-[#dbf0de] mb-2">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#dbf0de]">Portal Access Verification</h2>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Enter your valid Book Access Code to unlock account registration and begin your onboarding journey.
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={bookCode}
                  onChange={(e) => setBookCode(e.target.value.toUpperCase())}
                  disabled={isCodeVerified || verifyingCode}
                  placeholder="e.g. DELOXE-ABCD-1234"
                  className={`w-full p-4 pl-12 rounded-2xl bg-[#1a2321]/80 border text-white font-mono text-base sm:text-lg focus:outline-none transition-all ${
                    isCodeVerified
                      ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                      : 'border-white/15 focus:border-[#dbf0de]'
                  }`}
                />
                <KeyRound className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                {isCodeVerified && (
                  <CheckCircle2 className="w-6 h-6 absolute right-4 top-4 text-emerald-400" />
                )}
              </div>

              {codeErrorScenario === 'USED_NEEDS_EMAIL' && (
                <div className="space-y-3 p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-amber-200">
                  <p className="text-xs font-semibold">Enter the email linked to this Book Code to resume your application:</p>
                  <input
                    type="email"
                    value={usedCodeEmail}
                    onChange={(e) => setUsedCodeEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full p-3 rounded-xl bg-black/40 border border-amber-500/40 text-white text-sm"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyBookCode}
                disabled={verifyingCode || isCodeVerified}
                className="w-full p-4 bg-[#dbf0de] text-[#1a2321] rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-2"
              >
                {verifyingCode ? 'Verifying Code...' : isCodeVerified ? '✓ Book Code Verified' : 'Verify Book Code'}
                {!verifyingCode && !isCodeVerified && <ArrowRight className="w-5 h-5" />}
              </button>

              {(codeErrorScenario === 'NOT_FOUND' || codeErrorScenario === 'USED_MISMATCH') && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/sales')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-[#dbf0de] rounded-xl font-semibold text-xs sm:text-sm border border-white/15 transition-all inline-flex items-center gap-2"
                  >
                    Get Book Code
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STAGE 2: CREATE ECOSYSTEM ACCOUNT */}
        {stage === 2 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-6"
          >
            {/* Verified Code Header */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs sm:text-sm font-semibold">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> ✓ Book Code Verified ({bookCode})
              </span>
              <span className="text-emerald-400 font-mono">Verified</span>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#dbf0de]">Create Ecosystem Account</h2>
              <p className="text-xs sm:text-sm text-gray-300">Set up your credentials to access the candidate portal.</p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1 block">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={accountForm.fullName}
                  onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                  placeholder="e.g. Chinedu Alex Okonkwo"
                  className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 block">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={accountForm.phoneNumber}
                    onChange={(e) => setAccountForm({ ...accountForm, phoneNumber: e.target.value })}
                    placeholder="e.g. +2348012345678"
                    className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1 block">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full p-3.5 pr-10 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {accountForm.password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrength(accountForm.password).color}`}
                        style={{ width: getPasswordStrength(accountForm.password).width }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">
                      Strength: <strong className="text-white">{getPasswordStrength(accountForm.password).label}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1 block">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={accountForm.confirmPassword}
                  onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] focus:outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={creatingAccount}
                className="w-full p-4 bg-[#dbf0de] text-[#1a2321] rounded-2xl font-bold text-base hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl mt-2"
              >
                {creatingAccount ? 'Creating Ecosystem Account...' : 'Create Ecosystem Account'}
              </button>
            </form>
          </motion.div>
        )}

        {/* STAGE 2.5: ACCOUNT CREATED SUCCESS SCREEN */}
        {stage === 2.5 && (
          <motion.div
            key="stage2.5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 sm:p-12 rounded-3xl shadow-2xl text-center space-y-6 max-w-lg mx-auto"
          >
            <div className="w-20 h-20 bg-[#dbf0de]/20 border border-[#dbf0de]/40 text-[#dbf0de] rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
              🎉
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#dbf0de]">Welcome to the Deloxe HR Ecosystem</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Your account has been created successfully. You&apos;re now ready to complete your professional profile.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setStage(3)}
                className="px-8 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold text-base hover:scale-105 transition-transform shadow-xl"
              >
                Proceed to Complete Profile
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-gray-200 rounded-full font-semibold text-sm border border-white/10 transition-colors"
              >
                Login Instead
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE 3: APPLICANT ONBOARDING MULTI-STEP FORM */}
        {stage === 3 && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-8"
          >
            {/* Header Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="text-[#dbf0de] uppercase tracking-wider font-bold">Step {onboardingStep} of 9</span>
                <span className="text-gray-400 font-mono">{Math.round((onboardingStep / 9) * 100)}% Completed</span>
              </div>

              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-[#dbf0de] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(onboardingStep / 9) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* STEP 1: Personal Information */}
            {onboardingStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#dbf0de]" /> Step 1: Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Gender *</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Date of Birth *</label>
                    <input
                      type="date"
                      value={profileData.date_of_birth}
                      onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 block">Residential Address *</label>
                  <input
                    type="text"
                    value={profileData.residential_address}
                    onChange={(e) => setProfileData({ ...profileData, residential_address: e.target.value })}
                    placeholder="Full residential street address, city, state"
                    className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Education */}
            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#dbf0de]" /> Step 2: Educational Background
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Institution Name *</label>
                    <input
                      type="text"
                      value={profileData.institution_name}
                      onChange={(e) => setProfileData({ ...profileData, institution_name: e.target.value })}
                      placeholder="e.g. University of Lagos"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Course of Study *</label>
                    <input
                      type="text"
                      value={profileData.course_of_study}
                      onChange={(e) => setProfileData({ ...profileData, course_of_study: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Degree *</label>
                    <input
                      type="text"
                      value={profileData.degree}
                      onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                      placeholder="e.g. B.Sc, B.Tech, HND"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Graduation Year *</label>
                    <input
                      type="number"
                      value={profileData.graduation_year}
                      onChange={(e) => setProfileData({ ...profileData, graduation_year: Number(e.target.value) })}
                      placeholder="2024"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Current Career Stage */}
            {onboardingStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#dbf0de]" /> Step 3: Current Career Stage
                </h3>
                <p className="text-xs text-gray-300">Select your current career stage to customize your talent category.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'Final Year Student', label: 'Final Year Student', desc: 'Currently completing undergraduate degree' },
                    { id: 'Waiting for NYSC', label: 'Waiting for NYSC', desc: 'Graduated, awaiting call-up' },
                    { id: 'Currently Serving (NYSC)', label: 'Currently Serving NYSC', desc: 'Actively serving NYSC primary assignment' },
                    { id: 'Completed NYSC', label: 'Completed NYSC', desc: 'Discharged from NYSC, ready for full-time roles' },
                  ].map((stageOpt) => (
                    <button
                      key={stageOpt.id}
                      type="button"
                      onClick={() => setProfileData({ ...profileData, current_stage: stageOpt.id })}
                      className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        profileData.current_stage === stageOpt.id
                          ? 'bg-[#dbf0de]/15 border-[#dbf0de] text-[#dbf0de] shadow-lg'
                          : 'bg-[#1a2321] border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm block mb-1">{stageOpt.label}</span>
                        <span className="text-xs text-gray-400">{stageOpt.desc}</span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          profileData.current_stage === stageOpt.id ? 'border-[#dbf0de] bg-[#dbf0de] text-[#1a2321]' : 'border-gray-500'
                        }`}>
                          {profileData.current_stage === stageOpt.id && <Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Profile Picture (Live Camera + Upload) */}
            {onboardingStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#dbf0de]" /> Step 4: Passport Photograph
                </h3>
                <p className="text-xs text-gray-300">
                  Provide a clear, professional passport photograph using your live camera or file upload.
                </p>

                <CameraCapture
                  existingUrl={profileData.profile_picture || profileData.passport_photo_url}
                  showToast={showToast}
                  onPhotoSelected={(url) => {
                    setProfileData((prev) => ({
                      ...prev,
                      profile_picture: url,
                      passport_photo_url: url,
                    }));
                  }}
                />
              </div>
            )}

            {/* STEP 5: Document Upload */}
            {onboardingStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#dbf0de]" /> Step 5: Document Upload
                </h3>

                <div className="space-y-4">
                  {/* Educational Certificate */}
                  <div className="p-4 bg-[#1a2321] rounded-2xl border border-white/10 space-y-2">
                    <label className="text-xs font-semibold text-gray-300 block">Educational Certificate (Degree/HND) *</label>
                    {profileData.educational_cert_url ? (
                      <div className="flex items-center justify-between text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Certificate Uploaded</span>
                        <a href={profileData.educational_cert_url} target="_blank" rel="noreferrer" className="underline font-semibold">View</a>
                      </div>
                    ) : (
                      <input
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'Edu_cert', 'educational_cert_url')}
                        className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#dbf0de] file:text-[#1a2321] file:font-bold hover:file:cursor-pointer"
                      />
                    )}
                  </div>

                  {/* CV / Resume */}
                  <div className="p-4 bg-[#1a2321] rounded-2xl border border-white/10 space-y-2">
                    <label className="text-xs font-semibold text-gray-300 block">Curriculum Vitae (CV) / Resume *</label>
                    {profileData.cv_resume_url ? (
                      <div className="flex items-center justify-between text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> CV / Resume Uploaded</span>
                        <a href={profileData.cv_resume_url} target="_blank" rel="noreferrer" className="underline font-semibold">View</a>
                      </div>
                    ) : (
                      <input
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'cv_resume', 'cv_resume_url')}
                        className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#dbf0de] file:text-[#1a2321] file:font-bold hover:file:cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Conditional NYSC Certificate */}
                  {profileData.current_stage === 'Completed NYSC' && (
                    <div className="p-4 bg-[#1a2321] rounded-2xl border border-white/10 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block">NYSC Discharge Certificate *</label>
                        {profileData.nysc_cert_url ? (
                          <div className="flex items-center justify-between text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 mt-1">
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> NYSC Cert Uploaded</span>
                            <a href={profileData.nysc_cert_url} target="_blank" rel="noreferrer" className="underline font-semibold">View</a>
                          </div>
                        ) : (
                          <input
                            type="file"
                            onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'nysc_cert', 'nysc_cert_url')}
                            className="w-full text-xs text-gray-300 mt-1 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#dbf0de] file:text-[#1a2321] file:font-bold hover:file:cursor-pointer"
                          />
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-300 block">NYSC Completion Date *</label>
                        <input
                          type="date"
                          value={profileData.nysc_completion_date}
                          onChange={(e) => setProfileData({ ...profileData, nysc_completion_date: e.target.value })}
                          className="w-full p-3 rounded-xl bg-black/30 border border-white/15 text-white text-xs mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Skills Inventory */}
            {onboardingStep === 6 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#dbf0de]" /> Step 6: Skills Inventory
                  </h3>
                  <button
                    type="button"
                    onClick={() => setProfileData({
                      ...profileData,
                      skills: [...profileData.skills, { course_name: '', platform: '', year: new Date().getFullYear() }]
                    })}
                    className="px-3 py-1.5 bg-[#dbf0de] text-[#1a2321] rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Skill
                  </button>
                </div>

                <div className="space-y-3">
                  {profileData.skills.map((sk, idx) => (
                    <div key={idx} className="p-4 bg-[#1a2321] rounded-2xl border border-white/10 space-y-2 relative">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Skill / Course Name"
                          value={sk.course_name}
                          onChange={(e) => {
                            const newSkills = [...profileData.skills];
                            newSkills[idx].course_name = e.target.value;
                            setProfileData({ ...profileData, skills: newSkills });
                          }}
                          className="p-2.5 rounded-xl bg-black/30 border border-white/15 text-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Platform / Institute"
                          value={sk.platform}
                          onChange={(e) => {
                            const newSkills = [...profileData.skills];
                            newSkills[idx].platform = e.target.value;
                            setProfileData({ ...profileData, skills: newSkills });
                          }}
                          className="p-2.5 rounded-xl bg-black/30 border border-white/15 text-white text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Year"
                          value={sk.year}
                          onChange={(e) => {
                            const newSkills = [...profileData.skills];
                            newSkills[idx].year = Number(e.target.value);
                            setProfileData({ ...profileData, skills: newSkills });
                          }}
                          className="p-2.5 rounded-xl bg-black/30 border border-white/15 text-white text-xs"
                        />
                      </div>
                      {profileData.skills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileData({
                              ...profileData,
                              skills: profileData.skills.filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Skill
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Professional Information */}
            {onboardingStep === 7 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#dbf0de]" /> Step 7: Professional Information
                </h3>

                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 block">Your Competitive Edge *</label>
                  <textarea
                    value={profileData.competitive_edge}
                    onChange={(e) => setProfileData({ ...profileData, competitive_edge: e.target.value })}
                    rows={4}
                    placeholder="Describe your core strengths, unique skill set, leadership experiences, or achievements that make you stand out..."
                    className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Preferred Industry *</label>
                    <input
                      type="text"
                      value={profileData.preferred_industry}
                      onChange={(e) => setProfileData({ ...profileData, preferred_industry: e.target.value })}
                      placeholder="e.g. FinTech, Healthcare, Energy"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Preferred Role *</label>
                    <input
                      type="text"
                      value={profileData.preferred_role}
                      onChange={(e) => setProfileData({ ...profileData, preferred_role: e.target.value })}
                      placeholder="e.g. Software Engineer, HR Specialist"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Preferred Work Location *</label>
                    <input
                      type="text"
                      value={profileData.preferred_location}
                      onChange={(e) => setProfileData({ ...profileData, preferred_location: e.target.value })}
                      placeholder="e.g. Lagos, Remote, Hybrid"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 mb-1 block">Availability *</label>
                    <input
                      type="text"
                      value={profileData.availability}
                      onChange={(e) => setProfileData({ ...profileData, availability: e.target.value })}
                      placeholder="e.g. Immediate, 2 Weeks, 1 Month"
                      className="w-full p-3.5 rounded-xl bg-[#1a2321] border border-white/15 text-white focus:border-[#dbf0de] text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: Review */}
            {onboardingStep === 8 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#dbf0de] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#dbf0de]" /> Step 8: Profile Review
                </h3>
                <p className="text-xs text-gray-300">
                  Review all details before submitting. You can click &quot;Edit&quot; on any section to modify information.
                </p>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {/* Personal Summary */}
                  <div className="p-4 bg-[#1a2321] rounded-2xl border border-white/10 flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-[#dbf0de] uppercase tracking-wider mb-2">Personal Information</h4>
                      <p className="text-xs text-gray-300">Name: <span className="text-white font-semibold">{createdUser?.fullName || accountForm.fullName}</span></p>
                      <p className="text-xs text-gray-300">Gender: <span className="text-white capitalize">{profileData.gender}</span></p>
                      <p className="text-xs text-gray-300">Address: <span className="text-white">{profileData.residential_address}</span></p>
                    </div>
                    <button type="button" onClick={() => setOnboardingStep(1)} className="text-xs text-[#dbf0de] font-semibold flex items-center gap-1 hover:underline">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  {/* Education Summary */}
                  <div className="p-4 bg-[#1a2321] rounded-2xl border border-white/10 flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-[#dbf0de] uppercase tracking-wider mb-2">Education & Stage</h4>
                      <p className="text-xs text-gray-300">Institution: <span className="text-white">{profileData.institution_name}</span></p>
                      <p className="text-xs text-gray-300">Course & Degree: <span className="text-white">{profileData.course_of_study} ({profileData.degree})</span></p>
                      <p className="text-xs text-gray-300">Career Stage: <span className="text-white font-semibold">{profileData.current_stage}</span></p>
                    </div>
                    <button type="button" onClick={() => setOnboardingStep(2)} className="text-xs text-[#dbf0de] font-semibold flex items-center gap-1 hover:underline">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  {/* Documents & Photo Summary */}
                  <div className="p-4 bg-[#1a2321] rounded-2xl border border-white/10 flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-[#dbf0de] uppercase tracking-wider mb-2">Documents & Photo</h4>
                      <p className="text-xs text-gray-300">Passport Photo: <span className="text-emerald-400 font-semibold">Verified</span></p>
                      <p className="text-xs text-gray-300">Edu Certificate: <span className="text-emerald-400 font-semibold">Uploaded</span></p>
                      <p className="text-xs text-gray-300">CV / Resume: <span className="text-emerald-400 font-semibold">Uploaded</span></p>
                    </div>
                    <button type="button" onClick={() => setOnboardingStep(4)} className="text-xs text-[#dbf0de] font-semibold flex items-center gap-1 hover:underline">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: Final Submission */}
            {onboardingStep === 9 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-[#dbf0de]/10 border border-[#dbf0de]/30 text-[#dbf0de] rounded-full flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-[#dbf0de]">Ready for Final Submission</h3>
                  <p className="text-xs sm:text-sm text-gray-300">
                    By submitting your profile, your verified information will be enrolled into the Deloxe HR Ecosystem talent pool.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto px-10 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold text-base hover:scale-105 transition-transform shadow-2xl disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Stepper Navigation */}
            {onboardingStep < 9 && (
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={onboardingStep === 1 || savingStep}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={savingStep}
                  className="px-6 py-2.5 bg-[#dbf0de] text-[#1a2321] rounded-xl text-xs font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {savingStep ? 'Saving...' : 'Continue'}
                  {!savingStep && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
