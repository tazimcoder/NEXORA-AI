import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authStore } from '../store/authStore';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [authState, setAuthState] = useState(() => authStore.getState());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      setAuthState(state);
    });

    return unsubscribe;
  }, []);

  // 1. If not authenticated, redirect to /login
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If admin requirement is set and user is NOT an admin
  if (requireAdmin && authState.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative z-10">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Lock className="w-3 h-3" /> 403 Forbidden
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Admin Access Only</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              You are signed in as <strong className="text-slate-200">{authState.user?.email || 'User'}</strong> (Role: <span className="uppercase text-amber-400 font-bold">{authState.user?.role || 'user'}</span>).
              Access to the System Admin Panel is restricted exclusively to authorized Administrator accounts.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => navigate('/workflows')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Workflows
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated (and meets role requirement if admin)
  return children;
}
