import { useState, useRef, useEffect } from 'react';
import { ChevronDown, BookOpen, GraduationCap, Stethoscope, ClipboardList, Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const syllabusData = [
  {
    step: '1st Professional',
    description: 'Pre-clinical Foundation',
    icon: BookOpen,
    accent: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-500', iconBg: 'bg-blue-100' },
    subjects: [
      'Anatomy',
      'Physiology',
      'Biochemistry',
    ],
  },
  {
    step: '2nd Professional',
    description: 'Para-clinical Core',
    icon: Stethoscope,
    accent: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', dot: 'bg-indigo-500', iconBg: 'bg-indigo-100' },
    subjects: [
      'Pathology',
      'Pharmacology',
      'Community Medicine',
      'Forensic Medicine',
    ],
  },
  {
    step: '3rd & Final Professional',
    description: 'Clinical Focus',
    icon: ClipboardList,
    accent: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', dot: 'bg-violet-500', iconBg: 'bg-violet-100' },
    subjects: [
      'Medicine',
      'Surgery',
      'Obstetrics & Gynaecology',
      'ENT',
      'Integrated clinical revision',
    ],
  },
];

export default function SyllabusSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.syllabus-heading', {
        y: 40, opacity: 0, duration: 0.8,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });

      itemsRef.current.forEach((item, i) => {
        gsap.from(item, {
          y: 30, opacity: 0, duration: 0.6, delay: i * 0.12,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="syllabus-heading text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100 shadow-sm mb-5">
            <GraduationCap size={15} />
            <span>Complete Syllabus</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 font-heading">
            Everything You Need to Know
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Our quiz is mapped to MBBS professional subjects used in Bangladesh.
          </p>
        </div>

        {/* Accordion cards */}
        <div className="max-w-3xl mx-auto space-y-4">
          {syllabusData.map((item, i) => {
            const Icon = item.icon;
            const isOpen = openIndex === i;

            return (
              <div
                key={i}
                ref={el => { if (el) itemsRef.current[i] = el; }}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? `${item.accent.bg} ${item.accent.border} shadow-lg shadow-slate-100`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left transition-colors"
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? item.accent.iconBg : 'bg-slate-100'
                  }`}>
                    <Icon size={20} className={isOpen ? item.accent.text : 'text-slate-400'} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base md:text-lg font-heading">{item.step}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    size={20}
                    className={`shrink-0 ml-2 transition-all duration-300 ${
                      isOpen ? `rotate-180 ${item.accent.text}` : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Expandable content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                    <div className="h-px bg-slate-200/60 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {item.subjects.map((subject, j) => (
                        <div key={j} className="flex items-center gap-2.5 text-sm text-slate-700 py-2 px-3 rounded-lg hover:bg-white/60 transition-colors">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${item.accent.iconBg}`}>
                            <Check size={12} className={item.accent.text} strokeWidth={3} />
                          </div>
                          <span className="font-medium">{subject}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
