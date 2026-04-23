import { getPresenceTheme } from '../../utils/presenceTheme';
import { getUserDisplayName, getUserFirstName } from '../../utils/userIdentity';

function StatusBoard({ users }) {
  const visibleUsers = users.filter((user) => user.statusText).slice(0, 8);

  if (!visibleUsers.length) {
    return null;
  }

  const [featuredUser, ...otherUsers] = visibleUsers;
  const featuredTheme = getPresenceTheme(featuredUser);

  return (
    <section className="panel status-board social-stories-panel">
      <div className="story-panel-header">
        <div>
          <p className="eyebrow">Stories</p>
          <h2>Campus moments</h2>
        </div>
        <span className="story-panel-pill">{visibleUsers.length} active</span>
      </div>

      <div className="story-strip social-story-strip">
        <article className="story-card story-card-create">
          <div className="story-create-art">
            <span>+</span>
          </div>
          <div className="story-card-footer">
            <strong>Create story</strong>
            <p>Share a campus moment</p>
          </div>
        </article>

        {visibleUsers.map((user) => {
          const theme = getPresenceTheme(user);
          const publicName = getUserDisplayName(user);

          return (
            <article
              key={`${user.id}-story`}
              className="story-card"
              style={theme.cardStyle}
            >
              <div className="story-card-top">
                <div className="story-avatar-ring" style={theme.accentStyle}>
                  <div className="avatar story-avatar" style={theme.avatarStyle}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={publicName} />
                    ) : (
                      <span>{publicName?.[0] || 'S'}</span>
                    )}
                  </div>
                </div>
                <span className="story-card-count">{(user.interests?.length || 0) + 1}</span>
              </div>
              <div className="story-card-copy">
                <strong>{publicName?.split(' ')[0]}</strong>
                <p>{user.statusText}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="story-insight-row">
        <article className="story-insight-card" style={featuredTheme.cardStyle}>
          <div className="story-insight-top">
            <div className="avatar avatar-sm" style={featuredTheme.avatarStyle}>
              {featuredUser.avatarUrl ? (
                <img
                  src={featuredUser.avatarUrl}
                  alt={getUserDisplayName(featuredUser)}
                />
              ) : (
                <span>{getUserDisplayName(featuredUser)[0] || 'S'}</span>
              )}
            </div>
            <div>
              <p className="eyebrow">Campus now</p>
              <strong>{getUserDisplayName(featuredUser)}</strong>
            </div>
          </div>
          <p className="story-insight-copy">{featuredUser.statusText}</p>
          <div className="story-insight-tags">
            <span>{featuredUser.department}</span>
            <span>{featuredUser.level}</span>
            <span>{featuredUser.interests?.[0] || 'student life'}</span>
          </div>
        </article>

        <div className="story-micro-grid">
          {otherUsers.slice(0, 3).map((user) => {
            const theme = getPresenceTheme(user);

            return (
              <article key={user.id} className="story-micro-card" style={theme.cardStyle}>
                <div className="story-micro-top">
                  <div className="avatar avatar-sm" style={theme.avatarStyle}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={getUserDisplayName(user)} />
                    ) : (
                      <span>{getUserDisplayName(user)[0] || 'S'}</span>
                    )}
                  </div>
                  <div>
                    <strong>{getUserFirstName(user)}</strong>
                    <p>{user.department}</p>
                  </div>
                </div>
                <p>{user.statusText}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StatusBoard;
