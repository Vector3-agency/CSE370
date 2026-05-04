import { 
  LayoutDashboard, 
  Layers, 
  Stethoscope, 
  Bell, 
  LifeBuoy, 
  BarChart2, 
  Trophy, 
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCw,
  Zap
} from 'lucide-react';

export default function DemoAppPreview() {
  return (
    <div className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex text-slate-800 font-body text-xs sm:text-sm select-none">
      {/* Sidebar (Condensed) */}
      <div className="w-[88px] bg-white border-r border-slate-100 flex-shrink-0 flex flex-col hidden md:flex items-center py-2">
        <div className="h-14 flex items-center justify-center w-full border-b border-slate-50 mb-2">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
             <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
               <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           </div>
        </div>
        
        <div className="p-2 space-y-3 w-full flex flex-col items-center">
           <div className="flex items-center justify-center w-10 h-10 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors">
              <LayoutDashboard size={20} />
           </div>
           <div className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm shadow-indigo-100 ring-1 ring-indigo-200">
              <Layers size={20} />
           </div>
           <div className="flex items-center justify-center w-10 h-10 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors">
              <Stethoscope size={20} />
           </div>
           
           <div className="w-8 h-px bg-slate-100 my-1"></div>
           
           <div className="flex items-center justify-center w-10 h-10 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors">
              <BarChart2 size={20} />
           </div>
           <div className="flex items-center justify-center w-10 h-10 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors">
              <Trophy size={20} />
           </div>
           <div className="flex items-center justify-center w-10 h-10 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors">
              <Bell size={20} />
           </div>
        </div>
        
        <div className="mt-auto p-4 w-full flex justify-center">
           <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 ring-1 ring-slate-700 cursor-pointer hover:scale-105 transition-transform">
              <Stethoscope size={18} />
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-50 flex flex-col min-h-0">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
           <div className="flex-1 max-w-md bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <Search size={16} className="text-slate-400" />
              <span className="text-slate-400 text-xs">Search conditions, drugs, or questions...</span>
           </div>
           <div className="flex items-center gap-3 ml-6">
              <div className="text-right hidden sm:block">
                 <div className="font-bold text-slate-800 text-xs">jisan</div>
                 <div className="text-[10px] text-slate-500">bgjisan@gmail.com</div>
              </div>
              <div className="w-9 h-9 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=jisan" alt="avatar" className="w-full h-full object-cover" />
              </div>
           </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6 flex-1 overflow-hidden flex flex-col">
           {/* Breadcrumbs & Title */}
           <div className="flex justify-between items-end mb-4">
              <div>
                 <h2 className="text-2xl font-extrabold text-slate-800 font-heading">USMLE Essential Deck</h2>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Step 1</span>
                    <span className="text-slate-500 text-xs font-medium">• 10 cards</span>
                 </div>
              </div>
           </div>
           
           {/* Progress Bar */}
           <div className="w-32 h-1.5 bg-indigo-100 rounded-full mb-6 overflow-hidden">
              <div className="w-1/3 h-full bg-indigo-600 rounded-full"></div>
           </div>
           
           {/* Flashcard Area */}
           <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 aspect-[16/10] flex flex-col">
                 
                 {/* Card Header */}
                 <div className="p-6 flex justify-between items-start">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                      Cardiology
                    </span>
                    <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-amber-100">
                       <Zap size={12} fill="currentColor" /> Essential
                    </span>
                 </div>
                 
                 {/* Card Content */}
                 <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                    <h3 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-3">Clinical Concept</h3>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 font-heading leading-tight">
                       Mechanism of action of Aspirin in platelets?
                    </h1>
                 </div>
                 
                 {/* Card Footer */}
                 <div className="p-6 flex justify-center">
                    <div className="text-slate-400 text-xs font-medium flex items-center gap-2">
                       <RotateCw size={14} /> Click to flip
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Controls */}
           <div className="flex items-center justify-center gap-4 mt-8 pb-4">
              <button className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                 <ChevronLeft size={24} />
              </button>
              
              <button className="h-12 px-8 bg-indigo-600 text-white rounded-full font-bold flex items-center gap-2 shadow-lg shadow-indigo-200">
                 <Play size={20} fill="currentColor" /> Study Mode
              </button>
              
              <button className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                 <ChevronRight size={24} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
