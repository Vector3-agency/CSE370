import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useSubscription } from './SubscriptionProvider';
import FreeTrialPopup from './home/FreeTrialPopup';

/**
 * AuthRoute: Only requires authentication (logged in).
 * Used for: profile, settings, notifications
 */
export function AuthRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * AdminRoute: Requires authentication AND an admin role.
 */
export function AdminRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#365bce] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (profile?.role === 'admin') {
    return <Outlet />;
  }

  return <Navigate to="/auth" replace />;
}

/**
 * SubscriptionRoute: Requires authentication AND active subscription or valid trial.
 * Used for: dashboard, flashcards, practice, analytics, leaderboard
 *
 * Access control is enforced at two layers:
 * 1. Database: RLS policies on flashcards, questions, user_answers, and
 *    study_sessions call has_active_subscription() — unsubscribed users
 *    get empty result sets regardless of what the UI does.
 * 2. UI: This component shows a non-closeable upgrade popup when
 *    hasActiveAccess is false, so the user knows they need to subscribe.
 *
 * After a Stripe checkout redirect, sessionStorage('justCompletedCheckout')
 * is set by DashboardPage. We show a "Processing your payment" spinner
 * while the webhook confirms the subscription. No URL parameter is trusted
 * for access decisions.
 */
export function SubscriptionRoute() {
  const { user, profile, loading: authLoading } = useAuth();
  const { hasActiveAccess, loading: subscriptionLoading } = useSubscription();

  // Check if user just completed a Stripe checkout (flag set by DashboardPage
  // only when a real ?session_id= from Stripe is detected in the URL).
  const isProcessingPayment =
    sessionStorage.getItem('justCompletedCheckout') === '1';

  // Step 1: Wait for auth
  if (authLoading) {
    return null; // brief, invisible — AuthProvider resolves fast
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Staff accounts are not gated by Stripe; avoids blank/modal after reload when profile loaded late.
  if (profile?.role === 'admin') {
    return <Outlet />;
  }

  // Step 2: Wait for subscription check.
  // If user just came back from Stripe, show a friendly processing screen
  // while the webhook confirms. Otherwise, brief blank (~200ms).
  if (subscriptionLoading) {
    if (isProcessingPayment) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Processing your payment...
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" aria-hidden />
      </div>
    );
  }

  // Subscription loaded — clear the processing flag if it was set
  if (isProcessingPayment) {
    sessionStorage.removeItem('justCompletedCheckout');
  }

  // Step 3a: No access → show modal immediately (no dashboard data loaded)
  if (!hasActiveAccess) {
    return (
      <>
        <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden="true">
          <Outlet />
        </div>
        <FreeTrialPopup
          isOpen={true}
          onClose={() => {
            // no-op: trial_expired modal is non-closeable
          }}
          trigger="trial_expired"
        />
      </>
    );
  }

  // Step 3b: Has access → render page (it will show its own placeholders while loading data)
  return <Outlet />;
}

// Keep default export for backward compatibility
export default SubscriptionRoute;
