import { useMemo, useState } from 'react';
import { getPresenceTheme } from '../../utils/presenceTheme';
import { getUserDisplayName, getUserFirstName } from '../../utils/userIdentity';

function getStoryTime(timestamp) {
  const date =
    typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(timestamp || Date.now());
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 1) return 'Now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  return `${Math.floor(diffMinutes / 60)}h`;
}

function StatusBoard({ onCreateStory, profile, stories, storiesReady, users }) {
  const [creating, setCreating] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storyError, setStoryError] = useState('');
  const fallbackUsers = users.filter((user) => user.statusText).slice(0, 8);
  const visibleStories = useMemo(() => {
    const liveStories = (stories || []).map((story) => ({
      ...story,
      userId: story.authorId,
      name: story.authorName,
      avatarUrl: story.authorAvatar,
      department: story.authorDepartment,
      level: story.authorLevel,
      statusText: story.text,
      storyTime: getStoryTime(story.createdAt),
      isLiveStory: true,
    }));

    if (liveStories.length) {
      return liveStories;
    }

    return fallbackUsers.map((user) => ({
      ...user,
      name: getUserDisplayName(user),
      storyTime: 'Demo',
      isLiveStory: false,
    }));
  }, [fallbackUsers, stories]);

  if (!visibleStories.length && !storiesReady) {
    return null;
  }

  const [featuredStory, ...otherStories] = visibleStories;
  const featuredTheme = getPresenceTheme(featuredStory || profile || {});

  const handleSubmitStory = async (event) => {
    event.preventDefault();
    const trimmedStory = storyText.trim();
    if (!trimmedStory) return;

    setSubmitting(true);
    setStoryError('');

    try {
      await onCreateStory(trimmedStory);
      setStoryText('');
      setCreating(false);
    } catch (error) {
      setStoryError(error.message || 'Unable to create story.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel status-board social-stories-panel">
      <div className="story-panel-header">
        <div>
          <p className="eyebrow">Stories</p>
          <h2>Campus moments</h2>
        </div>
        <span className="story-panel-pill">{visibleStories.length} active</span>
      </div>

      <div className="story-strip social-story-strip">
        <button
          type="button"
          className="story-card story-card-create"
          onClick={() => setCreating((value) => !value)}
        >
          <div className="story-create-art">
            <span>+</span>
          </div>
          <div className="story-card-footer">
            <strong>Create story</strong>
            <p>Share a campus moment</p>
          </div>
        </button>

        {visibleStories.map((story) => {
          const theme = getPresenceTheme(story);
          const publicName = story.name || getUserDisplayName(story);

          return (
            <article
              key={`${story.id || story.userId}-story`}
              className="story-card"
              style={theme.cardStyle}
            >
              <div className="story-card-top">
                <div className="story-avatar-ring" style={theme.accentStyle}>
                  <div className="avatar story-avatar" style={theme.avatarStyle}>
                    {story.avatarUrl ? (
                      <img src={story.avatarUrl} alt={publicName} />
                    ) : (
                      <span>{publicName?.[0] || 'S'}</span>
                    )}
                  </div>
                </div>
                <span className="story-card-count">{story.storyTime}</span>
              </div>
              <div className="story-card-copy">
                <strong>{publicName?.split(' ')[0]}</strong>
                <p>{story.statusText}</p>
              </div>
            </article>
          );
        })}
      </div>

      {creating ? (
        <form className="comment-form story-create-form" onSubmit={handleSubmitStory}>
          <div className="comment-input-shell">
            <input
              className="input"
              maxLength={180}
              onChange={(event) => setStoryText(event.target.value)}
              placeholder="Drop quick campus gist, location, update, or moment"
              value={storyText}
            />
            {storyError ? <span className="status-text">{storyError}</span> : null}
          </div>
          <button type="submit" className="secondary-button" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post story'}
          </button>
        </form>
      ) : null}

      {featuredStory ? (
      <div className="story-insight-row">
        <article className="story-insight-card" style={featuredTheme.cardStyle}>
          <div className="story-insight-top">
            <div className="avatar avatar-sm" style={featuredTheme.avatarStyle}>
              {featuredStory.avatarUrl ? (
                <img
                  src={featuredStory.avatarUrl}
                  alt={featuredStory.name || getUserDisplayName(featuredStory)}
                />
              ) : (
                <span>{(featuredStory.name || getUserDisplayName(featuredStory))[0] || 'S'}</span>
              )}
            </div>
            <div>
              <p className="eyebrow">Campus now</p>
              <strong>{featuredStory.name || getUserDisplayName(featuredStory)}</strong>
            </div>
          </div>
          <p className="story-insight-copy">{featuredStory.statusText}</p>
          <div className="story-insight-tags">
            <span>{featuredStory.department || 'Campus'}</span>
            <span>{featuredStory.level || 'Story'}</span>
            <span>{featuredStory.isLiveStory ? '24h' : 'seeded'}</span>
          </div>
        </article>

        <div className="story-micro-grid">
          {otherStories.slice(0, 3).map((story) => {
            const theme = getPresenceTheme(story);
            const publicName = story.name || getUserDisplayName(story);

            return (
              <article key={story.id || story.userId} className="story-micro-card" style={theme.cardStyle}>
                <div className="story-micro-top">
                  <div className="avatar avatar-sm" style={theme.avatarStyle}>
                    {story.avatarUrl ? (
                      <img src={story.avatarUrl} alt={publicName} />
                    ) : (
                      <span>{publicName[0] || 'S'}</span>
                    )}
                  </div>
                  <div>
                    <strong>{getUserFirstName(story)}</strong>
                    <p>{story.department || 'Campus'}</p>
                  </div>
                </div>
                <p>{story.statusText}</p>
              </article>
            );
          })}
        </div>
      </div>
      ) : null}
    </section>
  );
}

export default StatusBoard;
