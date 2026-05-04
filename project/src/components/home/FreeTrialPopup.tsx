import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  X, Crown, Check, ArrowRight, ArrowLeft,
  Sparkles, Rocket, Gift, Star, Shield, Loader2, Clock, LogOut
} from 'lucide-react';
import gsap from 'gsap';
import { useAuth } from '../AuthProvider';
import { createCheckoutSession } from '../../lib/api';

import { PRICE_MONTHLY, PRICE_YEARLY } from '../../constants/stripe';

export type FreeTrialTrigger = 'questions' | 'trial_expired';

// All possible steps
type Step = 'intro' | 'choice' | 'plans' | 'confirm';

interface FreeTrialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: FreeTrialTrigger;
}

function getInitialStep(trigger: FreeTrialTrigger): Step {
  if (trigger === 'trial_expired') return 'plans';
  return 'intro';
}

function getPlansSubtitle(trigger: FreeTrialTrigger): string {
  if (trigger === 'trial_expired') return 'Your 3-day trial has ended. Upgrade to keep learning.';
  return 'Full access — choose how you want to pay.';
}

function isCloseable(trigger: FreeTrialTrigger): boolean {
  return trigger !== 'trial_expired';
}


export default function FreeTrialPopup({
  isOpen,
  onClose,
  trigger = 'questions',
}: FreeTrialPopupProps) {
  const navigate  = useNavigate();
  const { user, signOut }  = useAuth();

  const [step, setStep]               = useState<Step>(getInitialStep(trigger));
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef    = useRef<HTMLDivElement>(null);

  const closeable = isCloseable(trigger);

  // Reset when popup opens
  useEffect(() => {
    if (isOpen) {
      setStep(getInitialStep(trigger));
      setSelectedPlan(null);
      setCheckoutError(null);
      setIsLoading(false);
    }
  }, [isOpen, trigger]);

  // Animate on step change
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' },
      );
    }
    if (iconRef.current) {
      gsap.fromTo(
        iconRef.current,
        { scale: 0, rotation: -15 },
        { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.15 },
      );
    }
  }, [step]);

  // ── handlers ──────────────────────────────────────────────

  const handleNo    = () => onClose();
  const handleYes   = () => setStep('choice');    // Step 1 → Step 1.5

  // "Start Free Trial" from choice screen
  const handleChooseTrial = () => {
    if (!user) {
      localStorage.setItem('pending_price_id', PRICE_MONTHLY);
      localStorage.setItem('pending_with_trial', 'true');
      navigate('/auth?mode=signup');
    } else {
      navigate('/student/dashboard');
    }
    onClose();
  };

  // "Go Pro" from choice screen → show plan picker
  const handleChoosePro = () => setStep('plans');

  // Select a plan → confirm screen
  const handlePlanSelect = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setCheckoutError(null);
    setStep('confirm');
  };

  const handleGoBackFromConfirm = () => {
    setCheckoutError(null);
    setStep('plans');
  };

  const handleGoBackFromPlans = () => setStep('choice');

  // Final confirm → Stripe or signup
  const handleConfirm = async () => {
    if (!selectedPlan) return;

    const priceId = selectedPlan === 'yearly' ? PRICE_YEARLY : PRICE_MONTHLY;

    if (!user) {
      // Store the selected plan so AuthPage can continue to Stripe after signup
      localStorage.setItem('pending_price_id', priceId);
      localStorage.setItem('pending_with_trial', 'false');
      navigate('/auth?mode=signup');
      onClose();
      return;
    }

    const returnUrl = `${window.location.origin}/student/dashboard`;

    setIsLoading(true);
    setCheckoutError(null);

    try {
      const { url } = await createCheckoutSession(priceId, returnUrl);
      sessionStorage.setItem('redirecting_to_stripe', '1');
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      navigate('/');
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClose = () => {
    if (closeable) onClose();
  };

  // ── step indicator dots ────────────────────────────────────
  // For trial_expired: only plans + confirm visible
  // For questions: all 4 steps
  const visibleSteps: Step[] = trigger === 'questions'
    ? ['intro', 'choice', 'plans', 'confirm']
    : ['plans', 'confirm'];

  const currentIdx = visibleSteps.indexOf(step);

  // ── render ─────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onClose={handleBackdropClose} className="relative z-[100]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity duration-300 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden transition-all duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 justify-center pt-5 pb-1">
            {visibleSteps.map((s, i) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIdx
                    ? 'w-8 bg-blue-600'
                    : i < currentIdx
                    ? 'w-5 bg-blue-300'
                    : 'w-5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div ref={contentRef}>

            {/* ── INTRO: "You've used all free questions" ── */}
            {step === 'intro' && (
              <div className="px-8 pt-6 pb-8 text-center">
                <div
                  className="absolute top-0 left-0 right-0 h-32 opacity-40 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center top, rgba(59,130,246,0.12), transparent 70%)' }}
                />

                <div ref={iconRef} className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-2xl rotate-6 bg-blue-100/60" />
                  <div className="absolute inset-0 rounded-2xl -rotate-3 bg-blue-50/80" />
                  <div
                    className="relative w-full h-full rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                  >
                    <Rocket size={36} className="text-white" />
                  </div>
                </div>

                <h3 className="text-[22px] font-extrabold text-slate-900 font-heading mb-2 leading-tight">
                  You've used all free questions!
                </h3>
                <p className="text-slate-500 text-[15px] mb-7 leading-relaxed max-w-xs mx-auto">
                  Great start! Unlock{' '}
                  <span className="font-semibold text-slate-700">5,000+ questions</span> and AI
                  tutoring with a free trial.
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 mb-7 border border-slate-100">
                  <p className="text-base font-bold text-slate-800 font-heading flex items-center justify-center gap-2">
                    <Gift size={18} className="text-blue-500" />
                    Would you like a free trial?
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleNo}
                    className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all font-heading"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleYes}
                    className="flex-[1.3] px-5 py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 font-heading flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
                  >
                    <Sparkles size={16} />
                    Yes, Let's Go!
                  </button>
                </div>
              </div>
            )}

            {/* ── CHOICE: Free Trial vs Pro ── */}
            {step === 'choice' && (
              <div className="px-8 pt-6 pb-8">
                <div className="text-center mb-6">
                  <h3 className="text-[20px] font-extrabold text-slate-900 font-heading mb-2 leading-tight">
                    How would you like to start?
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Try free for 3 days, or jump straight into Pro.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {/* Free Trial option */}
                  <button
                    onClick={handleChooseTrial}
                    className="w-full text-left p-5 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-50 transition-all group flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Clock size={24} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 font-heading text-[15px]">
                        3-Day Free Trial
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        Full access . Pay 3 days later.
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Pro option */}
                  <button
                    onClick={handleChoosePro}
                    className="w-full text-left p-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 transition-all group flex items-center gap-4 relative"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Crown size={24} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 font-heading text-[15px]">
                        Go Pro
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        Unlock all premium features · Cancel anytime
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-indigo-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <button
                  onClick={handleNo}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium py-1"
                >
                  Maybe later
                </button>
              </div>
            )}

            {/* ── PLANS: Monthly / Yearly ── */}
            {step === 'plans' && (
              <div className="px-8 pt-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                      Choose Your Plan
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getPlansSubtitle(trigger)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {trigger === 'questions' && (
                      <button
                        onClick={handleGoBackFromPlans}
                        className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    {closeable && (
                      <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Monthly */}
                  <button
                    onClick={() => handlePlanSelect('monthly')}
                    className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all group flex items-center gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                      <Crown size={22} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 font-heading">Monthly</div>
                      <div className="text-sm text-slate-400">Cancel anytime</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-slate-900 font-heading">$29.99</div>
                      <div className="text-[11px] text-slate-400 font-medium">/month</div>
                    </div>
                  </button>

                  {/* Yearly — Recommended */}
                  <button
                    onClick={() => handlePlanSelect('yearly')}
                    className="w-full text-left p-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all group flex items-center gap-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl font-heading">
                      Best Value
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Star size={22} className="text-blue-600 fill-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 font-heading">Yearly</div>
                      <div className="text-sm text-slate-400">Save 16% annually</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-slate-900 font-heading">$299.99</div>
                      <div className="text-[11px] text-indigo-600 font-bold">/year</div>
                    </div>
                  </button>
                </div>

                {user && (
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="mt-6 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    <LogOut size={13} />
                    Log out
                  </button>
                )}
              </div>
            )}

            {/* ── CONFIRM ── */}
            {step === 'confirm' && (
              <div className="px-8 pt-6 pb-8 text-center">
                <div ref={iconRef} className="relative w-20 h-20 mx-auto mb-5">
                  <div
                    className="absolute inset-0 rounded-full bg-emerald-100/50 animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  <div className="relative w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200">
                    <Check size={40} className="text-white" strokeWidth={3} />
                  </div>
                </div>

                <h3 className="text-[22px] font-extrabold text-slate-900 font-heading mb-1.5 leading-tight">
                  {user ? 'Ready to subscribe?' : 'Almost there!'}
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  {user
                    ? "You'll be taken to Stripe to complete payment."
                    : 'Create your account first, then complete checkout.'}
                </p>

                {/* Plan summary card */}
                <div className="rounded-2xl border border-slate-200/80 mb-6 text-left overflow-hidden">
                  {/* Card header with gradient */}
                  <div
                    className="px-5 py-4 flex items-center justify-between"
                    style={{
                      background: selectedPlan === 'yearly'
                        ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #ede9fe 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          background: selectedPlan === 'yearly'
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        }}
                      >
                        {selectedPlan === 'yearly'
                          ? <Star size={18} className="text-white fill-white" />
                          : <Crown size={18} className="text-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 font-heading text-[15px] leading-tight">
                          {selectedPlan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {selectedPlan === 'yearly' ? 'Billed $299.99/yr' : 'Billed monthly'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-slate-900 font-heading leading-none">
                        ${selectedPlan === 'yearly' ? '299.99' : '29.99'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/{selectedPlan === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="px-5 py-4 bg-white">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      What's included
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {['5,000+ questions', 'AI Clinical Tutor', 'Full topic access', 'Advanced Analytics', 'Practice Builder', 'Cancel anytime'].map(
                        (item, i) => (
                          <div key={i} className="flex items-center gap-2 text-[13px] text-slate-700">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <Check size={10} className="text-emerald-600" strokeWidth={3} />
                            </div>
                            <span>{item}</span>
                          </div>
                        )
                      )}
                    </div>
                    {selectedPlan === 'yearly' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <Sparkles size={13} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600">
                          You save $60/yr compared to Monthly
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {checkoutError && (
                  <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-xl px-4 py-2 border border-red-100">
                    {checkoutError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleGoBackFromConfirm}
                    disabled={isLoading}
                    className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all font-heading flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="flex-[1.3] px-5 py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 font-heading flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Redirecting...
                      </>
                    ) : user ? (
                      <>
                        Subscribe Now
                        <ArrowRight size={15} />
                      </>
                    ) : (
                      <>
                        Sign Up & Subscribe
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
