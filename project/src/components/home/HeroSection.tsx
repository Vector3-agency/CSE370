import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import gsap from 'gsap';

export default function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const orbOneRef = useRef<HTMLDivElement>(null);
  const orbTwoRef = useRef<HTMLDivElement>(null);
  const orbThreeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // Staggered entrance
      tl.from(badgeRef.current, { y: 30, opacity: 0, duration: 0.7, delay: 0.2 })
        .from(headlineRef.current, { y: 50, opacity: 0, duration: 1 }, '-=0.4')
        .from(subRef.current, { y: 35, opacity: 0, duration: 0.8 }, '-=0.5')
        .from(ctaRef.current, { y: 25, opacity: 0, duration: 0.7 }, '-=0.4')
        .from(statsRef.current, { y: 20, opacity: 0, duration: 0.6 }, '-=0.3');



      // Infinite floating animation on orbs
      gsap.to(orbOneRef.current, {
        x: 25, y: -30, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
      gsap.to(orbTwoRef.current, {
        x: -20, y: 25, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
      gsap.to(orbThreeRef.current, {
        x: 15, y: -15, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);



  return (
<section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 30%, #e8eeff 50%, #f5f7ff 80%, #ffffff 100%)' }}
    >
      {/* Decorative orbs */}
      <div ref={orbOneRef} className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
      <div ref={orbTwoRef} className="absolute bottom-[5%] left-[5%] w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)' }} />
      <div ref={orbThreeRef} className="absolute top-[40%] left-[30%] w-[250px] h-[250px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.35] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />

      {/* Top bar: logo + sign in */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 lg:px-16 py-5">
<div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="MedKotha Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">MedKotha</span>
        </div>
        <button
          onClick={() => navigate(user ? '/student/flashcards' : '/auth?mode=signin')}
          className="px-5 py-2.5 bg-white text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all border border-slate-200 shadow-sm hover:shadow-md font-heading"
        >
          {user ? 'Dashboard' : 'Sign In'}
        </button>
      </div>

      {/* Hero content — two column layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-32 pb-20 w-full">
        <div className="flex flex-col items-center text-center">
          <div className="space-y-7 max-w-2xl">
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100 shadow-sm">
              <Sparkles size={14} className="text-blue-500" />
              <span>Built for Bangladesh MBBS Students</span>
            </div>

            <h1 ref={headlineRef} className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] font-heading">
              The Smartest Way to{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                  Ace Medical Exams
                </span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 7" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" />
                  <defs><linearGradient id="underline-grad" x1="0" y1="0" x2="300" y2="0"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                </svg>
              </span>
            </h1>

            <p ref={subRef} className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
              Practice BMDC-style questions for 1st Prof, 2nd Prof, 3rd Prof, and Final Prof with structured prep designed for Bangladesh medical colleges.
            </p>

            <div ref={ctaRef} className=" flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (user) {
                    navigate('/student/flashcards');
                  } else {
                    navigate('/auth?mode=signup');
                  }
                }}
                className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {user ? 'Go to Dashboard' : 'Sign Up Today'}
              </button>
            </div>



            <div ref={statsRef} className="flex flex-wrap items-center justify-center gap-6 pt-4">
              {[
                { value: '6,000+', label: 'BMDC-style Questions' },
                { value: '4', label: 'Professional Exams' },
                { value: '12+', label: 'Core Subjects' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-slate-900 font-heading">{stat.value}</div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</div>
                  </div>
                  {i < 2 && <div className="w-px h-10 bg-slate-200 ml-3" />}
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}
