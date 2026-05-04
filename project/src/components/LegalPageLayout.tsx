import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import FooterSection from './home/FooterSection';

export default function LegalPageLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Top bar — matches Hero section */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 py-5">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="MedKotha Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">MedKotha</span>
          </button>
          <button
            onClick={() => navigate(user ? '/student/dashboard' : '/auth?mode=signin')}
            className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md font-heading"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {children}
      </main>

      {/* Same footer as the home page */}
      <FooterSection />
    </div>
  );
}
