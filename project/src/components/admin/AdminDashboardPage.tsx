import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Layers, Loader2, CreditCard } from 'lucide-react';
import {
  ADMIN_SURFACE_SHADOW_CLASS,
  adminTableHeadRowClass,
  adminThClass,
  adminTdClass,
  adminTableRowClass,
} from '../../components/admin/adminDashboardPatterns';
import { fetchAdminDashboardStats, fetchAdminUsers, type AdminDashboardStats, type AdminUserRow } from '../../lib/api';

function formatInt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function subscriptionBadge(status: string | null) {
  if (!status) return { label: 'No plan', ok: false };
  const s = status.toLowerCase();
  const ok = s === 'active' || s === 'trialing';
  return { label: status, ok };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recent, setRecent] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, { rows }] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchAdminUsers({ page: 1, pageSize: 8 }),
      ]);
      setStats(s);
      setRecent(rows);
    } catch (e: unknown) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : 'Could not load dashboard. Run admin_dashboard_stats.sql and admin_user_management.sql in Supabase.',
      );
      setStats(null);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = stats
    ? [
        {
          label: 'Total users',
          value: formatInt(stats.total_users),
          hint: 'Profiles in database',
          icon: Users,
        },
        {
          label: 'Active subscribers',
          value: formatInt(stats.active_subscribers),
          hint: 'Active paid users',
          icon: CreditCard,
        },
        {
          label: 'Quiz questions',
          value: formatInt(stats.system_questions),
          hint: 'Total quiz items',
          icon: BookOpen,
        },
        {
          label: 'Flashcard topics',
          value: formatInt(stats.system_flashcard_topics),
          hint: `${formatInt(stats.system_flashcards)} cards across topics`,
          icon: Layers,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium text-slate-900 tracking-tight">Overview</h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0 bg-white border border-slate-200 hover:bg-[#FAFBFD] text-[13px] font-medium rounded-xl px-4 py-2 shadow-sm transition-colors inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {loading && !stats
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className={`bg-white ${ADMIN_SURFACE_SHADOW_CLASS} rounded-[24px] p-5 border border-slate-200/60 animate-pulse`}
              >
                <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
                <div className="h-8 w-20 bg-slate-100 rounded mb-4" />
                <div className="h-3 w-32 bg-slate-50 rounded" />
              </div>
            ))
          : kpis.map((kpi) => (
              <div
                key={kpi.label}
                className={`bg-white ${ADMIN_SURFACE_SHADOW_CLASS} rounded-[24px] p-5 border border-slate-200/60`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13px] font-medium text-slate-500 mb-1">{kpi.label}</p>
                    <div className="text-[28px] font-medium tabular-nums text-slate-900">{kpi.value}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#365bce]">
                    <kpi.icon size={20} />
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-slate-400 leading-snug">{kpi.hint}</p>
              </div>
            ))}
      </div>

      <div className={`bg-white ${ADMIN_SURFACE_SHADOW_CLASS} rounded-[32px] border border-slate-200/60 overflow-hidden`}>
        <div className="px-6 py-5 border-b border-slate-200/60 flex justify-between items-center gap-4">
          <h2 className="text-[17px] font-medium text-slate-900">Recent accounts</h2>
          <Link
            to="/admin/users"
            className="bg-white border border-slate-200 hover:bg-[#FAFBFD] text-[13px] font-medium rounded-xl px-4 py-2 shadow-sm transition-colors shrink-0"
          >
            View all users
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[520px]">
            <thead>
              <tr className={adminTableHeadRowClass}>
                <th className={adminThClass}>Email</th>
                <th className={adminThClass}>Name</th>
                <th className={adminThClass}>Role</th>
                <th className={adminThClass}>Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {loading && recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <Loader2 className="inline animate-spin mr-2" size={18} />
                    Loading…
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No users yet, or the admin user list RPC is not installed.
                  </td>
                </tr>
              ) : (
                recent.map((u) => {
                  const sub = subscriptionBadge(u.subscription_status);
                  return (
                    <tr key={u.id} className={adminTableRowClass}>
                      <td className={`${adminTdClass} font-medium text-slate-900`}>{u.email}</td>
                      <td className={adminTdClass}>{u.full_name || '—'}</td>
                      <td className={adminTdClass}>
                        <span className="capitalize text-[13px]">{u.role}</span>
                      </td>
                      <td className={adminTdClass}>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium border ${
                            sub.ok
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {sub.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
