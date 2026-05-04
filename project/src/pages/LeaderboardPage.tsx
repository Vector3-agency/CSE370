import { useState, useEffect } from 'react';
import { Trophy, Crown, TrendingUp } from 'lucide-react';
import { fetchLeaderboard, LeaderboardRow } from '../lib/api';

const GenericMedal = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g strokeWidth="0"></g>
    <g strokeLinecap="round" strokeLinejoin="round"></g>
    <g>
      <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M2.63303 16H21.367C21.4471 15.2813 21.5232 14.4732 21.609 13.5616L21.8382 11.1263C22.0182 9.2137 22.1082 8.25739 21.781 7.86207C21.604 7.64823 21.3633 7.5172 21.106 7.4946C20.6303 7.45282 20.0329 8.1329 18.8381 9.49307C18.2202 10.1965 17.9113 10.5482 17.5666 10.6027C17.3757 10.6328 17.1811 10.6018 17.0047 10.5131C16.6865 10.3529 16.4743 9.91812 16.0499 9.04851L13.8131 4.46485C13.0112 2.82162 12.6102 2 12 2C11.3898 2 10.9888 2.82162 10.1869 4.46485L7.95007 9.04852C7.5257 9.91811 7.31351 10.3529 6.99526 10.5131C6.81892 10.6018 6.62434 10.6328 6.43337 10.6027C6.08872 10.5482 5.77977 10.1965 5.16187 9.49307C3.96708 8.1329 3.36968 7.45282 2.89399 7.4946C2.63666 7.5172 2.39598 7.64823 2.21899 7.86207C1.8918 8.25739 1.9818 9.2137 2.16181 11.1263L2.391 13.5616C2.4768 14.4732 2.55286 15.2813 2.63303 16Z" fill="currentColor"></path>
      <path d="M13.3597 22C16.9046 22 18.6771 22 19.8597 20.7902C20.7736 19.8553 21.094 18.4447 21.3667 16H2.63281C2.90553 18.4447 3.22594 19.8553 4.13987 20.7902C5.32249 22 7.09495 22 10.6399 22H13.3597Z" fill="currentColor"></path>
    </g>
  </svg>
);

import { useLocation } from 'react-router-dom';

const LeaderboardPage = () => {
  const location = useLocation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); // Show loading state on refresh
    fetchLeaderboard()
      .then(data => setLeaderboard(data))
      .catch(err => {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, [location.key]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown size={24} className="text-yellow-500 fill-yellow-500" />;
    }
    return <GenericMedal className="w-6 h-6 text-slate-300 fill-slate-300" />;
  };

  const getRowStyle = (rank: number, isCurrentUser: boolean) => {
     if (isCurrentUser) return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-200 dark:ring-indigo-800';
     if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/20 dark:to-slate-800 border-yellow-200 dark:border-yellow-700/50';
     return 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50';
   };

  if (loading) {
    return (
      <div className="animate-fadeIn max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl mb-4 shadow-sm">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading mb-2 sm:mb-3">
            Hall of Fame
          </h1>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 sm:w-10 flex justify-center">
                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse"></div>
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white dark:border-slate-600 bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-5 w-24 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="mt-1 h-3 w-16 bg-slate-50 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right pl-2 sm:pl-4">
                <div className="h-6 w-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-12 bg-slate-50 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fadeIn max-w-2xl mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Unavailable</h3>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      <div className="text-center mb-6 sm:mb-10">
         <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl mb-4 shadow-sm rotate-3 transform hover:rotate-6 transition-transform">
           <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-500" />
         </div>
         <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading mb-2 sm:mb-3">
          Hall of Fame
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm sm:text-lg">
           Top students mastering Essential concepts. Compete to climb the ranks!
         </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {leaderboard.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 sm:p-12 text-center shadow-sm">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
               </div>
               <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 font-heading">No rankings yet</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Be the first to take a practice test and get on the board!</p>
            </div>
        ) : (
          leaderboard.map((row, index) => {
            const isCurrentUser = row.is_current_user;
            
            return (
              <div
                key={`${row.full_name}-${index}`}
                className={`
                  relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all shadow-sm
                  ${getRowStyle(row.rank_position, isCurrentUser)}
                  ${isCurrentUser ? 'scale-[1.01] sm:scale-[1.02] shadow-md z-10' : ''}
                `}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 sm:w-10 flex justify-center">
                  {getRankIcon(row.rank_position)}
                </div>

                {/* Avatar */}
                 <div className="flex-shrink-0">
                   <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 overflow-hidden bg-slate-100 dark:bg-slate-700 ${isCurrentUser ? 'border-indigo-200 dark:border-indigo-700' : 'border-white dark:border-slate-600'}`}>
                      <img 
                       src={row.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=rank-${row.rank_position}-${index}&backgroundColor=e0e7ff`}
                       alt={row.full_name}
                       className="w-full h-full object-cover"
                     />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                     <h3 className={`font-bold truncate text-sm sm:text-base font-heading ${isCurrentUser ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-white'}`}>
                       {row.full_name}
                     </h3>
                     {isCurrentUser && (
                       <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                         You
                       </span>
                     )}
                   </div>
                   <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{row.year || 'Student'}</p>
                 </div>

                {/* Score */}
                 <div className="flex-shrink-0 text-right pl-2 sm:pl-4">
                   <div className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums font-heading">
                     {row.score}
                   </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Correct
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
