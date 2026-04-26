import { useEffect, useMemo, useState } from 'react';
import { Activity, Edit3, Flag, Megaphone, Save, ShieldCheck, Trash2, UsersRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  approveGroupRequest,
  createAnnouncement,
  createGroup,
  deleteAnnouncement,
  deleteGroup,
  deletePost,
  declineGroupRequest,
  listenToAnnouncements,
  listenToGroupRequests,
  listenToGroups,
  listenToPosts,
  listenToReports,
  listenToUsers,
  toggleAnnouncementStatus,
  updateAnnouncement,
  updateGroup,
  updateReportStatus,
  updateUserProfile,
} from '../firebase/firestore';

const initialAnnouncementState = {
  title: '',
  tag: 'Announcement',
  message: '',
};

const initialGroupState = {
  name: '',
  description: '',
  type: 'community',
  audience: '',
};

const adminPanelByHash = {
  '#overview': 'notices',
  '#announcements': 'notices',
  '#groups': 'groups',
  '#community': 'users',
  '#users': 'users',
  '#safety': 'safety',
  '#posts': 'posts',
};

const adminHashByPanel = {
  notices: '#announcements',
  groups: '#groups',
  safety: '#safety',
  users: '#community',
  posts: '#posts',
};

function getInitialAdminPanel() {
  if (typeof window === 'undefined') return 'notices';
  return adminPanelByHash[window.location.hash] || 'notices';
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Just now';
  if (typeof timestamp?.toDate === 'function') {
    return timestamp.toDate().toLocaleString();
  }

  return new Date(timestamp).toLocaleString();
}

function AdminPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupRequests, setGroupRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [formValues, setFormValues] = useState(initialAnnouncementState);
  const [groupValues, setGroupValues] = useState(initialGroupState);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [userQuery, setUserQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState('');
  const [deletingPostId, setDeletingPostId] = useState('');
  const [reviewingRequestId, setReviewingRequestId] = useState('');
  const [reviewingReportId, setReviewingReportId] = useState('');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState('');
  const [announcementDraft, setAnnouncementDraft] = useState(initialAnnouncementState);
  const [editingGroupId, setEditingGroupId] = useState('');
  const [groupDraft, setGroupDraft] = useState(initialGroupState);
  const [activePanel, setActivePanel] = useState(getInitialAdminPanel);

  useEffect(() => {
    const unsubscribeUsers = listenToUsers(setUsers);
    const unsubscribeGroups = listenToGroups(setGroups);
    const unsubscribeGroupRequests = listenToGroupRequests(setGroupRequests);
    const unsubscribePosts = listenToPosts(setPosts);
    const unsubscribeReports = listenToReports(setReports);
    const unsubscribeAnnouncements = listenToAnnouncements(setAnnouncements);

    return () => {
      unsubscribeUsers();
      unsubscribeGroups();
      unsubscribeGroupRequests();
      unsubscribePosts();
      unsubscribeReports();
      unsubscribeAnnouncements();
    };
  }, []);

  useEffect(() => {
    const syncPanelFromHash = () => {
      setActivePanel(getInitialAdminPanel());
    };

    window.addEventListener('hashchange', syncPanelFromHash);
    syncPanelFromHash();

    return () => window.removeEventListener('hashchange', syncPanelFromHash);
  }, []);

  const activeAnnouncementsCount = announcements.filter((item) => item.isActive !== false).length;
  const pendingGroupRequests = groupRequests.filter((request) => request.status === 'pending');
  const pendingReports = reports.filter((report) => report.status === 'pending');
  const metrics = [
    { label: 'Users', value: users.length, icon: UsersRound },
    { label: 'Groups', value: groups.length, icon: ShieldCheck },
    { label: 'Posts', value: posts.length, icon: Activity },
    { label: 'Requests', value: pendingGroupRequests.length, icon: Megaphone },
    { label: 'Reports', value: pendingReports.length, icon: Flag },
  ];

  const filteredUsers = useMemo(() => {
    const search = userQuery.trim().toLowerCase();

    return users.filter((user) => {
      const userRole = user.role || 'member';
      const matchesRole = roleFilter === 'all' ? true : userRole === roleFilter;
      const displayName = user.displayName || user.fullName || user.name || '';
      const haystack = [
        displayName,
        user.email || '',
        user.department || '',
        user.level || '',
        userRole,
      ]
        .join(' ')
        .toLowerCase();

      return matchesRole && (!search || haystack.includes(search));
    });
  }, [roleFilter, userQuery, users]);

  const recentPosts = useMemo(() => posts.slice(0, 5), [posts]);
  const recentReports = useMemo(() => reports.slice(0, 8), [reports]);
  const queuedAnnouncements = useMemo(() => announcements.slice(0, 6), [announcements]);
  const adminPanels = [
    { value: 'notices', label: 'Notices', count: activeAnnouncementsCount },
    { value: 'groups', label: 'Groups', count: pendingGroupRequests.length },
    { value: 'safety', label: 'Safety', count: pendingReports.length },
    { value: 'users', label: 'Users', count: filteredUsers.length },
    { value: 'posts', label: 'Posts', count: recentPosts.length },
  ];

  const handlePanelSelect = (panel) => {
    setActivePanel(panel);

    if (typeof window === 'undefined') return;

    const nextHash = adminHashByPanel[panel] || '#overview';
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  };

  const handleReviewGroupRequest = async (request, nextStatus) => {
    setReviewingRequestId(request.id);
    setStatus('');

    try {
      if (nextStatus === 'approved') {
        await approveGroupRequest(request.id, request, {
          uid: currentUser.uid,
          email: currentUser.email,
        });
        setStatus(`Approved ${request.name}.`);
      } else {
        await declineGroupRequest(request.id, {
          uid: currentUser.uid,
          email: currentUser.email,
        });
        setStatus(`Declined ${request.name}.`);
      }
    } catch (error) {
      setStatus(error.message || 'Unable to review group request.');
    } finally {
      setReviewingRequestId('');
    }
  };

  const handleRoleUpdate = async (userId, nextRole) => {
    setUpdatingUserId(userId);
    setStatus('');

    try {
      await updateUserProfile(userId, { role: nextRole });
      setStatus(`User role updated to ${nextRole}.`);
    } catch (error) {
      setStatus(error.message || 'Unable to update user role.');
    } finally {
      setUpdatingUserId('');
    }
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus('');

    try {
      await createAnnouncement({
        title: formValues.title.trim(),
        tag: formValues.tag.trim() || 'Announcement',
        message: formValues.message.trim(),
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
      });

      setFormValues(initialAnnouncementState);
      setStatus('Announcement published.');
    } catch (error) {
      setStatus(error.message || 'Unable to publish announcement.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus('');

    try {
      await createGroup({
        name: groupValues.name.trim(),
        description: groupValues.description.trim(),
        type: groupValues.type || 'community',
        audience: groupValues.audience.trim(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
      });
      setGroupValues(initialGroupState);
      setStatus('Group created.');
    } catch (error) {
      setStatus(error.message || 'Unable to create group.');
    } finally {
      setBusy(false);
    }
  };

  const startEditingAnnouncement = (announcement) => {
    setEditingAnnouncementId(announcement.id);
    setAnnouncementDraft({
      title: announcement.title || '',
      tag: announcement.tag || 'Announcement',
      message: announcement.message || '',
    });
  };

  const handleUpdateAnnouncement = async (announcementId) => {
    setBusy(true);
    setStatus('');

    try {
      await updateAnnouncement(announcementId, {
        title: announcementDraft.title.trim(),
        tag: announcementDraft.tag.trim() || 'Announcement',
        message: announcementDraft.message.trim(),
      });
      setEditingAnnouncementId('');
      setAnnouncementDraft(initialAnnouncementState);
      setStatus('Notice updated.');
    } catch (error) {
      setStatus(error.message || 'Unable to update notice.');
    } finally {
      setBusy(false);
    }
  };

  const startEditingGroup = (group) => {
    setEditingGroupId(group.id);
    setGroupDraft({
      name: group.name || '',
      description: group.description || '',
      type: group.type || 'community',
      audience: group.audience || '',
    });
  };

  const handleUpdateGroup = async (groupId) => {
    setBusy(true);
    setStatus('');

    try {
      await updateGroup(groupId, {
        name: groupDraft.name.trim(),
        description: groupDraft.description.trim(),
        type: groupDraft.type || 'community',
        audience: groupDraft.audience.trim(),
      });
      setEditingGroupId('');
      setGroupDraft(initialGroupState);
      setStatus('Group updated.');
    } catch (error) {
      setStatus(error.message || 'Unable to update group.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    const shouldDelete = window.confirm(`Delete ${group.name}? This removes the group from VASIQ.`);
    if (!shouldDelete) return;

    setBusy(true);
    setStatus('');

    try {
      await deleteGroup(group.id);
      setStatus('Group deleted.');
    } catch (error) {
      setStatus(error.message || 'Unable to delete group.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePost = async (post) => {
    const shouldDelete = window.confirm(
      `Remove this post by ${post.authorDisplayName || post.authorName || 'Student'}?`,
    );

    if (!shouldDelete) return;

    setDeletingPostId(post.id);
    setStatus('');

    try {
      await deletePost(post.id);
      setStatus('Post removed.');
    } catch (error) {
      setStatus(error.message || 'Unable to remove post.');
    } finally {
      setDeletingPostId('');
    }
  };

  const handleReviewReport = async (report, nextStatus, moderatorNote = '') => {
    setReviewingReportId(report.id);
    setStatus('');

    try {
      await updateReportStatus(
        report.id,
        nextStatus,
        {
          uid: currentUser.uid,
          email: currentUser.email,
        },
        moderatorNote,
      );
      setStatus(`Report marked ${nextStatus}.`);
    } catch (error) {
      setStatus(error.message || 'Unable to review report.');
    } finally {
      setReviewingReportId('');
    }
  };

  const handleRemoveReportedPost = async (report) => {
    const shouldRemove = window.confirm('Remove the reported post and mark this report actioned?');
    if (!shouldRemove) return;

    setReviewingReportId(report.id);
    setDeletingPostId(report.targetId);
    setStatus('');

    try {
      await deletePost(report.targetId);
      await updateReportStatus(
        report.id,
        'actioned',
        {
          uid: currentUser.uid,
          email: currentUser.email,
        },
        'Reported post removed.',
      );
      setStatus('Reported post removed.');
    } catch (error) {
      setStatus(error.message || 'Unable to remove reported post.');
    } finally {
      setReviewingReportId('');
      setDeletingPostId('');
    }
  };

  return (
    <div className="admin-clean-page">
      <section id="overview" className="admin-clean-section">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>Campus dashboard</h2>
          </div>
          {status ? <p className="admin-clean-status">{status}</p> : null}
        </div>

        <div className="admin-dashboard-overview-grid">
          <div className="admin-dashboard-hero">
            <div>
              <p className="eyebrow">Live control room</p>
              <h3>Keep users, groups, notices, and reports moving from one place.</h3>
              <p>
                Edit notices, manage groups, review reports, and keep campus signal clean
                without leaving this admin board.
              </p>
            </div>
            <div className="admin-dashboard-orb" aria-hidden="true">
              <ShieldCheck size={42} strokeWidth={1.9} />
            </div>
          </div>

          <div className="admin-clean-metrics">
            {metrics.map((metric) => (
              <article key={metric.label} className="admin-clean-metric">
                <metric.icon size={18} strokeWidth={2.1} aria-hidden="true" />
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-panel-tabs" aria-label="Admin workspace sections">
          {adminPanels.map((panel) => (
            <button
              key={panel.value}
              type="button"
              className={`admin-panel-tab ${
                activePanel === panel.value ? 'admin-panel-tab-active' : ''
              }`}
              onClick={() => handlePanelSelect(panel.value)}
            >
              <span>{panel.label}</span>
              <strong>{panel.count}</strong>
            </button>
          ))}
        </div>
      </section>

      {activePanel === 'notices' ? (
      <>
      <section id="announcements" className="admin-clean-section">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Announcements</p>
            <h2>Publish notice</h2>
          </div>
          <span>{activeAnnouncementsCount} active</span>
        </div>

        <form className="admin-clean-form" onSubmit={handleCreateAnnouncement}>
          <input
            className="input elevated-input"
            placeholder="Title"
            value={formValues.title}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
          <input
            className="input elevated-input"
            placeholder="Tag"
            value={formValues.tag}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, tag: event.target.value }))
            }
          />
          <textarea
            className="input textarea elevated-input"
            placeholder="Message"
            value={formValues.message}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, message: event.target.value }))
            }
            rows={4}
            required
          />
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? 'Publishing...' : 'Publish'}
          </button>
        </form>
      </section>

      <section className="admin-clean-section">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Queue</p>
            <h2>Notices</h2>
          </div>
        </div>

        <div className="admin-clean-list admin-scroll-list">
          {queuedAnnouncements.map((item) => (
            <article key={item.id} className="admin-clean-row">
              {editingAnnouncementId === item.id ? (
                <div className="admin-inline-editor">
                  <input
                    className="input elevated-input"
                    value={announcementDraft.title}
                    onChange={(event) =>
                      setAnnouncementDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Notice title"
                  />
                  <input
                    className="input elevated-input"
                    value={announcementDraft.tag}
                    onChange={(event) =>
                      setAnnouncementDraft((current) => ({
                        ...current,
                        tag: event.target.value,
                      }))
                    }
                    placeholder="Tag"
                  />
                  <textarea
                    className="input textarea elevated-input"
                    value={announcementDraft.message}
                    onChange={(event) =>
                      setAnnouncementDraft((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Notice message"
                  />
                </div>
              ) : (
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <small>
                    {item.tag || 'Announcement'} /{' '}
                    {item.isActive !== false ? 'Active' : 'Paused'}
                  </small>
                </div>
              )}
              <div className="admin-clean-row-actions">
                {editingAnnouncementId === item.id ? (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleUpdateAnnouncement(item.id)}
                      disabled={busy}
                    >
                      <Save size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingAnnouncementId('');
                        setAnnouncementDraft(initialAnnouncementState);
                      }}
                    >
                      <X size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startEditingAnnouncement(item)}
                    >
                      <Edit3 size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => toggleAnnouncementStatus(item.id, item.isActive !== false)}
                    >
                      {item.isActive !== false ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="ghost-button admin-danger-button"
                      onClick={() => deleteAnnouncement(item.id)}
                    >
                      <Trash2 size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      </>
      ) : null}

      {activePanel === 'groups' ? (
      <>
      <section id="groups" className="admin-clean-section">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Groups</p>
            <h2>Create group</h2>
          </div>
        </div>

        <form className="admin-clean-form" onSubmit={handleCreateGroup}>
          <input
            className="input elevated-input"
            placeholder="Group name"
            value={groupValues.name}
            onChange={(event) =>
              setGroupValues((current) => ({ ...current, name: event.target.value }))
            }
            required
          />
          <textarea
            className="input textarea elevated-input"
            placeholder="Description"
            value={groupValues.description}
            onChange={(event) =>
              setGroupValues((current) => ({ ...current, description: event.target.value }))
            }
            rows={3}
            required
          />
          <div className="admin-clean-form-grid">
            <select
              className="input elevated-input"
              value={groupValues.type}
              onChange={(event) =>
                setGroupValues((current) => ({ ...current, type: event.target.value }))
              }
            >
              <option value="academic">Academic</option>
              <option value="hostel">Hostel</option>
              <option value="career">Career</option>
              <option value="builders">Builders</option>
              <option value="community">Community</option>
            </select>
            <input
              className="input elevated-input"
              placeholder="Audience, e.g. 200L CSC"
              value={groupValues.audience}
              onChange={(event) =>
                setGroupValues((current) => ({ ...current, audience: event.target.value }))
              }
            />
          </div>
          <button type="submit" className="primary-button" disabled={busy}>
            Create group
          </button>
        </form>

        <div className="admin-clean-list">
          {groups.map((group) => (
            <article key={group.id} className="admin-clean-row">
              {editingGroupId === group.id ? (
                <div className="admin-inline-editor">
                  <input
                    className="input elevated-input"
                    value={groupDraft.name}
                    onChange={(event) =>
                      setGroupDraft((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                  <textarea
                    className="input textarea elevated-input"
                    value={groupDraft.description}
                    onChange={(event) =>
                      setGroupDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                  />
                  <div className="admin-clean-form-grid">
                    <select
                      className="input elevated-input"
                      value={groupDraft.type}
                      onChange={(event) =>
                        setGroupDraft((current) => ({ ...current, type: event.target.value }))
                      }
                    >
                      <option value="academic">Academic</option>
                      <option value="hostel">Hostel</option>
                      <option value="career">Career</option>
                      <option value="builders">Builders</option>
                      <option value="community">Community</option>
                    </select>
                    <input
                      className="input elevated-input"
                      value={groupDraft.audience}
                      onChange={(event) =>
                        setGroupDraft((current) => ({
                          ...current,
                          audience: event.target.value,
                        }))
                      }
                      placeholder="Audience"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <strong>{group.name}</strong>
                  <p>{group.description}</p>
                  <small>
                    {group.type || 'community'} / {group.audience || 'Campus'} /{' '}
                    {group.members?.length || 0} members
                  </small>
                </div>
              )}
              <div className="admin-clean-row-actions">
                {editingGroupId === group.id ? (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleUpdateGroup(group.id)}
                      disabled={busy}
                    >
                      <Save size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingGroupId('');
                        setGroupDraft(initialGroupState);
                      }}
                    >
                      <X size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startEditingGroup(group)}
                    >
                      <Edit3 size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="ghost-button admin-danger-button"
                      onClick={() => handleDeleteGroup(group)}
                      disabled={busy}
                    >
                      <Trash2 size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-clean-section">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Group requests</p>
            <h2>Review queue</h2>
          </div>
          <span>{pendingGroupRequests.length} pending</span>
        </div>

        <div className="admin-clean-list">
          {pendingGroupRequests.length ? (
            pendingGroupRequests.map((request) => (
              <article key={request.id} className="admin-clean-row admin-clean-request-row">
                <div>
                  <strong>{request.name}</strong>
                  <p>{request.description}</p>
                  <small>
                    Requested by {request.requesterName || request.requesterEmail || 'Student'}
                  </small>
                </div>
                <div className="admin-clean-row-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleReviewGroupRequest(request, 'approved')}
                    disabled={reviewingRequestId === request.id}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="ghost-button admin-danger-button"
                    onClick={() => handleReviewGroupRequest(request, 'declined')}
                    disabled={reviewingRequestId === request.id}
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))
          ) : (
            <article className="admin-clean-row">
              <div>
                <strong>No pending group requests</strong>
                <p>New student-created group requests will appear here.</p>
              </div>
            </article>
          )}
        </div>
      </section>
      </>
      ) : null}

      {activePanel === 'safety' ? (
      <>
      <section id="safety" className="admin-clean-section admin-clean-section-wide">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Safety</p>
            <h2>Reports queue</h2>
          </div>
          <span>{pendingReports.length} pending</span>
        </div>

        <div className="admin-clean-list">
          {recentReports.length ? (
            recentReports.map((report) => (
              <article key={report.id} className="admin-clean-row admin-clean-report-row">
                <div>
                  <strong>
                    {report.targetType || 'content'} reported by{' '}
                    {report.reporterName || 'Student'}
                  </strong>
                  <p>{report.targetLabel || 'No content preview'}</p>
                  <small>
                    Reason: {report.reason || 'Not provided'} / Status:{' '}
                    {report.status || 'pending'}
                  </small>
                  {report.details ? <small>Details: {report.details}</small> : null}
                </div>
                <div className="admin-clean-row-actions">
                  {report.status === 'pending' && report.targetType === 'post' ? (
                    <button
                      type="button"
                      className="ghost-button admin-danger-button"
                      onClick={() => handleRemoveReportedPost(report)}
                      disabled={
                        reviewingReportId === report.id || deletingPostId === report.targetId
                      }
                    >
                      Remove post
                    </button>
                  ) : null}
                  {report.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleReviewReport(report, 'reviewed')}
                        disabled={reviewingReportId === report.id}
                      >
                        Mark reviewed
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => handleReviewReport(report, 'dismissed')}
                        disabled={reviewingReportId === report.id}
                      >
                        Dismiss
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className="admin-clean-row">
              <div>
                <strong>No reports yet</strong>
                <p>Student reports will appear here for admins and moderators.</p>
              </div>
            </article>
          )}
        </div>
      </section>

      <section id="posts" className="admin-clean-section admin-clean-section-wide">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Posts</p>
            <h2>Moderation</h2>
          </div>
        </div>

        <div className="admin-clean-list admin-scroll-list">
          {recentPosts.map((post) => (
            <article key={post.id} className="admin-clean-row admin-clean-post-row">
              <div>
                <strong>{post.authorDisplayName || post.authorName || 'Student'}</strong>
                <p>{post.content || 'No post text'}</p>
                <small>{formatTimestamp(post.createdAt)}</small>
              </div>
              <button
                type="button"
                className="ghost-button admin-danger-button"
                onClick={() => handleDeletePost(post)}
                disabled={deletingPostId === post.id}
              >
                <Trash2 size={14} strokeWidth={2.1} aria-hidden="true" />
                <span>{deletingPostId === post.id ? 'Removing...' : 'Remove'}</span>
              </button>
            </article>
          ))}
        </div>
      </section>
      </>
      ) : null}

      {activePanel === 'users' ? (
      <section id="community" className="admin-clean-section admin-clean-section-wide">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Users</p>
            <h2>Roles</h2>
          </div>
          <span>{filteredUsers.length} shown</span>
        </div>

        <div className="admin-clean-toolbar">
          <input
            className="input elevated-input"
            placeholder="Search users"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
          />
          <select
            className="input elevated-input"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="member">Members</option>
          </select>
        </div>

        <div className="admin-clean-list admin-scroll-list">
          {filteredUsers.map((user) => {
            const displayName = user.displayName || user.fullName || user.name || 'Student';
            const currentRole = user.role || 'member';

            return (
              <article key={user.id} className="admin-clean-row admin-clean-user-row">
                <div>
                  <strong>{displayName}</strong>
                  <p>{user.email || 'No email'} / {user.department || 'No department'}</p>
                </div>
                <select
                  className="input elevated-input"
                  value={currentRole}
                  onChange={(event) => handleRoleUpdate(user.id, event.target.value)}
                  disabled={updatingUserId === user.id}
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </article>
            );
          })}
        </div>
      </section>
      ) : null}

      {activePanel === 'posts' ? (
      <section id="posts" className="admin-clean-section admin-clean-section-wide">
        <div className="admin-clean-heading">
          <div>
            <p className="eyebrow">Posts</p>
            <h2>Moderation</h2>
          </div>
        </div>

        <div className="admin-clean-list admin-scroll-list">
          {recentPosts.map((post) => (
            <article key={post.id} className="admin-clean-row admin-clean-post-row">
              <div>
                <strong>{post.authorDisplayName || post.authorName || 'Student'}</strong>
                <p>{post.content || 'No post text'}</p>
                <small>{formatTimestamp(post.createdAt)}</small>
              </div>
              <button
                type="button"
                className="ghost-button admin-danger-button"
                onClick={() => handleDeletePost(post)}
                disabled={deletingPostId === post.id}
              >
                <Trash2 size={14} strokeWidth={2.1} aria-hidden="true" />
                <span>{deletingPostId === post.id ? 'Removing...' : 'Remove'}</span>
              </button>
            </article>
          ))}
        </div>
      </section>
      ) : null}
    </div>
  );
}

export default AdminPage;
