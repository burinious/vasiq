import { Link, useLocation } from 'react-router-dom';

const lastUpdated = 'April 22, 2026';

const termsSections = [
  {
    title: 'Acceptance of Terms',
    body: 'By creating an account, signing in, posting, joining groups, sending messages, uploading media, or using VASIQ in any way, you agree to these Terms. If you do not agree, do not use the app. These Terms apply to students, admins, moderators, and any other account holder.',
  },
  {
    title: 'Campus Community Rules',
    body: 'VASIQ is built for university-related communication. You must not harass, threaten, impersonate, exploit, defame, stalk, intimidate, spam, scam, or deliberately mislead anyone. You must not post sexual exploitation, hate speech, violent threats, private information, exam malpractice material, illegal content, malware, or content that puts another person at risk.',
  },
  {
    title: 'Account Responsibility',
    body: 'You are responsible for your account, password, profile information, posts, comments, chats, group activity, uploaded media, and any action taken from your session. Use accurate information where requested. Do not share access to your account. If you suspect unauthorized access, stop using the account and contact an administrator immediately.',
  },
  {
    title: 'Posts, Comments, Chats, and Groups',
    body: 'Your content must be lawful, respectful, and relevant to the campus community. Group creators can manage members in groups they created. Admins and moderators may approve, decline, remove, restrict, or review groups and content where necessary to protect the platform, users, or university community.',
  },
  {
    title: 'Moderation and Enforcement',
    body: 'VASIQ may remove content, decline group requests, restrict features, suspend access, preserve evidence, or escalate serious issues when content or conduct violates these Terms, threatens safety, disrupts the service, or creates legal or disciplinary risk. Moderation decisions may be made without prior notice.',
  },
  {
    title: 'No Guarantee of Availability',
    body: 'The app may be unavailable, delayed, interrupted, changed, or discontinued. Messages, posts, media uploads, GIF integrations, notifications, and other features may fail or be limited. Use good judgment and do not rely on VASIQ as the only channel for urgent, academic, emergency, or official university communication.',
  },
  {
    title: 'Intellectual Property',
    body: 'You keep responsibility for content you submit. By posting or uploading content, you give VASIQ permission to display, store, transmit, resize, moderate, and make that content available inside the app for the purpose of operating the service. Do not upload content you do not have rights to use.',
  },
  {
    title: 'Changes to Terms',
    body: 'These Terms may be updated as the app grows. Continued use after updates means you accept the revised Terms. If a change is material, the app may show an in-product notice or require renewed acceptance.',
  },
];

const privacySections = [
  {
    title: 'Information We Collect',
    body: 'VASIQ may collect account information such as email, display name, department, level, avatar, verification status, role, and profile visibility choices. The app also stores content you create, including posts, comments, replies, likes, shares, group membership, group requests, direct messages, group messages, and uploaded media links.',
  },
  {
    title: 'How Information Is Used',
    body: 'Information is used to authenticate users, show campus identities, power feeds and chats, manage groups, support moderation, prevent abuse, maintain security, improve reliability, and operate core social features. Admins and moderators may use relevant data to review safety, conduct, group requests, and content reports.',
  },
  {
    title: 'Visibility of Content',
    body: 'Posts, comments, replies, likes, group membership, display names, avatars, departments, and levels may be visible to other signed-in users depending on the feature and your profile settings. Direct messages and group messages are not public feeds, but they may still be stored and may be reviewed where safety, abuse, or technical investigation requires it.',
  },
  {
    title: 'Third-Party Services',
    body: 'VASIQ uses third-party infrastructure and integrations, including Firebase for authentication and database services, Cloudinary for media uploads, and Klipy for GIF search. These providers may process technical data needed to deliver their services. Do not upload sensitive documents, passwords, financial data, or private personal records.',
  },
  {
    title: 'Security and Safety',
    body: 'Security rules, account verification, role checks, and moderation tools are used to reduce abuse. No online service is perfectly secure. You should use a strong password, protect your device, log out on shared devices, and avoid sharing sensitive personal information in posts or chats.',
  },
  {
    title: 'Data Retention and Removal',
    body: 'Content and account data may be retained while needed to operate the app, preserve safety records, resolve disputes, comply with obligations, or maintain backups. Deleting or removing content from the interface may not immediately remove every copy from backups, logs, or moderation records.',
  },
  {
    title: 'Your Choices',
    body: 'You can update your profile, control whether your department and level appear publicly, leave groups, and choose what you post. If you want assistance with account or content removal, contact an administrator. Some information may need to be retained for safety, abuse prevention, or legal reasons.',
  },
  {
    title: 'Policy Updates',
    body: 'This Privacy Policy may be updated to reflect new features, service providers, legal requirements, or safety practices. Continued use after an update means the revised policy applies to your use of VASIQ.',
  },
];

function LegalPage({ type = 'terms' }) {
  const location = useLocation();
  const isPrivacy = type === 'privacy' || location.pathname.includes('privacy');
  const title = isPrivacy ? 'Privacy Policy' : 'Terms and Conditions';
  const kicker = isPrivacy ? 'Privacy' : 'Terms';
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <main className="legal-page">
      <section className="panel legal-panel">
        <div className="legal-heading">
          <Link to="/auth" className="ghost-button legal-back-link">
            Back to access
          </Link>
          <p className="eyebrow">{kicker}</p>
          <h1>{title}</h1>
          <p>
            Last updated: {lastUpdated}. This page sets strict expectations for safe,
            respectful, university-inclined use of VASIQ.
          </p>
        </div>

        <div className="legal-warning">
          <strong>Important:</strong>
          <span>
            VASIQ is a campus social platform, not an official emergency, academic-record,
            payment, disciplinary, or legal channel. Use it responsibly.
          </span>
        </div>

        <div className="legal-section-list">
          {sections.map((section, index) => (
            <article key={section.title} className="legal-section">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="legal-footer-note">
          <p>
            Questions about these policies should be directed to a VASIQ administrator or
            moderator. Do not continue using the app if you cannot comply.
          </p>
          <div>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LegalPage;
