import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCw,
  Play,
  Pause,
  Zap,
  Sparkles,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bone,
  FlaskConical,
  Activity,
  Pill,
  Microscope,
  Bug,
  Shield,
  Users,
  Calculator,
  Scale,
  Dna,
  Brain,
  Heart,
  XCircle,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import {
  createFlashcard,
  fetchFlashcardTopics,
  fetchFlashcardsByTag,
  FlashcardRow,
  FlashcardTopicInfo,
} from '../lib/api';

const FlashcardsPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  // View state: 'overview' shows topic grid, 'cards' shows the deck
  const [view, setView] = useState<'overview' | 'cards'>('overview');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Topic grid state
  const [topics, setTopics] = useState<FlashcardTopicInfo[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const tagDeepLinkConsumed = useRef(false);

  // Card deck state
  const [cards, setCards] = useState<FlashcardRow[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");

  // Icon mapping by topic name (same as Quiz page)
  const topicIcons: Record<string, typeof Heart> = {
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

  /** Single accent for all topic tiles (matches app shell). */
  const topicIconClass =
    'bg-indigo-50 dark:bg-indigo-900/35 text-indigo-600 dark:text-indigo-400';

  // Fetch topics on mount and when returning to overview
  useEffect(() => {
    if (!user || view !== 'overview') return;
    const loadTopics = async () => {
      try {
        if (topics.length === 0) setLoadingTopics(true);
        const data = await fetchFlashcardTopics(user.id);
        setTopics(data);
      } catch (err) {
        console.error("Failed to fetch flashcard topics:", err);
      } finally {
        setLoadingTopics(false);
      }
    };
    loadTopics();
  }, [user, view]);

  // Handle deep linking for a specific flashcard (go straight to cards view)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cardId = searchParams.get('id');
    if (!user || !cardId) return;

    // Fetch only the single card by id, then load its topic deck
    supabase
      .from('flashcards')
      .select('*')
      .eq('id', cardId)
      .single()
      .then(({ data: card, error }) => {
        if (error || !card) return;
        // Now fetch the rest of that topic's cards
        fetchFlashcardsByTag(user.id, card.tag).then((topicCards) => {
          const idx = topicCards.findIndex(c => c.id === cardId);
          setCards(topicCards);
          setCurrentIndex(idx !== -1 ? idx : 0);
          setActiveTopic(card.tag);
          setView('cards');
        }).catch(console.error);
      });
  }, [user, location.search]);

  useEffect(() => {
    tagDeepLinkConsumed.current = false;
  }, [location.search]);

  // Start studying a specific topic
  const startTopic = useCallback(
    async (tag: string) => {
      if (!user) return;
      setActiveTopic(tag);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsAutoPlaying(false);
      setLoadingCards(true);
      setView('cards');

      try {
        const data = await fetchFlashcardsByTag(user.id, tag);
        setCards(data);
      } catch (err) {
        console.error('Failed to fetch flashcards for topic:', err);
        setView('overview');
      } finally {
        setLoadingCards(false);
      }
    },
    [user],
  );

  // Open deck from admin link: /student/flashcards?tag=TopicName
  useEffect(() => {
    if (!user || view !== 'overview' || loadingTopics || topics.length === 0) return;
    const params = new URLSearchParams(location.search);
    if (params.get('id')) return;
    const rawTag = params.get('tag');
    if (!rawTag || tagDeepLinkConsumed.current) return;
    const decoded = decodeURIComponent(rawTag);
    if (!topics.some((t) => t.tag === decoded)) return;
    tagDeepLinkConsumed.current = true;
    void startTopic(decoded);
  }, [user, view, loadingTopics, topics, location.search, startTopic]);

  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  const generateFlashcards = async () => {
    if (!aiTopic.trim() || !user) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tutor', {
        body: { mode: 'flashcard_generate', topic: aiTopic.trim() },
      });

      if (error) throw new Error(error.message);

      const responseText: string = data?.text ?? "[]";
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        alert("That topic doesn't appear to be related to medicine. Please enter a medical or USMLE topic.");
        return;
      }

      // Save each card to Supabase
      const savedCards: FlashcardRow[] = [];
      for (const card of parsed) {
        const saved = await createFlashcard(user.id, {
          tag: card.tag,
          difficulty: card.difficulty,
          question: card.question,
          answer: card.answer,
          source: 'ai_generated',
        });
        savedCards.push(saved);
      }

      // After generating, refresh topics and go to overview
      setShowAiModal(false);
      setAiTopic("");
      const updatedTopics = await fetchFlashcardTopics(user.id);
      setTopics(updatedTopics);
    } catch (err) {
      console.error("Failed to generate cards", err);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-play logic
  useEffect(() => {
    if (isAutoPlaying && cards.length > 0) {
      autoPlayRef.current = setInterval(() => {
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          setIsFlipped(false);
          setCurrentIndex((prev) => (prev + 1) % cards.length);
        }
      }, 4000);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, isFlipped, cards.length]);

  // Helper for difficulty styling
  const getDifficultyConfig = (difficulty: string) => {
    const d = difficulty?.toLowerCase() || '';
    if (d.includes('easy'))
      return {
        label: 'Easy',
        className:
          'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/60',
      };
    if (d.includes('medium'))
      return {
        label: 'Medium',
        className:
          'bg-indigo-100/80 dark:bg-indigo-900/45 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700/50',
      };
    if (d.includes('hard') || d.includes('high yield'))
      return {
        label: 'Hard',
        className:
          'bg-indigo-200/90 dark:bg-indigo-800/50 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-600',
      };
    return {
      label: 'Medium',
      className:
        'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
    };
  };

  // AI Modal component (shared between views)
  const AiModal = () => (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-heading">
            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
            Generate AI Deck
          </h3>
          <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter a medical topic and AI will create high-yield cards.</p>
        <input
          type="text"
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          placeholder="e.g. Pharmacology of Heart Failure"
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
        />
        <button
          onClick={generateFlashcards}
          disabled={isGenerating}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200/80 dark:shadow-none transition-all disabled:opacity-70 flex justify-center items-center gap-2 font-heading"
        >
          {isGenerating ? <RotateCw className="animate-spin" /> : <Sparkles size={18} />}
          {isGenerating ? "Generating..." : "Create Flashcards"}
        </button>
      </div>
    </div>
  );

  // ============================
  // OVERVIEW VIEW — Topic Grid
  // ============================
  if (view === 'overview') {
    return (
      <div className="animate-fadeIn max-w-6xl mx-auto relative">
        {showAiModal && <AiModal />}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">Flashcards</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
              <span className="font-mono tabular-nums">Select a topic</span> ({topics.reduce((sum, t) => sum + t.total, 0)} Cards)
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingTopics ? (
            // Skeleton cards while loading
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700"></div>
                  <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="h-5 w-28 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded mb-4"></div>
              </div>
            ))
          ) : topics.length === 0 ? (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Plus size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2 font-heading">No flashcards yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center max-w-md">
                Create your first deck using AI — just enter a medical topic and we'll generate high-yield cards instantly.
              </p>

            </div>
          ) : (
            topics.map((topic) => {
              const IconComponent = topicIcons[topic.tag] || Zap;
              return (
                <div
                  key={topic.tag}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => startTopic(topic.tag)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${topicIconClass} transition-transform group-hover:scale-110`}>
                      <IconComponent size={24} />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded font-mono tabular-nums">
                      {topic.total} {topic.total === 1 ? 'Card' : 'Cards'}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 font-heading">{topic.tag}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">All Difficulties</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    {(['Easy', 'Medium', 'Hard'] as const).map((lbl) => (
                      <span
                        key={lbl}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ============================
  // CARDS VIEW — Deck Viewer
  // ============================

  // Loading cards
  if (loadingCards) {
    return (
      <div className="animate-fadeIn max-w-4xl mx-auto flex flex-col items-center">
        {/* Header skeleton */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <div className="h-7 w-48 sm:w-56 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-5 w-14 bg-indigo-100 dark:bg-indigo-900/50 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        {/* Card skeleton */}
        <div className="relative w-full aspect-[16/12] sm:h-[420px] sm:aspect-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl p-6 sm:p-10 flex flex-col items-center justify-center">
          <div className="space-y-4 w-full max-w-lg">
            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded mx-auto animate-pulse"></div>
            <div className="h-7 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // No cards found for this topic
  if (cards.length === 0) {
    return (
      <div className="animate-fadeIn max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
          <Plus size={32} className="text-indigo-400" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2 font-heading">No cards for this topic</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center max-w-md">
          There are no flashcards for "{activeTopic}" yet.
        </p>
        <button
          onClick={() => setView('overview')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors flex items-center gap-2 font-heading"
        >
          <ChevronLeft size={18} /> Back to Topics
        </button>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, cards.length - 1);
  const currentCard = cards[safeIndex];
  const difficultyConfig = currentCard ? getDifficultyConfig(currentCard.difficulty) : { label: '', className: '' };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto flex flex-col items-center relative">
      {showAiModal && <AiModal />}

      {/* Header with back button */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setView('overview');
              setIsAutoPlaying(false);
              setIsFlipped(false);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <XCircle size={20} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight font-heading">{activeTopic}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-200 dark:border-indigo-800 font-heading">Step 1</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{cards.length} cards</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm font-mono tabular-nums">
            {safeIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${((safeIndex + 1) / cards.length) * 100}%` }}
        ></div>
      </div>

      {/* Card */}
      <div
        className="relative w-full aspect-[4/5] sm:aspect-[16/10] sm:h-[420px] flashcard-container cursor-pointer group select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''} shadow-2xl dark:shadow-slate-900/50`}>
          <div className="flashcard-front bg-white dark:bg-slate-800 p-6 md:p-8 lg:p-10 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100/50 dark:from-indigo-900/20 to-transparent rounded-bl-full -mr-12 -mt-12"></div>
            <div className="absolute top-5 left-5 flex flex-wrap gap-2">
              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-indigo-100 dark:border-indigo-800 shadow-sm font-heading">
                {currentCard.tag}
              </span>
            </div>
            <div className="absolute top-5 right-5">
              <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border shadow-sm font-heading ${difficultyConfig.className}`}>
                {difficultyConfig.label === 'Hard' && <Zap size={12} fill="currentColor" />}
                {difficultyConfig.label}
              </div>
            </div>
            <div className="w-full max-w-2xl px-4">
              <h3 className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4 opacity-70 font-heading">Clinical Concept</h3>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white leading-tight tracking-tight font-heading">
                {currentCard.question}
              </p>
            </div>
            <div className="absolute bottom-6 text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-2 opacity-60">
              <RotateCw size={14} /> Click to flip
            </div>
          </div>
          <div className="flashcard-back bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 lg:p-10 flex flex-col items-center justify-center border border-slate-700/50 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.12] dark:opacity-20" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="absolute top-5 right-5">
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                <Eye size={16} className="text-indigo-300" />
              </div>
            </div>
            <div className="w-full max-w-2xl px-4 relative z-10">
              <h3 className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center justify-center gap-2 font-heading">
                <span className="w-8 h-px bg-indigo-500/50"></span>
                Explanation
                <span className="w-8 h-px bg-indigo-500/50"></span>
              </h3>
              <p className="text-base md:text-lg lg:text-xl font-medium text-white leading-relaxed whitespace-pre-line">
                {currentCard.answer}
              </p>
            </div>
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <span className="text-xs text-slate-500 font-medium">Click to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-10 mb-8 sm:mb-0">
        <button
          onClick={handlePrev}
          className="p-3 sm:p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft size={20} className="sm:inline hidden" />
          <ChevronLeft size={24} className="sm:hidden inline" />
        </button>
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold transition-all shadow-md active:scale-95 tracking-wide font-heading text-sm sm:text-base ${
            isAutoPlaying
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent shadow-indigo-200/80 dark:shadow-none'
          }`}
        >
          {isAutoPlaying ? <><Pause size={18} className="sm:w-5 sm:h-5" fill="currentColor" /> Pause</> : <><Play size={18} className="sm:w-5 sm:h-5" fill="currentColor" /> Study Mode</>}
        </button>
        <button
          onClick={handleNext}
          className="p-3 sm:p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
        >
          <ChevronRight size={20} className="sm:inline hidden" />
          <ChevronRight size={24} className="sm:hidden inline" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardsPage;
