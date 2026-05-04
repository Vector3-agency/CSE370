import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { fetchSettings, updateSettings } from '../lib/api';
import { Timer, Check, Moon, Sun, BellRing } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

interface UserSettings {
  timer_enabled: boolean;
  timer_duration_sec?: number;
  theme?: string;
  daily_goal?: number;
  default_notification_tab?: 'all' | 'unread' | 'achievement' | 'update' | 'reminder';
}

const SettingsPage = () => {
     const { user } = useAuth();
     const { theme, setTheme } = useTheme();
     const [isDark, setIsDark] = useState(false);
     const [settings, setSettings] = useState<UserSettings>({ timer_enabled: true });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Calculate effective theme
        const checkTheme = () => {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(theme === 'dark' || (theme === 'system' && systemDark));
        };
        
        checkTheme();
        
        // Listen for system changes if theme is system
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (theme === 'system') checkTheme();
        };
        
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    useEffect(() => {
        if (!user) return;
        fetchSettings(user.id)
            .then(data => {
                if (data?.settings) {
                    setSettings({ ...settings, ...data.settings });
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const showToast = (msg: string) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(msg);
        toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    };

    const handleToggleTimer = async () => {
        if (!user) return;
        const newSettings = { ...settings, timer_enabled: !settings.timer_enabled };
        setSettings(newSettings);
        setSaving(true);
        try {
            await updateSettings(user.id, newSettings);
            showToast("Settings saved");
        } catch (err) {
            console.error("Failed to save settings:", err);
            // Revert on error
            setSettings(settings);
            showToast("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
         return (
             <div className="animate-pulse max-w-4xl mx-auto w-full text-slate-800 dark:text-slate-200">
                 <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-32 mb-6"></div>
                 
                 {/* Appearance Skeleton */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                     <div className="flex items-center gap-2 mb-4">
                         <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                         <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-32"></div>
                     </div>
                     <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                             <div>
                                 <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24 mb-1.5"></div>
                                 <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-48 mt-1"></div>
                             </div>
                         </div>
                         <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                     </div>
                 </div>

                 {/* Study Preferences Skeleton */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                     <div className="flex items-center gap-2 mb-4">
                         <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                         <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-40"></div>
                     </div>
                     <div className="space-y-4">
                         <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                                 <div>
                                     <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-1.5"></div>
                                     <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-56 mt-1"></div>
                                 </div>
                             </div>
                             <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                         </div>
                         <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                                 <div>
                                     <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-44 mb-1.5"></div>
                                     <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-48 mt-1"></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         );
     }
 
     return (
         <div className="animate-fadeIn max-w-4xl mx-auto relative text-slate-800 dark:text-slate-200">
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn">
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}

            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-6 tracking-tight font-heading">Settings</h2>
             

 
             {/* General Appearance */}
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 font-heading flex items-center gap-2">
                     <Sun size={20} className="text-indigo-600 dark:text-indigo-400" />
                     Appearance
                 </h3>
                 <div className="space-y-4">
                     <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                         <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 text-slate-400'}`}>
                                 <Moon size={20} />
                             </div>
                             <div>
                                 <span className="text-slate-700 dark:text-slate-200 font-bold block">Dark Mode</span>
                                 <span className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark themes</span>
                             </div>
                         </div>
                         <div className="relative">
                             <input 
                                 type="checkbox" 
                                 className="sr-only peer"
                                 checked={isDark}
                                 onChange={() => setTheme(isDark ? 'light' : 'dark')}
                             />
                             <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </div>
                     </label>
                 </div>
             </div>
 
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 font-heading flex items-center gap-2">
                    <Timer size={20} className="text-indigo-600" />
                    Study Preferences
                </h3>
                <div className="space-y-4">
                     <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                         <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${settings.timer_enabled ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                 <Timer size={20} />
                             </div>
                             <div>
                                 <span className="text-slate-700 dark:text-slate-200 font-bold block">Timed Practice Mode</span>
                                 <span className="text-xs text-slate-500 dark:text-slate-400">Show a countdown timer during practice sessions</span>
                             </div>
                         </div>
                        <div className="relative">
                            <input 
                                 type="checkbox" 
                                 className="sr-only peer"
                                 checked={settings.timer_enabled ?? true}
                                 onChange={handleToggleTimer}
                                 disabled={saving}
                             />
                             <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                    </label>

                    {settings.timer_enabled && (
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                            <div>
                                <span className="text-sm text-slate-700 dark:text-slate-200 font-bold block">Seconds Per Question</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Time limit before the timer flashes red</span>
                            </div>
                            <select 
                                value={settings.timer_duration_sec || 90}
                                onChange={async (e) => {
                                    if (!user) return;
                                    const newSettings = { ...settings, timer_duration_sec: parseInt(e.target.value) };
                                    setSettings(newSettings);
                                    setSaving(true);
                                    try {
                                        await updateSettings(user.id, newSettings);
                                        showToast("Timer duration updated");
                                    } catch (err) {
                                        console.error(err);
                                        setSettings(settings);
                                        showToast("Failed to update duration");
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={saving}
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value={30}>30s</option>
                                <option value={60}>60s (1m)</option>
                                <option value={90}>90s (1.5m)</option>
                                <option value={120}>120s (2m)</option>
                            </select>
                        </div>
                    )}

                     {/* Placeholder for future settings */}
                     <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 opacity-60 cursor-not-allowed">
                         <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                 <Check size={20} />
                              </div>
                              <div>
                                 <span className="text-slate-500 dark:text-slate-400 font-bold block">Daily Goal (Coming Soon)</span>
                                 <span className="text-xs text-slate-400 dark:text-slate-500">Set your daily question target</span>
                              </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 font-heading flex items-center gap-2">
                    <BellRing size={20} className="text-rose-500" />
                    Notifications
                </h3>
                <div className="space-y-4">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-sm text-slate-700 dark:text-slate-200 font-bold block">Default Notification View</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Choose which tab opens automatically</span>
                        </div>
                        <select 
                            value={settings.default_notification_tab || 'all'}
                            onChange={async (e) => {
                                if (!user) return;
                                const val = e.target.value as UserSettings['default_notification_tab'];
                                const newSettings = { ...settings, default_notification_tab: val };
                                setSettings(newSettings);
                                setSaving(true);
                                try {
                                    await updateSettings(user.id, newSettings);
                                    showToast("Default view updated");
                                } catch (err) {
                                    console.error(err);
                                    setSettings(settings); // revert
                                    showToast("Failed to update view");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                        >
                            <option value="all">All Notifications</option>
                            <option value="unread">Unread Only</option>
                            <option value="achievement">Achievements</option>
                            <option value="update">Updates</option>
                            <option value="reminder">Reminders</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-slate-400">
                MedKotha v1.0.0 • {user?.email}
            </div>
        </div>
    );
};

export default SettingsPage;
