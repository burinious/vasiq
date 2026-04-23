import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminShell from './components/layout/AdminShell';
import AppShell from './components/layout/AppShell';
import Loader from './components/layout/Loader';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { firebaseReady } from './firebase/config';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ConfigErrorPage = lazy(() => import('./pages/ConfigErrorPage'));
const EmailActionPage = lazy(() => import('./pages/EmailActionPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

function App() {
  if (!firebaseReady) {
    return (
      <Suspense fallback={<Loader label="Checking setup..." />}>
        <ConfigErrorPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loader label="Loading the next part of campus..." />}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/email-action" element={<EmailActionPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route
          element={
            <ProtectedRoute requireVerified>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute requireVerified requireAdmin>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
