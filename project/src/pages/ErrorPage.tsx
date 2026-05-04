import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Stethoscope, FileQuestion } from 'lucide-react';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 font-body">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center rotate-3 transform transition-transform hover:rotate-6 duration-300">
            <Stethoscope size={48} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center -rotate-6 shadow-sm border-2 border-white dark:border-slate-800">
             <FileQuestion size={24} className="text-rose-500 dark:text-rose-400" />
          </div>
        </div>
        
        <h1 className="text-6xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2 font-heading tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 font-heading">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
          The page you're looking for seems to have gone on rounds. It might have been moved, deleted, or possibly never existed.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
