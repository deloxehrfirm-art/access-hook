'use client';
import { useState, useEffect } from 'react';
import { useApplicant } from '@/components/ApplicantContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SiteMapTour from '@/components/layout/SiteMapTour';
import { getSupabase } from '@/lib/supabase';
import { 
  BookOpen, Lock, Unlock, Award, Check, CheckCircle2, 
  ArrowRight, Loader2, User as UserIcon, Briefcase, Calendar, 
  CheckCircle, ChevronRight, Play, FileText, Send, UserCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import Image from 'next/image';

export default function DashboardPage() {
  const { applicant, quizSubmissions, modules, isLoading, refreshApplicantData } = useApplicant();
  const router = useRouter();

  const [examSubmission, setExamSubmission] = useState<{ score: number, percentage: number } | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);
  
  // Certificate state
  const [certificate, setCertificate] = useState<any | null>(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);

  // Interview state
  const [interviewFormOpen, setInterviewFormOpen] = useState(false);
  const [careerGoals, setCareerGoals] = useState('');
  const [problemSolving, setProblemSolving] = useState('');
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [interviewSuccess, setInterviewSuccess] = useState(false);

  useEffect(() => {
    if (!applicant) return;
    const fetchExamScore = async () => {
      try {
        setLoadingExam(true);
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('professional_exam_submissions')
          .select('score, percentage')
          .eq('applicant_id', applicant.id)
          .maybeSingle();

        if (error) {
          console.error('Supabase query error (professional_exam_submissions):', error);
        }

        if (data) {
          setExamSubmission(data);
        }
      } catch (err) {
        console.error('Unexpected error loading exam details on dashboard:', err);
      } finally {
        setLoadingExam(false);
      }
    };

    fetchExamScore();
  }, [applicant]);

  // Load Certificate if stageInt >= 5 (implies final exam submitted)
  const stageInt = applicant ? (parseInt(applicant.current_stage) || 1) : 1;
  
  useEffect(() => {
    if (!applicant || stageInt < 5) return;
    
    const fetchCertificate = async () => {
      try {
        setLoadingCertificate(true);
        const res = await fetch('/api/certificates/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicantId: applicant.id }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCertificate(data.certificate);
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
      } finally {
        setLoadingCertificate(false);
      }
    };
    
    fetchCertificate();
  }, [applicant, stageInt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 size={48} className="animate-spin text-[#DFFF00]" />
      </div>
    );
  }

  if (!applicant) {
    return <div className="text-red-400 p-8 text-center">Error loading applicant data.</div>;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // Calculate progress based on sequential journey
  const completedQuizzesCount = Array.from(new Set((quizSubmissions || []).map(sub => sub?.module_number).filter(Boolean))).length;
  const totalModulesCount = modules.length || 5;

  const getJourneyProgress = () => {
    if (stageInt >= 6) return 100;
    if (stageInt === 5) return 80;
    if (stageInt === 4) return 60;
    
    // Stage 3 is Internship Readiness Training.
    // Base before Stage 3 starts is 40% (Stage 1 & Stage 2 are complete)
    const trainingProgress = (completedQuizzesCount / totalModulesCount) * 20;
    return Math.round(40 + trainingProgress);
  };

  const journeyPercent = getJourneyProgress();

  const handleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerGoals.trim() || !problemSolving.trim()) return;

    try {
      setSubmittingInterview(true);
      const supabase = getSupabase();

      // Update current_stage to '6' (Job Pool Access)
      const { error } = await supabase
        .from('applicants')
        .update({ 
          current_stage: '6',
          competitive_edge: `Career Motivation: ${careerGoals}\nProblem Solving Roadblock: ${problemSolving}`
        })
        .eq('id', applicant.id);

      if (error) throw error;

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setInterviewSuccess(true);
      setInterviewFormOpen(false);
      await refreshApplicantData();
    } catch (err) {
      console.error('Error submitting interview assessment:', err);
      alert('Failed to submit interview answers. Please try again.');
    } finally {
      setSubmittingInterview(false);
    }
  };

  return (
    <DashboardLayout>
      <SiteMapTour />
      
      {/* Premium Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5" id="dashboard-header-bar">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#DFFF00]/30 shadow-lg bg-[#26312f] flex items-center justify-center">
            {applicant.profile_picture ? (
              <Image 
                src={applicant.profile_picture} 
                alt={applicant.full_name} 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xl font-bold text-[#dbf0de]">
                {applicant.full_name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || <UserIcon size={24} />}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {greeting}, <span className="text-[#DFFF00]">{applicant.full_name}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Student ID: DELX-2026-{applicant.id.substring(0, 4).toUpperCase()} &bull; {applicant.status_tag}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#26312f] border border-white/5 text-right hidden sm:block">
            <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Journey Status</span>
            <span className="text-xs text-[#dbf0de] font-semibold">{stageInt >= 6 ? 'Job-Ready Candidate' : 'Preparation Phase'}</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Journey Stats & Progress (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress Card inspired by "Your progress 72%" */}
          <div className="bg-[#26312f] rounded-[32px] p-8 border border-white/5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#DFFF00]/5 blur-3xl rounded-full"></div>
            
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#dbf0de]/60 uppercase tracking-widest block">Your Journey Progress</span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white tracking-tight">{journeyPercent}%</span>
                <span className="text-xs text-[#DFFF00] font-black">COMPLETE</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">
                Of your professional internship preparation roadmap has been successfully completed. Unlock subsequent stages to qualify for corporate matching.
              </p>
            </div>

            <div className="space-y-4 mt-8 pt-6 border-t border-white/5">
              {/* Custom Thin Glowing Progress Bar */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#DFFF00]/70 to-[#DFFF00] rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(223,255,0,0.4)]"
                  style={{ width: `${journeyPercent}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                <span>Stage {Math.min(13, stageInt)}/13 Active</span>
                <span className="text-[#DFFF00]">
                  {stageInt >= 6 ? 'Preparation Phase Completed!' : 'Keep advancing!'}
                </span>
              </div>
            </div>
          </div>

          {/* Context Info Card */}
          <div className="bg-[#1e2624] rounded-[24px] p-6 border border-[#dbf0de]/5 space-y-4">
            <h4 className="text-xs font-black uppercase text-[#dbf0de] tracking-wider flex items-center gap-2">
              <Calendar size={14} className="text-[#DFFF00]" /> Next Up in your journey
            </h4>
            <div className="text-xs space-y-3">
              {stageInt < 4 && (
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="font-bold text-[#DFFF00] block mb-1">Complete Training Hub Quizzes</span>
                  <p className="text-gray-400 leading-normal text-[11px]">
                    You have finished <strong className="text-white">{completedQuizzesCount}/{totalModulesCount}</strong> quizzes. Complete all remaining modules to unlock the Final Certification Exam.
                  </p>
                </div>
              )}
              {stageInt === 4 && (
                <div className="p-3.5 bg-[#DFFF00]/5 rounded-xl border border-[#DFFF00]/20">
                  <span className="font-bold text-[#DFFF00] block mb-1">Take your Professional Exam</span>
                  <p className="text-gray-400 leading-normal text-[11px]">
                    This is your 75-question final assessment. There is no minimum score requirement; your certificate will be generated automatically upon submission.
                  </p>
                </div>
              )}
              {stageInt === 5 && (
                <div className="p-3.5 bg-[#DFFF00]/5 rounded-xl border border-[#DFFF00]/20">
                  <span className="font-bold text-[#DFFF00] block mb-1">Complete the Interview Stage</span>
                  <p className="text-gray-400 leading-normal text-[11px]">
                    Simulate your placement interview directly inside the Stage 5 roadmap card below to instantly unlock the Deloxe Job Pool!
                  </p>
                </div>
              )}
              {stageInt >= 6 && (
                <div className="p-3.5 bg-green-500/5 rounded-xl border border-green-500/20">
                  <span className="font-bold text-green-400 block mb-1">Job Pool Access is Unlocked!</span>
                  <p className="text-gray-400 leading-normal text-[11px]">
                    Congratulations! All preparation phases are completed. Explore direct corporate placements in the Job Pool.
                  </p>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Interactive 5-Stage Journey Roadmap (8 cols) */}
        <div className="lg:col-span-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#dbf0de] tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#DFFF00] rounded-full inline-block"></span>
                Sequential Placement Journey
              </h3>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">13 Stages</span>
            </div>

            {/* Stage 1: Profile Creation */}
            <div className="relative pl-8 md:pl-12 pb-8 border-l border-white/5 last:border-l-0">
              {/* Connector Node */}
              <div className="absolute left-0 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full bg-green-500 border-4 border-[#1a2321] flex items-center justify-center text-white text-[10px] font-black shadow-[0_0_12px_rgba(34,197,94,0.3)] z-10">
                <Check size={10} className="stroke-[3px]" />
              </div>
              
              <div className="bg-[#26312f] rounded-[24px] p-6 border border-white/5 shadow-md flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Stage 01</span>
                    <h4 className="text-base font-bold text-white">Profile Creation</h4>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/25 rounded-full text-[9px] font-bold uppercase tracking-wider">Completed</span>
                  </div>
                  <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                    First step completed. Your academic documents, resume, and career focus details are fully uploaded and reviewed.
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/dashboard/profile')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#dbf0de] border border-white/5 transition-all flex items-center gap-1 shrink-0"
                >
                  View Profile <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Stage 2: Dashboard Access */}
            <div className="relative pl-8 md:pl-12 pb-8 border-l border-white/5 last:border-l-0">
              {/* Connector Node */}
              <div className="absolute left-0 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full bg-green-500 border-4 border-[#1a2321] flex items-center justify-center text-white text-[10px] font-black shadow-[0_0_12px_rgba(34,197,94,0.3)] z-10">
                <Check size={10} className="stroke-[3px]" />
              </div>
              
              <div className="bg-[#26312f] rounded-[24px] p-6 border border-white/5 shadow-md flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Stage 02</span>
                    <h4 className="text-base font-bold text-white">Dashboard Access</h4>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/25 rounded-full text-[9px] font-bold uppercase tracking-wider">Granted</span>
                  </div>
                  <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                    Access to the overall internship readiness suite is active. Welcome messages, timeline logs, and roadmap progress tracking unlocked.
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-500 mr-2 shrink-0 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-green-400" /> Authorized
                </span>
              </div>
            </div>

            {/* Stage 3: Internship Readiness Training */}
            {(() => {
              const isActive = stageInt < 4;
              const isCompleted = stageInt >= 4;
              return (
                <div className="relative pl-8 md:pl-12 pb-8 border-l border-white/5 last:border-l-0">
                  {/* Connector Node */}
                  <div className={`absolute left-0 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-[#1a2321] flex items-center justify-center text-[10px] font-black shadow-lg z-10 ${
                    isCompleted ? 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 
                    isActive ? 'bg-[#DFFF00] text-[#1a2321] animate-pulse shadow-[0_0_12px_rgba(223,255,0,0.3)]' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {isCompleted ? <Check size={10} className="stroke-[3px]" /> : '03'}
                  </div>
                  
                  <div className={`bg-[#26312f] rounded-[24px] p-6 border shadow-md transition-all duration-300 ${
                    isActive ? 'border-[#DFFF00]/20 shadow-[0_4px_25px_rgba(223,255,0,0.03)]' : 'border-white/5'
                  }`}>
                    <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Stage 03</span>
                          <h4 className="text-base font-bold text-white">Internship Readiness Training</h4>
                          {isCompleted ? (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/25 rounded-full text-[9px] font-bold uppercase tracking-wider">Completed</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/25 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse">In Progress</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                          Complete all structured learning modules and score gates to prepare for the Professional Certification Exam.
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => router.push('/dashboard/training-hub')}
                        className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
                          isActive ? 'bg-[#DFFF00] text-[#1a2321] hover:brightness-110 font-black' : 'bg-white/5 hover:bg-white/10 text-[#dbf0de] border border-white/5'
                        }`}
                      >
                        <BookOpen size={13} /> {isCompleted ? 'Review Modules' : 'Resume Training'}
                      </button>
                    </div>

                    {/* Miniature Modules Track Panel */}
                    <div className="mt-5 pt-5 border-t border-white/5 flex flex-wrap gap-2.5">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const moduleNum = i + 1;
                        const isQuizDone = quizSubmissions.some(sub => sub.module_number === moduleNum);
                        return (
                          <div 
                            key={i}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border ${
                              isQuizDone 
                                ? 'bg-green-500/5 text-green-400 border-green-500/20' 
                                : isActive && i === completedQuizzesCount
                                ? 'bg-[#DFFF00]/5 text-[#DFFF00] border-[#DFFF00]/20 animate-pulse'
                                : 'bg-white/5 text-gray-500 border-white/5'
                            }`}
                          >
                            {isQuizDone ? <Check size={10} className="text-green-400 stroke-[3px]" /> : <Play size={8} />}
                            Module {moduleNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Stage 4: Final Exam */}
            {(() => {
              const isLocked = stageInt < 4;
              const isActive = stageInt === 4;
              const isCompleted = stageInt >= 5;
              
              return (
                <div className="relative pl-8 md:pl-12 pb-8 border-l border-white/5 last:border-l-0">
                  {/* Connector Node */}
                  <div className={`absolute left-0 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-[#1a2321] flex items-center justify-center text-[10px] font-black shadow-lg z-10 ${
                    isCompleted ? 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 
                    isActive ? 'bg-[#DFFF00] text-[#1a2321] animate-pulse shadow-[0_0_12px_rgba(223,255,0,0.3)]' : 'bg-[#1a2321] border-gray-700 text-gray-500'
                  }`}>
                    {isCompleted ? <Check size={10} className="stroke-[3px]" /> : isLocked ? <Lock size={10} className="text-gray-500" /> : '04'}
                  </div>
                  
                  <div className={`bg-[#26312f] rounded-[24px] p-6 border shadow-md transition-all duration-300 ${
                    isLocked ? 'opacity-50' : 
                    isActive ? 'border-[#DFFF00]/30 shadow-[0_4px_25px_rgba(223,255,0,0.05)]' : 'border-white/5'
                  }`}>
                    <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Stage 04</span>
                          <h4 className="text-base font-bold text-white">Professional Certification Exam</h4>
                          {isCompleted ? (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/25 rounded-full text-[9px] font-bold uppercase tracking-wider">Completed</span>
                          ) : isActive ? (
                            <span className="px-2 py-0.5 bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/25 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse">Unlocked & Ready</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-500 border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Lock size={8} /> Locked</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                          Take the final professional certification exam. No minimum score is required to unlock subsequent stages or automatically generate your secure PDF certificate!
                        </p>
                      </div>

                      {!isLocked && (
                        <button 
                          onClick={() => router.push('/dashboard/professional-exam')}
                          className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
                            isActive ? 'bg-[#DFFF00] text-[#1a2321] hover:brightness-110 font-black' : 'bg-white/5 hover:bg-white/10 text-[#dbf0de] border border-white/5 font-black'
                          }`}
                        >
                          <Award size={13} /> {isCompleted ? 'View Certificate' : 'Start Exam'}
                        </button>
                      )}
                    </div>

                    {/* Show score and certificate download if complete */}
                    {isCompleted && (
                      <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#1a2321]/40 border border-white/5 rounded-2xl">
                          <div className="space-y-1 text-left">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Your Exam Score</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-[#DFFF00]">{examSubmission?.percentage ?? '--'}%</span>
                              <span className="text-xs text-gray-400 font-medium">({examSubmission?.score ?? '--'} / 75 Correct)</span>
                            </div>
                          </div>

                          {loadingCertificate ? (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Loader2 size={14} className="animate-spin text-[#DFFF00]" /> Generating PDF...
                            </div>
                          ) : certificate ? (
                            <a 
                              href={`/api/certificates/download?id=${certificate.certificate_id}`}
                              className="px-4 py-2 bg-[#dbf0de] hover:bg-[#cbe2ce] text-[#1a2321] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shrink-0 self-start sm:self-center"
                            >
                              <FileText size={13} /> Download Certificate (PDF)
                            </a>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Stage 5: Interview */}
            {(() => {
              const isLocked = stageInt < 5;
              const isActive = stageInt === 5;
              const isCompleted = stageInt >= 6;
              
              return (
                <div className="relative pl-8 md:pl-12 pb-8 border-l border-white/5 last:border-l-0">
                  {/* Connector Node */}
                  <div className={`absolute left-0 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-[#1a2321] flex items-center justify-center text-[10px] font-black shadow-lg z-10 ${
                    isCompleted ? 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 
                    isActive ? 'bg-[#DFFF00] text-[#1a2321] animate-pulse shadow-[0_0_12px_rgba(223,255,0,0.3)]' : 'bg-[#1a2321] border-gray-700 text-gray-500'
                  }`}>
                    {isCompleted ? <Check size={10} className="stroke-[3px]" /> : isLocked ? <Lock size={10} className="text-gray-500" /> : '05'}
                  </div>
                  
                  <div className={`bg-[#26312f] rounded-[24px] p-6 border shadow-md transition-all duration-300 ${
                    isLocked ? 'opacity-50' : 
                    isActive ? 'border-[#DFFF00]/30 shadow-[0_4px_25px_rgba(223,255,0,0.05)] bg-[#1e2725]' : 'border-white/5'
                  }`}>
                    <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Stage 05</span>
                          <h4 className="text-base font-bold text-white">Professional Interview</h4>
                          {isCompleted ? (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/25 rounded-full text-[9px] font-bold uppercase tracking-wider">Completed</span>
                          ) : isActive ? (
                            <span className="px-2 py-0.5 bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/25 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse">Unlocked & Ready</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-500 border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Lock size={8} /> Locked</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                          Complete your alignment assessment. Record your professional motivation and goals to complete the interview stage and unlock direct placement job access.
                        </p>
                      </div>

                      {isActive && (
                        <button 
                          onClick={() => router.push('/dashboard/interview')}
                          className="px-5 py-3 bg-[#DFFF00] text-[#1a2321] hover:brightness-110 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md animate-pulse"
                        >
                          Start AI Interview <ArrowRight size={13} />
                        </button>
                      )}
                      {isCompleted && (
                        <button 
                          onClick={() => router.push('/dashboard/interview')}
                          className="px-5 py-3 bg-white/5 hover:bg-white/10 text-[#dbf0de] border border-white/10 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md"
                        >
                          View AI Evaluation <CheckCircle size={13} className="text-[#DFFF00]" />
                        </button>
                      )}
                    </div>

                    {isCompleted && (
                      <div className="mt-4 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-start gap-2.5 text-left">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        <div>
                           <span className="text-[11px] font-black text-green-400 block uppercase tracking-wider">Placement Interview Completed</span>
                           <p className="text-[11px] text-gray-400 leading-normal mt-0.5">
                             Your interactive AI assessment has been completed. View your scores and personalized feedback report.
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Stage 6: Job Pool Access */}
            {(() => {
              const isLocked = stageInt < 6;
              
              return (
                <div className="relative pl-8 md:pl-12 pb-8 border-l border-white/5">
                  {/* Connector Node */}
                  <div className={`absolute left-0 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-[#1a2321] flex items-center justify-center text-[10px] font-black shadow-lg z-10 ${
                    !isLocked ? 'bg-[#DFFF00] text-[#1a2321] shadow-[0_0_15px_rgba(223,255,0,0.5)] border-white' : 'bg-[#1a2321] border-gray-700 text-gray-500'
                  }`}>
                    {!isLocked ? <Check size={10} className="stroke-[3px]" /> : <Lock size={10} className="text-gray-500" />}
                  </div>
                  
                  <div className={`bg-[#26312f] rounded-[24px] p-6 border shadow-md transition-all duration-300 ${
                    isLocked ? 'opacity-50' : 'border-[#DFFF00]/30 shadow-[0_4px_25px_rgba(223,255,0,0.15)] bg-gradient-to-r from-[#212c29] to-[#2a3834]'
                  }`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Stage 06</span>
                          <h4 className="text-base font-bold text-white">Career Job Pool Access</h4>
                          {!isLocked ? (
                            <span className="px-2 py-0.5 bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/25 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1"><CheckCircle size={8} /> Unlocked</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-500 border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Lock size={8} /> Locked</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                          Your profile is authorized in the placement job pool. Connect with active hiring teams, submit applications, and match with direct internship roles.
                        </p>
                      </div>

                      {!isLocked && (
                        <button 
                          onClick={() => router.push('/dashboard/job-pool')}
                          className="px-5 py-3.5 bg-[#DFFF00] text-[#1a2321] hover:brightness-110 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(223,255,0,0.35)] shrink-0"
                        >
                          Explore Job Pool <Briefcase size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Stages 07 to 13: Locked Post-Job Pool Stages */}
            {[
              {
                num: '07',
                title: 'Engaged',
                desc: 'Active employer engagement, corporate interview matching, and official candidate selection step.'
              },
              {
                num: '08',
                title: 'Onboarding',
                desc: 'Worksite orientation, documentation verification, and placement onboarding.'
              },
              {
                num: '09',
                title: '3-Month Review',
                desc: 'First quarterly performance assessment and employer feedback review.'
              },
              {
                num: '10',
                title: '6-Month Review',
                desc: 'Mid-term placement review, skill milestone evaluation, and career progression check.'
              },
              {
                num: '11',
                title: 'Final Review',
                desc: 'Comprehensive end-of-placement performance appraisal and corporate graduation audit.'
              },
              {
                num: '12',
                title: 'Testimonial',
                desc: 'Submission of candidate exit interview, placement success feedback, and career story.'
              },
              {
                num: '13',
                title: 'Completion',
                desc: 'Official program completion, alumni network induction, and full certification release.'
              }
            ].map((lockedStage, idx, arr) => {
              const isLast = idx === arr.length - 1;
              return (
                <div key={lockedStage.num} className={`relative pl-8 md:pl-12 ${isLast ? '' : 'pb-8 border-l border-white/5'}`}>
                  {/* Connector Node */}
                  <div className="absolute left-0 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-[#1a2321] flex items-center justify-center text-[10px] font-black shadow-lg z-10 bg-[#1a2321] border-gray-700 text-gray-500">
                    <Lock size={10} className="text-gray-500" />
                  </div>
                  
                  <div className="bg-[#26312f] rounded-[24px] p-6 border border-white/5 shadow-md opacity-50 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Stage {lockedStage.num}</span>
                          <h4 className="text-base font-bold text-white">{lockedStage.title}</h4>
                          <span className="px-2 py-0.5 bg-white/5 text-gray-500 border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Lock size={8} /> Locked
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                          {lockedStage.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

