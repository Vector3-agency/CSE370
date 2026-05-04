import { useState } from 'react';
import { RotateCw, Zap, Eye } from 'lucide-react';

export default function DemoFlashcard() {
  const [isFlipped, setIsFlipped] = useState(false);

  // Hardcoded demo data
  const demoCard = {
    tag: 'Physiology',
    difficulty: 'Essential',
    question: 'A 45-year-old male with a history of hypertension presents with severe tearing chest pain radiating to the back. What is the most likely diagnosis?',
    answer: 'Aortic Dissection.\n\nKey features: "Tearing" chest pain, radiation to the back, history of hypertension. Immediate diagnostic step: CT Angiography.'
  };

  return (
    <div 
      className="relative w-full aspect-[4/3] max-w-lg mx-auto flashcard-container cursor-pointer group select-none"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''} shadow-2xl rounded-3xl`}>
        {/* Front Side */}
        <div className="flashcard-front bg-white p-6 md:p-10 flex flex-col items-center justify-center border border-slate-100 text-center relative overflow-hidden rounded-3xl">
           <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100/50 to-transparent rounded-bl-full -mr-12 -mt-12"></div>
           
           <div className="absolute top-6 left-6 flex flex-wrap gap-2">
               <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-indigo-100 shadow-sm font-heading">
                 {demoCard.tag}
               </span>
           </div>
           
           <div className="absolute top-6 right-6">
              <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border shadow-sm font-heading text-amber-600 bg-amber-50 border-amber-200">
                  <Zap size={12} fill="currentColor" />
                  {demoCard.difficulty}
              </div>
           </div>

           <div className="w-full max-w-sm px-2 mt-4 scale-90 sm:scale-100 transition-transform">
             <h3 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4 opacity-70 font-heading">Clinical Concept</h3>
             <p className="text-xl md:text-2xl font-bold text-slate-800 leading-tight tracking-tight font-heading">
                {demoCard.question}
             </p>
           </div>
           
           <div className="absolute bottom-6 text-slate-400 text-xs font-medium flex items-center gap-2 opacity-60">
              <RotateCw size={14} /> Click to flip
           </div>
        </div>

        {/* Back Side */}
        <div className="flashcard-back bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10 flex flex-col items-center justify-center border border-slate-700/50 text-center relative overflow-hidden rounded-3xl">
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
           <div className="absolute top-6 right-6">
             <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
               <Eye size={16} className="text-indigo-300" />
             </div>
           </div>
           
           <div className="w-full max-w-sm px-2 relative z-10 scale-90 sm:scale-100 transition-transform">
             <h3 className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center justify-center gap-2 font-heading">
               <span className="w-8 h-px bg-indigo-500/50"></span>
               Explanation
               <span className="w-8 h-px bg-indigo-500/50"></span>
             </h3>
             <p className="text-base md:text-lg font-medium text-white leading-relaxed whitespace-pre-line">
                {demoCard.answer}
             </p>
           </div>
           
           <div className="absolute bottom-6 left-0 right-0 flex justify-center">
             <span className="text-xs text-slate-500 font-medium">Click to flip back</span>
           </div>
        </div>
      </div>
    </div>
  );
}
