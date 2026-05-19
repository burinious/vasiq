import { useMemo, useState } from 'react';
import { normalizeAcademicValue } from '../../data/nigeriaAcademics';
import { getPresenceTheme } from '../../utils/presenceTheme';
import { getUserDisplayName, getUserFirstName } from '../../utils/userIdentity';

function ChatSidebar({
  chats,
  users,
  selectedChatId,
  currentUserId,
  currentProfile,
  onSelectChat,
}) {
  const [search, setSearch] = useState('');
  const [identityFilter, setIdentityFilter] = useState('department');
  const normalizedUniversity = normalizeAcademicValue(currentProfile?.university);
  const normalizedDepartment = normalizeAcademicValue(currentProfile?.department);

  const discoverableUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => user.id !== currentUserId)
      .filter((user) => {
        const sameUniversity =
          normalizedUniversity && normalizeAcademicValue(user.university) === normalizedUniversity;
        const sameDepartment =
          normalizedDepartment &&
          normalizeAcademicValue(user.department) === normalizedDepartment &&
          (!normalizedUniversity || sameUniversity);

        if (identityFilter === 'department' && normalizedDepartment) return sameDepartment;
        if (identityFilter === 'university' && normalizedUniversity) return sameUniversity;
        return true;
      })
      .filter((user) => {
        if (!query) return true;

        return [
          getUserDisplayName(user),
          user.name,
          user.email,
          user.university,
          user.department,
          user.level,
          user.interests?.join(' '),
          user.residence,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      })
      .sort((first, second) => {
        const firstDepartmentMatch =
          normalizedDepartment &&
          normalizeAcademicValue(first.department) === normalizedDepartment &&
          (!normalizedUniversity || normalizeAcademicValue(first.university) === normalizedUniversity);
        const secondDepartmentMatch =
          normalizedDepartment &&
          normalizeAcademicValue(second.department) === normalizedDepartment &&
          (!normalizedUniversity || normalizeAcademicValue(second.university) === normalizedUniversity);
        if (firstDepartmentMatch !== secondDepartmentMatch) return firstDepartmentMatch ? -1 : 1;

        const firstUniversityMatch =
          normalizedUniversity && normalizeAcademicValue(first.university) === normalizedUniversity;
        const secondUniversityMatch =
          normalizedUniversity && normalizeAcademicValue(second.university) === normalizedUniversity;
        if (firstUniversityMatch !== secondUniversityMatch) return firstUniversityMatch ? -1 : 1;

        return getUserDisplayName(first).localeCompare(getUserDisplayName(second));
      })
      .slice(0, 12);
  }, [currentUserId, identityFilter, normalizedDepartment, normalizedUniversity, search, users]);

  const clusterUsers = discoverableUsers.slice(0, 5);

  return (
    <aside className="panel chat-sidebar">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Chats</p>
          <h2>Direct messages</h2>
          <p>Find your people, start a conversation, and keep the campus energy moving.</p>
        </div>
      </div>

      <div className="connection-cluster">
        <div className="cluster-avatars">
          {clusterUsers.map((user) => {
            const theme = getPresenceTheme(user);
            const publicName = getUserDisplayName(user);

            return (
              <div
                key={user.id}
                className="cluster-avatar"
                style={theme.avatarStyle}
                title={publicName}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={publicName} />
                ) : (
                  <span>{publicName[0] || 'S'}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="cluster-copy">
          <strong>{discoverableUsers.length} students ready to connect</strong>
          <p>Study partners, builders, creatives, gist people, and project teammates.</p>
        </div>
      </div>

      <div className="chat-section">
        <p className="section-label">Recent chats</p>
        <div className="chat-list">
          {chats.length ? (
            chats.map((chat) => {
              const chatName = getUserDisplayName(chat.user);

              return (
                <button
                  key={chat.id}
                  type="button"
                  className={`chat-list-item ${selectedChatId === chat.id ? 'chat-list-item-active' : ''}`}
                  onClick={() => onSelectChat(chat.user)}
                >
                  <div className="recent-chat-row">
                    <div className="avatar avatar-sm">
                      {chat.user?.avatarUrl ? (
                        <img src={chat.user.avatarUrl} alt={chatName} />
                      ) : (
                        <span>{chatName[0] || 'S'}</span>
                      )}
                    </div>
                    <div>
                      <strong>{chatName}</strong>
                      <p>{chat.lastMessage || 'Start the conversation'}</p>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="muted-text">No conversations yet.</p>
          )}
        </div>
      </div>

      <div className="chat-section">
        <div className="discover-header">
          <p className="section-label">Discover people</p>
          <input
            className="input discover-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, university, course..."
          />
        </div>

        <div className="identity-filter-row" aria-label="Student discovery filters">
          {[
            { value: 'department', label: 'My course' },
            { value: 'university', label: 'My university' },
            { value: 'all', label: 'All students' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`identity-filter-chip ${
                identityFilter === item.value ? 'identity-filter-chip-active' : ''
              }`}
              onClick={() => setIdentityFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="student-discovery-grid">
          {discoverableUsers.map((user) => {
            const theme = getPresenceTheme(user);
            const publicName = getUserDisplayName(user);

            return (
              <button
                key={user.id}
                type="button"
                className="student-spotlight-card"
                style={theme.cardStyle}
                onClick={() => onSelectChat(user)}
              >
                <div className="student-spotlight-top">
                  <div className="avatar avatar-sm" style={theme.avatarStyle}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={publicName} />
                    ) : (
                      <span>{publicName[0] || 'S'}</span>
                    )}
                  </div>
                  <div>
                    <strong>{publicName}</strong>
                    <p>
                      {user.department} / {user.level}
                    </p>
                    <p>{user.university || 'University not set'}</p>
                  </div>
                  <span className="student-emoji-badge">{theme.emoji}</span>
                </div>
                <p className="student-spotlight-copy">
                  {user.statusText ||
                    user.about ||
                    `${getUserFirstName(user)} is available to connect on campus.`}
                </p>
                <div className="status-tags">
                  <span>{user.university || 'VASIQ campus'}</span>
                  <span>{user.department || 'course pending'}</span>
                  <span>{user.interests?.[0] || 'community'}</span>
                  <span>Say hello</span>
                </div>
              </button>
            );
          })}
          {!discoverableUsers.length ? (
            <p className="muted-text">No students matched that search.</p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export default ChatSidebar;
