import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  Play,
  X,
  Activity,
  ChevronRight,
  Check,
  Heart,
  Brain,
  Zap,
  FlaskConical,
  Microscope,
  Timer,
  Flag,
  XCircle,
  Sparkles,
  Bot,
  Send,
  RotateCw,
  Flame,
  Loader2,
  AlertTriangle,
  Pill,
  Bone,
  Bug,
  Shield,
  Users,
  Calculator,
  Scale,
  Dna,
  Save,
  FileText,
  Trash2,
  Trophy,
  Book,
  Search
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { fetchQuestionsBySystem, submitAnswer, fetchAvailableSystems, fetchSettings, QuestionRow, SystemInfo, fetchQuestionNote, saveQuestionNote, fetchQuestionById, deleteQuestionNote, createStudySession, fetchMarkedQuestionIds, saveMarkedQuestion, deleteMarkedQuestion, fetchMistakeStats, fetchQuestionsByIds } from '../lib/api';
import { supabase } from '../lib/supabase';
import { LAB_REFERENCE_DATA } from '../constants/labConstants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useLocation, useNavigate } from 'react-router-dom';

const LabIcon = Microscope;

const QbankPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<'overview' | 'test' | 'results'>('overview');
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [tutorQuery, setTutorQuery] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  // Multi-turn chat history: {role, text} pairs for display; raw Gemini history for API
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [geminiHistory, setGeminiHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const [markedQuestionIds, setMarkedQuestionIds] = useState<Set<string>>(new Set());

  // Custom Session State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSystem, setCustomSystem] = useState<string>('mixed');
  const [customDifficulty, setCustomDifficulty] = useState<string>('mixed');
  const [customCount, setCustomCount] = useState<number>(10);
  const [isCustomSession, setIsCustomSession] = useState(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionTotalTimeSec, setSessionTotalTimeSec] = useState(0);

  // Note State
  const [noteContent, setNoteContent] = useState("");
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [lastSavedNote, setLastSavedNote] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Lab Reference State
  const [showLabRefModal, setShowLabRefModal] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState("");
  
  console.log("Render QbankPage. showDeleteConfirm:", showDeleteConfirm);

  // Questions fetched from Supabase
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'warning' | 'error' = 'warning') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // Dynamic systems from Supabase
  const [systems, setSystems] = useState<SystemInfo[]>([]);
  const [loadingSystems, setLoadingSystems] = useState(true);

  // Icon mapping by system name
  // Icon mapping by system name
  const systemIcons: Record<string, typeof Heart> = {
    'Anatomy': Bone,
    'Biochemistry': FlaskConical,
    'Physiology': Activity,
    'Pharmacology': Pill,
    'Pathology': Microscope,
    'Microbiology': Bug,
    'Immunology': Shield,
    'Behavioral Science': Users,
    'Biostatistics': Calculator,
    'Ethics': Scale,
    'Genetics': Dna,
    'Neuroscience': Brain,
  };
  const systemIconClass =
    'bg-indigo-50 dark:bg-indigo-900/35 text-indigo-600 dark:text-indigo-400';

  // Timer state
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerDurationSec, setTimerDurationSec] = useState(90);
  const [secondsLeft, setSecondsLeft] = useState(90); // 90s per question
  const [timeSpent, setTimeSpent] = useState(0);

  // Fetch systems whenever in overview to update progress
  useEffect(() => {
    if (view === 'overview') {
      const loadSystems = async () => {
        try {
          if (!user?.id) {
            setSystems([]);
            return;
          }
          // If we just navigated back, we might want a silent update if data already exists,
          // but for simplicity and accuracy, let's just fetch.
          // We can skip setLoadingSystems(true) if systems.length > 0 to avoid flicker
          if (systems.length === 0) setLoadingSystems(true);

          const data = await fetchAvailableSystems(user.id);
          setSystems(data);
        } catch (err) {
          console.error("Failed to fetch systems:", err);
        } finally {
          setLoadingSystems(false);
        }
      };
      loadSystems();
    }
  }, [user, view, location.key]);

  // Fetch settings on mount (once per user)
  useEffect(() => {
    if (user) {
      fetchSettings(user.id).then(data => {
        if (data?.settings?.timer_enabled !== undefined) {
          setTimerEnabled(data.settings.timer_enabled);
        }
        if (data?.settings?.timer_duration_sec !== undefined) {
          setTimerDurationSec(data.settings.timer_duration_sec);
        }
      }).catch(console.error);
    }

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [user]);

  // Deep link: review one question (?questionId=) or weak-spot quiz (?weak=1)
  useEffect(() => {
    if (!user) return;
    const searchParams = new URLSearchParams(location.search);
    const qId = searchParams.get('questionId');
    const weak = searchParams.get('weak') === '1';

    if (!qId && !weak) return;

    if (qId) {
      let cancelled = false;
      const loadSingleQuestion = async () => {
        setLoadingQuestions(true);
        try {
          const q = await fetchQuestionById(qId);
          if (cancelled) return;
          if (q) {
            setQuestions([q]);
            setView('test');
            setCurrentQuestionIdx(0);
            setActiveSystem(q.system);
            setIsSubmitted(true);
            setSelectedOption(q.correct_id);
            setIsCustomSession(false);
          }
        } catch (err) {
          console.error('Failed to load question:', err);
          if (!cancelled) showToast('Could not load the requested question.', 'error');
        } finally {
          if (!cancelled) setLoadingQuestions(false);
        }
      };
      void loadSingleQuestion();
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    const runWeak = async () => {
      setLoadingQuestions(true);
      try {
        const stats = await fetchMistakeStats(user.id);
        if (cancelled) return;
        if (stats.length === 0) {
          showToast('No tracked mistakes yet. Answer questions in Quiz first.', 'warning');
          navigate('/student/qbank', { replace: true });
          return;
        }
        const top = stats.slice(0, 100);
        const ids = top.map((s) => s.question_id);
        const qs = await fetchQuestionsByIds(ids, user.id);
        if (cancelled) return;
        if (qs.length === 0) {
          showToast('Could not load weak questions.', 'error');
          navigate('/student/qbank', { replace: true });
          return;
        }
        const byWrong = new Map(top.map((s) => [s.question_id, s.wrong_count]));
        const sorted = [...qs].sort((a, b) => (byWrong.get(b.id) || 0) - (byWrong.get(a.id) || 0));

        navigate('/student/qbank', { replace: true });
        if (cancelled) return;

        setActiveSystem('Weak spots');
        setSelectedDifficulty(null);
        setIsCustomSession(true);
        setSessionCorrectCount(0);
        setSessionTotalTimeSec(0);
        setCurrentQuestionIdx(0);
        setSecondsLeft(timerDurationSec);
        setSelectedOption(null);
        setIsSubmitted(false);
        setShowTutor(false);
        setChatMessages([]);
        setGeminiHistory([]);
        setQuestions(sorted);
        setView('test');
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          showToast('Weak quiz could not start. Run mistake_tracking.sql in Supabase.', 'error');
          navigate('/student/qbank', { replace: true });
        }
      } finally {
        if (!cancelled) setLoadingQuestions(false);
      }
    };
    void runWeak();
    return () => {
      cancelled = true;
    };
  }, [user, location.search, navigate]);

  // Load Note for Current Question
  useEffect(() => {
    if (questions.length > 0 && user) {
        const qId = questions[currentQuestionIdx].id;
        // Reset note state first to avoid showing prev question's note
        setNoteContent("");
        setLastSavedNote("");
        
        fetchQuestionNote(user.id, qId).then(note => {
            if (note) {
                setNoteContent(note.note);
                setLastSavedNote(note.note);
                setNoteId(note.id);
            } else {
                setNoteId(null);
            }
        });
    }
  }, [currentQuestionIdx, questions, user]);

  // Load persisted marked question IDs when entering test view
  useEffect(() => {
    if (view === 'test' && user) {
      fetchMarkedQuestionIds(user.id)
        .then(ids => setMarkedQuestionIds(ids))
        .catch(console.error);
    }
  }, [view, user]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSaveNote = async () => {
      if (!user || !questions[currentQuestionIdx]) return;
      if (noteContent === lastSavedNote) return; // No changes

      setIsNoteSaving(true);
      try {
          const saved = await saveQuestionNote(user.id, questions[currentQuestionIdx].id, noteContent);
          setLastSavedNote(noteContent);
          setNoteId(saved.id);
          showToast("Note saved!", 'warning'); // Using warning color as 'success' isn't defined in toast types currently
      } catch (err) {
          console.error("Failed to save note:", err);
          showToast("Failed to save note.", 'error');
      } finally {
          setIsNoteSaving(false);
      }
  };

  const handleDeleteNote = async (e?: React.MouseEvent) => {
      e?.preventDefault(); // Prevent blur of textarea
      console.log("Delete clicked. NoteID:", noteId);
      if (!noteId) {
          console.warn("No noteId found to delete");
          return;
      }
      setShowDeleteConfirm(true);
  };

  const confirmDeleteNote = async () => {
      if (!noteId) return;
      setShowDeleteConfirm(false);
      setIsNoteSaving(true);
      try {
          await deleteQuestionNote(noteId);
          setNoteContent("");
          setLastSavedNote("");
          setNoteId(null);
          showToast("Note deleted.", 'warning');
      } catch (err) {
          console.error("Failed to delete note:", err);
          showToast("Failed to delete note.", 'error');
      } finally {
          setIsNoteSaving(false);
      }
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'test' && !isSubmitted && !loadingQuestions) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
        if (isCustomSession) {
           setSessionTotalTimeSec(prev => prev + 1);
        }
        if (timerEnabled) {
          setSecondsLeft(prev => Math.max(0, prev - 1));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, isSubmitted, loadingQuestions, timerEnabled, isCustomSession]);

  // Handle Tab Backgrounding (Prevent Timer Desync/Reset)
  useEffect(() => {
    let lastHiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHiddenAt = Date.now();
      } else {
        if (lastHiddenAt && view === 'test' && !isSubmitted && !loadingQuestions) {
          const elapsedSec = Math.floor((Date.now() - lastHiddenAt) / 1000);
          
          if (elapsedSec > 0) {
            setTimeSpent(prev => prev + elapsedSec);
            if (isCustomSession) {
                setSessionTotalTimeSec(prev => prev + elapsedSec);
            }
            if (timerEnabled) {
                setSecondsLeft(prev => Math.max(0, prev - elapsedSec));
            }
          }
        }
        lastHiddenAt = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [view, isSubmitted, loadingQuestions, timerEnabled, isCustomSession]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timerEnabled && secondsLeft === 0 && !isSubmitted && view === 'test') {
      handleSubmit();
      showToast("Time's up! Answer revealed.", 'warning');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, timerEnabled, isSubmitted, view]);

  // Reset timer on new question
  useEffect(() => {
    setTimeSpent(0);
  }, [currentQuestionIdx]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const openDifficultyModal = (systemName: string) => {
    setSelectedSystem(systemName);
    setShowDifficultyModal(true);
  };

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setShowDifficultyModal(false);
    if (selectedSystem) {
      startTest(selectedSystem, difficulty);
    }
  };

  const startTest = async (systemName: string, difficulty?: string) => {
    setActiveSystem(systemName);
    setSelectedDifficulty(difficulty || null);
    setCurrentQuestionIdx(0);
    setSecondsLeft(timerDurationSec);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowTutor(false);
    setChatMessages([]);
    setGeminiHistory([]);
    setLoadingQuestions(true);
    setView('test');

    try {
      const data = await fetchQuestionsBySystem(systemName, difficulty, user?.id);
      if (data.length === 0) {
        showToast(`No ${difficulty || ''} questions found for ${systemName}. Try a different difficulty or system.`, 'warning');
        setView('overview');
        return;
      }
      setQuestions(data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      showToast("Failed to load questions. Please try again.", 'error');
      setView('overview');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const startCustomSession = async () => {
    setActiveSystem(customSystem === 'mixed' ? 'Mixed Systems' : customSystem);
    setSelectedDifficulty(customDifficulty === 'mixed' ? null : customDifficulty);
    setCurrentQuestionIdx(0);
    setSecondsLeft(timerDurationSec);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowTutor(false);
    setChatMessages([]);
    setGeminiHistory([]);
    setLoadingQuestions(true);
    setView('test');
    setShowCustomModal(false);
    setIsCustomSession(true);
    setSessionCorrectCount(0);
    setSessionTotalTimeSec(0);

    try {
      const fullData = await fetchQuestionsBySystem(
        customSystem === 'mixed' ? undefined : customSystem, 
        customDifficulty === 'mixed' ? undefined : customDifficulty, 
        user?.id
      );
      
      const shuffledData = [...fullData].sort(() => Math.random() - 0.5);
      const data = shuffledData.slice(0, customCount);
      
      if (data.length === 0) {
        showToast(`No questions found matching those criteria.`, 'warning');
        setView('overview');
        return;
      }
      setQuestions(data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      showToast("Failed to load questions. Please try again.", 'error');
      setView('overview');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    
    // Save answer to Supabase
    if (user && selectedOption && questions.length > 0) {
      const currentQ = questions[currentQuestionIdx];
      try {
        await submitAnswer({
          userId: user.id,
          questionId: currentQ.id,
          selectedId: selectedOption,
          isCorrect: selectedOption === currentQ.correct_id,
          timeSpentSec: timeSpent,
          difficulty: selectedDifficulty || undefined,
        });

        if (selectedOption === currentQ.correct_id) {
            setSessionCorrectCount(prev => prev + 1);
        }

      } catch (err) {
        console.error("Failed to save answer:", err);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
        setSecondsLeft(timerDurationSec); // Reset timer BEFORE un-submitting the view
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOption(null);
        setIsSubmitted(false);
        setShowTutor(false);
        setChatMessages([]);
        setGeminiHistory([]);
    } else {
        if (isCustomSession && user) {
            // End of custom session, save to DB
            createStudySession({
              userId: user.id,
              system: activeSystem || 'Mixed',
              difficulty: selectedDifficulty || undefined,
              totalQuestions: questions.length,
              correctCount: sessionCorrectCount + (selectedOption === questions[currentQuestionIdx].correct_id ? 1 : 0),
              durationSec: sessionTotalTimeSec, 
              startedAt: new Date(Date.now() - (sessionTotalTimeSec * 1000)).toISOString()
            }).catch(console.error);

            // We'll calculate total time better later, for now we will show results
            setView('results');
        } else {
            setView('overview'); 
        }
    }
  };

  const askAiTutor = async () => {
    if (!tutorQuery.trim() || questions.length === 0) return;
    const userText = tutorQuery.trim();
    setIsTutorLoading(true);
    setTutorQuery("");

    // Optimistically add user message to chat
    const newUserMsg = { role: 'user' as const, text: userText };
    setChatMessages(prev => [...prev, newUserMsg]);

    try {
      const currentQ = questions[currentQuestionIdx];
      const isFirstMessage = geminiHistory.length === 0;

      const { data, error } = await supabase.functions.invoke('ai-tutor', {
        body: {
          mode: 'tutor',
          userMessage: userText,
          history: isFirstMessage ? [] : geminiHistory,
          questionContext: isFirstMessage ? {
            system: currentQ.system,
            scenario: currentQ.scenario,
            question: currentQ.question,
            correct_id: currentQ.correct_id,
            explanation: currentQ.explanation,
          } : undefined,
        },
      });

      if (error) throw new Error(error.message);
      const responseText: string = data?.text ?? "No response generated.";

      // Build the context-injected user text that was actually sent for the first turn
      const sentUserText = isFirstMessage
        ? `[CONTEXT]\nMedical Subject: ${currentQ.system ?? "USMLE"}\nScenario: ${currentQ.scenario ?? ""}\nQuestion: ${currentQ.question ?? ""}\nCorrect Answer: Option ${currentQ.correct_id ?? ""}\nExplanation: ${currentQ.explanation ?? ""}\n[/CONTEXT]\n\nStudent question: ${userText}`
        : userText;

      // Update Gemini history for next turn
      setGeminiHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: sentUserText }] },
        { role: 'model', parts: [{ text: responseText }] },
      ]);

      setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (_e) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  if (view === 'overview') {
    return (
      <div className="animate-fadeIn max-w-6xl mx-auto relative">
        {/* Toast notification — rendered via portal to escape Layout overflow */}
        {toast && createPortal(
          <div className={`fixed bottom-6 right-6 left-6 sm:left-auto z-[9999] max-w-sm shadow-2xl rounded-xl border px-5 py-4 flex items-start gap-3 animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-900/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-100'
              : 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
          }`}>
            <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${toast.type === 'error' ? 'text-rose-500 dark:text-rose-400' : 'text-indigo-500 dark:text-indigo-400'}`} />
            <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className={`shrink-0 p-0.5 rounded hover:bg-white/60 dark:hover:bg-black/20 transition-colors ${toast.type === 'error' ? 'text-rose-400 dark:text-rose-300' : 'text-indigo-400 dark:text-indigo-300'}`}>
              <X size={16} />
            </button>
          </div>,
          document.body
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">Quiz</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base"><span className="font-mono tabular-nums">Free Preview</span> ({systems.reduce((sum, s) => sum + s.total, 0)} Questions)</p>
            </div>
            <button onClick={() => setShowCustomModal(true)} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 sm:py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-heading">
                <Play size={18} fill="currentColor" /> Create Custom Session
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingSystems ? (
              // Skeleton cards while loading
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700"></div>
                    <div className="h-5 w-12 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="h-5 w-28 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded mb-4"></div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                </div>
              ))
            ) : (
              systems.map((sys) => {
                const IconComponent = systemIcons[sys.name] || Zap;
                return (
                  <div key={sys.name} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => openDifficultyModal(sys.name)}>
                      <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${systemIconClass} transition-transform group-hover:scale-110`}>
                              <IconComponent size={24} />
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded font-mono tabular-nums">{sys.total} Qs</div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 font-heading">{sys.name}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 font-medium">Organ System</p>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                          <span>{sys.completed || 0} / {sys.total} completed</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                              className="h-full rounded-full bg-indigo-500 dark:bg-indigo-500"
                              style={{ width: `${Math.min(100, Math.round(((sys.completed || 0) / sys.total) * 100))}%`, opacity: 0.85 }}
                          ></div>
                      </div>
                  </div>
                );
              })
            )}
        </div>

        {/* Difficulty Selection Modal */}
        <Dialog open={showDifficultyModal} onClose={() => setShowDifficultyModal(false)} className="relative z-50">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md mx-4 sm:mx-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 transition-all duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">Select Difficulty</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedSystem} • Choose your challenge level</p>
                </div>
                <button onClick={() => setShowDifficultyModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleDifficultySelect('easy')}
                  className="w-full text-left p-4 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-[#f4f4ff] to-white dark:from-indigo-950/40 dark:to-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group/diff flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center transition-transform group-hover/diff:scale-110">
                    <Sparkles size={22} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base font-heading">Easy</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Foundational concepts & recall</p>
                  </div>
                  <ChevronRight size={18} className="text-indigo-300 dark:text-indigo-500 opacity-0 -translate-x-2 group-hover/diff:opacity-100 group-hover/diff:translate-x-0 transition-all" />
                </button>

                <button
                  onClick={() => handleDifficultySelect('medium')}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all group/diff flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform group-hover/diff:scale-110">
                    <Zap size={22} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base font-heading">Medium</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clinical application & reasoning</p>
                  </div>
                  <ChevronRight size={18} className="text-indigo-300 dark:text-indigo-500 opacity-0 -translate-x-2 group-hover/diff:opacity-100 group-hover/diff:translate-x-0 transition-all" />
                </button>

                <button
                  onClick={() => handleDifficultySelect('hard')}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all group/diff flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-200/70 dark:bg-indigo-900/60 flex items-center justify-center transition-transform group-hover/diff:scale-110">
                    <Flame size={22} className="text-indigo-800 dark:text-indigo-200" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base font-heading">Hard</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Long patient cases & multi-step</p>
                  </div>
                  <ChevronRight size={18} className="text-indigo-300 dark:text-indigo-500 opacity-0 -translate-x-2 group-hover/diff:opacity-100 group-hover/diff:translate-x-0 transition-all" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-5">Press <kbd className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-600">Esc</kbd> to cancel</p>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Custom Session Modal */}
        <Dialog open={showCustomModal} onClose={() => setShowCustomModal(false)} className="relative z-50">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md mx-4 sm:mx-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 transition-all duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">Custom Session</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your practice block</p>
                </div>
                <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 font-heading mb-1.5">System/Topic</label>
                  <select value={customSystem} onChange={(e) => setCustomSystem(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="mixed">All Systems (Mixed)</option>
                    {systems.map(s => <option key={s.name} value={s.name}>{s.name} ({s.total} Qs)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 font-heading mb-1.5">Difficulty</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['mixed', 'easy', 'medium', 'hard'].map((diff) => (
                      <button key={diff} onClick={() => setCustomDifficulty(diff)}
                        className={`py-2 rounded-lg text-sm font-bold capitalize transition-colors ${customDifficulty === diff ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border-2 border-indigo-500' : 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 font-heading mb-1.5">Number of Questions</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 40, 100].map((num) => (
                      <button key={num} onClick={() => setCustomCount(num)}
                        className={`py-2 rounded-lg text-sm font-bold transition-colors ${customCount === num ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border-2 border-indigo-500' : 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                        {num === 100 ? 'Max' : num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                  <button onClick={startCustomSession} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 font-heading transition-colors">
                      <Play size={18} fill="currentColor"/> Start Session
                  </button>
              </div>

            </DialogPanel>
          </div>
        </Dialog>

      </div>
    );
  }

  if (view === 'results') {
    const accuracy = Math.round((sessionCorrectCount / questions.length) * 100) || 0;
    return (
      <div className="animate-fadeIn w-full max-w-2xl mx-auto py-6 sm:py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
        <div className="bg-white dark:bg-slate-800 rounded-3xl w-full p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 w-full h-[6px] bg-indigo-500 dark:bg-indigo-500 rounded-t-3xl"></div>
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 mt-2">
            <Trophy size={32} className="text-indigo-600 dark:text-indigo-400 sm:w-10 sm:h-10 w-8 h-8" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 font-heading tracking-tight">Session Complete!</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-8 sm:mb-10">You've successfully finished your custom practice block.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="bg-[#f8fafc] dark:bg-slate-900/50 py-4 px-2 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 sm:mb-2 font-heading tracking-widest uppercase">Score</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tight">{accuracy}%</p>
            </div>
            <div className="bg-[#f8fafc] dark:bg-slate-900/50 py-4 px-2 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 sm:mb-2 font-heading tracking-widest uppercase">Correct</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">{sessionCorrectCount}</p>
            </div>
            <div className="bg-[#f8fafc] dark:bg-slate-900/50 py-4 px-2 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 sm:mb-2 font-heading tracking-widest uppercase">Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tight">{questions.length}</p>
            </div>
            <div className="bg-[#f8fafc] dark:bg-slate-900/50 py-4 px-2 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 sm:mb-2 font-heading tracking-widest uppercase">Time</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tight">
                 {Math.floor(sessionTotalTimeSec / 60)}m {sessionTotalTimeSec % 60}s
              </p>
            </div>
          </div>

          <button onClick={() => setView('overview')} className="w-full sm:w-auto bg-[#6366f1] text-white px-8 py-3.5 rounded-xl font-bold text-[15px] sm:text-base shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all outline-none focus:ring-4 focus:ring-indigo-500/30 flex items-center justify-center gap-2 mx-auto font-heading tracking-wide">
            <Check size={18} strokeWidth={2.5} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading questions
  if (loadingQuestions || questions.length === 0) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center h-[60vh]">
        <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading questions...</p>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];
  
  return (
    <div className="animate-fadeIn h-[calc(100vh-140px)] flex flex-col">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 sm:gap-0">
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 flex-wrap">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button onClick={() => setView('overview')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><XCircle size={20} /></button>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-none justify-center sm:justify-start flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-white font-heading text-sm sm:text-base">{activeSystem} Block</span>
                  {
                    isCustomSession && activeSystem === 'Mixed Systems' && currentQ.system && (
                       <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-lg font-bold border font-heading uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50`}>
                         {currentQ.system}
                       </span>
                    )
                  }
                  {selectedDifficulty && !isCustomSession && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-lg font-bold border font-heading capitalize bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50">
                      {selectedDifficulty}
                    </span>
                  )}
                  {isCustomSession && currentQ.difficulty && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-lg font-bold border font-heading capitalize bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50">
                      {currentQ.difficulty}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium font-mono tabular-nums">Question {currentQuestionIdx + 1} of {questions.length}</div>
            </div>
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4">
                <span className="sm:hidden text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium font-mono tabular-nums">Q {currentQuestionIdx + 1}/{questions.length}</span>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 font-mono text-sm px-3 py-1 rounded border tabular-nums border-slate-200 dark:border-slate-700 transition-colors ${
                      timerEnabled && secondsLeft === 0 ? 'bg-indigo-700 dark:bg-indigo-600 text-white border-indigo-800 dark:border-indigo-500 shadow-md shadow-indigo-300/40 dark:shadow-none' :
                      timerEnabled && secondsLeft <= 30 && !isSubmitted ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 animate-pulse' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                      <Timer size={14} /> {timerEnabled ? formatTime(secondsLeft) : "Unlimited"}
                  </div>
                  <button 
                      onClick={async () => {
                          if (!user) return;
                          const qId = currentQ.id;
                          const newMarked = new Set(markedQuestionIds);
                          if (newMarked.has(qId)) {
                              newMarked.delete(qId);
                              setMarkedQuestionIds(newMarked);
                              try { await deleteMarkedQuestion(user.id, qId); } catch (err) { console.error("Failed to unmark question:", err); }
                          } else {
                              newMarked.add(qId);
                              setMarkedQuestionIds(newMarked);
                              try { await saveMarkedQuestion(user.id, qId); } catch (err) { console.error("Failed to mark question:", err); }
                          }
                      }}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                          markedQuestionIds.has(currentQ.id) 
                              ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300' 
                              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                  >
                      <Flag size={16} className={markedQuestionIds.has(currentQ.id) ? "fill-indigo-500 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" : ""} /> 
                      <span className="hidden sm:inline">{markedQuestionIds.has(currentQ.id) ? 'Marked' : 'Mark'}</span>
                  </button>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                  <button 
                      onClick={() => setShowLabRefModal(true)}
                      className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800"
                  >
                      <Book size={16} /> 
                      <span>Lab Values</span>
                  </button>
                </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-1/3 min-h-[200px] lg:h-auto shrink-0">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 font-heading">Patient scenario</h3>
                <p className="text-sm md:text-[15px] text-slate-600 dark:text-slate-300 leading-[1.8] tracking-wide font-body">{currentQ.scenario}</p>
                
                {currentQ.lab_results && Object.keys(currentQ.lab_results).length > 0 && (
                  <div className="mt-8 overflow-hidden rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-white dark:bg-slate-800/50 shadow-sm">
                      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 px-4 py-2 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                          <h4 className="text-indigo-800 dark:text-indigo-200 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 font-heading">
                              <LabIcon size={14}/> Patient Laboratory Results
                          </h4>
                          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold font-mono">ID: LAB-{currentQ.id.substring(0,6).toUpperCase()}</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                          {Object.entries(currentQ.lab_results).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-1 last:border-0 last:pb-0">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{key}</span>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">{val}</span>
                            </div>
                          ))}
                      </div>
                  </div>
                )}
            </div>

            <div className="w-full lg:w-1/2 flex flex-col bg-slate-50/50 dark:bg-slate-900 h-2/3 lg:h-auto">
                <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <p className="font-semibold text-slate-900 dark:text-white text-base lg:text-lg mb-6 leading-relaxed font-heading">{currentQ.question}</p>
                    <div className="space-y-3">
                        {currentQ.options.map((opt) => {
                            let statusClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm";
                            if (isSubmitted) {
                                if (opt.id === currentQ.correct_id) statusClass = "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-700 ring-1 ring-emerald-500 dark:ring-emerald-700";
                                else if (selectedOption === opt.id && opt.id !== currentQ.correct_id) statusClass = "bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-700 ring-1 ring-rose-500 dark:ring-rose-700";
                                else statusClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60";
                            } else if (selectedOption === opt.id) {
                                statusClass = "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500";
                            }
                            return (
                                <button key={opt.id} onClick={() => !isSubmitted && setSelectedOption(opt.id)} disabled={isSubmitted}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${statusClass}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border font-heading ${
                                        isSubmitted && opt.id === currentQ.correct_id ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                        isSubmitted && selectedOption === opt.id && opt.id !== currentQ.correct_id ? 'bg-rose-500 border-rose-500 text-white' :
                                        selectedOption === opt.id ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                                    }`}>{opt.id}</span>
                                    <span className={`text-sm font-medium ${isSubmitted && opt.id === currentQ.correct_id ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>{opt.text}</span>
                                    {isSubmitted && opt.id === currentQ.correct_id && <Check size={18} className="ml-auto text-emerald-600 dark:text-emerald-400" />}
                                    {isSubmitted && selectedOption === opt.id && opt.id !== currentQ.correct_id && <XCircle size={18} className="ml-auto text-rose-500 dark:text-rose-400" />}
                                </button>
                            );
                        })}
                    </div>

                    {isSubmitted && (
                        <div className="mt-8 animate-fadeIn space-y-4">
                             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2 font-heading">
                                    Explanation
                                    <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 font-heading">
                                        <Zap size={10} fill="currentColor" /> Essential
                                    </span>
                                </h4>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">{currentQ.explanation}</p>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50 mb-4">
                                    <strong className="text-indigo-900 dark:text-indigo-300 text-xs uppercase tracking-wide block mb-1 font-heading">Bottom Line</strong>
                                    <p className="text-indigo-800 dark:text-indigo-200 text-sm font-medium">{currentQ.takeaway ?? ''}</p>
                                </div>
                                {!showTutor && (
                                    <button onClick={() => setShowTutor(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors font-heading">
                                        <Bot size={18} /> Ask AI Tutor
                                    </button>
                                )}
                             </div>
                             {showTutor && (
                                <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm animate-fadeIn flex flex-col gap-3">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 font-heading text-sm"><Sparkles size={15} /> AI Clinical Tutor</h4>

                                    {/* Chat history */}
                                    {chatMessages.length === 0 ? (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            <button onClick={() => setTutorQuery("Simplify this explanation")} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full hover:bg-indigo-50 dark:hover:bg-slate-600 font-heading">Simplify</button>
                                            <button onClick={() => setTutorQuery("Give me a mnemonic")} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full hover:bg-indigo-50 dark:hover:bg-slate-600 font-heading">Mnemonic</button>
                                            <button onClick={() => setTutorQuery("Why is option A incorrect?")} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full hover:bg-indigo-50 dark:hover:bg-slate-600 font-heading">Why not A?</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                                            {chatMessages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                                                        msg.role === 'user'
                                                            ? 'bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap'
                                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-indigo-50 dark:border-slate-600 rounded-bl-sm shadow-sm'
                                                    }`}>
                                                        {msg.role === 'user' ? msg.text : (
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                                    strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                                                                    em: ({ children }) => <em className="italic">{children}</em>,
                                                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                                                    h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
                                                                    h2: ({ children }) => <h2 className="font-bold text-sm mb-1">{children}</h2>,
                                                                    h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
                                                                    code: ({ children, className }) => {
                                                                        const isBlock = className?.includes('language-');
                                                                        return isBlock
                                                                            ? <code className="block bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs font-mono my-1 overflow-x-auto">{children}</code>
                                                                            : <code className="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>;
                                                                    },
                                                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-300 dark:border-indigo-600 pl-3 italic text-slate-500 dark:text-slate-400 my-1">{children}</blockquote>,
                                                                    hr: () => <hr className="border-slate-200 dark:border-slate-600 my-2" />,
                                                                }}
                                                            >
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {isTutorLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white dark:bg-slate-700 border border-indigo-50 dark:border-slate-600 px-3 py-2 rounded-xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>
                                    )}

                                    {/* Input row */}
                                    <div className="flex gap-2">
                                        <input type="text" value={tutorQuery} onChange={(e) => setTutorQuery(e.target.value)}
                                            placeholder="Ask a follow-up question..."
                                            className="flex-1 px-4 py-2 text-sm border border-indigo-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                                            onKeyDown={(e) => e.key === 'Enter' && !isTutorLoading && askAiTutor()} />
                                        <button onClick={askAiTutor} disabled={isTutorLoading || !tutorQuery.trim()}
                                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                            {isTutorLoading ? <RotateCw size={18} className="animate-spin"/> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {/* Personal Notebook Section */}
                    {questions.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                             <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-slate-800 dark:text-slate-200 font-bold text-sm mb-3 flex items-center gap-2 font-heading">
                                    <FileText size={16} className="text-indigo-600 dark:text-indigo-400" /> My Personal Notes
                                </h4>
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    // Auto-save on blur
                                    onBlur={handleSaveNote}
                                    placeholder="Add your own notes, mnemonics, or reminders here..."
                                    className="w-full text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 resize-none h-24 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {noteContent !== lastSavedNote ? 'Unsaved changes...' : lastSavedNote ? 'Saved to Profile' : 'Auto-saves on exit'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {lastSavedNote && (
                                            <button
                                                onMouseDown={handleDeleteNote}
                                                disabled={isNoteSaving}
                                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                title="Delete Note"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        {noteContent !== lastSavedNote && (
                                            <button 
                                                onClick={handleSaveNote} 
                                                disabled={isNoteSaving}
                                                className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors flex items-center gap-1"
                                            >
                                                <Save size={12} /> {isNoteSaving ? 'Saving...' : 'Save Note'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shrink-0 gap-4">
                    <button className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-sm hidden sm:block">Suspend Session</button>
                    <button className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-sm sm:hidden"><XCircle size={20}/></button>
                    
                    <div className="flex gap-3 w-full sm:w-auto justify-end">
                        {!isSubmitted ? (
                             <button onClick={handleSubmit} disabled={!selectedOption}
                                className={`flex-1 sm:flex-none px-6 py-2.5 sm:py-2 rounded-lg font-bold text-white transition-colors font-heading ${selectedOption ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'}`}>
                                Submit Answer
                             </button>
                        ) : (
                             <button onClick={handleNextQuestion}
                                className="flex-1 sm:flex-none px-6 py-2.5 sm:py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 font-heading">
                                Next Question <ChevronRight size={18} />
                             </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {/* Delete Confirmation Modal - Portalled to body to avoid stacking context issues */}
        {createPortal(
          <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="relative z-[100]">
            <DialogBackdrop
              transition
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel
                transition
                className="w-full max-w-sm mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 transition-all duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
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
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-heading"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteNote}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors font-heading shadow-lg shadow-rose-200 dark:shadow-none"
                    >
                      Delete It
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </Dialog>,
          document.body
        )}

      {/* Lab Reference Modal */}
      {createPortal(
        <Dialog open={showLabRefModal} onClose={() => setShowLabRefModal(false)} className="relative z-[150]">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] transition-all duration-300 data-[closed]:scale-95 data-[closed]:opacity-0 overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">Handheld Lab Reference</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Standard normal ranges for clinical practice</p>
                </div>
                <button onClick={() => setShowLabRefModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 sm:p-6 shrink-0 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search labs (e.g. Sodium, Hemoglobin)..."
                        value={labSearchQuery}
                        onChange={(e) => setLabSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder:text-slate-400 dark:text-white"
                      />
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar">
                {['Blood, Serum, Plasma', 'Hematologic', 'Cerebrospinal Fluid', 'Urine'].map(cat => {
                    const labs = LAB_REFERENCE_DATA.filter(l => l.category === cat && (l.name.toLowerCase().includes(labSearchQuery.toLowerCase())));
                    if (labs.length === 0) return null;
                    return (
                        <div key={cat} className="mb-6 sm:mb-8 last:mb-0">
                            <h4 className="px-4 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-3 font-heading">{cat}</h4>
                            <div className="space-y-1">
                                {labs.map((lab, i) => (
                                    <div key={i} className="px-4 py-2 sm:py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-between items-center group">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lab.name}</span>
                                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">{lab.range}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {LAB_REFERENCE_DATA.filter(l => l.name.toLowerCase().includes(labSearchQuery.toLowerCase())).length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 italic">No matching laboratory values found.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-heading">USMLE Step 1/2 Clinical Reference Material</p>
              </div>
            </DialogPanel>
          </div>
        </Dialog>,
        document.body
      )}
    </div>
  );
};

export default QbankPage;
