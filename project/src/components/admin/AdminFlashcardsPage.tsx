import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  Pencil,
  X,
  Zap,
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
} from 'lucide-react';
import { ADMIN_SURFACE_SHADOW_CLASS, adminTableHeadRowClass, adminThClass, adminTdClass, adminTableRowClass } from '../../components/admin/adminDashboardPatterns';
import {
  fetchAdminSystemFlashcardTopics,
  fetchAdminSystemFlashcardsByTag,
  insertAdminSystemFlashcard,
  updateAdminSystemFlashcard,
  deleteAdminSystemFlashcard,
  deleteAdminSystemFlashcardsByTag,
  type FlashcardRow,
} from '../../lib/api';

const topicIcons: Record<string, typeof Heart> = {
  Anatomy: Bone,
  Biochemistry: FlaskConical,
  Physiology: Activity,
  Pharmacology: Pill,
  Pathology: Microscope,
  Microbiology: Bug,
  Immunology: Shield,
  'Behavioral Science': Users,
  Biostatistics: Calculator,
  Ethics: Scale,
  Genetics: Dna,
  Neuroscience: Brain,
};

const TOPIC_ICON_SURFACE = 'bg-slate-100 text-slate-600';

function snippet(text: string, max = 80) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function AdminFlashcardsPage() {
  const [view, setView] = useState<'topics' | 'deck'>('topics');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const [topicRows, setTopicRows] = useState<{ tag: string; card_count: number }[]>([]);
  const [deckCards, setDeckCards] = useState<FlashcardRow[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingDeck, setLoadingDeck] = useState(false);

  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [flashDelete, setFlashDelete] = useState<
    { kind: 'card'; card: FlashcardRow } | { kind: 'deck'; tag: string } | null
  >(null);
  const [flashDeleteBusy, setFlashDeleteBusy] = useState(false);
  const [tag, setTag] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const loadTopics = useCallback(async () => {
    setLoadingTopics(true);
    setError(null);
    try {
      const data = await fetchAdminSystemFlashcardTopics();
      setTopicRows(data);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load flashcard topics');
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const loadDeck = useCallback(async (topicTag: string) => {
    setLoadingDeck(true);
    setError(null);
    try {
      const list = await fetchAdminSystemFlashcardsByTag(topicTag);
      setDeckCards(list);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load cards');
      setDeckCards([]);
    } finally {
      setLoadingDeck(false);
    }
  }, []);

  const openTopic = (topicTag: string) => {
    setActiveTopic(topicTag);
    setView('deck');
    void loadDeck(topicTag);
  };

  const backToTopics = () => {
    setView('topics');
    setActiveTopic(null);
    setDeckCards([]);
    void loadTopics();
  };

  const resetForm = () => {
    setEditingCard(null);
    setTag('');
    setDifficulty('Medium');
    setQuestion('');
    setAnswer('');
  };

  const openCreate = () => {
    resetForm();
    if (view === 'deck' && activeTopic) setTag(activeTopic);
    setModalOpen(true);
  };

  const openEdit = (card: FlashcardRow) => {
    setEditingCard(card);
    setTag(card.tag);
    setDifficulty(card.difficulty);
    setQuestion(card.question);
    setAnswer(card.answer);
    setModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim() || !question.trim() || !answer.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingCard) {
        await updateAdminSystemFlashcard(editingCard.id, {
          tag: tag.trim(),
          difficulty,
          question,
          answer,
          source: editingCard.source,
        });
      } else {
        await insertAdminSystemFlashcard({
          tag: tag.trim(),
          difficulty,
          question,
          answer,
        });
      }
      setModalOpen(false);
      resetForm();
      await loadTopics();
      if (view === 'deck' && activeTopic) {
        await loadDeck(activeTopic);
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not save flashcard');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteCardDialog = (card: FlashcardRow) => {
    setFlashDelete({ kind: 'card', card });
  };

  const openDeleteDeckDialog = (deckTag: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFlashDelete({ kind: 'deck', tag: deckTag });
  };

  const confirmFlashDelete = async () => {
    if (!flashDelete) return;
    setFlashDeleteBusy(true);
    setError(null);
    try {
      if (flashDelete.kind === 'card') {
        await deleteAdminSystemFlashcard(flashDelete.card.id);
        await loadTopics();
        if (activeTopic) await loadDeck(activeTopic);
      } else {
        await deleteAdminSystemFlashcardsByTag(flashDelete.tag);
        if (activeTopic === flashDelete.tag) backToTopics();
        else await loadTopics();
      }
      setFlashDelete(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not delete');
    } finally {
      setFlashDeleteBusy(false);
    }
  };

  const filteredTopics = topicRows.filter((r) =>
    r.tag.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const totalCards = topicRows.reduce((s, t) => s + t.card_count, 0);

  const flashcardFormModal = (
    <FlashcardModal
      open={modalOpen}
      title={editingCard ? 'Edit flashcard' : 'New flashcard'}
      tag={tag}
      setTag={setTag}
      lockTag={view === 'deck' && activeTopic ? !editingCard : false}
      difficulty={difficulty}
      setDifficulty={setDifficulty}
      question={question}
      setQuestion={setQuestion}
      answer={answer}
      setAnswer={setAnswer}
      saving={saving}
      onClose={() => {
        setModalOpen(false);
        resetForm();
      }}
      onSubmit={handleModalSubmit}
    />
  );

  const flashDeleteDialog = (
    <Dialog
      open={flashDelete !== null}
      onClose={() => {
        if (!flashDeleteBusy) setFlashDelete(null);
      }}
      className="relative z-[60]"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <div className="flex justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">
              {flashDelete?.kind === 'deck' ? 'Delete entire topic?' : 'Delete flashcard?'}
            </h3>
            <button
              type="button"
              disabled={flashDeleteBusy}
              onClick={() => setFlashDelete(null)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {flashDelete?.kind === 'deck'
              ? `All system cards tagged “${flashDelete.tag}” will be removed. This cannot be undone.`
              : 'This removes the card from the shared deck.'}
          </p>
          {flashDelete?.kind === 'card' && (
            <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {snippet(flashDelete.card.question, 220)}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              disabled={flashDeleteBusy}
              onClick={() => setFlashDelete(null)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={flashDeleteBusy}
              onClick={() => void confirmFlashDelete()}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {flashDeleteBusy && <Loader2 size={16} className="animate-spin" />}
              Delete
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );

  // ----- Deck view -----
  if (view === 'deck' && activeTopic) {
    return (
      <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={backToTopics}
              className="mt-1 p-2 rounded-xl border border-slate-200 bg-white hover:bg-[#FAFBFD] text-slate-600 shrink-0"
              aria-label="Back to topics"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl font-medium text-slate-900 tracking-tight">{activeTopic}</h1>
              <p className="text-[15px] text-slate-500 mt-1">
                {deckCards.length} card{deckCards.length === 1 ? '' : 's'} — edit or remove cards below.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadDeck(activeTopic)}
              className="bg-white border border-slate-200 hover:bg-[#FAFBFD] text-[13px] font-medium rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={16} className={loadingDeck ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="bg-[#365bce] hover:bg-[#2c4ca8] text-white text-[13px] font-bold rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Add card to topic
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3">{error}</div>
        )}

        <div className={`bg-white ${ADMIN_SURFACE_SHADOW_CLASS} rounded-[32px] border border-slate-200/60 overflow-hidden`}>
          {loadingDeck ? (
            <div className="flex items-center justify-center py-24 text-slate-500 gap-2 text-sm">
              <Loader2 className="animate-spin" size={20} />
              Loading cards…
            </div>
          ) : deckCards.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No cards in this topic.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className={adminTableHeadRowClass}>
                    <th className={adminThClass}>Front (question)</th>
                    <th className={adminThClass}>Back (answer)</th>
                    <th className={adminThClass}>Difficulty</th>
                    <th className={adminThClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {deckCards.map((card) => (
                    <tr key={card.id} className={adminTableRowClass}>
                      <td className={adminTdClass}>
                        <span title={card.question}>{snippet(card.question, 120)}</span>
                      </td>
                      <td className={adminTdClass}>
                        <span title={card.answer}>{snippet(card.answer, 120)}</span>
                      </td>
                      <td className={`${adminTdClass} text-[13px]`}>{card.difficulty}</td>
                      <td className={adminTdClass}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(card)}
                            className="text-[#365bce] hover:bg-[#365bce]/10 p-2 rounded-lg"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteCardDialog(card)}
                            className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      {flashcardFormModal}
      {flashDeleteDialog}
      </>
    );
  }

  // ----- Topics overview (student-style grid: names + counts only) -----
  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium text-slate-900 tracking-tight">Flashcard Management</h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Pick a topic to view and edit cards ({totalCards} total).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[#365bce] hover:bg-[#2c4ca8] text-white text-[13px] font-bold rounded-xl px-4 py-2.5 shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add flashcard
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className={`bg-white ${ADMIN_SURFACE_SHADOW_CLASS} rounded-[32px] border border-slate-200/60 overflow-hidden flex flex-col min-h-[400px]`}>
        <div className="px-6 py-5 border-b border-slate-200/60 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#365bce]/20 focus:bg-white transition-colors text-[13px]"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadTopics()}
              className="bg-white border border-slate-200 hover:bg-[#FAFBFD] text-[13px] font-medium rounded-xl px-4 py-2 shadow-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loadingTopics ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              className="bg-white border border-slate-200 hover:bg-[#FAFBFD] text-[13px] font-medium rounded-xl px-4 py-2 shadow-sm transition-colors flex items-center gap-2 shrink-0 opacity-60 cursor-not-allowed"
              disabled
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        <div className="p-6">
          {loadingTopics ? (
            <div className="flex items-center justify-center py-24 text-slate-500 gap-2 text-sm">
              <Loader2 className="animate-spin" size={20} />
              Loading topics…
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              {topicRows.length === 0
                ? 'No system flashcards yet. Add a card or run seed SQL.'
                : 'No topics match your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((deck) => {
                const IconComponent = topicIcons[deck.tag] || Zap;
                return (
                  <div
                    key={deck.tag}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTopic(deck.tag)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openTopic(deck.tag);
                      }
                    }}
                    className="relative bg-[#FAFBFD] hover:bg-white transition-colors rounded-[24px] border border-slate-200/80 p-5 cursor-pointer group text-left"
                  >
                    <button
                      type="button"
                      onClick={(e) => openDeleteDeckDialog(deck.tag, e)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 z-10"
                      title="Delete entire topic"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex justify-between items-start mb-4 pr-10">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${TOPIC_ICON_SURFACE} transition-transform group-hover:scale-105`}
                      >
                        <IconComponent size={24} />
                      </div>
                      <span className="bg-white text-slate-600 text-xs font-bold px-2 py-1 rounded-md border border-slate-100 font-mono tabular-nums">
                        {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-semibold text-slate-900 mb-1 group-hover:text-[#365bce] transition-colors font-heading">
                      {deck.tag}
                    </h3>
                    <p className="text-[13px] text-slate-500">Open to view and edit cards</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
    {flashcardFormModal}
    {flashDeleteDialog}
    </>
  );
}

function FlashcardModal({
  open,
  title,
  tag,
  setTag,
  lockTag,
  difficulty,
  setDifficulty,
  question,
  setQuestion,
  answer,
  setAnswer,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  tag: string;
  setTag: (v: string) => void;
  lockTag: boolean;
  difficulty: string;
  setDifficulty: (v: string) => void;
  question: string;
  setQuestion: (v: string) => void;
  answer: string;
  setAnswer: (v: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      className="relative z-[55]"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 z-[56] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
        <DialogPanel
          transition
          className="my-6 w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 transition-all duration-300 data-[closed]:scale-[0.98] data-[closed]:opacity-0 max-h-[min(100vh-3rem,calc(100vh-2rem))] overflow-y-auto sm:my-8"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {lockTag ? 'Topic is fixed for this deck view.' : 'Pick a topic and fill both sides of the card.'}
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Topic name</label>
            <input
              required
              disabled={lockTag}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="e.g. Cardiology"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {['Easy', 'Medium', 'Hard', 'High Yield'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Question (front)</label>
            <textarea
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Answer (back)</label>
            <textarea
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white/95 pt-4 pb-1 backdrop-blur-sm">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#365bce] px-4 py-2 text-sm font-bold text-white hover:bg-[#2c4ca8] disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
