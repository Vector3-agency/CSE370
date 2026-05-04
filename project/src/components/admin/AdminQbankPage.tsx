import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Plus, Search, Filter, Loader2, Trash2, RefreshCw, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import {
  ADMIN_SURFACE_SHADOW_CLASS,
  adminTableHeadRowClass,
  adminThClass,
  adminTdClass,
  adminTableRowClass,
} from '../../components/admin/adminDashboardPatterns';
import {
  fetchAdminSystemQuestions,
  fetchAdminQuizSystemOptions,
  deleteAdminSystemQuestion,
  insertAdminSystemQuestion,
  updateAdminSystemQuestion,
  QuestionRow,
} from '../../lib/api';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

function snippet(text: string, max = 120) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function emptyChoices(): Record<(typeof OPTION_LETTERS)[number], string> {
  return { A: '', B: '', C: '', D: '', E: '' };
}

function choicesFromQuestion(q: QuestionRow): Record<(typeof OPTION_LETTERS)[number], string> {
  const c = emptyChoices();
  for (const o of q.options || []) {
    const L = o.id?.trim().toUpperCase();
    if (L === 'A' || L === 'B' || L === 'C' || L === 'D' || L === 'E') {
      c[L] = o.text ?? '';
    }
  }
  return c;
}

const PAGE_SIZE = 25;

const DIFFICULTY_FILTERS = [
  { value: '', label: 'All difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

export default function AdminQbankPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filterSystem, setFilterSystem] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [quizSystemOptions, setQuizSystemOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const editingLabResultsRef = useRef<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; preview: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [system, setSystem] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [scenario, setScenario] = useState('');
  const [questionStem, setQuestionStem] = useState('');
  const [choices, setChoices] = useState(emptyChoices);
  const [correctId, setCorrectId] = useState<(typeof OPTION_LETTERS)[number]>('A');
  const [explanation, setExplanation] = useState('');
  const [takeaway, setTakeaway] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, filterSystem, filterDifficulty]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const opts = await fetchAdminQuizSystemOptions();
        if (!cancelled) setQuizSystemOptions(opts);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: data, total: count } = await fetchAdminSystemQuestions({
        search: debounced || undefined,
        system: filterSystem || undefined,
        difficulty: filterDifficulty || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(data);
      setTotal(count);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [debounced, filterSystem, filterDifficulty, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const confirmDeleteQuiz = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteAdminSystemQuestion(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not delete question');
    } finally {
      setDeleteBusy(false);
    }
  };

  const resetCreateForm = () => {
    setEditingQuestionId(null);
    editingLabResultsRef.current = null;
    setSystem('');
    setDifficulty('medium');
    setScenario('');
    setQuestionStem('');
    setChoices(emptyChoices());
    setCorrectId('A');
    setExplanation('');
    setTakeaway('');
  };

  const openNewQuestion = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const openEditQuestion = (q: QuestionRow) => {
    setEditingQuestionId(q.id);
    editingLabResultsRef.current = q.lab_results ?? null;
    setSystem(q.system);
    setDifficulty(q.difficulty?.toLowerCase() || 'medium');
    setScenario(q.scenario === '—' ? '' : q.scenario || '');
    setQuestionStem(q.question);
    setChoices(choicesFromQuestion(q));
    const cid = (q.correct_id?.trim().toUpperCase() || 'A') as (typeof OPTION_LETTERS)[number];
    setCorrectId(OPTION_LETTERS.includes(cid) ? cid : 'A');
    setExplanation(q.explanation || '');
    setTakeaway(q.takeaway || '');
    setCreateOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const options = OPTION_LETTERS.map((id) => ({ id, text: choices[id] }))
        .filter((o) => o.text.trim().length > 0);

      const payload = {
        system,
        difficulty,
        scenario: scenario.trim() || '—',
        question: questionStem,
        options,
        correct_id: correctId,
        explanation,
        takeaway: takeaway.trim() || undefined,
        lab_results: editingQuestionId ? editingLabResultsRef.current : null,
      };

      if (editingQuestionId) {
        await updateAdminSystemQuestion(editingQuestionId, payload);
      } else {
        await insertAdminSystemQuestion(payload);
      }
      setCreateOpen(false);
      resetCreateForm();
      if (system.trim()) {
        const s = system.trim();
        setQuizSystemOptions((prev) =>
          prev.includes(s) ? prev : [...prev, s].sort((a, b) => a.localeCompare(b)),
        );
      }
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium text-slate-900 tracking-tight">Quiz Management</h1>
        </div>
        <button
          type="button"
          onClick={openNewQuestion}
          className="bg-[#365bce] hover:bg-[#2c4ca8] text-white text-[13px] font-bold rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Question
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className={`bg-white ${ADMIN_SURFACE_SHADOW_CLASS} rounded-[32px] border border-slate-200/60 overflow-hidden flex flex-col min-h-[500px]`}>
        <div className="px-6 py-5 border-b border-slate-200/60 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question, topic, or patient story…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#365bce]/20 focus:bg-white transition-colors text-[13px]"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => load()}
              className="bg-white border border-slate-200 hover:bg-[#FAFBFD] text-[13px] font-medium rounded-xl px-4 py-2 shadow-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Popover className="relative">
              <PopoverButton
                type="button"
                className={`bg-white border text-[13px] font-medium rounded-xl px-4 py-2 shadow-sm transition-colors flex items-center gap-2 shrink-0 ${
                  filterSystem || filterDifficulty
                    ? 'border-[#365bce]/50 ring-2 ring-[#365bce]/15 text-[#365bce]'
                    : 'border-slate-200 hover:bg-[#FAFBFD] text-slate-800'
                }`}
              >
                <Filter size={16} />
                Filters
                {(filterSystem || filterDifficulty) ? (
                  <span className="min-w-[1.125rem] h-[1.125rem] rounded-full bg-[#365bce] text-white text-[10px] font-bold leading-[1.125rem] text-center">
                    {(filterSystem ? 1 : 0) + (filterDifficulty ? 1 : 0)}
                  </span>
                ) : null}
              </PopoverButton>
              <PopoverPanel
                transition
                anchor={{ to: 'bottom end', gap: '8px' }}
                className="z-30 w-[min(100vw-2rem,20rem)] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/10 transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">Filter list</p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="qbank-filter-topic" className="block text-[12px] font-medium text-slate-700 mb-1">
                      Topic
                    </label>
                    <select
                      id="qbank-filter-topic"
                      value={filterSystem}
                      onChange={(e) => setFilterSystem(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] focus:ring-2 focus:ring-[#365bce]/20 focus:bg-white"
                    >
                      <option value="">All topics</option>
                      {quizSystemOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="qbank-filter-diff" className="block text-[12px] font-medium text-slate-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      id="qbank-filter-diff"
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] focus:ring-2 focus:ring-[#365bce]/20 focus:bg-white"
                    >
                      {DIFFICULTY_FILTERS.map((d) => (
                        <option key={d.value || 'all'} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={!filterSystem && !filterDifficulty}
                    onClick={() => {
                      setFilterSystem('');
                      setFilterDifficulty('');
                    }}
                    className="w-full rounded-xl border border-slate-200 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Clear filters
                  </button>
                </div>
              </PopoverPanel>
            </Popover>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={adminTableHeadRowClass}>
                <th className={adminThClass}>Question</th>
                <th className={adminThClass}>Topic</th>
                <th className={adminThClass}>Difficulty</th>
                <th className={adminThClass}>Status</th>
                <th className={adminThClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 text-sm">
                    <Loader2 className="inline animate-spin mr-2" size={18} />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 text-sm">
                    No system questions found. Run <code className="text-xs bg-slate-100 px-1 rounded">seed_questions.sql</code> or widen search.
                  </td>
                </tr>
              ) : (
                rows.map((q) => (
                  <tr key={q.id} className={adminTableRowClass}>
                    <td className={adminTdClass}>
                      <div className="font-medium text-slate-900 line-clamp-2 max-w-[380px]" title={q.question}>
                        {snippet(q.question)}
                      </div>
                    </td>
                    <td className={adminTdClass}>
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">{q.system}</span>
                    </td>
                    <td className={`${adminTdClass} capitalize`}>{q.difficulty}</td>
                    <td className={adminTdClass}>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        System
                      </span>
                    </td>
                    <td className={adminTdClass}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditQuestion(q)}
                          className="text-[#365bce] hover:bg-[#365bce]/10 p-1 rounded-lg"
                          title="Edit question"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: q.id, preview: q.question })}
                          className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                          title="Delete question"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && total > 0 && (
          <div className="px-6 py-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-600">
            <span className="tabular-nums">
              {total} question{total === 1 ? '' : 's'} · Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 font-medium hover:bg-[#FAFBFD] disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 font-medium hover:bg-[#FAFBFD] disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleteBusy) setDeleteTarget(null);
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
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/90 ring-1 ring-slate-900/5 transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Delete system question?</h3>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              This removes the item from the shared quiz bank. Students will no longer see it.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 max-h-40 overflow-y-auto">
              {deleteTarget ? snippet(deleteTarget.preview, 400) : ''}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDeleteQuiz()}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {deleteBusy && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!saving) {
            setCreateOpen(false);
            resetCreateForm();
          }
        }}
        className="relative z-[55]"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 z-[56] flex items-start justify-center overflow-y-auto p-4 sm:p-6 sm:items-center">
          <DialogPanel
            transition
            className="my-6 sm:my-8 w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 transition-all duration-300 data-[closed]:scale-[0.98] data-[closed]:opacity-0 max-h-[min(100vh-3rem,calc(100vh-2rem))] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {editingQuestionId ? 'Edit question' : 'New question'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {editingQuestionId ? 'Update the shared quiz item below.' : 'Create a new system-wide quiz item.'}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Topic / system</label>
                  <input
                    required
                    value={system}
                    onChange={(e) => setSystem(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="e.g. Pharmacology"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm capitalize"
                  >
                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Patient story / case setup
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-1">
                  Optional — the situation before the actual question (sometimes called a scenario).
                </p>
                <textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. brief exam findings or scenario (leave blank if you only need one short question)."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Question</label>
                <textarea
                  required
                  value={questionStem}
                  onChange={(e) => setQuestionStem(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="The actual question line."
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-[#FAFBFD]">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Choices (fill at least two)</div>
                {OPTION_LETTERS.map((letter) => (
                  <div key={letter} className="flex gap-2 items-start">
                    <span className="w-7 shrink-0 text-sm font-bold text-slate-500 pt-2">{letter}</span>
                    <input
                      value={choices[letter]}
                      onChange={(e) => setChoices((c) => ({ ...c, [letter]: e.target.value }))}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={`Option ${letter}`}
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Correct answer</label>
                  <select
                    value={correctId}
                    onChange={(e) => setCorrectId(e.target.value as (typeof OPTION_LETTERS)[number])}
                    className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {OPTION_LETTERS.map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Explanation</label>
                <textarea
                  required
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Takeaway (optional)</label>
                <textarea
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white/95 pt-4 pb-1 backdrop-blur-sm">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreateForm();
                  }}
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
                  {editingQuestionId ? 'Save changes' : 'Save question'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
