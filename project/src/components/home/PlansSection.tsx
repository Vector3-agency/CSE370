import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, CheckCircle, Sparkles, Loader2, Clock, BadgeCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../lib/api';
import { useSubscription } from '../SubscriptionProvider';

import { PRICE_MONTHLY } from '../../constants/stripe';

gsap.registerPlugin(ScrollTrigger);

export default function PlansSection() {
  const navigate = useNavigate();
  const { isTrialing, isSubscribed, trialDaysRemaining, hasActiveAccess } = useSubscription();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  // Determine the trial card state
  const trialCardState = (() => {
    if (isSubscribed) return 'subscribed';
    if (isTrialing) return 'active_trial';
    return 'available';
  })();

  // For paid plans: if not logged in → signup first; if logged in → Stripe
  const handleSubscribe = async (priceId: string) => {
    try {
      setIsLoading(priceId);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        localStorage.setItem('pending_price_id', priceId);
        localStorage.setItem('pending_with_trial', 'false'); // Instant charge if they picked the Pro card
        navigate('/auth?mode=signup');
        return;
      }

      const { url } = await createCheckoutSession(priceId, window.location.origin + '/student/dashboard', false);
      sessionStorage.setItem('redirecting_to_stripe', '1');
      window.location.href = url;
    } catch (err: any) {
      console.error('Subscription error:', err);
      alert('Failed to start checkout: ' + (err.message || 'Unknown error'));
      setIsLoading(null);
    }
  };

  // For free trial: not logged in → signup; logged in → Stripe checkout with trial, else dashboard if already entitled
  const handleStartTrial = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      localStorage.setItem('pending_price_id', currentPriceId);
      localStorage.setItem('pending_with_trial', 'true');
      navigate('/auth?mode=signup');
      return;
    }
    if (isTrialing || hasActiveAccess) {
      navigate('/student/dashboard');
      return;
    }
    try {
      setIsLoading('trial');
      const returnUrl = `${window.location.origin}/student/dashboard`;
      const { url } = await createCheckoutSession(currentPriceId, returnUrl, true);
      sessionStorage.setItem('redirecting_to_stripe', '1');
      window.location.href = url;
    } catch (err: any) {
      console.error('Trial checkout error:', err);
      alert('Failed to start trial checkout: ' + (err.message || 'Unknown error'));
      setIsLoading(null);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.plans-heading', {
        y: 40, opacity: 0, duration: 0.8,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
      [card1Ref, card2Ref].forEach((ref, i) => {
        gsap.from(ref.current, {
          y: 50, opacity: 0, duration: 0.7, delay: i * 0.12,
          scrollTrigger: { trigger: ref.current, start: 'top 85%' },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const currentPriceId = PRICE_MONTHLY;

  return (
    <section ref={sectionRef} id="pricing" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="plans-heading text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 font-heading">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Affordable plans tailored for Bangladesh MBBS students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* ── Card 1: Free Trial ── */}
          <div
            ref={card1Ref}
            className={`bg-white rounded-3xl p-8 border shadow-lg hover:shadow-xl transition-all relative flex flex-col overflow-hidden group ${
              trialCardState === 'active_trial'
                ? 'border-emerald-300 ring-1 ring-emerald-200'
                : trialCardState === 'subscribed'
                ? 'border-slate-200 opacity-70'
                : 'border-slate-200'
            }`}
          >
            <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={100} className="text-emerald-500" />
            </div>

            <div className="mb-5 relative z-10">
              {trialCardState === 'active_trial' ? (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 font-heading inline-flex items-center gap-1 mb-3">
                  <Clock size={12} />
                  {trialDaysRemaining != null ? (
                    <>
                      {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
                    </>
                  ) : (
                    <>Trial active</>
                  )}
                </span>
              ) : trialCardState === 'subscribed' ? (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200 font-heading inline-flex items-center gap-1 mb-3">
                  <BadgeCheck size={12} /> Pro Active
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 font-heading inline-flex items-center gap-1 mb-3">
                  <CheckCircle size={12} fill="currentColor" /> Risk Free
                </span>
              )}
              <h3 className="text-xl font-bold text-slate-900 font-heading">3-Day Free Trial</h3>
              <p className="text-slate-500 text-sm mt-1.5">
                {trialCardState === 'active_trial'
                  ? 'Your trial is active — enjoy full access!'
                  : trialCardState === 'subscribed'
                  ? 'You already have an active Pro subscription.'
                  : 'Experience everything without commitment.'}
              </p>
            </div>

            <div className="mb-6 relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 font-heading tracking-tight">৳0</span>
                <span className="text-slate-400 font-medium">/ today</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">No charge until day 3</p>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1 relative z-10">
              {['3-day full preview access', 'BMDC-style SAQ + MCQ bank', 'Performance Dashboard'].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-emerald-600" strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {trialCardState === 'subscribed' ? (
              <div className="w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-400 font-bold text-center relative z-10 font-heading text-sm cursor-default select-none">
                You're on Pro
              </div>
            ) : trialCardState === 'active_trial' ? (
              <button
                onClick={() => navigate('/student/dashboard')}
                className="w-full py-3.5 rounded-xl border-2 border-emerald-500 text-emerald-700 font-bold hover:bg-emerald-50 transition-all shadow-sm relative z-10 font-heading active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={handleStartTrial}
                disabled={isLoading !== null}
                className="w-full py-3.5 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-all shadow-sm relative z-10 font-heading active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading === 'trial' ? <Loader2 size={18} className="animate-spin" /> : null}
                Start Free Trial
              </button>
            )}
          </div>

          {/* ── Card 2: Pro Access ── */}
          <div
            ref={card2Ref}
            className="bg-white rounded-3xl p-8 border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all relative flex flex-col overflow-hidden group ring-1 ring-indigo-100"
          >
            <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
              <Crown size={100} className="text-indigo-400" />
            </div>

            <div className="mb-5 relative z-10">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200 font-heading inline-flex items-center gap-1 mb-3">
                <Sparkles size={12} fill="currentColor" /> Most Popular
              </span>
              <h3 className="text-xl font-bold text-slate-900 font-heading">Pro Access</h3>
              <p className="text-slate-500 text-sm mt-1.5">Core MBBS professional exam preparation plan.</p>
            </div>

            <div className="mb-6 relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 font-heading tracking-tight">৳300</span>
                <span className="text-indigo-600 font-medium">/month</span>
              </div>
              <p className="text-xs text-indigo-600 mt-1.5 font-medium">Final local pricing shown at checkout</p>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1 relative z-10">
              {['MBBS Pro exam tracks', 'Subject-wise practice sets', 'Adaptive analytics', 'Detailed explanations', 'University-relevant prep flow'].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-indigo-600" strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(currentPriceId)}
              disabled={isLoading !== null}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-200/50 relative z-10 font-heading active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading === currentPriceId
                ? <Loader2 className="animate-spin" size={18} />
                : 'Get Pro Access'}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
