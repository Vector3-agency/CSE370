import { ArrowRight, Zap, Target } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get user name or default to 'Student'
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || 'Doctor';
  
  // Get current date
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const currentDate = new Date().toLocaleDateString('en-US', dateOptions);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8 group">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-600/40 transition-all duration-700"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 group-hover:bg-rose-600/30 transition-all duration-700"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-soft-light"></div>
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }}></div>

      <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        
        {/* Left Content */}
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Zap size={12} className="fill-indigo-300" />
            <span>Study Streak: 14 Days</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1] font-heading">
              Ready to crush your goals, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">{displayName}?</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-md">
              {currentDate}. Your daily target is <span className="text-white font-bold">40 questions</span>. Let's make every second count.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => navigate('/student/qbank')}
              className="group/btn relative px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-shimmer"></div>
              <span className="relative flex items-center gap-3">
                Start Practice Session
                <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
              </span>
            </button>
            
            <button 
              onClick={() => navigate('/student/flashcards')}
              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-2xl font-bold transition-all backdrop-blur-md flex items-center gap-3 hover:-translate-y-1"
            >
              <Target size={18} />
              Review Flashcards
            </button>
          </div>
        </div>

        {/* Right Content / Visual */}
        <div className="hidden lg:block relative">
          <div className="relative w-64 h-64">
            {/* Circular Progress Mockup */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
               <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray="283" strokeDashoffset="100" strokeLinecap="round" className="animate-[dash_1.5s_ease-out_forwards]" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
               <span className="text-4xl font-extrabold text-white font-heading">65%</span>
               <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Essential</span>
            </div>
            
            {/* Floating Badges */}
            <div className="absolute -top-4 -right-4 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 p-3 rounded-2xl animate-float">
               <Zap size={24} className="text-rose-400 fill-rose-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
