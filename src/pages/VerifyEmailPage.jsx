import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReadableAuthError, resendVerificationEmail } from '../firebase/auth';
import { isSeededDemoEmail } from '../utils/admin';

function VerifyEmailPage() {
  const { currentUser, profile, refreshVerification, signOut } = useAuth();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.emailVerified || profile?.isDemoAccount || isSeededDemoEmail(currentUser.email)) {
    return <Navigate to="/feed" replace />;
  }

  const handleResend = async () => {
    setBusy(true);
    setStatus('');

    try {
      await resendVerificationEmail();
      setStatus('Verification email sent. Check your inbox or spam folder.');
    } catch (error) {
      setStatus(getReadableAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    setStatus('');

    try {
      await refreshVerification();
      setStatus(
        'Verification status refreshed. If nothing changed, confirm you clicked the email link first.',
      );
    } catch (error) {
      setStatus(getReadableAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen-center">
      <section className="panel verify-card">
        <span className="brand-badge">Verify Email</span>
        <h1>Check your inbox</h1>
        <p>
          A verification link was sent to <strong>{currentUser.email}</strong>. Verify
          the address before entering varsiq. When you click the link, you will land on
          a branded confirmation screen here.
        </p>

        {status ? <p className="status-text">{status}</p> : null}

        <div className="stack-actions">
          <button type="button" className="primary-button" onClick={handleRefresh} disabled={busy}>
            I have verified my email
          </button>
          <button type="button" className="secondary-button" onClick={handleResend} disabled={busy}>
            Resend email
          </button>
          <button type="button" className="ghost-button" onClick={signOut}>
            Use another account
          </button>
        </div>
      </section>
    </div>
  );
}

export default VerifyEmailPage;
