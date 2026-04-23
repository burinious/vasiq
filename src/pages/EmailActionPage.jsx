import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import Loader from '../components/layout/Loader';
import { useAuth } from '../context/AuthContext';
import { getReadableAuthError, verifyEmailWithCode } from '../firebase/auth';

function EmailActionPage() {
  const { currentUser, refreshVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Confirming your email verification...');

  useEffect(() => {
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    async function runVerification() {
      if (mode !== 'verifyEmail' || !actionCode) {
        setStatus('error');
        setMessage('This verification link is incomplete or invalid.');
        return;
      }

      try {
        await verifyEmailWithCode(actionCode);
        await refreshVerification();
        setStatus('success');
        setMessage('Your email has been verified successfully. You can continue into varsiq.');
      } catch (error) {
        setStatus('error');
        setMessage(getReadableAuthError(error));
      }
    }

    runVerification();
  }, [refreshVerification, searchParams]);

  if (status === 'loading') {
    return <Loader label="Verifying your email..." />;
  }

  return (
    <div className="screen-center">
      <section className="panel verification-result-card">
        <span className="brand-badge">
          {status === 'success' ? 'Email Verified' : 'Verification Error'}
        </span>
        <h1>
          {status === 'success'
            ? 'Your email has been verified'
            : 'We could not verify this email'}
        </h1>
        <p>{message}</p>

        <div className="verification-hero">
          <div className="verification-orb" />
          <div className="verification-copy">
            <strong>
              {status === 'success'
                ? 'Your account is now ready for campus conversations.'
                : 'Request a new verification email and try again.'}
            </strong>
            <p>
              {status === 'success'
                ? 'Jump back into your communities, chats, and feed.'
                : 'If the problem continues, sign in again and use the resend option.'}
            </p>
          </div>
        </div>

        <div className="stack-actions">
          {currentUser?.emailVerified ? (
            <Link to="/feed" className="primary-button">
              Continue to varsiq
            </Link>
          ) : (
            <Link to="/verify-email" className="primary-button">
              Back to verification
            </Link>
          )}
          <Link to={currentUser ? '/feed' : '/auth'} className="secondary-button">
            {currentUser ? 'Open app' : 'Go to login'}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default EmailActionPage;
