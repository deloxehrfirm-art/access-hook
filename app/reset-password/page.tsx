'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Verification & Session check states
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const handleAuthCheckAndExchange = async () => {
      if (typeof window === 'undefined') return;
      
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const supabase = getSupabase();

      try {
        if (code) {
          // If there is an auth code, exchange it for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError(error.message);
            setHasValidSession(false);
          } else if (data?.session) {
            setHasValidSession(true);
            // Clean up the URL query params so they don't stay in the browser address bar
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setError('Could not verify your reset link. Please try again.');
            setHasValidSession(false);
          }
        } else {
          // No code in URL, check if there is an active session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setHasValidSession(true);
          } else {
            setError('No active session or password reset token found. Please request a new password reset link.');
            setHasValidSession(false);
          }
        }
      } catch (err) {
        setError('An unexpected error occurred during session verification.');
        setHasValidSession(false);
      } finally {
        setIsVerifying(false);
      }
    };

    handleAuthCheckAndExchange();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setError(error.message);
      } else {
        setMessage('Your password has been reset successfully! Redirecting you to login...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#1a2321]">
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-12 max-w-md w-full shadow-2xl">
        <h1 className="text-3xl font-bold text-[#dbf0de] mb-6 text-center">New Password</h1>
        
        {isVerifying ? (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="animate-spin text-[#dbf0de] mx-auto" size={40} />
            <p className="text-white text-sm">Verifying your security token...</p>
          </div>
        ) : !hasValidSession ? (
          <div className="text-center space-y-6 py-4">
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {error.toLowerCase().includes('pkce') || error.toLowerCase().includes('verifier') ? (
              <div className="text-left text-xs space-y-3 text-white/80 border-t border-b border-white/10 py-4 my-2">
                <p className="font-semibold text-[#dbf0de] text-sm">Why did this happen?</p>
                <p>
                  You requested the password reset from a <strong>development server</strong> (AI Studio preview), but Supabase redirected you to the <strong>production domain</strong> (<code className="bg-black/30 px-1 py-0.5 rounded text-red-300 font-mono">ecosystem.deloxehr.com</code>).
                </p>
                <p>
                  Due to modern security standards (PKCE), verification codes cannot be exchanged across different domains.
                </p>
                <p className="font-semibold text-[#dbf0de] mt-1">How to test and fix this:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>Production:</strong> Go to <a href="https://www.ecosystem.deloxehr.com/login" className="underline text-[#dbf0de]" target="_blank" rel="noopener noreferrer">ecosystem.deloxehr.com/login</a>, request the link there, and click it. It will work perfectly!
                  </li>
                  <li>
                    <strong>Development:</strong> Add your development preview URL to your Supabase Dashboard under <strong>Project Settings → Auth → URL Configuration → Redirect URLs</strong>.
                  </li>
                </ul>
              </div>
            ) : (
              <p className="text-white/70 text-sm">
                Your recovery link may have expired or is invalid. Please request a new link from the login page.
              </p>
            )}

            <button 
              onClick={() => router.push('/login')}
              className="w-full px-6 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold hover:shadow-lg transition-all hover:scale-105"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <p className="text-white text-center mb-8">Enter your new secure password below.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm text-center">
                {message}
              </div>
            )}

            {!message && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="New Password" 
                    className="w-full bg-[#1a2321]/50 p-4 pr-12 rounded-xl border border-white/10 text-white focus:border-[#dbf0de] transition-all outline-none" 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm New Password" 
                  className="w-full bg-[#1a2321]/50 p-4 rounded-xl border border-white/10 text-white focus:border-[#dbf0de] transition-all outline-none" 
                  required
                />

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full px-6 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold hover:shadow-lg transition-all hover:scale-105 flex justify-center items-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Updating password...' : 'Update Password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
