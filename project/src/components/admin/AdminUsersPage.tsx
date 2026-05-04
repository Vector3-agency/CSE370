import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ADMIN_SURFACE_SHADOW_CLASS,
  adminTableHeadRowClass,
  adminThClass,
  adminTdClass,
  adminTableRowClass,
} from '../../components/admin/adminDashboardPatterns';
import { fetchAdminUsers, adminSetUserRole, type AdminUserRow } from '../../lib/api';
import { useAuth } from '../AuthProvider';

const PAGE_SIZE = 25;

function subscriptionLabel(status: string | null) {
  if (!status) return 'None';
  const s = status.toLowerCase();
  if (s === 'active' || s === 'trialing') return status;
  return status;
}

export default function AdminUsersPage() {
  const { user, refreshProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: data, total: count } = await fetchAdminUsers({
        search: debounced || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(data);
      setTotal(count);
    } catch (e: unknown) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : 'Failed to load users. Run admin_user_management.sql and ensure you are an admin.',
      );
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const handleRoleChange = async (row: AdminUserRow, next: 'admin' | 'student') => {
    const current = (row.role || 'student').toLowerCase() === 'admin' ? 'admin' : 'student';
    if (next === current) return;

    if (user?.id === row.id && next === 'student') {
      const ok = window.confirm(
        'You are about to remove your own admin role. You will lose access to this area immediately. Continue?',
      );
      if (!ok) return;
    } else {
      const ok = window.confirm(
        `Change role for ${row.email} from ${current} to ${next}?`,
      );
      if (!ok) return;
    }

    setUpdatingId(row.id);
    setError(null);
    try {
      await adminSetUserRole(row.id, next);
      if (user?.id === row.id) await refreshProfile();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not update role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium text-slate-900 tracking-tight">User Management</h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Search accounts, view subscription status, and assign admin or student roles.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className={`bg-white ${ADMIN_SURFACE_SHADOW_CLASS} rounded-[32px] border border-slate-200/60 overflow-hidden flex flex-col min-h-[420px]`}>
        <div className="px-6 py-5 border-b border-slate-200/60 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#365bce]/20 focus:bg-white transition-colors text-[13px]"
            />
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="bg-white border border-slate-200 hover:bg-[#FAFBFD] text-[13px] font-medium rounded-xl px-4 py-2 shadow-sm transition-colors flex items-center gap-2 shrink-0"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className={adminTableHeadRowClass}>
                <th className={adminThClass}>Email</th>
                <th className={adminThClass}>Name</th>
                <th className={adminThClass}>Role</th>
                <th className={adminThClass}>Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500 text-sm">
                    <Loader2 className="inline animate-spin mr-2" size={18} />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500 text-sm">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const roleVal =
                    (row.role || 'student').toLowerCase() === 'admin' ? 'admin' : 'student';
                  const sub = subscriptionLabel(row.subscription_status);
                  const subOk =
                    row.subscription_status &&
                    ['active', 'trialing'].includes(row.subscription_status.toLowerCase());

                  return (
                    <tr key={row.id} className={adminTableRowClass}>
                      <td className={`${adminTdClass} font-medium text-slate-900`}>{row.email}</td>
                      <td className={adminTdClass}>{row.full_name || '—'}</td>
                      <td className={adminTdClass}>
                        <select
                          disabled={updatingId === row.id}
                          value={roleVal}
                          onChange={(e) =>
                            handleRoleChange(row, e.target.value as 'admin' | 'student')
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-[13px] bg-white capitalize disabled:opacity-50"
                        >
                          <option value="student">student</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className={adminTdClass}>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium border ${
                            subOk
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {sub}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && total > 0 && (
          <div className="px-6 py-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-600">
            <span className="tabular-nums">
              {total} user{total === 1 ? '' : 's'} · Page {page} of {totalPages}
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
    </div>
  );
}
