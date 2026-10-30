import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Cloud, Sparkles, Building2, AlertCircle, Loader2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-6">
          <Building2 className="w-9 h-9 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          KB Factory
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Animal Feed (Vanda / Bori) Wholesale &amp; Retail Cloud ERP System
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mb-3"
        >
          {signingIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              {/* Google G logo */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Quick Local Admin Access Button */}
        <button
          onClick={() => useAuth().loginAsLocalAdmin()}
          className="w-full py-3 px-4 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold rounded-2xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer mb-6"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Quick Access (Farooq Gujjar KB Admin)</span>
        </button>

        {/* Feature Badges */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-left">100% Serverless Cloud Database with global access</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-left">Secure per-account multi-tenant isolation</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-left">Automatic 1-Year data retention &amp; offline local backup</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Sign in with your Google account to access your live dashboard, inventory, and khatas.
      </p>
    </div>
  );
};
