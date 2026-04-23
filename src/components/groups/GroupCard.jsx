function GroupCard({ group, isMember, onToggleMembership, onOpenChat }) {
  return (
    <article className="panel group-card">
      <div>
        <p className="eyebrow">Community</p>
        <h3>{group.name}</h3>
        <p>{group.description}</p>
      </div>

      <div className="group-meta">
        <span>{group.members?.length || 0} members</span>
        <div className="group-actions">
          <button type="button" className="secondary-button" onClick={onToggleMembership}>
            {isMember ? 'Leave group' : 'Join group'}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onOpenChat}
            disabled={!isMember}
          >
            Open chat
          </button>
        </div>
      </div>
    </article>
  );
}

export default GroupCard;
