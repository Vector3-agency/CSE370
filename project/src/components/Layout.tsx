import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  User,
  Settings,
  Search,
  Menu,
  X,
  Stethoscope,
  LogOut,
  Trophy,
  Target,
  Loader2,
  FileText,
} from 'lucide-react';
import { DashboardSquare02Icon, File01Icon, Note04Icon, LogoutSquare02Icon } from 'hugeicons-react';
import { useAuth } from './AuthProvider';
import { searchGlobal, SearchResult } from '../lib/api';


const navigation = [
  { name: 'Overview', icon: DashboardSquare02Icon, iconKind: 'huge', path: '/student/dashboard' },
  { name: 'Flashcards', icon: File01Icon, iconKind: 'huge', path: '/student/flashcards' },
  { name: 'Quiz', icon: Note04Icon, iconKind: 'huge', path: '/student/qbank' },
  { name: 'Mistakes', icon: Target, iconKind: 'lucide', path: '/student/mistakes' },
  { name: 'Leaderboard', icon: Trophy, iconKind: 'lucide', path: '/student/leaderboard' },
  { name: 'Profile', icon: User, iconKind: 'lucide', path: '/student/profile' },
  { name: 'Settings', icon: Settings, iconKind: 'lucide', path: '/student/settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut, refreshProfile } = useAuth();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    // Listen for avatar updates from ProfilePage
    window.addEventListener('avatar-updated', refreshProfile);
    return () => window.removeEventListener('avatar-updated', refreshProfile);
  }, [refreshProfile]);

  // Search click-outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      const results = await searchGlobal(searchQuery, user?.id);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user?.id]);

  const handleSearchResultClick = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(result.url);
  };



  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-100 font-body selection:bg-indigo-100 selection:text-indigo-700`}>
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .flashcard-container {
          perspective: 1500px;
          -webkit-perspective: 1500px;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
        }
        .flashcard-inner.flipped {
          transform: rotateY(180deg);
          -webkit-transform: rotateY(180deg);
        }
        .flashcard-front, .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1.5rem;
        }
        .flashcard-back {
          transform: rotateY(180deg);
          -webkit-transform: rotateY(180deg);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#f4f4ff] dark:bg-slate-950 border-r border-indigo-100 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
           <div className="h-20 flex items-center px-8 border-b border-indigo-100/50 dark:border-slate-800">
<button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 relative flex items-center justify-center">
                 <img src="/logo.png" alt="MedKotha Logo" className="w-full h-full object-contain dark:hidden" />
                 <img src="/logowhite.png" alt="MedKotha Logo" className="w-full h-full object-contain hidden dark:block" />
              </div>
               <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">MedKotha</span>
             </button>
            <button className="ml-auto lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

<div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 sidebar-scrollbar">
            <div className="text-[10px] font-extrabold text-slate-400 px-4 mb-2 uppercase tracking-widest font-heading">Study</div>
            {navigation.slice(0, 3).map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                   `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                     isActive ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm ring-1 ring-indigo-50 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                   }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3 font-medium">
                    <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    {item.name}
                  </div>
                )}
              </NavLink>
            ))}
            
            <div className="text-[10px] font-extrabold text-slate-400 px-4 mb-2 mt-6 uppercase tracking-widest font-heading">Account</div>
            {navigation.slice(3).map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                   `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
                     isActive ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm ring-1 ring-indigo-50 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                   }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3 font-medium">
                    <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    {item.name}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
          
<div className="p-4">
<button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all font-medium text-sm"
              >
               <LogoutSquare02Icon size={18} />
               Sign Out
              </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all duration-300 overflow-x-hidden">
         <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
           <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800"><Menu size={24} /></button>
               <div ref={searchRef} className="hidden md:flex items-center bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 w-full max-w-md focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-500/20 focus-within:border-indigo-200 dark:focus-within:border-indigo-500/30 transition-all relative">
                  <Search size={18} className="text-slate-400 mr-3 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search questions, topics, or flashcards..." 
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400 text-slate-700 dark:text-slate-200 font-medium"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length > 0) setIsSearchOpen(true);
                    }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* Search Dropdown Popover */}
                  {isSearchOpen && (searchQuery.trim().length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fadeIn max-h-96 overflow-y-auto">
                      {isSearching ? (
                        <div className="flex items-center justify-center p-6 text-slate-500">
                          <Loader2 size={20} className="animate-spin text-indigo-500 mr-2" />
                          <span className="text-sm font-medium">Searching...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSearchResultClick(result)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                            >
                              <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                result.type === 'flashcard' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                              }`}>
                                {result.type === 'flashcard' ? <Layers size={14} /> : <FileText size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{result.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{result.subtitle}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-500">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No results found</p>
                          <p className="text-xs">Try a different keyword or check spelling.</p>
                        </div>
                      )}
                    </div>
                  )}
               </div>
           </div>
           <div className="flex items-center gap-4">
               <NavLink to="/student/profile" className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-800 cursor-pointer group">
                  <div className="text-right hidden md:block">
                     <div className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-heading">{displayName}</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user?.email}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden group-hover:ring-2 group-hover:ring-indigo-100 dark:group-hover:ring-slate-600 transition-all relative flex items-center justify-center">
                    <img 
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'default'}&backgroundColor=e0e7ff`}
                        alt="User" 
                        className="w-full h-full object-cover"
                    />
                 </div>
              </NavLink>
           </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
