import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Loader from '../components/layout/Loader';
import { useAuth } from '../context/AuthContext';
import {
  getReadableAuthError,
  loginWithEmail,
  registerWithEmail,
} from '../firebase/auth';
import { isSeededDemoEmail } from '../utils/admin';

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

  if (currentUser?.emailVerified || profile?.isDemoAccount || isSeededDemoEmail(currentUser?.email)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (currentUser && !currentUser.emailVerified && !isSeededDemoEmail(currentUser.email)) {
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
      <div className="auth-sticker-field" aria-hidden="true">
        <svg className="auth-sticker auth-sticker-cap" viewBox="0 0 96 96" role="img">
          <path d="M10 35 48 18l38 17-38 17L10 35Z" />
          <path d="M26 45v17c0 7 10 13 22 13s22-6 22-13V45" />
          <path d="M78 39v22" />
          <path d="M74 63h8l-4 10-4-10Z" />
        </svg>
        <svg className="auth-sticker auth-sticker-book" viewBox="0 0 96 96" role="img">
          <path d="M20 22h28c7 0 12 5 12 12v42H32c-7 0-12-5-12-12V22Z" />
          <path d="M60 34c0-7 5-12 12-12h4v54h-4c-7 0-12-5-12-12V34Z" />
          <path d="M30 36h18M30 49h18M70 36h6" />
        </svg>
        <svg className="auth-sticker auth-sticker-building" viewBox="0 0 96 96" role="img">
          <path d="M14 76h68" />
          <path d="M20 42h56v34H20V42Z" />
          <path d="M12 42 48 20l36 22H12Z" />
          <path d="M30 52v24M42 52v24M54 52v24M66 52v24" />
          <path d="M40 35h16" />
        </svg>
        <svg className="auth-sticker auth-sticker-pencil" viewBox="0 0 96 96" role="img">
          <path d="M23 68 64 27l12 12-41 41-16 4 4-16Z" />
          <path d="m57 34 12 12" />
          <path d="M19 84h34" />
        </svg>
      </div>
      <section className="hero-card auth-hero-shell">
        <div className="auth-hero-panel">
          <div className="auth-hero-copy">
            <span className="brand-badge">varsiq</span>
            <h1>The live campus pulse for updates, groups, and student momentum.</h1>
            <p>
              Catch urgent class changes, hostel gist, events, opportunities, and the
              conversations students actually open every day. VASIQ is built to feel like
              your campus, not just another random social app.
            </p>
            <div className="auth-hero-badges">
              <span>Urgent campus updates</span>
              <span>Useful groups over noisy chats</span>
              <span>Built for student life</span>
            </div>
            <div className="auth-hero-grid" aria-hidden="true">
              <article className="auth-hero-card auth-hero-card-feature auth-hero-side-banner">
                <span>Inside VASIQ</span>
                <strong>One place for the updates students keep chasing in scattered chats.</strong>
                <div className="auth-hero-points">
                  <p>Academic shifts and deadline gist</p>
                  <p>Hostel notices and urgent campus signal</p>
                  <p>Events, opportunities, and useful circles</p>
                </div>
              </article>
            </div>
          </div>

          <section className="auth-card panel">
            <div className="auth-card-heading">
              <span className="eyebrow">Access</span>
              <h2>Enter the campus pulse</h2>
              <p>
                Use your email to sign in or create an account, then verify it before joining
                the live student network.
              </p>
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
      </section>
    </div>
  );
}

export default AuthPage;
