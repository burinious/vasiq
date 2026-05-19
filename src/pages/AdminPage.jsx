import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Edit3,
  Flag,
  Megaphone,
  Save,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
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
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ReportRoundedIcon from '@mui/icons-material/ReportRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import { glassCardSx, pageBgSx, primaryButtonSx, softInputSx } from '../styles/premiumTheme';

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

const panelMeta = {
  notices: {
    label: 'Notices',
    icon: CampaignRoundedIcon,
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.9), rgba(20,184,166,0.82))',
  },
  groups: {
    label: 'Groups',
    icon: GroupsRoundedIcon,
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.9), rgba(20,184,166,0.82))',
  },
  safety: {
    label: 'Safety',
    icon: ReportRoundedIcon,
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(249,115,22,0.82))',
  },
  users: {
    label: 'Users',
    icon: AdminPanelSettingsRoundedIcon,
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(16,185,129,0.82))',
  },
  posts: {
    label: 'Posts',
    icon: ForumRoundedIcon,
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.9), rgba(20,184,166,0.82))',
  },
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

function SectionCard({ eyebrow, title, action, children, wide = false }) {
  return (
    <Card sx={{ ...glassCardSx, gridColumn: wide ? '1 / -1' : 'auto' }}>
      <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          mb={2.5}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 1.3 }}
            >
              {eyebrow}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a' }}>
              {title}
            </Typography>
          </Box>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, body }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.4,
        borderRadius: 4,
        border: '1px dashed rgba(148,163,184,0.55)',
        background: 'rgba(248,250,252,0.72)',
      }}
    >
      <Typography sx={{ fontWeight: 900, color: '#0f172a' }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4 }}>
        {body}
      </Typography>
    </Paper>
  );
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
        user.university || '',
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
    <Box
      className="mobile-admin-page"
      sx={{
        ...pageBgSx,
        py: { xs: 3, md: 5 },
      }}
    >
      <Container className="mobile-admin-container" maxWidth="xl">
        <Stack spacing={3}>
          <Card
            sx={{
              ...glassCardSx,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(135deg, rgba(15,118,110,0.12), rgba(20,184,166,0.08), rgba(14,165,233,0.1))',
                pointerEvents: 'none',
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 4 }, position: 'relative' }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Stack spacing={1.2}>
                    <Chip
                      label="VASIQ Admin Console"
                      sx={{
                        width: 'fit-content',
                        fontWeight: 900,
                        color: '#0d9488',
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.2)',
                      }}
                    />
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 950,
                        lineHeight: 1.05,
                        letterSpacing: -1.4,
                        color: '#0f172a',
                        fontSize: { xs: '2rem', md: '3.25rem' },
                      }}
                    >
                      Campus control room with premium admin power.
                    </Typography>
                    <Typography sx={{ color: '#475569', maxWidth: 650, fontSize: '1rem' }}>
                      Manage notices, groups, users, reports, and posts from one polished dashboard.
                      Built for quick moderation, live decisions, and clean campus signal.
                    </Typography>
                    {status ? (
                      <Alert
                        severity="info"
                        sx={{
                          width: 'fit-content',
                          borderRadius: 3,
                          background: 'rgba(239,246,255,0.78)',
                          border: '1px solid rgba(59,130,246,0.18)',
                        }}
                      >
                        {status}
                      </Alert>
                    ) : null}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Grid container spacing={1.5}>
                    {metrics.map((metric) => (
                      <Grid item xs={6} sm={4} key={metric.label}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.62)',
                            border: '1px solid rgba(255,255,255,0.58)',
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <Stack spacing={1}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                background: 'rgba(15,118,110,0.12)',
                                color: '#0f766e',
                              }}
                            >
                              <metric.icon size={18} />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                                {metric.label}
                              </Typography>
                              <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 950 }}>
                                {metric.value}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={1.5}>
            {adminPanels.map((panel) => {
              const meta = panelMeta[panel.value];
              const Icon = meta.icon;
              const selected = activePanel === panel.value;

              return (
                <Grid item xs={6} md={2.4} key={panel.value}>
                  <Button
                    fullWidth
                    onClick={() => handlePanelSelect(panel.value)}
                    sx={{
                      minHeight: 82,
                      borderRadius: 4,
                      justifyContent: 'flex-start',
                      p: 1.6,
                      textTransform: 'none',
                      border: selected
                        ? '1px solid rgba(255,255,255,0.74)'
                        : '1px solid rgba(148,163,184,0.28)',
                      background: selected ? meta.gradient : 'rgba(255,255,255,0.58)',
                      color: selected ? '#fff' : '#0f172a',
                      boxShadow: selected ? '0 18px 42px rgba(15,118,110,0.22)' : 'none',
                      backdropFilter: 'blur(18px)',
                      '&:hover': {
                        background: selected ? meta.gradient : 'rgba(255,255,255,0.84)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 180ms ease',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ width: '100%' }}>
                      <Avatar
                        sx={{
                          bgcolor: selected ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.06)',
                          color: 'inherit',
                          width: 38,
                          height: 38,
                        }}
                      >
                        <Icon fontSize="small" />
                      </Avatar>
                      <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>{panel.label}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.82, fontWeight: 800 }}>
                          {panel.count} items
                        </Typography>
                      </Box>
                    </Stack>
                  </Button>
                </Grid>
              );
            })}
          </Grid>

          {activePanel === 'notices' ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <SectionCard
                  eyebrow="Announcements"
                  title="Publish notice"
                  action={<Chip label={`${activeAnnouncementsCount} active`} color="primary" variant="outlined" />}
                >
                  <Stack component="form" onSubmit={handleCreateAnnouncement} spacing={2}>
                    <TextField
                      label="Title"
                      value={formValues.title}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, title: event.target.value }))
                      }
                      required
                      sx={softInputSx}
                    />
                    <TextField
                      label="Tag"
                      value={formValues.tag}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, tag: event.target.value }))
                      }
                      sx={softInputSx}
                    />
                    <TextField
                      label="Message"
                      value={formValues.message}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, message: event.target.value }))
                      }
                      multiline
                      minRows={4}
                      required
                      sx={softInputSx}
                    />
                    <Button type="submit" variant="contained" disabled={busy} sx={primaryButtonSx}>
                      {busy ? 'Publishing...' : 'Publish notice'}
                    </Button>
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={7}>
                <SectionCard eyebrow="Queue" title="Notices">
                  <Stack spacing={1.5} sx={{ maxHeight: 560, overflow: 'auto', pr: 0.5 }}>
                    {queuedAnnouncements.length ? (
                      queuedAnnouncements.map((item) => (
                        <Paper
                          key={item.id}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 4,
                            border: '1px solid rgba(148,163,184,0.2)',
                            background: 'rgba(255,255,255,0.66)',
                          }}
                        >
                          {editingAnnouncementId === item.id ? (
                            <Stack spacing={1.3}>
                              <TextField
                                size="small"
                                value={announcementDraft.title}
                                onChange={(event) =>
                                  setAnnouncementDraft((current) => ({
                                    ...current,
                                    title: event.target.value,
                                  }))
                                }
                                sx={softInputSx}
                              />
                              <TextField
                                size="small"
                                value={announcementDraft.tag}
                                onChange={(event) =>
                                  setAnnouncementDraft((current) => ({
                                    ...current,
                                    tag: event.target.value,
                                  }))
                                }
                                sx={softInputSx}
                              />
                              <TextField
                                size="small"
                                multiline
                                minRows={3}
                                value={announcementDraft.message}
                                onChange={(event) =>
                                  setAnnouncementDraft((current) => ({
                                    ...current,
                                    message: event.target.value,
                                  }))
                                }
                                sx={softInputSx}
                              />
                            </Stack>
                          ) : (
                            <Stack spacing={0.7}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{item.title}</Typography>
                                <Chip
                                  size="small"
                                  label={item.isActive !== false ? 'Active' : 'Paused'}
                                  color={item.isActive !== false ? 'success' : 'default'}
                                />
                              </Stack>
                              <Typography variant="body2" sx={{ color: '#475569' }}>
                                {item.message}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                                {item.tag || 'Announcement'}
                              </Typography>
                            </Stack>
                          )}

                          <Divider sx={{ my: 1.5 }} />

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {editingAnnouncementId === item.id ? (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Save size={14} />}
                                  onClick={() => handleUpdateAnnouncement(item.id)}
                                  disabled={busy}
                                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<X size={14} />}
                                  onClick={() => {
                                    setEditingAnnouncementId('');
                                    setAnnouncementDraft(initialAnnouncementState);
                                  }}
                                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Edit3 size={14} />}
                                  onClick={() => startEditingAnnouncement(item)}
                                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => toggleAnnouncementStatus(item.id, item.isActive !== false)}
                                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                  {item.isActive !== false ? 'Pause' : 'Activate'}
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  startIcon={<Trash2 size={14} />}
                                  onClick={() => deleteAnnouncement(item.id)}
                                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </Stack>
                        </Paper>
                      ))
                    ) : (
                      <EmptyState title="No notices yet" body="Published notices will appear here." />
                    )}
                  </Stack>
                </SectionCard>
              </Grid>
            </Grid>
          ) : null}

          {activePanel === 'groups' ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <SectionCard eyebrow="Groups" title="Create group">
                  <Stack component="form" onSubmit={handleCreateGroup} spacing={2}>
                    <TextField
                      label="Group name"
                      value={groupValues.name}
                      onChange={(event) =>
                        setGroupValues((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                      sx={softInputSx}
                    />
                    <TextField
                      label="Description"
                      value={groupValues.description}
                      onChange={(event) =>
                        setGroupValues((current) => ({ ...current, description: event.target.value }))
                      }
                      multiline
                      minRows={3}
                      required
                      sx={softInputSx}
                    />
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Type"
                          value={groupValues.type}
                          onChange={(event) =>
                            setGroupValues((current) => ({ ...current, type: event.target.value }))
                          }
                          sx={softInputSx}
                        >
                          <MenuItem value="academic">Academic</MenuItem>
                          <MenuItem value="hostel">Hostel</MenuItem>
                          <MenuItem value="career">Career</MenuItem>
                          <MenuItem value="builders">Builders</MenuItem>
                          <MenuItem value="community">Community</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Audience"
                          value={groupValues.audience}
                          onChange={(event) =>
                            setGroupValues((current) => ({ ...current, audience: event.target.value }))
                          }
                          sx={softInputSx}
                        />
                      </Grid>
                    </Grid>
                    <Button type="submit" variant="contained" disabled={busy} sx={primaryButtonSx}>
                      Create group
                    </Button>
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={7}>
                <SectionCard eyebrow="Group requests" title="Review queue" action={<Chip label={`${pendingGroupRequests.length} pending`} color="warning" variant="outlined" />}>
                  <Stack spacing={1.5}>
                    {pendingGroupRequests.length ? (
                      pendingGroupRequests.map((request) => (
                        <Paper key={request.id} elevation={0} sx={{ p: 2, borderRadius: 4, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(148,163,184,0.2)' }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                            <Box>
                              <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{request.name}</Typography>
                              <Typography variant="body2" sx={{ color: '#475569' }}>{request.description}</Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                                Requested by {request.requesterName || request.requesterEmail || 'Student'}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="contained" onClick={() => handleReviewGroupRequest(request, 'approved')} disabled={reviewingRequestId === request.id} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                                Approve
                              </Button>
                              <Button size="small" color="error" variant="outlined" onClick={() => handleReviewGroupRequest(request, 'declined')} disabled={reviewingRequestId === request.id} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                                Decline
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))
                    ) : (
                      <EmptyState title="No pending group requests" body="Student-created group requests will appear here." />
                    )}
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid item xs={12}>
                <SectionCard eyebrow="Groups" title="Existing groups" wide>
                  <Grid container spacing={1.5}>
                    {groups.map((group) => (
                      <Grid item xs={12} md={6} key={group.id}>
                        <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 4, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(148,163,184,0.2)' }}>
                          {editingGroupId === group.id ? (
                            <Stack spacing={1.3}>
                              <TextField size="small" value={groupDraft.name} onChange={(event) => setGroupDraft((current) => ({ ...current, name: event.target.value }))} sx={softInputSx} />
                              <TextField size="small" multiline minRows={3} value={groupDraft.description} onChange={(event) => setGroupDraft((current) => ({ ...current, description: event.target.value }))} sx={softInputSx} />
                              <TextField size="small" select value={groupDraft.type} onChange={(event) => setGroupDraft((current) => ({ ...current, type: event.target.value }))} sx={softInputSx}>
                                <MenuItem value="academic">Academic</MenuItem>
                                <MenuItem value="hostel">Hostel</MenuItem>
                                <MenuItem value="career">Career</MenuItem>
                                <MenuItem value="builders">Builders</MenuItem>
                                <MenuItem value="community">Community</MenuItem>
                              </TextField>
                              <TextField size="small" value={groupDraft.audience} onChange={(event) => setGroupDraft((current) => ({ ...current, audience: event.target.value }))} sx={softInputSx} />
                            </Stack>
                          ) : (
                            <Stack spacing={0.6}>
                              <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{group.name}</Typography>
                              <Typography variant="body2" sx={{ color: '#475569' }}>{group.description}</Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip size="small" label={group.type || 'community'} />
                                <Chip size="small" label={group.audience || 'Campus'} />
                                <Chip size="small" label={`${group.members?.length || 0} members`} />
                              </Stack>
                            </Stack>
                          )}
                          <Divider sx={{ my: 1.5 }} />
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {editingGroupId === group.id ? (
                              <>
                                <Button size="small" variant="contained" startIcon={<Save size={14} />} onClick={() => handleUpdateGroup(group.id)} disabled={busy} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>Save</Button>
                                <Button size="small" variant="outlined" startIcon={<X size={14} />} onClick={() => { setEditingGroupId(''); setGroupDraft(initialGroupState); }} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button size="small" variant="outlined" startIcon={<Edit3 size={14} />} onClick={() => startEditingGroup(group)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>Edit</Button>
                                <Button size="small" color="error" variant="outlined" startIcon={<Trash2 size={14} />} onClick={() => handleDeleteGroup(group)} disabled={busy} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>Delete</Button>
                              </>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </SectionCard>
              </Grid>
            </Grid>
          ) : null}

          {activePanel === 'safety' ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionCard eyebrow="Safety" title="Reports queue" action={<Chip label={`${pendingReports.length} pending`} color="error" variant="outlined" />} wide>
                  <Stack spacing={1.5}>
                    {recentReports.length ? (
                      recentReports.map((report) => (
                        <Paper key={report.id} elevation={0} sx={{ p: 2, borderRadius: 4, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(148,163,184,0.2)' }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                            <Box>
                              <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>
                                {report.targetType || 'content'} reported by {report.reporterName || 'Student'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#475569' }}>{report.targetLabel || 'No content preview'}</Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                                Reason: {report.reason || 'Not provided'} / Status: {report.status || 'pending'}
                              </Typography>
                              {report.details ? <Typography variant="caption" display="block" sx={{ color: '#64748b' }}>Details: {report.details}</Typography> : null}
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {report.status === 'pending' && report.targetType === 'post' ? (
                                <Button size="small" color="error" variant="contained" onClick={() => handleRemoveReportedPost(report)} disabled={reviewingReportId === report.id || deletingPostId === report.targetId} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                                  Remove post
                                </Button>
                              ) : null}
                              {report.status === 'pending' ? (
                                <>
                                  <Button size="small" variant="outlined" onClick={() => handleReviewReport(report, 'reviewed')} disabled={reviewingReportId === report.id} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>Mark reviewed</Button>
                                  <Button size="small" variant="outlined" onClick={() => handleReviewReport(report, 'dismissed')} disabled={reviewingReportId === report.id} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>Dismiss</Button>
                                </>
                              ) : null}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))
                    ) : (
                      <EmptyState title="No reports yet" body="Student reports will appear here for admins and moderators." />
                    )}
                  </Stack>
                </SectionCard>
              </Grid>
            </Grid>
          ) : null}

          {activePanel === 'users' ? (
            <SectionCard eyebrow="Users" title="Roles" action={<Chip label={`${filteredUsers.length} shown`} color="success" variant="outlined" />} wide>
              <Grid container spacing={1.5} mb={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    placeholder="Search users"
                    value={userQuery}
                    onChange={(event) => setUserQuery(event.target.value)}
                    sx={softInputSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    sx={softInputSx}
                  >
                    <MenuItem value="all">All roles</MenuItem>
                    <MenuItem value="admin">Admins</MenuItem>
                    <MenuItem value="moderator">Moderators</MenuItem>
                    <MenuItem value="member">Members</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Stack spacing={1.5} sx={{ maxHeight: 620, overflow: 'auto', pr: 0.5 }}>
                {filteredUsers.map((user) => {
                  const displayName = user.displayName || user.fullName || user.name || 'Student';
                  const currentRole = user.role || 'member';

                  return (
                    <Paper key={user.id} elevation={0} sx={{ p: 2, borderRadius: 4, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(148,163,184,0.2)' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: 'rgba(15,118,110,0.12)', color: '#0f766e', fontWeight: 950 }}>
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{displayName}</Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              {user.email || 'No email'} / {user.university || 'No university'} / {user.department || 'No course'}
                            </Typography>
                          </Box>
                        </Stack>
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                          <Select
                            value={currentRole}
                            onChange={(event) => handleRoleUpdate(user.id, event.target.value)}
                            disabled={updatingUserId === user.id}
                            sx={{ borderRadius: 999, background: 'rgba(255,255,255,0.72)' }}
                          >
                            <MenuItem value="member">Member</MenuItem>
                            <MenuItem value="moderator">Moderator</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </SectionCard>
          ) : null}

          {activePanel === 'posts' ? (
            <SectionCard eyebrow="Posts" title="Moderation" wide>
              <Stack spacing={1.5} sx={{ maxHeight: 620, overflow: 'auto', pr: 0.5 }}>
                {recentPosts.length ? (
                  recentPosts.map((post) => (
                    <Paper key={post.id} elevation={0} sx={{ p: 2, borderRadius: 4, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(148,163,184,0.2)' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                        <Box>
                          <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{post.authorDisplayName || post.authorName || 'Student'}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>{post.content || 'No post text'}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>{formatTimestamp(post.createdAt)}</Typography>
                        </Box>
                        <IconButton color="error" onClick={() => handleDeletePost(post)} disabled={deletingPostId === post.id} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(254,242,242,0.8)' }}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))
                ) : (
                  <EmptyState title="No posts yet" body="Recent posts will appear here for moderation." />
                )}
              </Stack>
            </SectionCard>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}

export default AdminPage;
