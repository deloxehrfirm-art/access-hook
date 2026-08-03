'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

const supabase = getSupabase();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Forgot password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      // 2. Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login error details:', error);
        if (error.message.includes('credentials')) {
          setErrorMessage('Incorrect password. Please check your credentials and try again.');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess(true);
      }
    } catch (err) {
      setResetError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#1a2321]">
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-12 max-w-md w-full shadow-2xl">
        {mode === 'login' ? (
          <>
            <h1 className="text-3xl font-bold text-[#dbf0de] mb-6 text-center">Welcome Back</h1>
            <p className="text-white text-center mb-8">Enter your credentials to access your dashboard.</p>
            
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="email" 
                id="email"
                name="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email Address" 
                className="w-full bg-[#1a2321]/50 p-4 rounded-xl border border-white/10 text-white focus:border-[#dbf0de] transition-all outline-none" 
                required
              />
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password"
                  name="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Password" 
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

              <div className="flex justify-end text-sm">
                <button 
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setResetEmail(email);
                  }}
                  className="text-gray-400 hover:text-[#dbf0de] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                id="login-submit"
                name="login-submit"
                disabled={loading} 
                className="w-full px-6 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold hover:shadow-lg transition-all hover:scale-105"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <button 
                onClick={() => setMode('login')}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-[#dbf0de]">Reset Password</h1>
            </div>
            
            <p className="text-white mb-6 text-sm">
              Enter your email address and we will send you a secure link to reset your password.
            </p>

            {resetError && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                {resetError}
              </div>
            )}

            {resetSuccess ? (
              <div className="text-center space-y-6">
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm text-center">
                  Password reset link sent! Check your inbox for further instructions.
                </div>
                <button 
                  onClick={() => {
                    setMode('login');
                    setResetSuccess(false);
                  }}
                  className="w-full px-6 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold hover:shadow-lg transition-all hover:scale-105"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input 
                  type="email" 
                  id="reset-email"
                  name="reset-email"
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)} 
                  placeholder="Email Address" 
                  className="w-full bg-[#1a2321]/50 p-4 rounded-xl border border-white/10 text-white focus:border-[#dbf0de] transition-all outline-none" 
                  required
                />
                <button 
                  type="submit" 
                  disabled={resetLoading} 
                  className="w-full px-6 py-4 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold hover:shadow-lg transition-all hover:scale-105"
                >
                  {resetLoading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
