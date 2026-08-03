'use client';
import { useState, useEffect } from 'react';
import { useApplicant } from '@/components/ApplicantContext';
import { Loader2, ArrowLeft, GraduationCap, CheckCircle2, Play, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';

export default function ModulePage() {
  const { modules, completedModules, quizSubmissions, isLoading, completeModule, applicant } = useApplicant();
  const [isMarking, setIsMarking] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const params = useParams();
  const router = useRouter();
  
  const moduleNumber = parseInt(params.id as string);
  const moduleData = modules.find(m => m.module_number === moduleNumber);
  
  // Sequential Unlock logic: Module 1 is always unlocked; other modules are unlocked if previous is completed & submitted
  const isUnlocked = moduleNumber === 1 || quizSubmissions.some(sub => sub.module_number === moduleNumber - 1);
  
  // Progress status of the current module
  const isCompleted = completedModules.some(log => log.module_number === moduleNumber);
  const subRecord = quizSubmissions.find(sub => sub.module_number === moduleNumber);
  const hasSubmitted = !!subRecord;

  const handleMarkComplete = async () => {
    if (isMarking) return;
    setIsMarking(true);
    try {
      await completeModule(moduleNumber);
    } catch (err) {
      console.error('Error logging module completion:', err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleTakeQuiz = () => {
    setIsExiting(true);
    setTimeout(() => {
      // Return to main Training Hub with a query param to auto-start the quiz
      router.push(`/dashboard/training-hub?startQuiz=${moduleNumber}`);
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a2321]">
        <Loader2 size={48} className="animate-spin text-[#DFFF00]" />
      </div>
    );
  }

  if (!moduleData || !applicant) {
    return (
      <div className="min-h-screen bg-[#1a2321] text-[#E0E6ED] flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-[rgb(50,60,55)] p-8 rounded-3xl border border-white/10 shadow-lg">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Module Not Found</h3>
          <p className="text-sm text-gray-400 mb-6">We couldn&apos;t load study materials for this module.</p>
          <Link href="/dashboard/training-hub" className="bg-[#DFFF00] text-[#1a2321] px-6 py-2.5 rounded-xl font-bold transition inline-block">
            Back to Training Hub
          </Link>
        </div>
      </div>
    );
  }

  // If locked, render the locked gate view
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#1a2321] text-[#E0E6ED] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-[rgb(50,60,55)] p-8 rounded-3xl border border-white/10 shadow-lg space-y-6"
        >
          <div className="w-16 h-16 bg-red-500/10 text-red-400 mx-auto rounded-full flex items-center justify-center">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Module Locked</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              To unlock Module {moduleNumber}, you must first complete the certification quiz for Module {moduleNumber - 1}.
            </p>
          </div>
          <Link 
            href="/dashboard/training-hub" 
            className="w-full bg-[#DFFF00] text-[#1a2321] py-3 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all block text-center"
          >
            Return to Training Hub
          </Link>
        </motion.div>
      </div>
    );
  }

  const splitIntoSections = (content: string) => {
    if (!content) return [];
    // Split by h2 headings, keeping the heading with its body using a lookahead
    const parts = content.split(/(?=^##\s+)/m);
    return parts.map((part, index) => {
      const text = part.trim();
      return {
        id: index,
        text,
        isIntro: index === 0 && !text.startsWith('##')
      };
    }).filter(p => p.text);
  };

  const MarkdownComponents = {
    h1: ({ children, ...props }: any) => (
      <h1 className="text-3xl font-extrabold text-white mt-2 mb-6 font-sans tracking-tight leading-snug" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 border-b border-white/10 pb-4 mb-6" {...props}>
        <span className="w-2.5 h-7 bg-[#DFFF00] rounded-md inline-block flex-shrink-0"></span>
        <span>{children}</span>
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-bold text-[#DFFF00] mt-8 mb-4 border-l-4 border-emerald-400 pl-3" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-lg font-bold text-gray-200 mt-6 mb-3" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }: any) => {
      const text = String(children || '');
      if (text.startsWith('NOTE:') || text.startsWith('Note:')) {
        return (
          <div className="my-6 p-5 rounded-2xl border border-blue-500/10 bg-blue-500/5 text-blue-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
            <div>
              <span className="font-bold text-blue-400">Note:</span> {text.replace(/^(NOTE|Note):\s*/, '')}
            </div>
          </div>
        );
      }
      if (text.startsWith('TIP:') || text.startsWith('Tip:')) {
        return (
          <div className="my-6 p-5 rounded-2xl border border-[#DFFF00]/10 bg-[#DFFF00]/5 text-gray-200 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#DFFF00] mt-0.5" />
            <div>
              <span className="font-bold text-[#DFFF00]">Tip:</span> {text.replace(/^(TIP|Tip):\s*/, '')}
            </div>
          </div>
        );
      }
      return (
        <p className="text-gray-300 leading-relaxed text-base md:text-lg mb-6" {...props}>
          {children}
        </p>
      );
    },
    ul: ({ children, ...props }: any) => (
      <ul className="list-none pl-0 space-y-4 mb-8" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal pl-6 space-y-4 mb-8 font-sans text-gray-300 leading-relaxed text-base" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => {
      return (
        <li className="flex items-start gap-3.5 text-gray-300 leading-relaxed text-base pl-1" {...props}>
          <CheckCircle2 className="w-5 h-5 text-[#DFFF00] mt-1 flex-shrink-0" />
          <span className="flex-1">{children}</span>
        </li>
      );
    },
    strong: ({ children, ...props }: any) => (
      <strong className="text-white font-black bg-[#DFFF00]/10 text-[#DFFF00] px-1.5 py-0.5 rounded border border-[#DFFF00]/10" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="text-gray-100 italic font-medium" {...props}>
        {children}
      </em>
    ),
    code: ({ children, ...props }: any) => (
      <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-xs text-[#DFFF00]" {...props}>
        {children}
      </code>
    )
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={isExiting ? { opacity: 0, y: -20, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="max-w-4xl mx-auto px-4 md:px-6 pt-8 pb-16"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/training-hub" className="p-3 bg-[rgb(50,60,55)] rounded-full hover:bg-white/10 transition flex items-center justify-center">
            <ArrowLeft size={22} className="text-[#DFFF00]" />
          </Link>
          <div>
            <span className="text-xs uppercase tracking-widest text-[#DFFF00] font-mono font-semibold">Module {moduleNumber} Study Space</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">{moduleData.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400 font-mono text-xs bg-[rgb(50,60,55)] px-4 py-2 rounded-xl border border-white/5 self-start sm:self-center">
          <GraduationCap size={16} className="text-[#DFFF00]" /> Dynamic Study Mode
        </div>
      </div>
      
      <div className="space-y-8 flex flex-col">
        {/* Module Header Overview Card */}
        <div className="bg-gradient-to-r from-[#212c29] to-[#17201e] p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/20">
                COURSE MODULE {moduleNumber}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {moduleData.content ? `${Math.ceil(moduleData.content.split(' ').length / 200)} min read` : 'Fast study'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">{moduleData.title}</h3>
            <p className="text-sm text-gray-400">
              Read carefully, engage with concepts, and complete the quiz challenge to proceed.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <span className="px-4 py-2 rounded-2xl bg-green-500/10 text-green-400 font-bold text-xs border border-green-400/20 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> MODULE READ
              </span>
            ) : (
              <span className="px-4 py-2 rounded-2xl bg-[#DFFF00]/10 text-[#DFFF00] font-bold text-xs border border-[#DFFF00]/20 flex items-center gap-1.5">
                <GraduationCap size={16} className="animate-bounce" /> ACTIVE MODULE
              </span>
            )}
          </div>
        </div>

        {/* Section Cards */}
        {splitIntoSections(moduleData.content).map((section) => (
          <div 
            key={section.id} 
            className={`transition-all duration-300 rounded-3xl p-6 md:p-10 shadow-2xl border ${
              section.isIntro 
                ? 'bg-[#1b2523] border-white/10' 
                : 'bg-[#1e2a27] border-white/10 hover:border-[#DFFF00]/25'
            }`}
          >
            <article className="prose prose-invert max-w-none">
              <Markdown components={MarkdownComponents}>
                {section.text}
              </Markdown>
            </article>
          </div>
        ))}

        {/* Dynamic Interactive Completion Footer Button Flow */}
        <div className="mt-6 flex flex-col items-center justify-center w-full pt-4 text-center bg-[#26312f] p-8 md:p-10 rounded-3xl border border-white/10">
          {hasSubmitted ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-green-400 font-bold text-lg bg-green-500/10 px-6 py-3 rounded-2xl border border-green-500/20 shadow-inner">
                <CheckCircle2 size={24} /> Module Certified & Completed! (Score: {subRecord?.score ?? 0}/5)
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                You have completed the certification quiz for this module. You can review the material as often as you like.
              </p>
              <Link 
                href="/dashboard/training-hub" 
                className="mt-2 text-[#DFFF00] hover:underline font-mono text-sm inline-block"
              >
                ← Back to Training Hub
              </Link>
            </div>
          ) : isCompleted ? (
            <div className="space-y-4 w-full max-w-md">
              <div className="text-gray-300 text-sm mb-2">
                Study logs saved! Complete the gate assessment of Module {moduleNumber} to advance.
              </div>
              <button 
                onClick={handleTakeQuiz} 
                className="w-full relative group bg-[#DFFF00] text-[rgb(38,47,44)] py-5 rounded-2xl font-extrabold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(223,255,0,0.25)] flex items-center justify-center gap-3 text-lg animate-pulse"
              >
                <Play size={20} fill="currentColor" />
                <span>Take Quiz to Proceed</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-md animate-fade-in">
              <p className="text-gray-400 text-sm">
                Ensure you read the document completely before marking.
              </p>
              <button 
                onClick={handleMarkComplete} 
                disabled={isMarking}
                className="w-full relative group bg-white/10 border border-white/20 text-white py-5 rounded-2xl font-bold tracking-wide hover:bg-white/20 hover:border-white/30 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
              >
                {isMarking ? (
                  <>
                    <Loader2 size={20} className="animate-spin text-[#DFFF00]" />
                    <span>Synchronizing Study Log...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} className="text-[#DFFF00]" />
                    <span>Mark Module Complete</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
