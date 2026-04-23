import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Loader from '../components/layout/Loader';
import { useAuth } from '../context/AuthContext';
import {
  getReadableAuthError,
  loginWithEmail,
  registerWithEmail,
} from '../firebase/auth';

const initialRegisterState = {
  email: '',
  password: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getEmailValidationError(email) {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return 'Email is required.';
  }

  if (!emailPattern.test(trimmedEmail)) {
    return 'Enter a valid email address.';
  }

  return '';
}

function getPasswordValidationError(password, { strict = false } = {}) {
  if (!password) {
    return 'Password is required.';
  }

  if (!strict) {
    return '';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }

  return '';
}

function AuthPage() {
  const location = useLocation();
  const { currentUser, loading, profile } = useAuth();
  const [mode, setMode] = useState('login');
  const [loginValues, setLoginValues] = useState({ email: '', password: '' });
  const [registerValues, setRegisterValues] = useState(initialRegisterState);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/feed';

  if (loading) {
    return <Loader />;
  }

  if (currentUser?.emailVerified || profile?.isDemoAccount) {
    return <Navigate to={redirectTo} replace />;
  }

  if (currentUser && !currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    const emailError = getEmailValidationError(loginValues.email);
    const passwordError = getPasswordValidationError(loginValues.password);

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      setStatus('');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('');

    try {
      await loginWithEmail(loginValues);
    } catch (loginError) {
      setError(getReadableAuthError(loginError));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const emailError = getEmailValidationError(registerValues.email);
    const passwordError = getPasswordValidationError(registerValues.password, {
      strict: true,
    });

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      setStatus('');
      return;
    }

    if (!acceptedLegal) {
      setError('You must accept the Terms and Privacy Policy before creating an account.');
      setStatus('');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('');

    try {
      await registerWithEmail(registerValues);
      setStatus(
        `Verification email sent to ${registerValues.email}. Check your inbox or spam folder before logging in.`,
      );
    } catch (registerError) {
      setError(getReadableAuthError(registerError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="hero-card">
        <div className="auth-hero-copy">
          <span className="brand-badge">varsiq</span>
          <h1>Your campus conversations, groups, and updates in one place.</h1>
          <p>
            Join study circles, message classmates, post updates, and build a stronger
            student network with a cleaner workflow than scattered WhatsApp groups.
          </p>
          <div className="auth-hero-badges">
            <span>Student-first feed</span>
            <span>Cleaner than scattered chats</span>
            <span>Built for VASIQ</span>
          </div>
        </div>
        <div className="auth-hero-grid" aria-hidden="true">
          <article className="auth-hero-card auth-hero-card-feature">
            <span>Live now</span>
            <strong>Groups, chats, and campus moments in one rhythm.</strong>
          </article>
          <article className="auth-hero-card">
            <span>01</span>
            <strong>Find people faster</strong>
          </article>
          <article className="auth-hero-card">
            <span>02</span>
            <strong>Share updates cleanly</strong>
          </article>
        </div>
      </section>

      <section className="auth-card panel">
        <div className="auth-card-heading">
          <span className="eyebrow">Access</span>
          <h2>Enter the campus network</h2>
          <p>Use your email to sign in or create an account, then verify it to continue.</p>
        </div>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'tab-active' : ''}
            onClick={() => {
      setMode('login');
      setError('');
      setStatus('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'tab-active' : ''}
            onClick={() => {
              setMode('register');
              setError('');
              setStatus('');
            }}
          >
            Create account
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              className="input"
              type="email"
              placeholder="School email"
              value={loginValues.email}
              onChange={(event) =>
                setLoginValues((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
            <div className="password-field">
              <input
                className="input"
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="Password"
                value={loginValues.password}
                onChange={(event) =>
                  setLoginValues((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowLoginPassword((current) => !current)}
              >
                {showLoginPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
            {status ? <p className="status-text">{status}</p> : null}
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={registerValues.email}
              onChange={(event) =>
                setRegisterValues((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
            <div className="password-field">
              <input
                className="input"
                type={showRegisterPassword ? 'text' : 'password'}
                minLength={8}
                placeholder="Password"
                value={registerValues.password}
                onChange={(event) =>
                  setRegisterValues((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowRegisterPassword((current) => !current)}
              >
                {showRegisterPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="helper-text">
              Use a valid email address. You will need to verify it before you can log in
              successfully. Password must be at least 8 characters and include a number.
            </p>
            <label className="legal-consent-option">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => setAcceptedLegal(event.target.checked)}
                required
              />
              <span>
                I agree to the <Link to="/terms">Terms and Conditions</Link> and{' '}
                <Link to="/privacy">Privacy Policy</Link>. I understand VASIQ may moderate
                content and restrict accounts that break community rules.
              </span>
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            {status ? <p className="status-text">{status}</p> : null}
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
        <div className="auth-legal-links">
          <Link to="/terms">Terms and Conditions</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
