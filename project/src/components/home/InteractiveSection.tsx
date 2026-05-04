import { useState, useRef, useEffect } from 'react';
import { Check, XCircle, ChevronRight, Stethoscope } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface InteractiveSectionProps {
  onFreeQuestionsUsed: () => void;
}

const demoQuestions = [
  {
    question:
      'Mr Rahim, a 45-year-old office worker, suddenly feels tightness in his chest. After checking his pulse, the doctor says, "Your heart rate is very high." What should a normal resting heart rate be?',
    options: [
      { id: 'A', text: '30–50 beats/min' },
      { id: 'B', text: '60–100 beats/min' },
      { id: 'C', text: '120–150 beats/min' },
      { id: 'D', text: '150–200 beats/min' },
    ],
    correctId: 'B',
    explanation:
      'A normal resting heart rate is about 60–100 beats per minute. A rate above that suggests tachycardia, which can occur with stress, fever, or cardiac disease.',
  },
  {
    question:
      'Karim, a football player, falls on the pitch and has severe pain in his thigh. X-ray shows the largest bone in the body is fractured. What is the name of this bone?',
    options: [
      { id: 'A', text: 'Humerus' },
      { id: 'B', text: 'Tibia' },
      { id: 'C', text: 'Femur' },
      { id: 'D', text: 'Radius' },
    ],
    correctId: 'C',
    explanation:
      'The femur (thigh bone) is the longest and strongest bone in the human body. Breaking it in football usually requires a large amount of force.',
  },
  {
    question:
      'Sumaiya, a 20-year-old medical student, goes to donate blood and learns her haemoglobin is low. The doctor says the blood component that carries oxygen is reduced. Which component is it?',
    options: [
      { id: 'A', text: 'White blood cell' },
      { id: 'B', text: 'Platelet' },
      { id: 'C', text: 'Red blood cell / Haemoglobin' },
      { id: 'D', text: 'Plasma' },
    ],
    correctId: 'C',
    explanation:
      'Iron in haemoglobin (Fe²⁺) binds oxygen. When haemoglobin is low, anaemia develops — often with fatigue and dizziness.',
  },
];

export default function InteractiveSection({ onFreeQuestionsUsed }: InteractiveSectionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.interactive-heading', {
        y: 40, opacity: 0, duration: 0.8,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
      gsap.from(cardRef.current, {
        y: 60, opacity: 0, duration: 0.9, delay: 0.2,
        scrollTrigger: { trigger: cardRef.current, start: 'top 85%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const currentQ = demoQuestions[currentIdx];

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    const newCount = answeredCount + 1;
    setAnsweredCount(newCount);
  };

  const handleNext = () => {
    if (answeredCount >= 3) {
      setAllDone(true);
      onFreeQuestionsUsed();
      return;
    }
    // Animate card out and in
    gsap.to(cardRef.current, {
      x: -30, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        setCurrentIdx((prev) => (prev + 1) % demoQuestions.length);
        setSelectedOption(null);
        setIsSubmitted(false);
        gsap.fromTo(cardRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
    });
  };

  return (
    <section ref={sectionRef} id="interactive-section" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section heading */}
        <div className="interactive-heading text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100 mb-4">
            <Stethoscope size={14} />
            <span>Try It Free</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 font-heading">
            Practice in BMDC Exam Style
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Answer 3 free questions and see the same exam-style items our students use every day.
          </p>
        </div>

        {allDone ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Check size={40} className="text-indigo-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 font-heading mb-2">Great job!</h3>
            <p className="text-slate-500">You've completed all 3 free questions. Sign up to unlock the full MBBS quiz.</p>
          </div>
        ) : (
          <div
            ref={cardRef}
            className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${((answeredCount) / 3) * 100}%` }}
              />
            </div>

            {/* Question counter */}
            <div className="px-6 md:px-8 pt-6 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">
                Question {answeredCount + 1} of 3
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Free Preview
              </span>
            </div>

            {/* Question */}
            <div className="px-6 md:px-8 pt-4 pb-4">
              <p className="font-bold text-slate-900 text-lg md:text-xl leading-snug">{currentQ.question}</p>
            </div>

            {/* Options */}
            <div className="px-6 md:px-8 pb-4 space-y-3">
              {currentQ.options.map((opt) => {
                let statusClass = 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer';
                if (isSubmitted) {
                  if (opt.id === currentQ.correctId) statusClass = 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500';
                  else if (selectedOption === opt.id && opt.id !== currentQ.correctId) statusClass = 'bg-rose-50 border-rose-500 ring-1 ring-rose-500';
                  else statusClass = 'bg-slate-50 border-slate-200 opacity-50';
                } else if (selectedOption === opt.id) {
                  statusClass = 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500';
                }
                return (
                  <button
                    key={opt.id}
                    onClick={() => !isSubmitted && setSelectedOption(opt.id)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${statusClass}`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 font-heading shrink-0 ${
                      isSubmitted && opt.id === currentQ.correctId ? 'bg-emerald-500 border-emerald-500 text-white' :
                      isSubmitted && selectedOption === opt.id && opt.id !== currentQ.correctId ? 'bg-rose-500 border-rose-500 text-white' :
                      selectedOption === opt.id ? 'bg-indigo-500 border-indigo-500 text-white' :
                      'bg-slate-100 border-slate-300 text-slate-500'
                    }`}>
                      {opt.id}
                    </span>
                    <span
                      className={`text-base font-medium ${isSubmitted && opt.id === currentQ.correctId ? 'text-emerald-900' : 'text-slate-700'}`}
                    >
                      {opt.text}
                    </span>
                    {isSubmitted && opt.id === currentQ.correctId && <Check size={18} className="ml-auto text-emerald-600" />}
                    {isSubmitted && selectedOption === opt.id && opt.id !== currentQ.correctId && <XCircle size={18} className="ml-auto text-rose-500" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {isSubmitted && (
              <div className="px-6 md:px-8 pb-4 animate-fadeIn">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2 text-base">Explanation</h4>
                  <p className="text-slate-600 text-base leading-relaxed">{currentQ.explanation}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 md:px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedOption}
                  className={`px-6 py-3 rounded-xl font-bold text-white transition-all font-heading ${
                    selectedOption
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 font-heading transition-all"
                >
                  {answeredCount >= 3 ? 'See Results' : 'Next Question'}
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
