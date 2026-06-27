'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Loader2, Zap, AlertCircle } from 'lucide-react';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const errorCode = searchParams.get('error');

  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    await signIn('azure-ad', { callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center mt-3">WorkSphere</h1>
          <p className="text-indigo-300 text-sm text-center mt-1 mb-8">Your AI-powered productivity command center</p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {['AI Classification', 'Smart Tasks', 'Auto Reminders', 'Team Tracking'].map(f => (
              <span key={f} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-medium">
                {f}
              </span>
            ))}
          </div>

          {/* Error message */}
          {errorCode && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errorCode === 'AccessDenied'
                ? 'Access denied. You are not authorised to use this workspace.'
                : 'Sign-in failed. Please try again.'}
            </div>
          )}

          {/* Microsoft SSO button */}
          <button
            onClick={handleMicrosoftSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-13 px-6 py-3.5 bg-[#0078d4] hover:bg-[#106ebe] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30 group"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              /* Microsoft logo SVG */
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            )}
            <span>{loading ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}</span>
          </button>

          <p className="text-center text-slate-500 text-xs mt-6">
            Sign in using your <span className="text-slate-400">nationalgroupindia.com</span> Microsoft account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
