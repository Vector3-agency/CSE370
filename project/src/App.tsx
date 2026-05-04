import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthRoute, SubscriptionRoute, AdminRoute } from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QbankPage from './pages/QbankPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MistakesPage from './pages/MistakesPage';
import ErrorPage from './pages/ErrorPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './components/admin/AdminDashboardPage';
import AdminQbankPage from './components/admin/AdminQbankPage';
import AdminFlashcardsPage from './components/admin/AdminFlashcardsPage';
import AdminUsersPage from './components/admin/AdminUsersPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/refund-policy" element={<RefundPolicyPage />} />
      <Route path="/terms-of-use" element={<TermsOfUsePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* Admin Routes (admin role only) */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="qbank" element={<AdminQbankPage />} />
          <Route path="flashcards" element={<AdminFlashcardsPage />} />
        </Route>
      </Route>

      {/* Student app — authenticated; subscription gates study features */}
      <Route element={<AuthRoute />}>
        <Route path="/student" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          <Route element={<SubscriptionRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="qbank" element={<QbankPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="mistakes" element={<MistakesPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
          </Route>
        </Route>
      </Route>

      {/* Previous URLs → /student/* */}
      <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/flashcards" element={<Navigate to="/student/flashcards" replace />} />
      <Route path="/qbank" element={<Navigate to="/student/qbank" replace />} />
      <Route path="/analytics" element={<Navigate to="/student/analytics" replace />} />
      <Route path="/mistakes" element={<Navigate to="/student/mistakes" replace />} />
      <Route path="/leaderboard" element={<Navigate to="/student/leaderboard" replace />} />
      <Route path="/billing" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
      <Route path="/settings" element={<Navigate to="/student/settings" replace />} />
      <Route path="/support" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/notifications" element={<Navigate to="/student/notifications" replace />} />

      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
