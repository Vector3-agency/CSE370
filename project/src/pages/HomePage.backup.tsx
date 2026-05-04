import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { ArrowRight, CheckCircle, Zap, Shield, Globe } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center bg-slate-900 rounded-xl">
               <svg viewBox="0 -8.14 62.451 62.451" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" className="w-6 h-6">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier"> 
                     <g id="Group_35" transform="translate(-782.964 -1356.609)"> 
                        <path id="Path_92" d="M798.022,1369.359v23.226h.034c.353,4.555,7.685,8.2,16.7,8.2s16.347-3.641,16.7-8.2h.033v-23.226Z" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path> 
                        <path id="Path_93" d="M843.415,1373.207l-29.225,14.6-29.227-14.6,29.227-14.6Z" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path> 
                        <line id="Line_40" y1="19.235" transform="translate(784.964 1374.361)" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></line> 
                     </g> 
                  </g>
               </svg>
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">MedKotha</span>
          </div>
          
          <div className="flex items-center gap-6">
            {user ? (
               <button 
                  onClick={() => navigate('/student/dashboard')}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors font-heading"
                >
                  Go to Dashboard
               </button>
            ) : (
                <button 
                  onClick={() => navigate('/auth')}
                  className="px-5 py-2.5 text-slate-900 font-bold text-sm hover:text-indigo-600 transition-colors font-heading"
                >
                  Sign In
                </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100">
              <Zap size={12} className="fill-indigo-700" />
              <span>New: USMLE Step 2 CK Quiz</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] font-heading">
              Master Medicine. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Crush Your Boards.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-lg">
              The smartest way to prepare for medical board exams. AI-powered personalised learning, high-yield clinical scenarios, and analytics that actually predict your score.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={() => navigate(user ? '/student/dashboard' : '/auth')}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 flex items-center justify-center gap-2 font-heading"
              >
                Start Studying Now
                <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-8 pt-8 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Mock Logos */}
               <span className="text-xl font-black text-slate-300">Harvard</span>
               <span className="text-xl font-black text-slate-300">Stanford</span>
               <span className="text-xl font-black text-slate-300">Johns Hopkins</span>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] flex items-center justify-center">
             <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full"></div>
             {/* Abstract Dashboard Mockup */}
             <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 transform rotate-2 hover:rotate-0 transition-transform duration-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -z-10 opacity-50"></div>
                <div className="w-full h-full bg-slate-50 rounded-2xl overflow-hidden relative">
                   {/* Fake header */}
                   <div className="h-12 bg-white border-b border-slate-100 flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                   </div>
                   {/* Fake content */}
                   <div className="p-6 space-y-4">
                      <div className="flex gap-4">
                         <div className="w-1/3 h-24 bg-indigo-100 rounded-xl"></div>
                         <div className="w-1/3 h-24 bg-white border border-slate-100 rounded-xl"></div>
                         <div className="w-1/3 h-24 bg-white border border-slate-100 rounded-xl"></div>
                      </div>
                      <div className="flex gap-4">
                         <div className="w-2/3 h-48 bg-white border border-slate-100 rounded-xl p-4">
                            <div className="w-full h-full bg-slate-100 rounded-lg opacity-50"></div>
                         </div>
                         <div className="w-1/3 h-48 bg-white border border-slate-100 rounded-xl"></div>
                      </div>
                   </div>
                   
                   {/* Overlay Badge */}
                   <div className="absolute bottom-6 right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                         <CheckCircle size={20} />
                      </div>
                      <div>
                         <div className="text-xs text-slate-400 font-bold uppercase">Accuracy</div>
                         <div className="text-lg font-extrabold text-slate-800">94%</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-100">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 font-heading">
                  Everything you need to pass.
               </h2>
               <p className="text-lg text-slate-500">
                  Comprehensive tools designed by top scorers to help you learn faster and retain more.
               </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               {[
                  {
                     icon: Zap,
                     title: "High-Yield Focus",
                     desc: "We analyze thousands of exam questions to surface only the most tested concepts, saving you hundreds of hours."
                  },
                  {
                     icon: Shield,
                     title: "Adaptive Learning",
                     desc: "Our algorithm tracks your weak areas and automatically adjusts your study plan to close knowledge gaps."
                  },
                  {
                     icon: Globe,
                     title: "Community Benchmarks",
                     desc: "Compare your performance against peers globally to gauge your readiness for the real exam."
                  }
               ].map((feature, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all hover:-translate-y-1 group">
                     <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <feature.icon size={28} className="text-indigo-600" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-3 font-heading">{feature.title}</h3>
                     <p className="text-slate-500 leading-relaxed font-medium">
                        {feature.desc}
                     </p>
                  </div>
               ))}
            </div>
         </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale">
               <div className="w-8 h-8 relative flex items-center justify-center bg-slate-400 rounded-lg">
                  <svg viewBox="0 -8.14 62.451 62.451" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" className="w-5 h-5">
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                     <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                     <g id="SVGRepo_iconCarrier"> 
                        <g id="Group_35" transform="translate(-782.964 -1356.609)"> 
                           <path id="Path_92" d="M798.022,1369.359v23.226h.034c.353,4.555,7.685,8.2,16.7,8.2s16.347-3.641,16.7-8.2h.033v-23.226Z" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path> 
                           <path id="Path_93" d="M843.415,1373.207l-29.225,14.6-29.227-14.6,29.227-14.6Z" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path> 
                           <line id="Line_40" y1="19.235" transform="translate(784.964 1374.361)" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></line> 
                        </g> 
                     </g>
                  </svg>
               </div>
               <span className="text-xl font-extrabold text-slate-400 tracking-tight font-heading">MedKotha</span>
            </div>
            <p className="text-slate-400 text-sm">© 2026 MedKotha. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
};

export default HomePage;
