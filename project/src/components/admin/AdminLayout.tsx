import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Users } from 'lucide-react';
import { DashboardSquare02Icon, File01Icon, Note04Icon } from 'hugeicons-react';
import { useAuth } from '../AuthProvider';
import { ADMIN_DASHBOARD_BG_CLASS } from './adminDashboardPatterns';

const adminNavigation = [
  { name: 'Overview', icon: DashboardSquare02Icon, path: '/admin/dashboard' },
  { name: 'Flashcard Management', icon: File01Icon, path: '/admin/flashcards' },
  { name: 'Quiz Management', icon: Note04Icon, path: '/admin/qbank' },
  { name: 'User Management', icon: Users, path: '/admin/users' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex text-slate-800 font-sans overflow-hidden">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-8 border-b border-slate-100">
             <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/');
                }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                title="Go to homepage"
              >
                <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="MedKotha" className="w-full h-full object-contain dark:hidden" />
                  <img src="/logowhite.png" alt="MedKotha" className="w-full h-full object-contain hidden dark:block" />
                </div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">MedKotha</span>
              </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <div className="text-xs font-medium text-slate-400 px-4 mb-2 uppercase tracking-wider">Management</div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin/dashboard'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                   `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-[14px] ${
                     isActive ? 'bg-[#F4F7FD] text-[#365bce] font-semibold' : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                   }`
                 }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={isActive ? 'text-[#365bce]' : 'text-slate-400 group-hover:text-slate-600'} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all font-medium text-[14px]"
              >
               <LogOut size={18} />
               Logout
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 lg:pl-64 flex flex-col min-h-screen ${ADMIN_DASHBOARD_BG_CLASS} transition-all duration-300`}>
         <header className="h-20 bg-[#F4F7FD] flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800">
                <Menu size={24} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800 font-heading">{displayName}</div>
                <div className="text-xs text-slate-500 font-medium">{user?.email}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden shrink-0">
                <img
                  src={
                    profile?.avatar_url ||
                    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.email || 'admin')}&backgroundColor=e0e7ff`
                  }
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
         </header>

         <div className="p-5 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-80px-4rem)]">
              <Outlet />
            </div>
         </div>
      </main>
    </div>
  );
}
