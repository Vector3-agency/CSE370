import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Loader2, AlertCircle, Play } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { fetchMistakeStats, fetchQuestionsByIds, type QuestionMistakeStatRow, type QuestionRow } from '../lib/api';

type Row = QuestionMistakeStatRow & { question?: QuestionRow | null };

export default function MistakesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const stats = await fetchMistakeStats(user.id);
        const ids = stats.map((s) => s.question_id);
        const questions = await fetchQuestionsByIds(ids, user.id);
        const byId = new Map(questions.map((q) => [q.id, q]));
        if (!cancelled) {
          setRows(stats.map((s) => ({ ...s, question: byId.get(s.question_id) ?? null })));
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            'Could not load mistakes. Run mistake_tracking.sql in Supabase and try again.',
          );
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 dark:bg-rose-900/40 rounded-2xl mb-3">
            <Target className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
            Mistake tracking
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base max-w-xl">
            Every wrong quiz attempt is counted here. Practice only these questions to focus on weak areas.
          </p>
        </div>
        <Link
          to="/student/qbank?weak=1"
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 shadow-lg shadow-indigo-200 dark:shadow-none transition-colors"
        >
          <Play size={18} fill="currentColor" />
          Weak-spot quiz
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-amber-900 dark:text-amber-100 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm font-medium">Loading your mistakes…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center">
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">No mistakes recorded yet</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Answer questions in Quiz. Each wrong submission is tracked automatically.
          </p>
          <Link
            to="/student/qbank"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Go to Quiz
          </Link>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {rows.map((r) => (
            <div
              key={r.question_id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 tabular-nums">
                    {r.wrong_count}× wrong
                  </span>
                  {r.question?.system && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{r.question.system}</span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium line-clamp-2">
                  {r.question?.question ?? `Question ${r.question_id.slice(0, 8)}…`}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Last wrong:{' '}
                  {new Date(r.last_wrong_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              {r.question && (
                <Link
                  to={`/student/qbank?questionId=${r.question_id}`}
                  className="shrink-0 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline sm:text-right"
                >
                  Review
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
