'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getSupabase } from '@/lib/supabase';
import { 
  BookOpen, Download, Search, CheckCircle2, ChevronRight, CheckCircle,
  FileText, Bookmark, ArrowRight, ShieldCheck, 
  HelpCircle, Copy, Check, Clock, Info, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HandbookChapter {
  id: string;
  number: number;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  content: string[];
  takeaways: string[];
  actionStep: string;
}

const HANDBOOK_CHAPTERS: HandbookChapter[] = [
  {
    id: 'ch-1',
    number: 1,
    category: 'ORIENTATION',
    readTime: '4 min',
    title: 'Deloxe Mission, Vision & Core Values',
    summary: 'An introduction to the standards of excellence and professional culture at Deloxe HR Academy.',
    content: [
      'Welcome to Deloxe HR Academy. Our mission is to cultivate high-performance talent and prepare you for seamless integration into world-class organizations.',
      'Core Value 1: Integrity — Doing the right thing even when no one is watching. Our clients trust us because we operate with absolute transparency.',
      'Core Value 2: Growth Mindset — Continuous learning is the fuel of modern careers. We view feedback as a gift and challenges as opportunities to improve.',
      'Core Value 3: Customer-Centric Service — Whether dealing with internal team members or external clients, exceptional service is our signature.',
      'Core Value 4: Excellence — We believe that "good enough" is the enemy of great. We aim for flawless execution in every report, presentation, and meeting.'
    ],
    takeaways: [
      'Understand the four core pillars of the Deloxe professional culture.',
      'Embrace negative feedback as an engine for rapid self-improvement.',
      'Learn how to represent the Academy in professional settings.'
    ],
    actionStep: 'Complete your profile details in the Hub to ensure they reflect your professional branding.'
  },
  {
    id: 'ch-2',
    number: 2,
    category: 'COMMUNICATION',
    readTime: '6 min',
    title: 'Executive Written & Verbal Communication',
    summary: 'Mastering email etiquette, structured reporting, and proactive communication styles.',
    content: [
      'Professional communication is structured, clear, and solutions-oriented. When communicating with stakeholders, always lead with the bottom line (BLUF: Bottom Line Up Front).',
      'Email Etiquette: Use descriptive subject lines (e.g., "[Action Required] Q3 Report Input"). Keep body copy scannable with bullet points and bold headers.',
      'Avoid vague messages: Never send raw "hey" or "hello" messages on internal chat without explaining your query in the first message.',
      'The Status Update Rule: When reporting a block, always present at least two potential solutions or avenues you are exploring. Do not simply deposit problems.',
      'Active Listening: In verbal settings, repeat key parameters back to verify alignment. For example: "To confirm, you would like this draft submitted by Thursday at 3 PM, correct?"'
    ],
    takeaways: [
      'Understand and apply the BLUF (Bottom Line Up Front) principle.',
      'Structure emails for maximum scannability and clear action items.',
      'Propose solutions alongside every reported roadblock.'
    ],
    actionStep: 'Review the professional email templates provided in the Quick Resources panel below.'
  },
  {
    id: 'ch-3',
    number: 3,
    category: 'PRESENTATION',
    readTime: '5 min',
    title: 'Professional Image, Dress Code & Virtual Presence',
    summary: 'Guidelines for business attire, virtual background hygiene, and camera presentation.',
    content: [
      'Your image is a silent resume. It conveys competence, detail-orientation, and respect for the organization.',
      'Business Formal vs. Business Casual: Business Formal includes tailored suits, blazers, dress shirts, and ties. Business Casual allows collared shirts, professional blouses, slacks, and blazers without ties.',
      'Virtual Background Etiquette: Ensure your camera frame is clean and free of clutter. Use a subtle digital blur or a neutral virtual background if necessary.',
      'Lighting and Camera Angle: Position yourself in a well-lit space where light shines on your face, not behind you. Elevate your camera to eye level to maintain natural eye contact.',
      'Non-verbal Cues: Nod to show understanding, sit upright, and maintain engagement during virtual roundtable assessments.'
    ],
    takeaways: [
      'Identify when to wear Business Formal versus Business Casual attire.',
      'Optimize your physical workspace for high-impact virtual meetings.',
      'Engage active body language signals during professional assessments.'
    ],
    actionStep: 'Set up your virtual camera workspace and verify that your lighting and background are distraction-free.'
  },
  {
    id: 'ch-4',
    number: 4,
    category: 'PRODUCTIVITY',
    readTime: '5 min',
    title: 'Time Management, Ownership & Eisenhower Priority',
    summary: 'Leveraging productivity framework to deliver high-quality work reliably on schedule.',
    content: [
      'In professional settings, reliability is your highest asset. If you commit to a deadline, deliver on or before that deadline.',
      'The Eisenhower Matrix: Categorize your tasks into four quadrants: (1) Urgent & Important (Do immediately), (2) Important but Not Urgent (Schedule/Plan), (3) Urgent but Not Important (Delegate), (4) Neither (Eliminate).',
      'The 2-Minute Rule: If a professional request or email take less than two minutes to complete, address it immediately. Do not postpone it.',
      'Ownership Mentality: Treat your assigned modules and tasks as your own independent business. Seek out ways to add value beyond the minimum requirements.',
      'Proactive Updates: If you anticipate a delay on a project, communicate this to your supervisor 24 hours BEFORE the deadline, not after it has passed.'
    ],
    takeaways: [
      'Map daily operations using the Eisenhower Priority Matrix.',
      'Apply the 2-Minute Rule to avoid communication backlogs.',
      'Provide immediate proactive alerts if a milestone is at risk of delay.'
    ],
    actionStep: 'Practice allocating your next 3 training goals using the Eisenhower Matrix.'
  },
  {
    id: 'ch-5',
    number: 5,
    category: 'INTERVIEWS',
    readTime: '7 min',
    title: 'Acing the Stage 5 Professional HR Interview',
    summary: 'Fulfilling final criteria and applying the STAR framework to secure placement offers.',
    content: [
      'The Stage 5 HR Interview is the culmination of your Readiness Training. It evaluates your adaptability, communication speed, and problem-solving structures.',
      'The STAR Interview Method: Always answer behavioral questions with: (S) Situation — Context of the challenge, (T) Task — Your specific responsibility, (A) Action — Concrete steps you executed, (R) Result — The measurable positive outcome.',
      'Core Questions to Prepare: "Tell me about a time you managed conflicting priorities," "Describe a situation where you had to deal with a difficult teammate," or "What are your 3-year career goals?"',
      'Follow-Up Questions: At the end of the interview, always ask 2-3 high-level questions. E.g., "What does success look like in the first 90 days of this role?" or "How does the team foster cross-functional learning?"',
      'Thank-You Note: Send a brief, professional email expressing appreciation within 24 hours of completing your interview panel.'
    ],
    takeaways: [
      'Structure every behavioral interview response using the STAR model.',
      'Formulate insightful questions to ask the interviewing panel.',
      'Submit your post-interview thank-you follow-up within 24 hours.'
    ],
    actionStep: 'Formulate and write down three personal STAR responses based on your academic or work projects.'
  }
];

export default function HandbookPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapter, setActiveChapter] = useState<string>('ch-1');
  const [completedChapters, setCompletedChapters] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('deloxe_handbook_progress');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.warn('Failed to load handbook progress:', e);
      }
    }
    return [];
  });
  const [downloading, setDownloading] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Save progress
  const toggleChapterComplete = (id: string) => {
    let updated: string[];
    if (completedChapters.includes(id)) {
      updated = completedChapters.filter(chId => chId !== id);
    } else {
      updated = [...completedChapters, id];
    }
    setCompletedChapters(updated);
    try {
      localStorage.setItem('deloxe_handbook_progress', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const supabase = getSupabase();
      const { data } = supabase.storage
        .from('applicant-docs')
        .getPublicUrl('Getting_Hired_.pdf');
      
      const response = await fetch(data.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Getting_Hired_.pdf');
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download handbook:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  // Filter chapters based on search
  const filteredChapters = HANDBOOK_CHAPTERS.filter(ch => 
    ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChapterData = HANDBOOK_CHAPTERS.find(ch => ch.id === activeChapter) || HANDBOOK_CHAPTERS[0];

  return (
    <DashboardLayout>
      <div id="handbook-container" className="space-y-8 max-w-7xl mx-auto pb-12">
        
        {/* Modern Header Banner */}
        <div id="handbook-hero" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a2321] via-[#111a18] to-black border border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#DFFF00]/5 rounded-full filter blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#dbf0de]/5 rounded-full filter blur-[100px] pointer-events-none" />
          
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-[#dbf0de] uppercase tracking-wider">
              <CheckCircle size={12} className="text-[#DFFF00]" /> Academy Resource Center
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight leading-tight">
              Workplace Readiness <span className="text-[#DFFF00]">Handbook</span>
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              This handbook contains the foundational skills, professional ethics, communication protocols, and interview standards expected of every top-tier candidate. Study these chapters closely to prepare for assessments and client placements.
            </p>
            
            {/* Simple Reading Progress Bar */}
            <div className="pt-2 space-y-1.5 max-w-sm">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>Reading Checklist Progress</span>
                <span className="font-bold text-[#DFFF00]">
                  {completedChapters.length} of {HANDBOOK_CHAPTERS.length} Read ({Math.round((completedChapters.length / HANDBOOK_CHAPTERS.length) * 100)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#dbf0de] to-[#DFFF00] transition-all duration-500"
                  style={{ width: `${(completedChapters.length / HANDBOOK_CHAPTERS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Block / Illustration Mock */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl w-full md:w-auto md:min-w-[280px] space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Document Details</span>
              <span className="text-[10px] text-green-400 uppercase font-mono font-bold flex items-center gap-1">
                <ShieldCheck size={11} /> Verified Active
              </span>
            </div>
            
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="font-semibold flex items-center gap-1"><FileText size={12} /> Adobe PDF (v1.4)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Version:</span>
                <span className="font-semibold">2026.1 Build</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Group:</span>
                <span className="font-semibold text-white">Academy Applicants</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#DFFF00] disabled:bg-white/10 text-[#1a2321] disabled:text-gray-500 rounded-xl font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#DFFF00]/10"
            >
              {downloading ? (
                <>
                  <Clock size={14} className="animate-spin" /> Downloading Handbook...
                </>
              ) : (
                <>
                  <Download size={14} /> Download Handbook PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search and Interactive Reader Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Browse & Navigation (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Bookmark size={14} className="text-[#dbf0de]" /> Table of Contents
              </h3>
              <span className="text-[11px] font-mono text-gray-500">
                {filteredChapters.length} Sections
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search topics, communication, dress code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1c2624] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#DFFF00]/50 transition-all"
              />
            </div>

            {/* Chapter Navigation Cards List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredChapters.length === 0 ? (
                <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl text-xs text-gray-500">
                  No chapters matched your search query. Try another term.
                </div>
              ) : (
                filteredChapters.map((ch) => {
                  const isActive = activeChapter === ch.id;
                  const isCompleted = completedChapters.includes(ch.id);
                  return (
                    <div
                      key={ch.id}
                      onClick={() => setActiveChapter(ch.id)}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer text-left relative flex items-start gap-3.5 ${
                        isActive 
                          ? 'bg-[#1c2624] border-[#DFFF00]/30 shadow-md' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {/* Left strip status color indicator */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all ${
                          isActive 
                            ? 'bg-[#DFFF00]' 
                            : isCompleted 
                              ? 'bg-green-500' 
                              : 'bg-transparent'
                        }`} 
                      />

                      {/* Number badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-all ${
                        isActive 
                          ? 'bg-[#DFFF00] text-[#1a2321]' 
                          : isCompleted 
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                            : 'bg-white/5 text-gray-400'
                      }`}>
                        {ch.number}
                      </div>

                      <div className="space-y-1 overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-black">
                            {ch.category}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
                            {ch.readTime}
                          </span>
                        </div>
                        <h4 className={`text-xs font-extrabold truncate transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {ch.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {ch.summary}
                        </p>
                      </div>

                      {/* Completed / Progress Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterComplete(ch.id);
                        }}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                            : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                        }`}
                        title={isCompleted ? "Mark as Unread" : "Mark as Read"}
                      >
                        {isCompleted ? <CheckCircle2 size={13} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-500 group-hover:bg-white" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Document Content Viewer (7 cols) */}
          <div className="lg:col-span-7 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedChapterData.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#1c2624] border border-white/10 rounded-3xl p-5 md:p-8 space-y-6 shadow-2xl relative"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-white/5 px-2.5 py-1 rounded-md border border-white/10 text-gray-400 uppercase tracking-widest font-black">
                        {selectedChapterData.category}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {selectedChapterData.readTime} Reading
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-black text-white mt-1.5">
                      Chapter {selectedChapterData.number}: {selectedChapterData.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleChapterComplete(selectedChapterData.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 border self-start sm:self-center ${
                      completedChapters.includes(selectedChapterData.id)
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {completedChapters.includes(selectedChapterData.id) ? (
                      <>
                        <CheckCircle2 size={13} /> Marked as Read
                      </>
                    ) : (
                      <>
                        <Bookmark size={13} /> Mark Chapter as Read
                      </>
                    )}
                  </button>
                </div>

                {/* Chapter Core Summary Block */}
                <div className="p-4 bg-[#111a18] border-l-4 border-[#DFFF00] rounded-r-2xl text-xs text-gray-400 italic leading-relaxed">
                  <strong>Chapter Objective:</strong> {selectedChapterData.summary}
                </div>

                {/* Paragraph Blocks */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                    Executive Guidelines
                  </h4>
                  <div className="space-y-4 text-xs text-gray-400 leading-relaxed font-sans">
                    {selectedChapterData.content.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {/* Split: Takeaways & Action items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/5">
                  
                  {/* Takeaways */}
                  <div className="space-y-3 p-4 bg-white/2 rounded-2xl border border-white/5">
                    <h5 className="text-[11px] font-mono font-black uppercase text-[#dbf0de] tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-green-400" /> Key Takeaways
                    </h5>
                    <ul className="space-y-2">
                      {selectedChapterData.takeaways.map((takeaway, i) => (
                        <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5 leading-normal">
                          <span className="text-green-500/80 font-bold mt-0.5">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Immediate Action Step */}
                  <div className="space-y-3 p-4 bg-[#DFFF00]/5 rounded-2xl border border-[#DFFF00]/10 flex flex-col justify-between">
                    <div>
                      <h5 className="text-[11px] font-mono font-black uppercase text-[#DFFF00] tracking-wider flex items-center gap-1.5">
                        <CheckCircle size={12} className="animate-spin-slow" /> Action Plan
                      </h5>
                      <p className="text-[11px] text-gray-300 leading-normal mt-2.5">
                        {selectedChapterData.actionStep}
                      </p>
                    </div>
                    <div className="text-[9px] font-mono text-[#DFFF00]/80 uppercase font-bold tracking-widest pt-2 flex items-center gap-1">
                      IMMEDIATE ENFORCEMENT <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* SECTION 3: Interactive Quick Reference Templates / Cheat Sheets */}
        <div id="quick-resources" className="border-t border-white/10 pt-8 space-y-6">
          <div className="text-left">
            <h3 className="text-lg font-serif font-black text-white flex items-center gap-2">
              <GraduationCap className="text-[#dbf0de]" /> Quick Readiness Cheatsheets
            </h3>
            <p className="text-xs text-gray-400 mt-1">Copy-paste standard communication structures and interview templates approved by HR coordinators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Email Etiquette Card */}
            <div className="bg-[#1c2624] border border-white/5 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-amber-500 uppercase font-black tracking-widest">TEMPLATE — EMAIL SUBJECT LOBBYING</span>
                <h4 className="text-xs font-bold text-white">How to request deadline extensions or status feedback</h4>
                <div className="bg-black/30 p-3.5 rounded-xl font-mono text-[10px] text-gray-400 leading-relaxed border border-white/5 relative group">
                  <button
                    onClick={() => handleCopyText(`Subject: [Update Required] Stage 4 Milestones Status\n\nDear Coordination Team,\n\nI am writing to provide an update on my training. I have successfully submitted the Workplace Readiness exam and completed the required orientation modules.\n\nCould you please advise on the schedule for the Stage 5 interview reviews?\n\nSincerely,\n[Your Name]`, 'email-tmpl')}
                    className="absolute top-2 right-2 bg-white/5 hover:bg-white/10 border border-white/10 p-1.5 rounded-lg text-gray-300 hover:text-white transition-all"
                    title="Copy Template"
                  >
                    {copiedTextId === 'email-tmpl' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                  <span className="text-amber-500 font-bold block mb-1">Subject: [Update] Stage 4 Status</span>
                  Dear Placement Team, <br />
                  I have successfully submitted my Stage 4 readiness assessments. Below is the confirmation ID...
                </div>
              </div>
              <p className="text-[10px] text-gray-500">Always include your Applicant ID and Stage details in email headers for faster routing.</p>
            </div>

            {/* STAR Response Framework Card */}
            <div className="bg-[#1c2624] border border-white/5 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-green-400 uppercase font-black tracking-widest">INTERVIEW PREPARATION — STAR METHOD</span>
                <h4 className="text-xs font-bold text-white">Answering complex behavioral questions with precision</h4>
                <div className="bg-black/30 p-3.5 rounded-xl font-mono text-[10px] text-gray-400 leading-relaxed border border-white/5 relative">
                  <button
                    onClick={() => handleCopyText(`S (Situation): During our academic group project, our team faced a sudden 24-hour deadline change.\nT (Task): I was tasked with rewriting the core logistics report section.\nA (Action): I parsed the template, designed a clear bullet-point summary, and shared it by 6 PM.\nR (Result): We delivered the submission 4 hours early and earned a 95% evaluation.`, 'star-tmpl')}
                    className="absolute top-2 right-2 bg-white/5 hover:bg-white/10 border border-white/10 p-1.5 rounded-lg text-gray-300 hover:text-white transition-all"
                    title="Copy Template"
                  >
                    {copiedTextId === 'star-tmpl' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                  <span className="text-green-400 font-bold block mb-1">STAR Method Blueprint</span>
                  <strong>S:</strong> Detail the context/complication <br />
                  <strong>T:</strong> State your specific job/role <br />
                  <strong>A:</strong> Detail your concrete technical action <br />
                  <strong>R:</strong> Cite measurable results
                </div>
              </div>
              <p className="text-[10px] text-gray-500">HR coordinators use behavioral checklists aligned strictly to the STAR methodology.</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
