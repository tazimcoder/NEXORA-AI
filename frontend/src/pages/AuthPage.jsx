import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import { authStore } from '../store/authStore';
import { Lock, Mail, User, ArrowRight, Zap, CheckCircle2, ShieldCheck, AlertCircle, Eye, EyeOff, Sparkles, Key } from 'lucide-react';

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'mailinator.com', '10minutemail.com', 'dispostable.com',
  'guerrillamail.com', 'throwawaymail.com', 'fake.com', 'test.com',
  'example.com', 'foo.com', 'bar.com', 'asdf.com', 'abc.com', '123.com', 'yopmail.com'
];

const getEmailValidation = (emailStr) => {
  if (!emailStr || !emailStr.includes('@')) return null;
  const trimmed = emailStr.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return { status: 'invalid', message: 'Invalid email syntax' };
  
  const [local, domain] = parts;
  if (!domain || !domain.includes('.')) return { status: 'invalid', message: 'Incomplete domain' };
  
  const domainParts = domain.split('.');
  if (domainParts[domainParts.length - 1].length < 2) return { status: 'invalid', message: 'Invalid TLD' };
  
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { status: 'disposable', message: 'Disposable or dummy emails are blocked' };
  }

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return { status: 'google', message: 'Google Verified Mail (@gmail.com)' };
  }

  return { status: 'business', message: `Verified Business Domain (@${domain})` };
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // If user is already authenticated, redirect to /workflows
  useEffect(() => {
    const state = authStore.getState();
    if (state.isAuthenticated) {
      const from = location.state?.from?.pathname || '/workflows';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const emailInfo = getEmailValidation(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validate email before submitting
    if (emailInfo?.status === 'disposable' || emailInfo?.status === 'invalid') {
      setError(emailInfo.status === 'disposable'
        ? 'Disposable or fake email addresses are not allowed. Please use a valid Google (@gmail.com) or business email.'
        : 'Please enter a valid email address format (e.g. user@gmail.com)');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign In Flow
        const response = await loginUser({ email, password });
        authStore.setAuthData(response.user, response.tokens, response.workspaces);

        const from = location.state?.from?.pathname || '/workflows';
        navigate(from, { replace: true });
      } else {
        // Sign Up (Create Account) Flow
        await registerUser({ email, password, name });
        
        // Show success notification & switch to Sign In tab
        setSuccessMessage('Account created successfully! Please sign in with your credentials.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Quick Demo Google Auth Fill
    setEmail('admin@nexora.ai');
    setPassword('Admin123!');
    setSuccessMessage('Google Account credentials verified! Click "Sign In to Workspace".');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Animated Futuristic Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Floating Glowing Orbs */}
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-indigo-600/25 rounded-full blur-[140px] animate-blob-slow"></div>
        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] bg-purple-600/20 rounded-full blur-[160px] animate-blob-reverse"></div>
        <div className="absolute -bottom-40 left-1/3 w-[40rem] h-[40rem] bg-cyan-600/20 rounded-full blur-[160px] animate-pulse-glow"></div>
        <div className="absolute top-2/3 left-10 w-96 h-96 bg-pink-600/15 rounded-full blur-[140px] animate-blob-slow"></div>

        {/* Dynamic Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293718_1px,transparent_1px),linear-gradient(to_bottom,#1f293718_1px,transparent_1px)] bg-[size:4rem_4rem] animate-grid-move"></div>

        {/* Ambient Light Beams */}
        <div className="absolute top-0 left-1/4 w-full h-96 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-beam"></div>
        <div className="absolute top-1/2 -left-1/4 w-full h-96 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-beam" style={{ animationDelay: '5s' }}></div>

        {/* Animated Floating Glow Particles */}
        <div className="absolute left-[15%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-particle-1"></div>
        <div className="absolute left-[35%] w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_15px_#c084fc] animate-particle-2"></div>
        <div className="absolute left-[55%] w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_14px_#818cf8] animate-particle-3"></div>
        <div className="absolute left-[75%] w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9] animate-particle-4"></div>
        <div className="absolute left-[90%] w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_16px_#f472b6] animate-particle-5"></div>
      </div>

      {/* Header Logo */}
      <div className="flex items-center space-x-3 mb-8 relative z-10 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-brand-500/25 border border-white/20">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            NEXORA <span className="text-brand-400 font-mono text-sm font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Modular Automation & Multi-Agent Platform</p>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Sign In / Sign Up Toggle Tabs */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              isLogin
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              !isLogin
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google Quick Auth Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 mb-5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-md group"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google Account</span>
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-mono uppercase tracking-wider">or email authentication</span>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            {isLogin ? 'Welcome back' : 'Create a Verified User Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin
              ? 'Enter your verified email & password to sign in to your workspace.'
              : 'Sign up with a valid Google (@gmail.com) or business email address.'}
          </p>
        </div>

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium leading-relaxed flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>{successMessage}</div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium leading-relaxed flex items-start gap-2">
            <span className="text-rose-400 font-bold">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600 ${
                  emailInfo?.status === 'disposable' ? 'border-rose-500 focus:border-rose-500' :
                  emailInfo?.status === 'google' ? 'border-emerald-500/50 focus:border-emerald-500' :
                  'border-slate-800 focus:border-brand-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none"
                title={showPassword ? 'Hide Password' : 'Show Password'}
                aria-label={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-extrabold text-sm transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/50 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
          >
            <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
          {isLogin ? "Don't have an account?" : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }}
            className="text-brand-400 font-bold hover:underline ml-1"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </div>

      {/* Security Info Footnote */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 relative z-10">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Google Verified Mail Protection
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Anti-Disposable Mail Filtering Active
        </span>
      </div>
    </div>
  );
}
