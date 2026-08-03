'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicant } from '@/components/ApplicantContext';
import { Loader2, Lock, Unlock, ArrowLeft, BookOpen, GraduationCap, CheckCircle2, Clock, Award, ChevronRight, ChevronLeft, Check, Play, FileText, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const FALLBACK_QUIZ_QUESTIONS: Record<number, any[]> = {
  1: [
    {
      question_text: "What is the most effective way to build a strong professional network?",
      options: [
        "Spamming LinkedIn connections with generic templates",
        "Attending networking events and engaging in authentic conversation",
        "Only talking to the most senior executives in your field",
        "Waiting for people to find you on search engines"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "When crafting a professional resume, which of the following is most crucial?",
      options: [
        "Listing every hobby and personal interest since childhood",
        "Using flashy colorful diagrams and high-contrast personal logos",
        "Tailoring your bullet points to match the target job description with metrics",
        "Making the document as long as possible to show expertise"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "What is the purpose of a professional cover letter?",
      options: [
        "To repeat the entire resume word-for-word in paragraph form",
        "To outline salary negotiations and list desired perks in detail",
        "To tell a compelling story matching your skills with the company's needs",
        "To explain why your previous employers were completely wrong"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "Which of the following defines 'Career Growth'?",
      options: [
        "Getting promoted solely based on length of tenure",
        "Continuous learning, skill acquisition, and expanding scope of influence",
        "Demanding salary increases every six months without fail",
        "Changing jobs as frequently as possible to increase title rank"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "What does 'active client research' involve before an interview?",
      options: [
        "Quickly scanning the homepage 5 minutes before the call starts",
        "Memorizing the names of every board member from their public wiki",
        "Understanding their industry, core products, target audience, and current challenges",
        "Sending a message to the HR manager asking what they do"
      ],
      correct_answer: "2",
      point: 1
    }
  ],
  2: [
    {
      question_text: "In professional communication, 'emotional intelligence' translates to which of the following?",
      options: [
        "Sharing emotional personal stories to build rapport",
        "Recognizing, understanding, and managing emotions to communicate constructively",
        "Always agreeing with the loudest person in the conference room",
        "Avoiding any stressful situations or tight deadlines"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "What is the best practice when you realize a major project milestone will be missed?",
      options: [
        "Hope standard project variance hides it until next quarter",
        "Working 24 hours straight without informing the project manager",
        "Proactively notifying stakeholders with a clear explanation and updated plan",
        "Assigning blame to external factors or junior engineers"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "How should constructive criticism from a team lead be handled?",
      options: [
        "Take it personally and update your resume immediately",
        "Defend your work by pointing out flaws in other colleagues' work",
        "Active listening, requesting specific examples, and designing a development plan",
        "Nodding in agreement during the review but changing absolutely nothing"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "What is the hallmark of 'Ownership' in the workplace?",
      options: [
        "Keeping your tasks strictly isolated and refusing to help others",
        "Taking responsibility for outcomes, proactively solving blockers, and driving results",
        "Seeking public credit for every successful team milestone",
        "Dictating instructions to colleagues without doing hands-on work"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "Which of the following is considered positive workplace etiquette?",
      options: [
        "Arriving exactly on time but staying silent during all discussions",
        "Keeping your webcam turned off during all internal meetings",
        "Punctuality, structured collaboration, active listening, and respecting diverse views",
        "Replying to team chats only during scheduled weekly reviews"
      ],
      correct_answer: "2",
      point: 1
    }
  ],
  3: [
    {
      question_text: "Under the Eisenhower Matrix, what is the best strategy for tasks that are 'Urgent but Not Important'?",
      options: [
        "Do them immediately ahead of all deep work",
        "Delegate them to appropriate team members or automate them",
        "Schedule them for next quarter's personal sprint",
        "Delete them from your action log entirely"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "Which of the following is the core benefit of the Pomodoro Technique?",
      options: [
        "To make meetings shorter and more efficient",
        "Sustained focus and mental stamina through rhythmic, timed intervals",
        "Maximizing the absolute number of hours spent at your desk",
        "Standardizing project deliverables across diverse engineering teams"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "What role does 'Deep Work' play in modern information professions?",
      options: [
        "Spending hours cleaning up your professional inbox",
        "Rapidly multitasking across 5 distinct digital channels",
        "High-concentration cognitive activities that create massive value and skill growth",
        "Collaborating with team members on shared boards"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "How can tool automation most effectively boost individual productivity?",
      options: [
        "Moving responsibility entirely away from the quality assurance team",
        "Eliminating repetitive tasks to unlock time for creative and strategic work",
        "Replacing the need for active peer feedback loops",
        "Standardizing every single word in all client emails"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "What is the root cause of professional burnout according to productivity studies?",
      options: [
        "Having a high-density, highly disciplined daily routine",
        "Mismatch in workload, lack of control, insufficient reward, and poor boundaries",
        "Working on projects that challenge your core technical boundaries",
        "Attending more than two engineering cross-functional syncs per day"
      ],
      correct_answer: "1",
      point: 1
    }
  ],
  4: [
    {
      question_text: "What does sound cybersecurity hygiene require for enterprise accounts?",
      options: [
        "Reusing the same secure password with simple suffix variants",
        "Storing active account access keys on secured shared public sheets",
        "High-entropy unique passwords, multi-factor authentication (MFA), and zero share",
        "Changing passwords exactly once per year"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "In modern documentation systems, what is the best practice for version control?",
      options: [
        "Appending date codes to target file names (e.g., Draft_v4_Final)",
        "Using cloud systems with automated revisions, single source of truth, and change logs",
        "Sending revised documents to team leads via immediate email attachments",
        "Re-creating the document folder structure for every minor sprint cycle"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "What is the primary role of 'Generative AI' in an analyst's daily workflow?",
      options: [
        "Generating final reports to copy-paste directly without professional review",
        "Replacing the human evaluation stage entirely for fast-tracking",
        "Partnering as an accelerant for drafting, brainstorming, and initial coding",
        "Substituting for customer research interviews"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "When analyzing a large dataset, which practice ensures data integrity?",
      options: [
        "Deleting outlier data points that conflict with desired project outcomes",
        "Double-counting missing responses as the statistical average",
        "Structuring precise data validation rules, treating nulls clearly, and documenting methods",
        "Selecting only the records that confirm existing hypotheses"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "What is the main utility of using cloud-based collaborative whiteboards?",
      options: [
        "To replace all text documentation and spreadsheets",
        "Rhythmic asynchronous brainstorming, wireframing, and real-time visual collaboration",
        "Presenting high-fidelity mockups to passive client audiences",
        "Conducting complex calculations and financial projections"
      ],
      correct_answer: "1",
      point: 1
    }
  ],
  5: [
    {
      question_text: "How can an intern make the most positive first impression during their first week?",
      options: [
        "Offering strategic company overhauls to the executive team on day two",
        "Staying entirely silent and avoiding conversation until assigned specific work",
        "Active curiosity, punctuality, taking copious notes, and clarifying expectations",
        "Asking for flexible work hours and remote options immediately"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "What is the most constructive way to seek clarification on a task assignment?",
      options: [
        "Waiting until the task is due to explain that you did not understand",
        "Paraphrasing expectations, documenting key deliverables, and scheduling an alignment brief",
        "Asking colleagues to do the work with you so you can shadow them",
        "Initiating the task with multiple assumptions without verifying with the manager"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "Which behavior differentiates a high-performing intern from a standard one?",
      options: [
        "Completing only assigned tasks and resting for the remaining day",
        "Proactively identifying problems, suggesting solutions, and demonstrating eagerness",
        "Working late hours to ensure visibility even when work is already done",
        "Telling management how much harder you work than other interns"
      ],
      correct_answer: "1",
      point: 1
    },
    {
      question_text: "What does 'managing up' mean for an intern?",
      options: [
        "Instructing your manager on how they should coordinate team tasks",
        "Giving direct feedback to department heads on leadership style",
        "Ensuring your manager stays informed of your progress, blockers, and bandwidth",
        "Bypassing your manager to talk to directors because you have high energy"
      ],
      correct_answer: "2",
      point: 1
    },
    {
      question_text: "What is the ultimate goal of an internship from a career development perspective?",
      options: [
        "To secure a permanent professional contract through demonstrated value and talent",
        "To collect a letter of recommendation without participating in company culture",
        "To gain maximum visual branding on social media channels",
        "To observe daily operations without participating in actual deliverables"
      ],
      correct_answer: "0",
      point: 1
    }
  ]
};


// ...

// Professional Exam Modal Component
interface ProfessionalExamModalProps {
  onClose: () => void;
  onCompleteExam: () => Promise<void>;
}

const EXAM_QUESTIONS = [
  {
    question: "Which of the following is the most vital element of professional consulting delivery?",
    options: [
      "Meeting timelines without focusing on quality deliverables",
      "Structuring actionable insights and maintaining professional communication of expectations",
      "Focusing solely on internal tools and isolated technical processes",
      "Avoiding direct feedback loop from stakeholders"
    ],
    correctAnswer: 1
  },
  {
    question: "How should an analyst address a significant data discrepancy discovered in a final report?",
    options: [
      "Ignore it and publish the report anyway to prevent project delays",
      "Adjust the detail metrics manually to fit the desired business narrative",
      "Perform rigorous root-cause analysis, verify sources, and report recommendations transparently",
      "Delegate the responsibility to external teams and proceed"
    ],
    correctAnswer: 2
  },
  {
    question: "What is the primary role of professional empathy during stakeholder engagement?",
    options: [
      "Establishing mutual trust, understanding pain points, and driving collaborative business value",
      "Avoiding difficult client business conversations in order to maintain comfort",
      "Accepting all client demands blindly without professional critique or analysis",
      "Limiting interaction to formal electronic surveys only"
    ],
    correctAnswer: 0
  }
];

const ProfessionalExamModal = ({ onClose, onCompleteExam }: ProfessionalExamModalProps) => {
  const router = useRouter();
  const [step, setStep] = useState<'celebration' | 'notice' | 'taking_exam' | 'grading' | 'exam_completed'>('celebration');
  const [celebrationText, setCelebrationText] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinishing, setIsFinishing] = useState(false);

  const fullCelebration = "🎉 Congratulations!\n\nYou have successfully completed all training modules and quizzes.\n\nYour dedication and effort have brought you one step closer to becoming certified.";
  const fullNotice = "⚠️ Important Notice\n\nBefore taking the Professional Exam, please carefully review the Training Handbook and revisit any modules you feel require additional study.\n\nThe Professional Exam is designed to assess your understanding of all training materials covered throughout the program.\n\nTake your time, review thoroughly, and ensure you are fully prepared before proceeding.";

  useEffect(() => {
    if (step === 'celebration') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      let i = 0;
      const timer = setInterval(() => {
        setCelebrationText(fullCelebration.slice(0, i));
        i++;
        if (i > fullCelebration.length) {
          clearInterval(timer);
          setTimeout(() => setStep('notice'), 2500);
        }
      }, 30);
      return () => clearInterval(timer);
    } else if (step === 'notice') {
      let i = 0;
      const timer = setInterval(() => {
        setNoticeText(fullNotice.slice(0, i));
        i++;
        if (i > fullNotice.length) clearInterval(timer);
      }, 20);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleNextQuestion = () => {
    if (selectedAnswers[currentQuestionIndex] === undefined) return;
    if (currentQuestionIndex < EXAM_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('grading');
      setTimeout(() => {
        setStep('exam_completed');
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
      }, 2000);
    }
  };

  const handleFinishAndProceed = async () => {
    try {
      setIsFinishing(true);
      await onCompleteExam();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f1413]/90 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1c2624] border border-white/10 p-8 md:p-12 rounded-3xl max-w-2xl w-full text-center space-y-8 shadow-2xl relative overflow-hidden">
        
        {step === 'celebration' && (
          <p className="text-xl md:text-2xl font-bold text-white leading-relaxed whitespace-pre-wrap">{celebrationText}</p>
        )}

        {step === 'notice' && (
          <div className="space-y-8">
            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap text-left">{noticeText}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  router.push('/dashboard/professional-exam');
                  onClose();
                }}
                className="px-8 py-4 bg-[#DFFF00] text-[#1a2321] rounded-xl font-black text-lg hover:brightness-110 transition-all"
              >
                Proceed to Professional Exam
              </button>
              <button onClick={onClose} className="px-8 py-4 bg-white/5 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
                Review Training Modules
              </button>
            </div>
          </div>
        )}

        {step === 'taking_exam' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="text-[#DFFF00]" /> Professional Certification Exam
              </h3>
              <span className="text-xs bg-[#DFFF00]/10 text-[#DFFF00] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {EXAM_QUESTIONS.length}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-medium text-white">{EXAM_QUESTIONS[currentQuestionIndex].question}</p>
              
              <div className="grid grid-cols-1 gap-3 mt-4">
                {EXAM_QUESTIONS[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: idx }))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'border-[#DFFF00] bg-[#DFFF00]/5 text-[#DFFF00]' 
                          : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-6">
              <button 
                onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1)}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2.5 rounded-lg border border-white/10 text-white font-medium hover:bg-white/5 transition-all disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="px-8 py-2.5 rounded-lg bg-[#DFFF00] text-[#1a2321] font-bold hover:brightness-110 transition-all disabled:opacity-40"
              >
                {currentQuestionIndex === EXAM_QUESTIONS.length - 1 ? 'Submit Exam' : 'Next Question'}
              </button>
            </div>
          </div>
        )}

        {step === 'grading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-16 h-16 text-[#DFFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white">Grading & Assessing Submissions...</h3>
            <p className="text-gray-400">Please wait while the system checks your exam against curriculum benchmarks.</p>
          </div>
        )}

        {step === 'exam_completed' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-3xl font-black text-white">Exam Passed with Distinction!</h3>
            <div className="bg-[#212c29] border border-white/5 p-6 rounded-2xl max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Score Assessment:</span>
                <span className="text-green-400 font-bold">100% (3/3 Correct)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-[#DFFF00] font-bold">CERTIFIED</span>
              </div>
            </div>
            <p className="text-gray-300 max-w-lg mx-auto leading-relaxed">
              Excellent standard of theoretical and practical application shown! You have successfully fulfilled all training program benchmarks. Your application stage is now officially advanced to the <strong>Interview Stage</strong>.
            </p>
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleFinishAndProceed}
                disabled={isFinishing}
                className="px-10 py-4 bg-[#DFFF00] text-[#1a2321] font-black text-lg rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(223,255,0,0.3)] transition-all flex items-center gap-2"
              >
                {isFinishing && <Loader2 className="w-5 h-5 animate-spin" />}
                Proceed to Interview Stage
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default function TrainingHubPage() {
  const { applicant, modules, quizSubmissions, completedModules, submitQuiz, isLoading, refreshApplicantData } = useApplicant();

  // Active Quiz State
  const [activeQuizModule, setActiveQuizModule] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(180);
  const [isQuizFinishedLocally, setIsQuizFinishedLocally] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [localMaxPoints, setLocalMaxPoints] = useState(0);
  const [localPassed, setLocalPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showExamModal, setShowExamModal] = useState(false);
  const isAllTrainingCompleted = quizSubmissions.length >= modules.length && modules.length > 0;

  const handleCompleteExam = async () => {
    if (!applicant) return;
    const supabase = getSupabase();
    const { error } = await supabase
      .from('applicants')
      .update({ current_stage: '5' })
      .eq('id', applicant.id);
      
    if (error) {
      console.error('Error updating current_stage:', error);
      throw error;
    }
    await refreshApplicantData();
  };

  const totalModulesCount = modules.length || 5;
  const isModuleCompleted = (moduleNumber: number) => {
    return completedModules.some(log => log.module_number === moduleNumber);
  };

  const hasSubmittedQuiz = (moduleNumber: number) => {
    return quizSubmissions.some(sub => sub.module_number === moduleNumber);
  };

  const isModuleLocked = (moduleNumber: number) => {
    if (moduleNumber === 1) return false;
    return !hasSubmittedQuiz(moduleNumber - 1);
  };

  const hasStudiedModule = (moduleNumber: number) => {
    return completedModules.some(log => log.module_number === moduleNumber);
  };

  const handleStartQuiz = async (moduleNumber: number) => {
    setActiveQuizModule(moduleNumber);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsQuizFinishedLocally(false);
    setTimeLeft(180);

    const supabase = getSupabase();
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('module_number', moduleNumber);
      
      if (data && data.length > 0) {
        const formatted = data.map(q => {
          let opts: string[] = [];
          if (Array.isArray(q.options)) {
            opts = q.options;
          } else if (typeof q.options === 'string') {
            try {
              opts = JSON.parse(q.options);
            } catch {
              opts = [];
            }
          }
          return {
            ...q,
            options: opts.length > 0 ? opts : ["Option A", "Option B", "Option C", "Option D"]
          };
        });
        setQuizQuestions(formatted);
      } else {
        setQuizQuestions(FALLBACK_QUIZ_QUESTIONS[moduleNumber] || []);
      }
    } catch {
      setQuizQuestions(FALLBACK_QUIZ_QUESTIONS[moduleNumber] || []);
    }
  };

  const evaluateScore = (answers: Record<number, number>, questions: any[]) => {
    let scoreCount = 0;
    let maxPoints = 0;

    questions.forEach((q, idx) => {
      const chosenIndex = answers[idx];
      const ptVal = typeof q.point === 'number' ? q.point : parseInt(q.point, 10) || 1;
      maxPoints += ptVal;

      if (chosenIndex !== undefined && q.options && q.options[chosenIndex] !== undefined) {
        const chosenText = q.options[chosenIndex];
        const correctVal = q.correct_answer;

        let isCorrect = false;
        // Direct matching
        if (String(correctVal).trim() === String(chosenIndex).trim()) {
          isCorrect = true;
        }
        // Text value matching
        else if (chosenText && String(chosenText).trim().toLowerCase() === String(correctVal).trim().toLowerCase()) {
          isCorrect = true;
        }
        // Char code letter mapping
        else if (correctVal) {
          const char = String(correctVal).trim().toUpperCase();
          if (char === 'A' && chosenIndex === 0) isCorrect = true;
          else if (char === 'B' && chosenIndex === 1) isCorrect = true;
          else if (char === 'C' && chosenIndex === 2) isCorrect = true;
          else if (char === 'D' && chosenIndex === 3) isCorrect = true;
        }

        if (isCorrect) {
          scoreCount += ptVal;
        }
      }
    });

    return { scoreCount, maxPoints };
  };

  const submitEvaluatedQuiz = async (overrideModule?: number, overrideAnswers?: any, overrideQuestions?: any) => {
    const activeModule = overrideModule ?? activeQuizModule;
    if (activeModule === null || isSubmitting) return;
    setIsSubmitting(true);

    const answers = overrideAnswers ?? selectedAnswers;
    const questions = overrideQuestions ?? quizQuestions;

    const { scoreCount, maxPoints } = evaluateScore(answers, questions);
    // Passing threshold is defined as 60% of total points possible
    const passed = maxPoints > 0 ? (scoreCount >= Math.ceil(maxPoints * 0.6)) : (scoreCount >= 3);

    setLocalScore(scoreCount);
    setLocalMaxPoints(maxPoints);
    setLocalPassed(true);
    
    try {
      await submitQuiz(activeModule, scoreCount, passed);
      sessionStorage.removeItem(`quiz_start_time_m${activeModule}`);
    } catch (e) {
      console.error('Error submitting quiz score:', e);
    } finally {
      setIsSubmitting(false);
      setIsQuizFinishedLocally(true);
    }
  };

  const handleAutoSubmit = (overrideModule: number, overrideAnswers: any, overrideQuestions: any) => {
    submitEvaluatedQuiz(overrideModule, overrideAnswers, overrideQuestions);
  };

  const handleManualSubmit = () => {
    submitEvaluatedQuiz();
  };

  const closeQuizOverlay = () => {
    setActiveQuizModule(null);
    setQuizQuestions([]);
    setIsQuizFinishedLocally(false);
  };

  // Block page exit on reload during active quiz
  useEffect(() => {
    if (activeQuizModule !== null && !isQuizFinishedLocally) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Assessment gate is active! Leaving this page will submit your quiz immediately.';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [activeQuizModule, isQuizFinishedLocally]);

  // Quiz Countdown Timer Effect
  useEffect(() => {
    if (activeQuizModule === null || isQuizFinishedLocally) return;

    const tick = () => {
      const now = Date.now();
      const storedStartTime = sessionStorage.getItem(`quiz_start_time_m${activeQuizModule}`);
      let startTime = now;
      
      if (storedStartTime) {
        startTime = parseInt(storedStartTime, 10);
      } else {
        sessionStorage.setItem(`quiz_start_time_m${activeQuizModule}`, now.toString());
      }

      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, 180 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleAutoSubmit(activeQuizModule, selectedAnswers, quizQuestions);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuizModule, quizQuestions, selectedAnswers, isQuizFinishedLocally]);

  // Check URL query parameters to auto-start the quiz if returning from module detail study workspace
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const startQuizParam = params.get('startQuiz');
      if (startQuizParam) {
        const mNum = parseInt(startQuizParam, 10);
        if (!isNaN(mNum)) {
          const isCompleted = completedModules.some(l => l.module_number === mNum);
          const hasSubmitted = quizSubmissions.some(s => s.module_number === mNum);
          if (isCompleted && !hasSubmitted) {
            // Delay state change to avoid synchronous state triggers inside react rendering loop
            setTimeout(() => {
              handleStartQuiz(mNum);
            }, 0);
            // Clean the URL search params elegantly
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }
      }
    }
  }, [isLoading, completedModules, quizSubmissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 size={48} className="animate-spin text-[#DFFF00]" />
      </div>
    );
  }

  // Circular Stats Calculations as specified by User
  const completedModulesCount = completedModules.length;
  const passedQuizzesCount = quizSubmissions.length;
  const totalScoreEarned = quizSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
  const completionPercentage = totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;

  // Find current active training module progress description
  let currentActiveNo = 1;
  for (let i = 1; i <= totalModulesCount; i++) {
    if (!hasSubmittedQuiz(i)) {
      currentActiveNo = i;
      break;
    }
  }
  const currentProgressDesc = `Module ${currentActiveNo} of ${totalModulesCount}`;

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-12">
      
      {/* Header and top-right widget block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-[#dbf0de]/10 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-3 bg-[#26312f] rounded-full hover:bg-[#dbf0de]/10 transition flex items-center justify-center text-[#dbf0de]">
            <ArrowLeft size={22} className="text-[#DFFF00]" />
          </Link>
          <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Training Hub</h2>
              <p className="text-gray-400 mt-1 max-w-sm">Study modules sequentially and complete quiz gates to qualify for interviews.</p>
          </div>
        </div>

        {/* Circular Progress Tracker Dashboard in Header */}
        <div className="bg-[#26312f] p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-5 justify-between min-w-[310px] self-start md:self-auto">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Progress Dashboard</div>
            <div className="text-sm font-bold text-white">
              Completed: <span className="text-green-400 font-mono">{completedModulesCount}</span> / {totalModulesCount}
            </div>
            <div className="text-sm font-bold text-white">
              Score Earned: <span className="text-[#DFFF00] font-mono">{totalScoreEarned}</span> pts
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Current: <span className="text-[#DFFF00] font-semibold">{currentProgressDesc}</span>
            </div>
          </div>
          <div className="relative w-18 h-18 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="36" cy="36" r={radius} className="text-white/5" strokeWidth="6" stroke="currentColor" fill="transparent" />
              <circle 
                cx="36" 
                cy="36" 
                r={radius} 
                className="text-[#DFFF00]" 
                strokeWidth="6" 
                stroke="currentColor" 
                fill="transparent" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-black text-[#DFFF00]">
              {completionPercentage}%
            </div>
          </div>
        </div>
      </div>
      
      {isAllTrainingCompleted && (
          <div className="my-8 p-6 md:p-8 bg-gradient-to-r from-[#212c29] to-[#1a2321] border-2 border-[#DFFF00]/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-[#DFFF00]/10 text-[#DFFF00]">
                      <Award className="w-8 h-8" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-white">Full Training Completed</h3>
                      <p className="text-sm text-gray-400 mt-1">You are eligible to take the Professional Certification Exam.</p>
                  </div>
              </div>
              <button 
                onClick={() => setShowExamModal(true)} 
                className="bg-[#DFFF00] text-[#1a2321] px-8 py-4 rounded-xl font-extrabold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(223,255,0,0.3)] w-full md:w-auto"
              >
                  Take Professional Exam
              </button>
          </div>
      )}

      {/* Course Modules Segment */}
      <div className="bg-[#26312f] p-6 md:p-8 rounded-3xl border border-[#dbf0de]/10 shadow-xl">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
          <GraduationCap className="text-[#dbf0de]" /> Dynamic Curriculum Modules
        </h3>
        
        <div className="space-y-6">
        {modules.map(m => {
            const completed = isModuleCompleted(m.module_number);
            const subRecord = quizSubmissions.find(sub => sub.module_number === m.module_number);
            const hasSubmitted = !!subRecord;
            const locked = isModuleLocked(m.module_number);
            const isCurrentActive = m.module_number === currentActiveNo;

            return (
              <div 
                key={m.id}
                className={`p-6 rounded-2xl border transition-all duration-200 ${
                  hasSubmitted 
                    ? 'bg-[#1a2321]/40 border-green-500/10 opacity-90' 
                    : locked 
                    ? 'opacity-40 bg-[#1a2321]/30 border-transparent select-none cursor-not-allowed'
                    : 'bg-[#1a2321] border-[#dbf0de]/10 hover:border-[#dbf0de]/35 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl transition-all ${
                      hasSubmitted 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/10' 
                        : locked 
                        ? 'bg-white/5 text-gray-500' 
                        : 'bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/10'
                    }`}>
                      {hasSubmitted ? <CheckCircle2 size={22} /> : locked ? <Lock size={22} /> : <BookOpen size={22} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-gray-400">
                          Module {m.module_number}
                        </span>
                        {hasSubmitted && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-green-500/10 text-green-400 font-bold border border-green-400/20 flex items-center gap-1">
                            <Check size={8} strokeWidth={4} /> QUIZ COMPLETED ({subRecord?.score || 0}/5)
                          </span>
                        )}
                        {completed && !hasSubmitted && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/10 text-amber-400 font-bold border border-amber-400/20">
                            QUIZ GATE ACTIVE
                          </span>
                        )}
                        {isCurrentActive && !completed && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#DFFF00]/10 text-[#DFFF00] font-bold border border-[#DFFF00]/30 animate-pulse">
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-white mt-1.5 leading-tight">{m.title}</h4>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
                    {hasSubmitted ? (
                      <Link 
                        href={`/dashboard/training-hub/${m.module_number}`}
                        className="bg-green-500/[0.05] text-green-400 border border-green-500/20 hover:border-green-400 hover:bg-green-500/10 px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2"
                      >
                        <FileText size={15} /> Review Module
                      </Link>
                    ) : locked ? (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 select-none">
                        <Lock size={12} /> Sequential Locked Gate
                      </div>
                    ) : completed ? (
                      <button 
                        onClick={() => handleStartQuiz(m.module_number)}
                        className="bg-[#DFFF00] text-[#1a2321] px-5 py-2.5 rounded-xl font-extrabold hover:brightness-110 active:scale-95 transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(223,255,0,0.25)] animate-bounce"
                      >
                        Take Quiz to Proceed <ChevronRight size={16} />
                      </button>
                    ) : (
                      <Link 
                        href={`/dashboard/training-hub/${m.module_number}`}
                        className="bg-[#26312f] text-[#DFFF00] border border-[#DFFF00]/20 hover:border-[#DFFF00] px-5 py-2.5 rounded-xl font-bold active:scale-95 transition-all text-sm flex items-center gap-2"
                      >
                        Study Module <BookOpen size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
        })}
        </div>
      </div>

      {/* FULL-SCREEN NON-DISMISSIBLE QUIZ ENGINE OVERLAY */}
      <AnimatePresence>
        {activeQuizModule !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f1413] z-[100] flex flex-col justify-between"
          >
            {/* Top Bar showing Timer and Instructions (Exit Disabled) */}
            <header className="border-b border-white/10 bg-[#161f1e] p-4 flex justify-between items-center px-6 md:px-12 shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                  Module {activeQuizModule} Certification Gate
                </span>
                <h3 className="text-sm md:text-base font-bold text-white mt-0.5">Assessment Challenge</h3>
              </div>
              
              {/* 3-Minute countdown */}
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border font-mono text-sm md:text-base font-bold transition-all ${
                timeLeft < 45 
                  ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
                  : 'bg-[#26312f]/80 text-[#DFFF00] border-[#DFFF00]/20'
              }`}>
                <Clock size={16} className={`${timeLeft < 45 ? 'text-red-500 animate-spin' : 'text-[#DFFF00]'}`} />
                <span>{Math.floor(timeLeft / 60)}:{((timeLeft % 60).toString().padStart(2, '0'))}</span>
              </div>
            </header>

            {/* Interactive Questions block */}
            <main className="flex-1 overflow-y-auto px-6 md:px-12 py-8 max-w-2xl mx-auto w-full flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {!isQuizFinishedLocally ? (
                  <motion.div 
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Progress Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                        <span>QUESTION {currentQuestionIndex + 1} OF {quizQuestions.length}</span>
                        <span>{Math.round(((currentQuestionIndex + 1) / Math.max(1, quizQuestions.length)) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#DFFF00] h-full transition-all duration-300" 
                          style={{ width: `${((currentQuestionIndex + 1) / Math.max(1, quizQuestions.length)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Question Content */}
                    {quizQuestions[currentQuestionIndex] && (
                      <div className="space-y-6">
                        <h4 className="text-xl md:text-2xl font-bold font-sans text-white leading-snug">
                          {quizQuestions[currentQuestionIndex].question_text}
                        </h4>

                        <div className="space-y-3 pt-2">
                          {quizQuestions[currentQuestionIndex].options.map((opt: string, optIndex: number) => {
                            const isChosen = selectedAnswers[currentQuestionIndex] === optIndex;
                            return (
                              <button
                                key={optIndex}
                                onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optIndex }))}
                                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 active:scale-[0.99] duration-150 ${
                                  isChosen
                                    ? 'bg-[#DFFF00]/10 border-[#DFFF00] text-white shadow-[0_0_20px_rgba(223,255,0,0.12)]'
                                    : 'bg-[#1c2624] border-white/5 hover:border-white/20 hover:bg-[#26312f]/50 text-gray-300'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-bold text-sm transition-all ${
                                  isChosen ? 'bg-[#DFFF00] text-[#1a2321]' : 'bg-white/5 text-gray-400'
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <span className="font-semibold text-sm md:text-base leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  // Results Success/Failure screen
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#1c2624] border border-white/10 p-8 md:p-11 rounded-3xl text-center space-y-6 max-w-md mx-auto shadow-2xl"
                  >
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-green-500/10 text-green-400">
                      <CheckCircle2 size={36} />
                    </div>
                    
                    <div className="space-y-2">
                       <h4 className="text-2xl font-bold text-white">
                        Quiz Completed!
                      </h4>
                      <p className="text-gray-400 text-sm">
                        You have completed the certification quiz for this module.
                      </p>
                    </div>

                    <div className="bg-[#151c1b] p-6 rounded-2xl border border-white/5 space-y-2.5">
                      <div className="text-xs text-gray-400 uppercase tracking-widest font-mono">Module Score Summary</div>
                      <div className="text-3xl font-black font-mono text-[#DFFF00]">
                        {localScore} / {localMaxPoints}
                      </div>
                      <p className="text-xs text-gray-300 font-mono">Points Earned: +{localScore} pts</p>
                      <p className="text-xs text-green-400 font-semibold">Next Module Unlocked Successfully</p>
                    </div>

                    <button
                      onClick={closeQuizOverlay}
                      className="w-full bg-[#DFFF00] text-[#1a2321] py-4 rounded-xl font-extrabold hover:brightness-110 active:scale-95 transition-all text-base"
                    >
                      Acknowledge & Finish
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Form Navigation Controls (Exit Blocked) */}
            {!isQuizFinishedLocally && (
              <footer className="border-t border-white/10 bg-[#161f1e] p-4 flex justify-between items-center px-6 md:px-12 shrink-0">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition-all text-sm shrink-0"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                {currentQuestionIndex < quizQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-[#26312f] text-white hover:bg-white/5 transition-all text-sm shrink-0 font-sans"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleManualSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-black bg-[#DFFF00] text-[#1a2321] hover:brightness-110 disabled:opacity-50 transition-all text-sm shrink-0 shadow-[0_0_15px_rgba(223,255,0,0.2)]"
                  >
                    {isSubmitting ? (
                      <>Evaluating... <Loader2 size={16} className="animate-spin" /></>
                    ) : (
                      <>Submit Assessment <Check size={16} /></>
                    )}
                  </button>
                )}
              </footer>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {showExamModal && <ProfessionalExamModal onClose={() => setShowExamModal(false)} onCompleteExam={handleCompleteExam} />}
    </div>
  );
}
