function Loader({ label = 'Loading vasiq...', compact = false }) {
  return (
    <div className={compact ? 'inline-loader-shell' : 'screen-center'}>
      <div className={`panel loader-card ${compact ? 'loader-card-compact' : ''}`}>
        <div className="loader-orbit">
          <div className="loader-spinner" />
          <div className="loader-core">v</div>
        </div>
        <div className="loader-copy">
          <span className="brand-badge">vasiq</span>
          {compact ? null : <h2>Campus is waking up</h2>}
          <p>{label}</p>
        </div>
        <div className="loader-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default Loader;
