import { getGroupTypeMeta } from '../../lib/campusSignal';

function GroupCard({ group, isMember, onToggleMembership, onOpenChat }) {
  const groupType = getGroupTypeMeta(group.type);

  return (
    <article className="panel group-card">
      <div className="group-card-copy">
        <div className="group-card-topline">
          <p className="eyebrow">{groupType.label}</p>
          {group.audience ? <span className="group-audience-pill">{group.audience}</span> : null}
        </div>
        <h3>{group.name}</h3>
        <p>{group.description}</p>
      </div>

      <div className="group-meta">
        <div className="group-meta-copy">
          <span>{group.members?.length || 0} members</span>
          <small>{groupType.description}</small>
        </div>
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
