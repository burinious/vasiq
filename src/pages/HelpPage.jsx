import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, LifeBuoy, RotateCcw, Trash2 } from 'lucide-react';
import OnboardingCards from '../components/onboarding/OnboardingCards';
import { useAuth } from '../context/AuthContext';
import { deleteCurrentAccount, getReadableAuthError } from '../firebase/auth';

const faqs = [
  {
    question: 'Why does onboarding show again after I close it?',
    answer:
      'Close only dismisses the guide for your current session. Skip forever saves the choice to your profile so it does not show automatically again.',
  },
  {
    question: 'Who can approve groups?',
    answer:
      'Admins and moderators review student-created group requests. A group creator controls membership after approval.',
  },
  {
    question: 'What happens when I report something?',
    answer:
      'A report enters the admin/moderator safety queue. They can review, dismiss, or take action on the reported content.',
  },
  {
    question: 'Can I recover a deleted account?',
    answer:
      'No. Account deletion permanently blocks that email/login from creating another VASIQ account.',
  },
];

function HelpPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const providerIds = currentUser?.providerData?.map((provider) => provider.providerId) || [];
  const needsPassword = providerIds.includes('password');
  const canDelete = confirmText === 'DELETE' && (!needsPassword || password);

  const handleReplayOnboarding = () => {
    window.dispatchEvent(new CustomEvent('vasiq:open-onboarding'));
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    if (!canDelete) {
      setError('Type DELETE and provide your password if required.');
      setStatus('');
      return;
    }

    const confirmed = window.confirm(
      'This permanently deletes your VASIQ account and blocks this login from being used again. Continue?',
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');
    setStatus('');

    try {
      await deleteCurrentAccount({ password });
      setStatus('Your account has been deleted.');
      navigate('/auth', { replace: true });
    } catch (deleteError) {
      setError(getReadableAuthError(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="help-page">
      <section className="panel help-hero-card">
        <div>
          <p className="eyebrow">Help and support</p>
          <h1>Get clear on how VASIQ works.</h1>
          <p>
            Replay onboarding, check safety rules, review legal pages, or manage serious account
            actions from one place.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={handleReplayOnboarding}>
          <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
          Replay onboarding
        </button>
      </section>

      <section className="help-grid">
        <article className="panel help-card">
          <div className="help-card-heading">
            <BookOpen size={20} strokeWidth={2.2} aria-hidden="true" />
            <div>
              <p className="eyebrow">FAQ</p>
              <h2>Common questions</h2>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((item) => (
              <details key={item.question} className="faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </article>

        <article className="panel help-card">
          <div className="help-card-heading">
            <LifeBuoy size={20} strokeWidth={2.2} aria-hidden="true" />
            <div>
              <p className="eyebrow">Guide</p>
              <h2>Onboarding notes</h2>
            </div>
          </div>
          <OnboardingCards mode="inline" />
        </article>

        <article className="panel help-card">
          <div className="help-card-heading">
            <BookOpen size={20} strokeWidth={2.2} aria-hidden="true" />
            <div>
              <p className="eyebrow">Legal</p>
              <h2>Policies</h2>
            </div>
          </div>
          <div className="help-link-list">
            <Link to="/terms">Terms and Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </article>

        <article className="panel help-card help-danger-card">
          <div className="help-card-heading">
            <AlertTriangle size={20} strokeWidth={2.2} aria-hidden="true" />
            <div>
              <p className="eyebrow">Danger zone</p>
              <h2>Delete your account</h2>
            </div>
          </div>
          <p>
            This is permanent. Your email/login will be blocked from creating another VASIQ
            account forever.
          </p>
          <form className="delete-account-form" onSubmit={handleDeleteAccount}>
            {needsPassword ? (
              <input
                className="input elevated-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
              />
            ) : null}
            <input
              className="input elevated-input"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="Type DELETE to confirm"
            />
            {error ? <p className="error-text">{error}</p> : null}
            {status ? <p className="status-text">{status}</p> : null}
            <button
              type="submit"
              className="ghost-button admin-danger-button"
              disabled={!canDelete || deleting}
            >
              <Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>{deleting ? 'Deleting...' : 'Delete account permanently'}</span>
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

export default HelpPage;
