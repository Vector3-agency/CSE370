import {
  CheckCircle,
  Target,
  Clock,
  Trophy,
} from 'lucide-react';
import { WeeklyBarChart, TopicDonutChart, ScoreTrendAreaChart } from '../components/charts';

const AnalyticsPage = () => {
  return (
    <div className="animate-fadeIn space-y-6">
      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: '2,847', icon: CheckCircle, change: '+124 this week', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg. Accuracy', value: '73.2%', icon: Target, change: '+2.1% vs last month', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Study Hours', value: '186h', icon: Clock, change: '12h this week', color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Best Subject', value: 'Cardiology', icon: Trophy, change: '89% accuracy', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
           <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
             <div className="flex items-center gap-3 mb-3">
               <div className={`w-9 h-9 rounded-xl ${stat.bg} dark:bg-opacity-20 flex items-center justify-center`}>
                 <stat.icon size={18} className={stat.color} />
               </div>
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-heading">{stat.label}</span>
             </div>
             <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading mb-1">{stat.value}</p>
             <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{stat.change}</p>
           </div>
         ))}
      </div>

      {/* Row 2: This Week + Score Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight font-heading">This Week</h3>
             <div className="flex items-center gap-2">
               <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading font-mono tabular-nums">147</span>
               <span className="text-xs text-slate-500 dark:text-slate-400">questions</span>
             </div>
           </div>
           <WeeklyBarChart />
         </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight font-heading">Score Trend</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400">Predicted exam readiness</p>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-heading font-mono tabular-nums">81%</span>
               <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">+6%</span>
             </div>
           </div>
           <ScoreTrendAreaChart />
         </div>
       </div>

      {/* Row 3: Weakest Systems + Topic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 tracking-tight font-heading">Weakest Systems</h3>
          <div className="space-y-5">
            {[
              { name: 'Renal', pct: 42, color: 'bg-rose-300', trend: '-3%', trendDown: true },
              { name: 'Pulmonology', pct: 55, color: 'bg-amber-300', trend: '+2%', trendDown: false },
              { name: 'Neurology', pct: 62, color: 'bg-indigo-300', trend: '+5%', trendDown: false },
              { name: 'Immunology', pct: 48, color: 'bg-violet-300', trend: '-1%', trendDown: true },
            ].map((sys, i) => (
              <div key={i}>
                 <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide font-heading items-center">
                   <span>{sys.name}</span>
                   <div className="flex items-center gap-2">
                     <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${sys.trendDown ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                       {sys.trend}
                     </span>
                     <span className="font-mono tabular-nums">{sys.pct}%</span>
                   </div>
                 </div>
                 <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                   <div className={`h-full ${sys.color} rounded-full shadow-sm transition-all duration-500`} style={{ width: `${sys.pct}%` }}></div>
                 </div>
               </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 tracking-tight font-heading">Topic Breakdown</h3>
           <TopicDonutChart />
         </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
