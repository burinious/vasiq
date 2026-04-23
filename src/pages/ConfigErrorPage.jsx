import { firebaseConfigIssues } from '../firebase/config';

function ConfigErrorPage() {
  return (
    <div className="screen-center">
      <section className="panel verify-card">
        <span className="brand-badge">Setup Required</span>
        <h1>Firebase config is missing</h1>
        <p>
          varsiq cannot start because the Firebase environment variables are missing,
          placeholder values, or invalid.
        </p>

        <div className="config-list">
          {firebaseConfigIssues.map((item) => (
            <code key={item} className="config-item">
              {item}
            </code>
          ))}
        </div>

        <p>
          Create a <strong>.env</strong> file from <strong>.env.example</strong>, add your
          real Firebase project values, then restart <strong>npm run dev</strong>.
        </p>
      </section>
    </div>
  );
}

export default ConfigErrorPage;
