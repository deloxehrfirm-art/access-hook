'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, BookOpen, GraduationCap, Briefcase, User, Settings, LogOut, ChevronDown, Lock, Loader2, X, Award, ChevronRight, ChevronLeft, Share2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useApplicant } from '@/components/ApplicantContext';

export function CustomSidebarIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="13" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { applicant, quizSubmissions, isLoading, user } = useApplicant();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lockedModal, setLockedModal] = useState(false);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a2321] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#DFFF00]" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const completedQuizzesCount = Array.from(new Set((quizSubmissions || []).map(sub => sub?.module_number).filter(Boolean))).length;
  const isInterviewCompleted = applicant?.current_stage === '6' || applicant?.current_stage === '7';
  const isLocked = !applicant || completedQuizzesCount < 5 || !isInterviewCompleted;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/handbook', label: 'Handbook', icon: BookOpen },
    { href: '/dashboard/training-hub', label: 'Training', icon: GraduationCap },
    { href: '/dashboard/professional-exam', label: 'Exam', icon: Award },
    { href: '/dashboard/job-pool', label: 'Job Pool', icon: Briefcase, isLocked: isLocked },
  ];

  return (
    <div className="min-h-screen bg-[#1a2321] text-[#E0E6ED] flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-[#dbf0de]/10 bg-[#1a2321] p-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2.5">
              <CustomSidebarIcon size={20} className="text-[#DFFF00]" />
              <h2 className={`text-lg font-bold text-[#dbf0de] ${isSidebarCollapsed ? 'hidden' : 'block'}`}>Deloxe</h2>
            </div>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="p-1.5 text-gray-400 hover:text-[#dbf0de] transition-colors rounded-lg hover:bg-white/5"
              title="Toggle Sidebar"
            >
              <CustomSidebarIcon size={18} />
            </button>
        </div>
        <div className="flex-1">
          <NavLinks navItems={navItems} pathname={pathname} isCollapsed={isSidebarCollapsed} isLocked={isLocked} setLockedModal={setLockedModal} />
        </div>
        <button 
            onClick={handleLogout} 
            className={`flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-white/5 transition-colors ${isSidebarCollapsed ? 'justify-center w-12 h-12 rounded-full' : 'w-full'}`}
        >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Bar */}
        <header className="border-b border-[#dbf0de]/10 bg-[#1a2321]/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-1.5 rounded-lg text-gray-300 hover:text-[#DFFF00] hover:bg-white/5 transition-colors flex items-center justify-center"
              title="Toggle Sidebar"
            >
              <CustomSidebarIcon size={20} />
            </button>
            <h1 className="text-lg font-semibold text-[#dbf0de]">Deloxe</h1>
          </div>
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)} 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#dbf0de]/5 rounded-full hover:bg-[#dbf0de]/10 transition text-[#dbf0de] text-sm font-medium"
            >
              <User size={16} />
              <ChevronDown size={12} />
            </button>
            {profileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="absolute right-0 mt-2 w-48 bg-[#26312f] border border-[#dbf0de]/10 rounded-xl overflow-hidden shadow-lg z-50 p-1"
              >
                <Link href="/dashboard/profile" className="block p-2 hover:bg-[#dbf0de]/5 rounded-lg text-[#dbf0de] text-sm">Profile</Link>
                <Link href="/dashboard/settings" className="block p-2 hover:bg-[#dbf0de]/5 rounded-lg text-[#dbf0de] text-sm">Settings</Link>
                <Link href="/dashboard/preferences" className="block p-2 hover:bg-[#dbf0de]/5 rounded-lg text-[#dbf0de] text-sm">Preferences</Link>
                <button onClick={handleLogout} className="w-full text-left p-2 text-red-400 hover:bg-white/5 rounded-lg text-sm flex items-center gap-2 mt-1 border-t border-[#dbf0de]/10">
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#26312f] border-t border-[#dbf0de]/10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] rounded-t-2xl p-2 flex justify-around items-center z-40">
        {navItems.slice(0, 4).map(item => (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${pathname === item.href ? 'text-[#DFFF00] bg-white/5' : 'text-gray-400'}`}>
                <item.icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
        ))}
        <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-[#DFFF00] transition-colors">
            <CustomSidebarIcon size={20} />
            <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>
      
      <AnimatePresence>
        {lockedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#1a2321] border border-[#dbf0de]/10 p-8 rounded-3xl max-w-sm w-full text-center">
              <Lock size={48} className="text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Access Locked</h3>
              <p className="text-gray-400 text-sm mb-6">Please complete your placement interview to unlock the Job Pool.</p>
              <button onClick={() => setLockedModal(false)} className="w-full py-3 bg-[#DFFF00] text-[#1a2321] font-bold rounded-xl">Got it</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="md:hidden fixed inset-y-0 right-0 z-50 w-3/4 bg-[#1a2321] shadow-2xl p-6 border-l border-[#dbf0de]/10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <CustomSidebarIcon size={20} className="text-[#DFFF00]" />
                <h2 className="text-lg font-bold text-white">Menu</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <NavLinks navItems={navItems} pathname={pathname} isCollapsed={false} isLocked={isLocked} setLockedModal={setLockedModal} isMobile={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLinks({ navItems, pathname, isCollapsed, isLocked, setLockedModal, isMobile = false }: any) {
  return (
    <nav className="space-y-1">
      {navItems.map((link: any) => {
        const isActive = pathname === link.href;
        const isLockedItem = !!link.isLocked;
        
        if (isLockedItem) {
          return (
            <button 
              key={link.href}
              onClick={() => setLockedModal(true)}
              className={`flex items-center transition-all opacity-40 cursor-not-allowed ${
                isCollapsed 
                  ? 'w-12 h-12 rounded-full mx-auto justify-center text-gray-400 hover:bg-[#dbf0de]/5' 
                  : 'gap-3 p-3 rounded-xl text-[#E0E6ED] hover:bg-[#dbf0de]/5'
              }`}
            >
              <link.icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left">{link.label}</span>}
              {!isCollapsed && <Lock size={14} />}
            </button>
          );
        }

        return (
          <Link 
            key={link.href} 
            href={link.href}
            className={`flex items-center transition-all ${
              isCollapsed 
                ? `w-12 h-12 rounded-full mx-auto justify-center ${isActive ? 'bg-[#DFFF00] text-[rgb(38,47,44)]' : 'text-gray-400 hover:bg-[#dbf0de]/5'}` 
                : `gap-3 p-3 rounded-xl ${isActive ? 'bg-[#DFFF00] text-[rgb(38,47,44)] font-semibold' : 'text-[#E0E6ED] hover:bg-[#dbf0de]/5'}`
            }`}
          >
            <link.icon size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>{link.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
