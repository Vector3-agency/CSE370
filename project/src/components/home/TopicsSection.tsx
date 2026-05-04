import { useRef, useEffect } from 'react';
import { FlaskConical, Microscope, Pill, Bone, Bug, Activity, Shield, Ear, HeartPulse, Syringe, Scale } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const topics = [
  { name: 'Anatomy', icon: Bone, count: 350, color: 'bg-sky-100 text-sky-600', border: 'border-sky-100' },
  { name: 'Physiology', icon: Activity, count: 400, color: 'bg-teal-100 text-teal-600', border: 'border-teal-100' },
  { name: 'Biochemistry', icon: FlaskConical, count: 290, color: 'bg-amber-100 text-amber-600', border: 'border-amber-100' },
  { name: 'Pathology', icon: Microscope, count: 510, color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
  { name: 'Pharmacology', icon: Pill, count: 460, color: 'bg-violet-100 text-violet-600', border: 'border-violet-100' },
  { name: 'Microbiology', icon: Bug, count: 310, color: 'bg-orange-100 text-orange-600', border: 'border-orange-100' },
  { name: 'Medicine', icon: HeartPulse, count: 620, color: 'bg-rose-100 text-rose-600', border: 'border-rose-100' },
  { name: 'Surgery', icon: Syringe, count: 510, color: 'bg-cyan-100 text-cyan-600', border: 'border-cyan-100' },
  { name: 'Obstetrics & Gynaecology', icon: Shield, count: 420, color: 'bg-fuchsia-100 text-fuchsia-600', border: 'border-fuchsia-100' },
  { name: 'Community Medicine', icon: Scale, count: 320, color: 'bg-blue-100 text-blue-600', border: 'border-blue-100' },
  { name: 'Forensic Medicine', icon: Microscope, count: 210, color: 'bg-pink-100 text-pink-600', border: 'border-pink-100' },
  { name: 'ENT', icon: Ear, count: 190, color: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-100' },
];

export default function TopicsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.topics-heading', {
        y: 40, opacity: 0, duration: 0.8,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });

      cardsRef.current.forEach((card, i) => {
        gsap.from(card, {
          y: 40, opacity: 0, scale: 0.95, duration: 0.5, delay: i * 0.08,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="topics-heading text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 font-heading">
            Comprehensive Topic Coverage
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Cover all core BMDC MBBS syllabus subjects from pre-clinical to clinical professional exams.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {topics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <div
                key={topic.name}
                ref={el => { if (el) cardsRef.current[i] = el; }}
                className={`bg-white p-5 lg:p-6 rounded-2xl border ${topic.border} hover:shadow-xl hover:shadow-slate-100 transition-all hover:-translate-y-1 cursor-pointer group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${topic.color} mb-4 transition-transform group-hover:scale-110`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-slate-800 font-heading mb-1">{topic.name}</h3>
                <p className="text-xs text-slate-400 font-medium font-mono tabular-nums">{topic.count}+ Questions</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
