import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Target,
  Sparkles,
  MessageSquare,
  Info,
  Gift,
  BellRing,
  Trash2,
  CheckCheck,
  CheckCircle,
  Check,
  ChevronDown,
  ArrowUpRight,
  Settings,
  X,
  Loader2,
} from 'lucide-react';

import { useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as deleteDbNotification, clearReadNotifications, NotificationRow } from '../lib/api';

const ICON_MAP: Record<string, { icon: any, color: string, bg: string }> = {
  achievement: { icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  reminder: { icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  update: { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  social: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  system: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  promo: { icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'achievement' | 'update' | 'reminder'>('all');
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<any>({});
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    
    // Fetch notifications and settings concurrently
    Promise.all([
      fetchNotifications(user.id),
      import('../lib/api').then(m => m.fetchSettings(user.id))
    ])
    .then(([notifs, fetchedSettings]) => {
      setNotifications(notifs);
      if (fetchedSettings?.settings) {
        setUserSettings(fetchedSettings.settings);
        if (fetchedSettings.settings.default_notification_tab) {
          setFilter(fetchedSettings.settings.default_notification_tab);
        }
      }
    })
    .catch(console.error)
    .finally(() => setIsLoading(false));
  }, [user]);

  const handleUpdatePreference = async (newTab: string) => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
      const { updateSettings } = await import('../lib/api');
      const updatedSettings = { ...userSettings, default_notification_tab: newTab };
      await updateSettings(user.id, updatedSettings);
      setUserSettings(updatedSettings);
    } catch (err) {
      console.error("Failed to update preferences", err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  }, [filter, notifications]);

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDbNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const clearAllRead = async () => {
    if (!user) return;
    const confirmDelete = window.confirm("Are you sure you want to delete all read notifications? This action cannot be undone.");
    if (!confirmDelete) return;
    
    try {
      await clearReadNotifications(user.id);
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (err) {
      console.error("Failed to clear read notifications", err);
    }
  };

  const filterTabs = [
    { key: 'all' as const, label: 'All', count: notifications.length },
    { key: 'unread' as const, label: 'Unread', count: unreadCount },
    { key: 'achievement' as const, label: 'Achievements', count: notifications.filter(n => n.type === 'achievement').length },
    { key: 'update' as const, label: 'Updates', count: notifications.filter(n => n.type === 'update').length },
    { key: 'reminder' as const, label: 'Reminders', count: notifications.filter(n => n.type === 'reminder').length },
  ];

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <BellRing size={22} className="text-indigo-600" />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-[9px] font-extrabold text-white font-mono tabular-nums">{unreadCount}</span>
              </div>
            )}
          </div>
          <div>
             <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">Notifications</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">{unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}</p>
           </div>
         </div>
         <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0">
           {unreadCount > 0 && (
             <button
               onClick={markAllAsRead}
               className="flex items-center justify-center sm:justify-start gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
             >
               <CheckCheck size={14} /> Mark all read
             </button>
           )}
           <button onClick={() => setIsPreferencesOpen(true)} className="flex items-center justify-center sm:justify-start gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
             <Settings size={14} /> Preferences
           </button>
         </div>
      </div>

      {/* Filter tabs - Desktop */}
      <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm mb-6 overflow-x-auto">
         {filterTabs.map((tab) => (
           <button
             key={tab.key}
             onClick={() => setFilter(tab.key)}
             className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap font-heading ${
               filter === tab.key
                 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
             }`}
           >
             {tab.label}
             <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
               filter === tab.key
                 ? 'bg-white/20 text-white'
                 : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
             }`}>
               {tab.count}
             </span>
           </button>
         ))}
       </div>

      {/* Filter Select - Mobile */}
      <div className="sm:hidden mb-6">
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-sm font-heading"
          >
            {filterTabs.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.label} ({tab.count})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Notification List */}
      {isLoading ? (
         <div className="space-y-3">
           {[1, 2, 3, 4, 5].map((i) => (
             <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-5">
               <div className="flex items-start gap-3 sm:gap-4">
                 <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-start justify-between gap-3">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                         <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
                       </div>
                       <div className="mt-1 space-y-2">
                         <div className="h-4 w-full bg-slate-50 dark:bg-slate-800 rounded animate-pulse"></div>
                         <div className="h-4 w-3/4 bg-slate-50 dark:bg-slate-800 rounded animate-pulse"></div>
                       </div>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                       <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                       <ChevronDown size={14} className="text-slate-100 dark:text-slate-700" />
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           ))}
         </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const IconData = ICON_MAP[notification.type] || ICON_MAP['system'];
            const NotificationIcon = IconData.icon;
            
            return (
            <div
               key={notification.id}
               className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm transition-all hover:shadow-md group ${
                 notification.read
                   ? 'border-slate-100 dark:border-slate-700'
                   : 'border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-900/10 ring-1 ring-indigo-50 dark:ring-indigo-900/30'
               }`}
             >
              <div
                className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 cursor-pointer"
                onClick={() => {
                  markAsRead(notification.id, notification.read);
                  setExpandedId(expandedId === notification.id ? null : notification.id);
                }}
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${IconData.bg} transition-transform group-hover:scale-110`}>
                  <NotificationIcon size={20} className={IconData.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <h3 className={`text-sm font-heading ${notification.read ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-extrabold text-slate-900 dark:text-white'}`}>
                           {notification.title}
                         </h3>
                         {!notification.read && (
                           <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse"></div>
                         )}
                       </div>
                       <p className={`text-sm mt-1 leading-relaxed break-words ${
                         expandedId === notification.id ? '' : 'line-clamp-2'
                       } ${notification.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                         {notification.message}
                       </p>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                       <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">{new Date(notification.created_at).toLocaleDateString()}</span>
                       <ChevronDown size={14} className={`text-slate-400 dark:text-slate-500 transition-transform ${expandedId === notification.id ? 'rotate-180' : ''}`} />
                     </div>
                   </div>
                 </div>
               </div>

              {/* Expanded actions */}
              {expandedId === notification.id && (
                <div className="px-4 sm:px-5 pb-4 pt-0 flex flex-wrap items-center gap-2 animate-fadeIn border-t border-slate-100 mt-3 pt-3">
                  {notification.action_url && (
                     <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none font-heading">
                       <ArrowUpRight size={12} />
                       View Action
                     </button>
                   )}
                   <button
                     onClick={(e) => { e.stopPropagation(); markAsRead(notification.id, notification.read); }}
                     className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                   >
                     <Check size={12} /> {notification.read ? 'Read' : 'Mark as Read'}
                   </button>
                   <div className="flex items-center gap-2 ml-auto w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                     <button
                         onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                         className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 text-rose-500 rounded-lg text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors border border-slate-200 dark:border-slate-700"
                     >
                         <Trash2 size={12} /> Delete
                     </button>
                   </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      ) : (
         <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-8 sm:p-16 text-center flex flex-col items-center justify-center min-h-[50vh]">
           <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-5">
             <CheckCircle size={36} className="text-emerald-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 font-heading mb-2">
             {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
           </h3>
           <p className="text-slate-400 max-w-sm">
             {filter === 'unread'
               ? "You're all caught up! All notifications have been read."
               : `No ${filter} notifications to show. Check back later!`
             }
           </p>
           {filter !== 'all' && (
             <button
               onClick={() => setFilter('all')}
               className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-heading"
             >
               View All Notifications
             </button>
           )}
         </div>
      )}

      {/* Summary footer */}
      {filteredNotifications.length > 0 && (
        <div className="mt-4 flex items-center justify-between px-2">
          <p className="text-xs text-slate-400">Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</p>
          <button onClick={clearAllRead} className="text-xs text-slate-500 hover:text-rose-500 font-medium flex items-center gap-1 transition-colors">
            <Trash2 size={12} /> Clear all read
          </button>
        </div>
      )}

      {/* Preferences Modal */}
      {isPreferencesOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setIsPreferencesOpen(false)}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white font-heading">Notification Preferences</h3>
              <button 
                onClick={() => setIsPreferencesOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-700 dark:text-slate-200 font-bold block mb-1">Default Tab</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-3">Choose which tab opens automatically</span>
                <div className="relative">
                  <select 
                      value={userSettings?.default_notification_tab || 'all'}
                      onChange={(e) => handleUpdatePreference(e.target.value)}
                      disabled={isSavingPrefs}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-lg py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                      <option value="all">All Notifications</option>
                      <option value="unread">Unread Only</option>
                      <option value="achievement">Achievements</option>
                      <option value="update">Updates</option>
                      <option value="reminder">Reminders</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    {isSavingPrefs ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsPreferencesOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationsPage;
