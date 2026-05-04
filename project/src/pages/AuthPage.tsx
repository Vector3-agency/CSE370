import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { createCheckoutSession, fetchProfileResolved } from '../lib/api';
import { PRICE_MONTHLY, PRICE_YEARLY } from '../constants/stripe';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Crown, Star, Check, Gift } from 'lucide-react';

const PLAN_INFO = {
  [PRICE_MONTHLY]: {
    label: 'Monthly',
    price: '$29.99',
    period: '/month',
    icon: Crown,
  },
  [PRICE_YEARLY]: {
    label: 'Yearly',
    price: '$299.99',
    period: '/year',
    badge: 'Save 16%',
    icon: Star,
  },
};

export default function AuthPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [noPlanError, setNoPlanError] = useState(false);
  const [withTrial, setWithTrial] = useState<boolean>(false);
  const hasHandledRedirect = useRef(false);

  // Read whatever plan was pre-selected before navigating here
  useEffect(() => {
    const stored = localStorage.getItem('pending_price_id');
    if (stored) setSelectedPriceId(stored);

    // Initialize trial toggle from localStorage
    const pendingWithTrial = localStorage.getItem('pending_with_trial');
    if (pendingWithTrial !== null) {
      setWithTrial(pendingWithTrial === 'true');
    }

    // When the user presses the browser back button from Stripe (an external page),
    // the browser restores this page from bfcache. Clear the pending checkout keys
    // so we don't re-redirect to Stripe, then navigate to dashboard.
    const handlePageShow = async (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      localStorage.removeItem('pending_price_id');
      localStorage.removeItem('pending_with_trial');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const prof = await fetchProfileResolved(session.user.id);
        window.location.href =
          window.location.origin +
          (prof?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
      } else {
        window.location.href = window.location.origin + '/student/dashboard';
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Keep localStorage in sync when user picks a plan inline
  const handleSelectPlan = (priceId: string) => {
    setSelectedPriceId(priceId);
    localStorage.setItem('pending_price_id', priceId);
    setNoPlanError(false);
  };

  const toggleTrial = (enabled: boolean) => {
    setWithTrial(enabled);
    localStorage.setItem('pending_with_trial', enabled.toString());
  };

  // Track whether the user was already logged in when auth first resolved.
  // This ref is set ONCE and never changes, so it correctly distinguishes:
  //   - "user pressed Back from Stripe" (wasLoggedInOnLoad = true → go to dashboard)
  //   - "user just signed up/in via the form" (wasLoggedInOnLoad = false → check for Stripe)
  const wasLoggedInOnLoad = useRef<boolean | null>(null); // null = not yet determined

  // Step 1: When auth finishes loading, determine if user was already signed in.
  // If yes, skip this page entirely and go to dashboard.
  useEffect(() => {
    if (authLoading) return;
    if (wasLoggedInOnLoad.current !== null) return; // already determined

    if (user) {
      wasLoggedInOnLoad.current = true;
      localStorage.removeItem('pending_price_id');
      localStorage.removeItem('pending_with_trial');
      navigate(profile?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true });
    } else {
      wasLoggedInOnLoad.current = false;
    }
  }, [authLoading, user, profile, navigate]);

  // If role resolved to admin one tick after the redirect above (rare), send admins to the admin app.
  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'admin') return;
    navigate('/admin/dashboard', { replace: true });
  }, [authLoading, user, profile, navigate]);

  // Step 2: Listen for FRESH sign-ins (form submit). This effect is set up once
  // and stays attached — it does NOT depend on `user` so it won't tear down
  // when the user state changes after signup.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session || hasHandledRedirect.current) return;
      // If the user was already logged in on page load, skip (handled above).
      if (wasLoggedInOnLoad.current === true) return;

      hasHandledRedirect.current = true;

      // We need to wait a tick for the profile to be fetched in AuthProvider 
      // before redirecting properly based on role, but we can check if it's already there
      const pendingPriceId = localStorage.getItem('pending_price_id');

      if (pendingPriceId) {
        setRedirecting(true);

        try {
          const pendingWithTrial = localStorage.getItem('pending_with_trial');
          const withTrial = pendingWithTrial === 'true';
          
          const returnUrl = window.location.origin + '/student/dashboard';
          const { url } = await createCheckoutSession(pendingPriceId, returnUrl, withTrial);
          sessionStorage.setItem('redirecting_to_stripe', '1');
          window.location.href = url;
        } catch (err: any) {
          console.error('Failed to create checkout session:', err);
          setRedirecting(false);
          hasHandledRedirect.current = false;
          setError(`Could not start checkout: ${err.message || 'Unknown error'}. Redirecting...`);
          // Note: Here we'll just redirect to dashboard, it's a fallback
          setTimeout(() => navigate('/student/dashboard', { replace: true }), 3000);
        }
      } else {
        // Here we should wait for profile to be available from the AuthContext
        // To be safe, we let the upper useEffect handle the redirect if profile is ready
        // But since we want to clear the form, we can just navigate here. Let's do a simple DB check or rely on the other effect.
        // Actually, we can fetch it right here to be 100% sure before navigating
        const prof = await fetchProfileResolved(session.user.id);
        navigate(prof?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // While auth is still loading or user was already signed in, render nothing.
  // The useEffect above will redirect to the role home (student dashboard or admin).
  if (authLoading || (user && wasLoggedInOnLoad.current === true)) return null;


  // Show loading screen while redirecting to Stripe checkout
  if (redirecting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Setting up your subscription...</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Redirecting to checkout</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        if (data.session) {
          setSuccessMessage('Account created successfully! Redirecting to dashboard...');
        } else {
          setSuccessMessage(
            'Account created! Please check your email to verify, then sign in to continue.'
          );
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = selectedPriceId ? (PLAN_INFO as Record<string, any>)[selectedPriceId] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 font-body selection:bg-indigo-100 selection:text-indigo-700">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 md:p-10">

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="MedKotha Logo" className="w-full h-full object-contain dark:hidden" />
              <img src="/logowhite.png" alt="MedKotha Logo" className="w-full h-full object-contain hidden dark:block" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">MedKotha</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">
            {isLogin ? 'Welcome back to MedKotha' : 'Join MedKotha today'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {isLogin ? 'Sign in to continue studying' : 'Start your medical journey today'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 rounded-xl text-sm text-rose-700 dark:text-rose-300 font-medium flex gap-2 items-start animate-fadeIn">
            <span>•</span>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 font-medium flex gap-2 items-start animate-fadeIn">
            <span>•</span>
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-heading">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-200 font-medium hover:bg-white dark:hover:bg-slate-600 focus:bg-white dark:focus:bg-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-heading">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-200 font-medium hover:bg-white dark:hover:bg-slate-600 focus:bg-white dark:focus:bg-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-heading">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-200 font-medium hover:bg-white dark:hover:bg-slate-600 focus:bg-white dark:focus:bg-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 transition-transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-heading text-sm mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">
            {isLogin ? "New to MedKotha?" : 'Already have an account?'}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMessage(null);
              setNoPlanError(false);
              navigate(`/auth?mode=${!isLogin ? 'signin' : 'signup'}`, { replace: true });
            }}
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {isLogin ? 'Create an account' : 'Sign in to your account'}
          </button>
        </div>
      </div>
    </div>
  );
}
