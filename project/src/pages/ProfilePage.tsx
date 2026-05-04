import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  Edit3,
  Calendar,
  GraduationCap,
  Shield,
  Target,
  Settings,
  Clock,
  Flame,
  Activity,
  Flag,
} from 'lucide-react';
import { StudyHeatmap } from '../components/charts';
import { useAuth } from '../components/AuthProvider';
import { fetchUserNotes, fetchProfile, fetchDashboardStats, fetchStudySessions, updateProfile, uploadProfileImage, NoteRow, deleteQuestionNote, ProfileRow, DashboardStats, StudySessionRow, fetchUserMarkedQuestions, MarkedQuestionRow } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'notes' | 'marked'>('overview');
  
  const [userNotes, setUserNotes] = useState<NoteRow[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const [markedQuestions, setMarkedQuestions] = useState<MarkedQuestionRow[]>([]);
  const [loadingMarked, setLoadingMarked] = useState(false);

  // New Data states
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<StudySessionRow[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // Edit Profile states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', university: '', year: '' });

  // Image upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'covers') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      if (bucket === 'avatars') setIsUploadingAvatar(true);
      if (bucket === 'covers') setIsUploadingCover(true);

      const url = await uploadProfileImage(user.id, file, bucket);
      
      const updates = bucket === 'avatars' 
        ? { avatar_url: url } 
        : { cover_image_url: url };
        
      const updatedProfile = await updateProfile(user.id, updates);
      setProfile(updatedProfile);
      
      // Dispatch an event so Layout can refetch the profile
      window.dispatchEvent(new CustomEvent('avatar-updated'));
    } catch (err: any) {
      console.error(`Failed to upload ${bucket}:`, err);
      alert(`Failed to upload image: ${err.message || 'Unknown error'}`);
    } finally {
      if (bucket === 'avatars') setIsUploadingAvatar(false);
      if (bucket === 'covers') setIsUploadingCover(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchProfile(user.id).then(setProfile).catch(console.error),
        fetchDashboardStats(user.id).then(setStats).catch(console.error),
        fetchStudySessions(user.id).then(setSessions).catch(console.error)
      ]).finally(() => setLoadingPage(false));
    }
  }, [user]);

  useEffect(() => {
    if (activeProfileTab === 'notes' && user) {
      setLoadingNotes(true);
      fetchUserNotes(user.id)
        .then(setUserNotes)
        .catch(console.error)
        .finally(() => setLoadingNotes(false));
    }
  }, [activeProfileTab, user]);

  useEffect(() => {
    if (activeProfileTab === 'marked' && user) {
      setLoadingMarked(true);
      fetchUserMarkedQuestions(user.id)
        .then(setMarkedQuestions)
        .catch(console.error)
        .finally(() => setLoadingMarked(false));
    }
  }, [activeProfileTab, user]);

  const handleDeleteClick = (noteId: string) => {
      setNoteToDelete(noteId);
      setShowDeleteConfirm(true);
  };

  const confirmDeleteNote = async () => {
      if (!noteToDelete) return;
      setShowDeleteConfirm(false);
      try {
          await deleteQuestionNote(noteToDelete);
          setUserNotes(prev => prev.filter(n => n.id !== noteToDelete));
          setNoteToDelete(null);
      } catch (err) {
          console.error("Failed to delete note:", err);
      }
  };

  const handleEditProfileClick = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      university: profile?.university || '',
      year: profile?.year || 'MS3'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updatedProfile = await updateProfile(user.id, {
        full_name: editForm.full_name,
        university: editForm.university,
        year: editForm.year
      });
      setProfile(updatedProfile);
      
      // If full_name changed, we should trigger a session refresh so UI components using user.user_metadata get the new name.
      if (editForm.full_name !== user.user_metadata?.full_name) {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.refreshSession();
      }

      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingProfile(false);
    }
  };


  const formatJoinedDate = (iso: string | undefined | null) => {
    if (!iso) return 'Recently';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const studyGoals = [
    { goal: 'Daily Questions', current: 0 /* TODO from today stats */, target: 40, unit: 'Qs' },
    { goal: 'Weekly Study Hours', current: 0 /* TODO */, target: 25, unit: 'hrs' },
    { goal: 'Monthly Quiz Progress', current: stats?.total_questions || 0, target: 1000, unit: 'Qs' },
  ];

  if (loadingPage) {
    return (
      <div className="max-w-6xl mx-auto w-full animate-pulse">
        {/* Cover Skeleton */}
        <div className="h-48 sm:h-56 md:h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl mb-0"></div>
        {/* Profile Info Skeleton */}
        <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-b-2xl shadow-sm px-4 sm:px-6 md:px-8 pb-6 pt-0 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-5">
            <div className="relative -mt-12 sm:-mt-14 md:-mt-20 z-10 shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 bg-slate-300 dark:bg-slate-700 rounded-2xl ring-4 ring-white dark:ring-slate-800"></div>
            </div>
            <div className="flex-1 pt-2 md:pt-0 md:pb-1 space-y-3">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pb-1">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-20"></div>
            </div>
          </div>
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-16"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Tabs Skeleton */}
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full mb-6"></div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

   return (
     <div className="animate-fadeIn max-w-6xl mx-auto w-full">
       <div className="relative h-48 sm:h-56 md:h-64 w-full rounded-2xl overflow-hidden mb-0">
         {profile?.cover_image_url ? (
           <img src={profile.cover_image_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
         ) : (
           <>
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700"></div>
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
           </>
         )}
         <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent"></div>
         <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleImageUpload(e, 'covers')} className="hidden" />
         <button 
           onClick={() => coverInputRef.current?.click()}
           disabled={isUploadingCover}
           className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-white/30 transition-colors border border-white/20 disabled:opacity-50">
           {isUploadingCover ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />} 
           {isUploadingCover ? 'Uploading...' : 'Edit Cover'}
         </button>
         <div className="absolute bottom-12 right-20 w-16 h-16 rounded-full border border-white/10"></div>
       </div>

       <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-b-2xl shadow-sm px-4 sm:px-6 md:px-8 pb-6 pt-0 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-5">
             <div className="relative -mt-12 sm:-mt-14 md:-mt-20 z-10 shrink-0">
               <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-xl ring-4 ring-white dark:ring-slate-800 relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                 <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}&backgroundColor=e0e7ff`} className="w-full h-full object-cover rounded-xl bg-indigo-50 dark:bg-slate-700" alt="avatar" />
                  <div className="absolute inset-1.5 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploadingAvatar ? <Loader2 size={24} className="text-white animate-spin" /> : <Edit3 size={24} className="text-white" />}
                  </div>
               </div>
               <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatars')} className="hidden" />
             </div>
             <div className="flex-1 pt-2 md:pt-0 md:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                 <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">{profile?.full_name || 'Student'}</h1>
                 <div className="flex items-center gap-2 flex-wrap">
                   <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 font-heading"><GraduationCap size={12} /> {profile?.year || 'MS3'}</span>
                   <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-heading"><Shield size={12} /> Pro Member</span>
                 </div>
               </div>
               <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 gap-y-1">
                 <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {formatJoinedDate(profile?.created_at)}</span>
               </div>
            </div>
             <div className="flex items-center gap-2 sm:gap-3 shrink-0 pb-1">
               <button onClick={handleEditProfileClick} className="bg-indigo-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-1 sm:gap-2 font-heading"><Edit3 size={14} /> <span className="hidden sm:inline">Edit Profile</span></button>
             </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
             <div className="text-center"><p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white font-heading tabular-nums">{stats?.total_questions || 0}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Questions Solved</p></div>
             <div className="text-center"><p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white font-heading tabular-nums">{stats?.accuracy || 0}%</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Overall Accuracy</p></div>
             <div className="text-center"><p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-1 font-heading tabular-nums">{stats?.streak || 0} <Flame size={16} className={`text-${(stats?.streak || 0) > 0 ? 'orange' : 'slate'}-500`} /></p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Day Streak</p></div>
             <div className="text-center"><p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white font-heading tabular-nums">{sessions.length}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Sessions</p></div>
           </div>
         </div>
 
        <div className="mb-6 overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm" style={{ width: 'max-content', minWidth: '100%' }}>
           {(['overview', 'notes', 'marked'] as const).map((tab) => (
             <button key={tab} onClick={() => setActiveProfileTab(tab)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all capitalize font-heading whitespace-nowrap ${
                  activeProfileTab === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>{tab === 'marked' ? 'Marked' : tab}</button>
           ))}
          </div>
        </div>

      {activeProfileTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center justify-between mb-5">
                 <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-heading"><Target size={16} className="text-indigo-600 dark:text-indigo-400" /> Study Goals</h3>
                 <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 font-heading"><Settings size={12} /> Edit</button>
               </div>
              <div className="space-y-5">
                {studyGoals.map((g, i) => {
                  const pct = Math.round((g.current / g.target) * 100);
                  return (
                     <div key={i}>
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{g.goal}</span>
                         <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono tabular-nums"><span className="text-slate-800 dark:text-white">{g.current}</span> / {g.target} {g.unit}</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${pct >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : pct >= 50 ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                      {pct >= 80 && (<p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1"><CheckCircle size={10} /> Almost there! Keep going!</p>)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center justify-between mb-5">
                 <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-heading"><Calendar size={16} className="text-emerald-600 dark:text-emerald-500" /> Custom Sessions</h3>
                 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">Last 20 weeks</span>
               </div>
              <StudyHeatmap sessions={sessions} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t border-slate-100">
                 <div className="text-center"><p className="text-base sm:text-lg font-extrabold text-slate-800 font-heading tabular-nums">{sessions.length}</p><p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium font-heading">Custom Sessions</p></div>
                 <div className="text-center"><p className="text-base sm:text-lg font-extrabold text-slate-800 font-heading tabular-nums">{(sessions.reduce((acc,s)=>acc+(s.duration_sec||0),0)/3600).toFixed(1)}h</p><p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium font-heading">Total Hours</p></div>
                 <div className="text-center"><p className="text-base sm:text-lg font-extrabold text-emerald-600 flex items-center justify-center gap-1 font-heading tabular-nums">{stats?.streak || 0} <Flame size={14} className={`text-${(stats?.streak || 0) > 0 ? 'orange' : 'slate'}-500`} /></p><p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium font-heading">Current Streak</p></div>
                 <div className="text-center"><p className="text-base sm:text-lg font-extrabold text-slate-800 font-heading tabular-nums">{stats?.streak || 0}</p><p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium font-heading">Best Streak</p></div>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center justify-between mb-5">
               <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-heading"><Clock size={16} className="text-slate-600 dark:text-slate-400" /> Recent Activity</h3>
               <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline font-heading">View All</button>
             </div>
             <div className="relative">
               <div className="absolute top-0 bottom-0 left-5 sm:left-5 w-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="space-y-0">
                {sessions.slice(0, 5).map((session, i) => (
                   <div key={i} className="flex items-start gap-3 sm:gap-4 relative group py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-xl px-2 -mx-2 transition-colors">
                     <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 z-10 bg-indigo-100 text-indigo-600 shadow-sm transition-transform group-hover:scale-110`}>
                      <Activity size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium text-slate-800 dark:text-white">Completed {session.system} Session</p>
                       <p className="text-xs text-slate-400 mt-0.5">{new Date(session.started_at).toLocaleDateString()}</p>
                     </div>
                     <div className="shrink-0">
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 font-mono tabular-nums">{session.total_questions > 0 ? Math.round((session.correct_count/session.total_questions)*100) : 0}%</span>
                     </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="py-4 text-center text-sm text-slate-500">No recent activity</div>
                )}
              </div>
            </div>
          </div>

          
        </div>
      )}

      {activeProfileTab === 'notes' && (        <div className="space-y-6 animate-fadeIn">
           <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 font-heading">
                <FileText size={16} className="text-indigo-600 dark:text-indigo-400" /> My Personal Notes
             </h3>
             
             {loadingNotes ? (
                 <div className="p-8 text-center text-slate-500">Loading notes...</div>
             ) : userNotes.length === 0 ? (
                 <div className="p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                     <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                     <h4 className="text-slate-600 dark:text-slate-400 font-bold mb-1">No notes yet</h4>
                     <p className="text-slate-500 text-sm">Add notes to questions while practicing to see them here.</p>
                     <button onClick={() => navigate('/student/qbank')} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">Go to Quiz</button>
                 </div>
             ) : (
                 <div className="grid gap-4">
                     {userNotes.map((note) => (
                         <div key={note.id} className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group shadow-sm">
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                                 <div className="flex-1">
                                     <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded uppercase tracking-wide mb-2 inline-block">
                                         {note.question?.system || 'General'}
                                     </span>
                                     <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1 font-heading">
                                         {note.question?.question || 'Question Unavailable'}
                                     </h4>
                                 </div>
                                 <button 
                                     onClick={() => navigate(`/student/qbank?questionId=${note.question_id}`)}
                                     className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 self-start sm:self-auto"
                                     title="Review this question"
                                 >
                                     Review <ChevronRight size={14} />
                                 </button>
                             </div>
                             
                             <div className="bg-amber-50 dark:bg-amber-900/10 p-3 sm:p-4 rounded-lg border border-amber-100 dark:border-amber-900/20 relative group/note">
                                 <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap font-medium">{note.note}</p>
                                 <button 
                                     onClick={() => handleDeleteClick(note.id)}
                                     className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg opacity-0 group-hover/note:opacity-100 transition-all"
                                     title="Delete Note"
                                 >
                                     <Trash2 size={14} />
                                 </button>
                             </div>
                             <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-2">
                                 <span>Last updated: {new Date(note.updated_at).toLocaleDateString()}</span>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
           </div>
        </div>
      )}

      {activeProfileTab === 'marked' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 font-heading">
              <Flag size={16} className="text-amber-500" /> Marked Questions
            </h3>

            {loadingMarked ? (
              <div className="p-8 text-center text-slate-500">Loading marked questions...</div>
            ) : markedQuestions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Flag size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="text-slate-600 dark:text-slate-400 font-bold mb-1">No marked questions yet</h4>
                <p className="text-slate-500 text-sm">Flag questions during practice to save them here for review.</p>
                <button onClick={() => navigate('/student/qbank')} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">Go to Quiz</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {markedQuestions.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded uppercase tracking-wide inline-block border border-amber-100 dark:border-amber-800">
                            {item.question?.system || 'General'}
                          </span>
                          {item.question?.difficulty && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                              item.question.difficulty === 'easy' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                              item.question.difficulty === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                              'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}>{item.question.difficulty}</span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-2 font-heading">
                          {item.question?.question || 'Question Unavailable'}
                        </p>
                        {item.question?.scenario && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.question.scenario}</p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/student/qbank?questionId=${item.question_id}`)}
                        className="text-xs font-medium text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 self-start sm:self-auto shrink-0"
                        title="Review this question"
                      >
                        Review <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-2">
                      <Flag size={10} className="text-amber-400" />
                      <span>Marked on {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="relative z-50">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
            <DialogPanel
              transition
              className="w-full max-w-sm mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 transition-all duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 font-heading">Delete Note?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-heading"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteNote}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors font-heading shadow-lg shadow-rose-200 dark:shadow-none"
                  >
                    Delete It
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Edit Profile Modal */}
        <Dialog open={isEditModalOpen} onClose={() => !isSavingProfile && setIsEditModalOpen(false)} className="relative z-50">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
            <DialogPanel
              transition
              className="w-full max-w-sm mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 transition-all duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Edit3 size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white font-heading">Edit Profile</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-heading">Display Name</label>
                    <input 
                      type="text" 
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-white font-medium text-base"
                      disabled={isSavingProfile}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-heading">Current Year / Status</label>
                    <select 
                      value={editForm.year}
                      onChange={(e) => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-white font-medium text-base"
                      disabled={isSavingProfile}
                    >
                      <option value="Pre-Med">Pre-Med</option>
                      <option value="MS1">MS1 (First Year)</option>
                      <option value="MS2">MS2 (Second Year)</option>
                      <option value="MS3">MS3 (Third Year)</option>
                      <option value="MS4">MS4 (Fourth Year)</option>
                      <option value="Resident">Resident</option>
                      <option value="Attending">Attending</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSavingProfile}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-heading disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-heading shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSavingProfile ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Saving...</span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
    </div>
  );
};

export default ProfilePage;
