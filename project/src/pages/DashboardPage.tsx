import {
  CheckCircle,
  Activity,
  BookOpen,
  Target,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { 
  PerformanceLineChart, 
  SubjectRadarChart, 
  StatCard,
  WeeklyBarChart,
  ScoreTrendAreaChart,
  TopicDonutChart
} from '../components/charts';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../components/SubscriptionProvider';
import { 
  fetchDashboardStats, 
  fetchWeeklyActivity, 
  fetchSubjectPerformance,
  fetchActivityHistory,
  DashboardStats,
  WeeklyActivityRow,
  SubjectPerformanceRow,
  ActivityHistoryRow
} from '../lib/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscription, loading: subLoading, refreshSubscription } = useSubscription();
  const hasCheckedPending = useRef(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'trial' | 'instant'>('trial');
  const [timeFilter, setTimeFilter] = useState('Week');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityRow[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryRow[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [statsData, weeklyData, subjectData] = await Promise.all([
          fetchDashboardStats(user.id),
          fetchWeeklyActivity(user.id),
          fetchSubjectPerformance(user.id)
        ]);

        setStats(statsData);
        setWeeklyActivity(weeklyData);
        setSubjectPerformance(subjectData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // When returning from Stripe checkout (?session_id=xxx):
  // - clear pending_price_id (checkout completed successfully)
  // - show welcome modal and poll for subscription update
  // If no session_id but pending_price_id exists and no active subscription:
  // - user pressed Back from Stripe without completing — re-redirect them
  useEffect(() => {
    if (subLoading) return; // wait for subscription status to load
    if (hasCheckedPending.current) return;
    hasCheckedPending.current = true;

    const sessionId = searchParams.get('session_id');
    const pendingPriceId = localStorage.getItem('pending_price_id');

    if (sessionId) {
      // Successful checkout — signal ProtectedRoute to show "Processing payment" screen
      // while the webhook confirms. This flag is ONLY set here (real Stripe redirect),
      // never from a URL the user can manually construct.
      sessionStorage.setItem('justCompletedCheckout', '1');

      // Clear pending keys and show welcome modal
      const pendingWithTrial = localStorage.getItem('pending_with_trial');
      const isTrial = pendingWithTrial === null || pendingWithTrial === 'true';
      setPurchaseType(isTrial ? 'trial' : 'instant');

      localStorage.removeItem('pending_price_id');
      localStorage.removeItem('pending_with_trial');
      setShowWelcomeModal(true);

      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });

      let attempts = 0;
      const maxAttempts = 10;
      let stopped = false;
      const poll = async () => {
        if (stopped) return;
        attempts++;
        await refreshSubscription();
        if (attempts >= maxAttempts) stopped = true;
      };
      poll();
      const pollInterval = setInterval(poll, 2000);
      return () => { stopped = true; clearInterval(pollInterval); };
    }

    if (pendingPriceId) {
      // User came back without completing checkout — just clear the pending state.
      // The SubscriptionRoute will show the pricing modal if they don't have access.
      localStorage.removeItem('pending_price_id');
      localStorage.removeItem('pending_with_trial');
    }
  }, [subLoading, subscription, searchParams, setSearchParams, refreshSubscription]);

  useEffect(() => {
    async function loadHistory() {
      if (timeFilter === 'Week') {
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const historyData = await fetchActivityHistory(user.id, timeFilter);
        setActivityHistory(historyData);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setHistoryLoading(false);
      }
    }
    
    loadHistory();
  }, [timeFilter]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Welcome Modal ── */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center overflow-hidden">
            {/* gradient top */}
            <div className="absolute top-0 left-0 right-0 h-28 opacity-30 pointer-events-none"
              style={{ background: purchaseType === 'trial'
                ? 'radial-gradient(ellipse at center top, rgba(16,185,129,0.5), transparent 70%)'
                : 'radial-gradient(ellipse at center top, rgba(99,102,241,0.5), transparent 70%)'
              }} />

            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full animate-ping" 
                style={{ 
                  animationDuration: '2.5s',
                  background: purchaseType === 'trial' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)'
                }} />
              <div className="relative w-full h-full rounded-full flex items-center justify-center"
                style={{ background: purchaseType === 'trial'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                }}>
                {purchaseType === 'trial'
                  ? <Sparkles size={36} className="text-white" />
                  : <Zap size={36} className="text-white" />
                }
              </div>
            </div>

            {purchaseType === 'trial' ? (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading mb-2">Welcome! 🎉</h2>
                <p className="text-slate-500 text-sm mb-1">Your <span className="font-bold text-emerald-600">3-day free trial</span> is now active.</p>
                <p className="text-slate-400 text-xs mb-7">You won't be charged until your trial ends. Cancel anytime.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading mb-2">You're a Pro! ⚡</h2>
                <p className="text-slate-500 text-sm mb-1">Your <span className="font-bold text-indigo-600">Pro subscription</span> is now active.</p>
                <p className="text-slate-400 text-xs mb-7">Full access to all features. Let's crush those exams!</p>
              </>
            )}

            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm font-heading flex items-center justify-center gap-2 shadow-lg"
              style={{ background: purchaseType === 'trial'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              }}
            >
              <BookOpen size={16} />
              Start Studying
            </button>

            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      {/* Greeting — soft gradient from sidebar tint toward white */}
      <div className="rounded-2xl border border-indigo-100/90 dark:border-slate-700 bg-gradient-to-br from-[#f4f4ff] via-indigo-50/85 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 shadow-sm text-slate-800 dark:text-slate-100">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{getGreeting()}! 👋</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-4">Ready to continue your learning journey?</p>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/student/flashcards')}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg font-semibold border border-indigo-100 dark:border-slate-600 shadow-sm hover:bg-indigo-50/80 dark:hover:bg-slate-700 transition-colors"
          >
            <BookOpen size={18} />
            Flashcards
          </button>
          <button 
            onClick={() => navigate('/student/qbank')}
            className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-semibold border border-slate-200/90 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Target size={18} />
            Quiz
          </button>
        </div>
      </div>
      
      {/* Stat Cards with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard 
           icon={CheckCircle} 
           label="Questions Solved" 
           value={loading ? "..." : stats?.total_questions.toLocaleString() || "0"} 
           trend="Total answered" 
           trendUp={true}
           sparkData={[800, 850, 920, 980, 1050, 1150, stats?.total_questions || 1240]} 
           sparkColor="#10b981" 
         />
         <StatCard 
           icon={Target} 
           label="Overall Accuracy" 
           value={loading ? "..." : `${stats?.accuracy || 0}%`} 
           trend="Current average" 
           trendUp={(stats?.accuracy || 0) > 70}
           sparkData={[65, 67, 68, 70, 71, 71, stats?.accuracy || 72]} 
           sparkColor="#8b5cf6" 
         />
         <StatCard 
           icon={Activity} 
           label="Study Streak" 
           value={loading ? "..." : `${stats?.streak || 0} Days`} 
           trend="Keep it up!" 
           trendUp={(stats?.streak || 0) > 0}
           sparkData={[0, 0, 0, 0, 0, 0, stats?.streak || 0]} 
           sparkColor="#f59e0b" 
         />
       </div>
       
 {/* Performance Line Chart + Radar */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight font-heading">Performance Over Time</h3>
              <div className="hidden sm:flex items-center gap-2">
                {['Week', 'Month', 'Year', 'All Time'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-heading ${
                      timeFilter === filter
                        ? 'font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                        : 'font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                   {filter}
                 </button>
               ))}
             </div>
             <div className="sm:hidden">
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="Week">Week</option>
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                  <option value="All Time">All Time</option>
                </select>
             </div>
           </div>
           <PerformanceLineChart 
             timeFilter={timeFilter} 
             loading={loading || (timeFilter !== 'Week' && historyLoading)}
             data={
               timeFilter === 'Week' 
                 ? (weeklyActivity.length > 0 ? weeklyActivity.map(w => ({
                     day: w.activity_date,
                     questions: w.question_count,
                     accuracy: w.question_count > 0 ? Math.round(((w.correct_count || 0) / w.question_count) * 100) : 0
                   })) : undefined)
                 : activityHistory.map(h => ({
                     [timeFilter === 'Month' ? 'week' : timeFilter === 'Year' ? 'month' : 'year']: h.period_label,
                     questions: h.question_count,
                     accuracy: h.accuracy
                   }))
             }
           />
         </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 tracking-tight font-heading">Subject Proficiency</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Accuracy by organ system</p>
            <SubjectRadarChart data={subjectPerformance} />
         </div>
      </div>

      {/* Analytics Components */}
      {/* Row 2: This Week + Score Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight font-heading">This Week</h3>
             <div className="flex items-center gap-2">
                 <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading font-mono tabular-nums">
                   {weeklyActivity.reduce((acc, curr) => acc + curr.question_count, 0)}
                 </span>
                 <span className="text-xs text-slate-500 dark:text-slate-400">questions</span>
               </div>
             </div>
             <WeeklyBarChart data={weeklyActivity} />
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center justify-between mb-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight font-heading">Score Trend</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Weekly accuracy trend</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-heading font-mono tabular-nums">
                  {(() => {
                    const totalQ = weeklyActivity.reduce((acc, curr) => acc + curr.question_count, 0);
                    const totalC = weeklyActivity.reduce((acc, curr) => acc + (curr.correct_count || 0), 0);
                    return totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
                  })()}%
                </span>
                {/* Trend indicator removed until we have historical data comparison */}
              </div>
            </div>
            <ScoreTrendAreaChart data={weeklyActivity} />
          </div>
      </div>

      {/* Row 3: Subject breakdown + Topic Breakdown */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="mb-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight font-heading">
               Subject breakdown
             </h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
               Accuracy by system · correct / attempts
             </p>
           </div>
           {loading ? (
             <div className="space-y-2.5 animate-pulse">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i}>
                   <div className="flex justify-between mb-1.5">
                     <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-28"></div>
                     <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-14"></div>
                   </div>
                   <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                 </div>
               ))}
             </div>
           ) : (() => {
             const attempted = [...subjectPerformance]
               .filter((s) => s.total_attempts > 0)
               .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0));
             if (attempted.length === 0) {
               return (
                 <p className="text-sm text-slate-500 dark:text-slate-400">
                   No attempts yet — practice in Quiz to populate subjects.
                 </p>
               );
             }
             return (
               <ul className="space-y-2.5">
                 {attempted.map((subj) => {
                   const pct =
                     subj.total_attempts > 0
                       ? Math.round((subj.correct_count / subj.total_attempts) * 100)
                       : 0;
                   return (
                     <li key={subj.system}>
                       <div className="flex items-center justify-between gap-2 mb-1">
                         <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate min-w-0">
                           {subj.system}
                         </span>
                         <div className="flex items-center gap-2 shrink-0 tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                           <span>{subj.correct_count}/{subj.total_attempts}</span>
                           <span className="font-semibold text-slate-700 dark:text-slate-200 w-9 text-right">
                             {pct}%
                           </span>
                         </div>
                       </div>
                       <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                         <div
                           className="h-full rounded-full bg-slate-600 dark:bg-slate-400 transition-[width] duration-500 ease-out"
                           style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
                           role="presentation"
                         />
                       </div>
                     </li>
                   );
                 })}
               </ul>
             );
           })()}
        </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 tracking-tight font-heading">Topic Breakdown</h3>
           <TopicDonutChart
             data={(() => {
                const total = subjectPerformance.reduce((acc, curr) => acc + curr.total_attempts, 0);
                if (total === 0) return undefined;
                return subjectPerformance.map(s => ({
                  name: s.system,
                  percentage: Math.round((s.total_attempts / total) * 100)
                })).sort((a, b) => b.percentage - a.percentage).slice(0, 5);
             })()}
           />
         </div>
      </div>
    </div>
  );
};

export default DashboardPage;
