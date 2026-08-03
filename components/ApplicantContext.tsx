'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Define the Applicant type based on the database schema
export interface Applicant {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  profile_picture: string;
  cv_resume_url: string;
  educational_cert_url: string;
  nysc_cert_url: string;
  institution_name: string;
  course_of_study: string;
  degree: string;
  graduation_year: number;
  residential_address: string;
  skills: any; // JSONB
  competitive_edge: string;
  preferred_industry: string;
  preferred_role: string;
  preferred_location: string;
  progress_percent: number;
  current_stage: string; // The database column is text
  status_tag: string;
  used_book_code_id: string;
}

export interface TrainingModule {
  id: string;
  module_number: number;
  title: string;
  content: string;
}

export interface TrainingLog {
  id: string;
  applicant_id: string;
  module_number: number;
  completed_at?: string;
}

export interface QuizSubmission {
  id?: string;
  applicant_id: string;
  module_number: number;
  score: number;
  passed: boolean;
  submitted_at?: string;
}

interface ApplicantContextType {
  applicant: Applicant | null;
  modules: TrainingModule[];
  completedModules: TrainingLog[];
  quizSubmissions: QuizSubmission[];
  isLoading: boolean;
  user: User | null;
  refreshApplicantData: () => Promise<void>;
  completeModule: (moduleNumber: number) => Promise<void>;
  submitQuiz: (moduleNumber: number, score: number, passed: boolean) => Promise<void>;
}

const ApplicantContext = createContext<ApplicantContextType | undefined>(undefined);

export const ApplicantProvider = ({ children }: { children: ReactNode }) => {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [completedModules, setCompletedModules] = useState<TrainingLog[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async (userId: string) => {
    const supabase = getSupabase();
    
    // Fetch applicant
    const { data: applicantData, error: applicantError } = await supabase
        .from('applicants')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    
    if (applicantError) {
        console.error('Supabase error fetching applicant:', applicantError);
    }

    if (applicantData) {
        setApplicant({
            ...applicantData,
            current_stage: (applicantData.current_stage || '1').toString(),
        } as Applicant);
        
        // Fetch modules
        const { data: modulesData } = await supabase.from('training_modules').select('*').order('module_number');
        const sortedModules = (modulesData || []).sort((a,b) => a.module_number - b.module_number);
        setModules(sortedModules);

        // Fetch logs
        const { data: logsData } = await supabase.from('training_logs').select('*').eq('applicant_id', applicantData.id);
        setCompletedModules(logsData || []);

        // Fetch quiz submissions with local fallback
        const { data: qData } = await supabase.from('quiz_submissions').select('*').eq('applicant_id', applicantData.id);
        if (qData) {
            setQuizSubmissions(qData);
            localStorage.setItem(`local_quiz_submissions_${applicantData.id}`, JSON.stringify(qData));
        } else {
            const fallbackStr = localStorage.getItem(`local_quiz_submissions_${applicantData.id}`);
            if (fallbackStr) {
                try {
                    setQuizSubmissions(JSON.parse(fallbackStr));
                } catch {
                    setQuizSubmissions([]);
                }
            } else {
                setQuizSubmissions([]);
            }
        }
    } else {
        console.error('Error fetching applicant data:', applicantError);
        setApplicant(null);
    }
    setIsLoading(false);
  };

  const completeModule = async (moduleNumber: number) => {
    if (!applicant) return;
    const supabase = getSupabase();
    
    // 1. Insert log
    await supabase.from('training_logs').insert({ 
      applicant_id: applicant.id, 
      module_number: moduleNumber,
      completed_at: new Date().toISOString()
    });
    
    // 2. Recalculate progress
    const { data: logs } = await supabase.from('training_logs').select('module_number').eq('applicant_id', applicant.id);
    const completedCount = logs ? logs.length : 0;
    const totalModules = modules.length;
    const newProgress = totalModules > 0 ? Math.min(100, Math.round((completedCount / totalModules) * 100)) : 0;
    
    // 3. Update applicant
    await supabase.from('applicants').update({ progress_percent: newProgress }).eq('id', applicant.id);
    
    await fetchAllData(applicant.user_id);
  };

  const submitQuiz = async (moduleNumber: number, score: number, passed: boolean) => {
    if (!applicant) return;
    const supabase = getSupabase();

    const newSub = { 
      applicant_id: applicant.id, 
      module_number: moduleNumber, 
      score: score,
      passed: passed,
      submitted_at: new Date().toISOString()
    };

    // Try to save to DB
    const { error: insertError } = await supabase.from('quiz_submissions').insert(newSub);

    let currentList = [...(quizSubmissions || [])];
    const existingIndex = currentList.findIndex(s => s && s.module_number === moduleNumber);
    if (existingIndex > -1) {
      currentList[existingIndex] = newSub;
    } else {
      currentList.push(newSub);
    }

    localStorage.setItem(`local_quiz_submissions_${applicant.id}`, JSON.stringify(currentList));
    setQuizSubmissions(currentList);

    // Calculate progress_percent and advance stage
    const quizCount = Array.from(new Set((currentList || []).map(s => s?.module_number).filter(Boolean))).length;
    const totalModulesCount = modules.length || 5;
    const calculatedProgress = Math.min(100, Math.round((quizCount / totalModulesCount) * 100));

    let nextStage = applicant.current_stage;
    if (quizCount === totalModulesCount && (parseInt(applicant.current_stage) || 1) <= 3) {
      nextStage = '4'; // "Final Exam" (next milestone/stage in progression)
    }

    await supabase.from('applicants').update({
        progress_percent: calculatedProgress,
        current_stage: nextStage
    }).eq('id', applicant.id);

    await fetchAllData(applicant.user_id);
  };

  useEffect(() => {
    const supabase = getSupabase();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchAllData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchAllData(session.user.id);
      } else {
        setUser(null);
        setApplicant(null);
        setModules([]);
        setCompletedModules([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ApplicantContext.Provider value={{ applicant, modules, completedModules, quizSubmissions, isLoading, user, refreshApplicantData: () => user ? fetchAllData(user.id) : Promise.resolve(), completeModule, submitQuiz }}>
      {children}
    </ApplicantContext.Provider>
  );
};

export const useApplicant = () => {
  const context = useContext(ApplicantContext);
  if (context === undefined) {
    throw new Error('useApplicant must be used within an ApplicantProvider');
  }
  return context;
};
