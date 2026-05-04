import { useRef, useEffect } from 'react';
import { Star } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function TrustSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.trust-content', {
        y: 30, opacity: 0, duration: 0.8,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' }
      });

      if (starsRef.current) {
        const stars = starsRef.current.querySelectorAll('.trust-star');
        gsap.from(stars, {
          scale: 0, opacity: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(2)',
          scrollTrigger: { trigger: starsRef.current, start: 'top 85%' }
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="trust-content flex flex-col items-center gap-6">
          {/* Section heading */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-heading text-center">
            Trusted by MBBS Students Across Bangladesh
          </h2>

          {/* Trustpilot widget — matching reference */}
          <div className="bg-white rounded-2xl px-8 py-6 border border-slate-200 shadow-sm flex flex-col items-center gap-3">
            {/* Rated line */}
            <p className="text-base font-bold text-slate-800 font-heading">
              Rated <span className="text-slate-900">4.6 / 5</span>
            </p>

            {/* Green star boxes */}
            <div ref={starsRef} className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="trust-star w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: '#00b67a' }}>
                  <Star size={20} className="text-white fill-white" />
                </div>
              ))}
            </div>

            {/* Based on reviews */}
            <p className="text-sm text-slate-500">
              Based on <span className="font-semibold text-slate-600">147 reviews</span>
            </p>

            {/* Trustpilot logo */}
            <div className="flex items-center gap-1.5 mt-1">
              <Star size={18} style={{ color: '#00b67a', fill: '#00b67a' }} />
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">Trustpilot</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
