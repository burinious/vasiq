import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import ReportRoundedIcon from '@mui/icons-material/ReportRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PostCard from '../components/feed/PostCard';
import PostComposer from '../components/feed/PostComposer';
import Loader from '../components/layout/Loader';
import { useAuth } from '../context/AuthContext';
import {
  addPostComment,
  blockUser,
  createPost,
  createReport,
  listenToAnnouncements,
  listenToPosts,
  listenToUsers,
  recordPostShare,
  replyToPostComment,
  togglePostLike,
  togglePostCommentLike,
  togglePostReplyLike,
} from '../firebase/firestore';
import { getPostCategoryMeta } from '../lib/campusSignal';
import { normalizeAcademicValue } from '../data/nigeriaAcademics';
import {
  glassCardSx,
  pageBgSx,
  primaryButtonSx,
  softInputSx,
} from '../styles/premiumTheme';
import '../styles/feedstyle.css';
import { getUserDisplayName } from '../utils/userIdentity';

function createClientPostId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function FeedShellCard({ children, sx, className = '' }) {
  return (
    <Card className={`vasiq-feed-card ${className}`} sx={{ ...glassCardSx, borderRadius: 4, overflow: 'hidden', ...sx }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.4, md: 2.8 } }}>{children}</CardContent>
    </Card>
  );
}

function FeedPage() {
  const { currentUser, profile } = useAuth();
  const publicName = getUserDisplayName({ ...profile, email: currentUser?.email });
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [posting, setPosting] = useState(false);
  const [postsReady, setPostsReady] = useState(false);
  const [usersReady, setUsersReady] = useState(false);
  const [announcementsReady, setAnnouncementsReady] = useState(false);
  const [feedStatus, setFeedStatus] = useState('');
  const [activeFilter, setActiveFilter] = useState('for-you');
  const [reportDialog, setReportDialog] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const pendingPostResolversRef = useRef(new Map());
  const pendingPostTimeoutsRef = useRef(new Map());

  useEffect(() => {
    const unsubscribePosts = listenToPosts((nextPosts) => {
      setPosts(nextPosts);
      setPostsReady(true);

      nextPosts.forEach((post) => {
        const clientPostId = post.clientPostId;
        if (!clientPostId) return;

        const resolver = pendingPostResolversRef.current.get(clientPostId);
        const timeoutId = pendingPostTimeoutsRef.current.get(clientPostId);

        if (resolver) {
          resolver();
          pendingPostResolversRef.current.delete(clientPostId);
        }

        if (timeoutId) {
          window.clearTimeout(timeoutId);
          pendingPostTimeoutsRef.current.delete(clientPostId);
        }
      });
    });
    const unsubscribeUsers = listenToUsers((nextUsers) => {
      setUsers(nextUsers);
      setUsersReady(true);
    });
    const unsubscribeAnnouncements = listenToAnnouncements((nextAnnouncements) => {
      setAnnouncements(nextAnnouncements);
      setAnnouncementsReady(true);
    });

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
      unsubscribeAnnouncements();
      pendingPostTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      pendingPostTimeoutsRef.current.clear();
      pendingPostResolversRef.current.clear();
    };
  }, []);

  const waitForPostAppearance = (clientPostId) =>
    new Promise((resolve) => {
      if (posts.some((post) => post.clientPostId === clientPostId)) {
        resolve();
        return;
      }

      pendingPostResolversRef.current.set(clientPostId, resolve);
      const timeoutId = window.setTimeout(() => {
        pendingPostResolversRef.current.delete(clientPostId);
        pendingPostTimeoutsRef.current.delete(clientPostId);
        resolve();
      }, 5000);
      pendingPostTimeoutsRef.current.set(clientPostId, timeoutId);
    });

  const handleCreatePost = async ({ content, imageUrl, mediaType, category, signalLevel }) => {
    setPosting(true);
    const clientPostId = createClientPostId();

    try {
      const writePromise = createPost({
        userId: currentUser.uid,
        authorName: publicName,
        authorUniversity: profile?.showUniversity === false ? '' : profile?.university || '',
        authorDepartment: profile?.showDepartment === false ? '' : profile?.department || '',
        authorLevel: profile?.showLevel === false ? '' : profile?.level || '',
        authorAvatar: profile?.avatarUrl || '',
        authorResidence: profile?.residence || '',
        content,
        imageUrl,
        mediaType,
        category,
        signalLevel,
        clientPostId,
      });

      await Promise.race([writePromise, waitForPostAppearance(clientPostId)]);
      writePromise.catch((error) => {
        console.error('Post write finished late with an error.', error);
      });
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (post) => {
    const isLiked = post.likes?.includes(currentUser.uid);
    setFeedStatus('');

    try {
      await togglePostLike(post.id, currentUser.uid, isLiked);
    } catch (error) {
      setFeedStatus(error.message || 'Unable to update this reaction.');
    }
  };

  const handleComment = async (postId, text) => {
    setFeedStatus('');

    try {
      await addPostComment(postId, {
        userId: currentUser.uid,
        userName: publicName,
        text,
      });
    } catch (error) {
      setFeedStatus(error.message || 'Unable to add comment.');
      throw error;
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    setFeedStatus('');

    try {
      await togglePostCommentLike(postId, commentId, currentUser.uid);
    } catch (error) {
      setFeedStatus(error.message || 'Unable to like this comment.');
    }
  };

  const handleCommentReply = async (postId, replyTarget, text) => {
    setFeedStatus('');

    try {
      await replyToPostComment(postId, replyTarget.commentId, {
        userId: currentUser.uid,
        userName: publicName,
        text,
        parentReplyId: replyTarget.parentReplyId || '',
        parentReplyName: replyTarget.parentReplyName || '',
      });
    } catch (error) {
      setFeedStatus(error.message || 'Unable to reply to this comment.');
      throw error;
    }
  };

  const handleReplyLike = async (postId, commentId, replyId) => {
    setFeedStatus('');

    if (!commentId || !replyId) {
      setFeedStatus('Unable to like this reply because it is missing a valid reply id.');
      return;
    }

    try {
      await togglePostReplyLike(postId, commentId, replyId, currentUser.uid);
    } catch (error) {
      const message =
        error.code === 'permission-denied'
          ? 'Firebase rules blocked this reply like. Deploy the latest firestore.rules so reply likes are allowed.'
          : error.message || 'Unable to like this reply.';
      setFeedStatus(message);
    }
  };

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/feed?post=${encodeURIComponent(post.id)}`;
    const shareTitle = `${post.authorName || 'A student'} on VASIQ`;
    const shareText = post.content
      ? post.content.slice(0, 180)
      : 'Check this campus update on VASIQ.';
    const shareMessage = `${shareText}\n\n${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        const openedWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

        if (!openedWindow && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareMessage);
        } else if (!openedWindow) {
          throw new Error('Unable to open WhatsApp. Try again or enable pop-ups for this site.');
        }
      }

      await recordPostShare(post.id);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Unable to share post.', error);
        setFeedStatus(error.message || 'Unable to share this post.');
      }
    }
  };

  const openReportDialog = (dialog) => {
    setFeedStatus('');
    setReportReason('');
    setReportDetails('');
    setReportDialog(dialog);
  };

  const handleReportPost = async (post) => {
    openReportDialog({
      targetName: 'post',
      successMessage: 'Report sent to moderators.',
      report: {
        reporterId: currentUser.uid,
        reporterName: publicName,
        targetType: 'post',
        targetId: post.id,
        targetOwnerId: post.userId || '',
        targetLabel: (post.content || 'Post').slice(0, 180),
      },
    });
  };

  const handleReportComment = async (post, commentItem) => {
    openReportDialog({
      targetName: 'comment',
      successMessage: 'Comment report sent to moderators.',
      report: {
        reporterId: currentUser.uid,
        reporterName: publicName,
        targetType: 'comment',
        targetId: commentItem.id || `${post.id}:comment:${commentItem.userId || 'unknown'}`,
        targetOwnerId: commentItem.userId || '',
        targetLabel: (commentItem.text || 'Comment').slice(0, 180),
      },
    });
  };

  const handleReportReply = async (post, commentItem, replyItem, replyIndex) => {
    openReportDialog({
      targetName: 'reply',
      successMessage: 'Reply report sent to moderators.',
      report: {
        reporterId: currentUser.uid,
        reporterName: publicName,
        targetType: 'reply',
        targetId:
          replyItem.id ||
          `${post.id}:comment:${commentItem.id || commentItem.userId || 'unknown'}:reply:${replyIndex}`,
        targetOwnerId: replyItem.userId || '',
        targetLabel: (replyItem.text || 'Reply').slice(0, 180),
      },
    });
  };

  const closeReportDialog = () => {
    if (reporting) return;
    setReportDialog(null);
    setReportReason('');
    setReportDetails('');
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!reportDialog || !reportReason.trim()) return;

    setReporting(true);
    setFeedStatus('');

    try {
      await createReport({
        ...reportDialog.report,
        reason: reportReason.trim(),
        details: reportDetails.trim(),
      });
      setFeedStatus(reportDialog.successMessage);
      closeReportDialog();
    } catch (error) {
      setFeedStatus(error.message || `Unable to report ${reportDialog.targetName}.`);
    } finally {
      setReporting(false);
    }
  };

  const handleBlockAuthor = async (post) => {
    if (!post.userId || post.userId === currentUser.uid) return;

    const authorName = post.authorDisplayName || post.authorName || 'this student';
    const shouldBlock = window.confirm(
      `Block ${authorName}? Their posts will be hidden from your feed.`,
    );

    if (!shouldBlock) return;

    setFeedStatus('');

    try {
      await blockUser(currentUser.uid, post.userId);
      setFeedStatus(`${authorName} has been blocked from your feed.`);
    } catch (error) {
      setFeedStatus(error.message || 'Unable to block this user.');
    }
  };

  const blockedUserIds = Array.isArray(profile?.blockedUserIds) ? profile.blockedUserIds : [];
  const visiblePosts = posts.filter((post) => !blockedUserIds.includes(post.userId));
  const normalizedUniversity = normalizeAcademicValue(profile?.university);
  const normalizedDepartment = normalizeAcademicValue(profile?.department);
  const prioritizedPosts = [...visiblePosts]
    .map((post) => {
      const categoryMeta = getPostCategoryMeta(
        post.category || (post.signalLevel === 'urgent' ? 'urgent' : 'social'),
      );
      const normalizedAuthorUniversity = normalizeAcademicValue(post.authorUniversity);
      const normalizedAuthorDepartment = normalizeAcademicValue(post.authorDepartment);
      const createdAtTime =
        typeof post.createdAt?.toMillis === 'function'
          ? post.createdAt.toMillis()
          : new Date(post.createdAt || 0).getTime();
      const engagementScore =
        (post.likes?.length || 0) + (post.comments?.length || 0) * 2 + (post.shareCount || 0) * 3;
      const recencyBoost = Math.max(
        0,
        5 - Math.floor((Date.now() - createdAtTime) / (1000 * 60 * 60 * 6)),
      );
      const categoryBoost =
        post.signalLevel === 'urgent'
          ? 50
          : categoryMeta.value === 'materials'
            ? 30
            : categoryMeta.value === 'opportunity'
              ? 28
              : categoryMeta.value === 'sapa'
                ? 26
                : categoryMeta.value === 'academic'
                  ? 24
                  : categoryMeta.value === 'hostel'
                    ? 18
                    : categoryMeta.value === 'event'
                      ? 16
                      : 10;
      const departmentBoost =
        normalizedDepartment &&
        normalizedAuthorDepartment === normalizedDepartment &&
        (!normalizedUniversity || normalizedAuthorUniversity === normalizedUniversity)
          ? 36
          : 0;
      const universityBoost =
        normalizedUniversity && normalizedAuthorUniversity === normalizedUniversity ? 18 : 0;

      return {
        ...post,
        _categoryMeta: categoryMeta,
        _createdAtTime: createdAtTime,
        _priorityScore: categoryBoost + departmentBoost + universityBoost + engagementScore + recencyBoost,
      };
    })
    .sort((first, second) => {
      if (second._priorityScore !== first._priorityScore) {
        return second._priorityScore - first._priorityScore;
      }

      return second._createdAtTime - first._createdAtTime;
    });

  const spotlightUsers = users
    .filter((user) => user.id !== currentUser.uid && !blockedUserIds.includes(user.id))
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

      return 0;
    })
    .slice(0, 4);
  const activeAnnouncements = announcements.filter((item) => item.isActive !== false).slice(0, 3);
  const urgentCount = prioritizedPosts.filter(
    (post) => post.signalLevel === 'urgent' || post._categoryMeta.value === 'urgent',
  ).length;
  const opportunityCount = prioritizedPosts.filter(
    (post) => post._categoryMeta.value === 'opportunity',
  ).length;
  const materialsCount = prioritizedPosts.filter(
    (post) => post._categoryMeta.value === 'materials',
  ).length;
  const sapaCount = prioritizedPosts.filter((post) => post._categoryMeta.value === 'sapa').length;
  const universityCount = prioritizedPosts.filter(
    (post) => normalizedUniversity && normalizeAcademicValue(post.authorUniversity) === normalizedUniversity,
  ).length;
  const departmentCount = prioritizedPosts.filter(
    (post) =>
      normalizedDepartment &&
      normalizeAcademicValue(post.authorDepartment) === normalizedDepartment &&
      (!normalizedUniversity || normalizeAcademicValue(post.authorUniversity) === normalizedUniversity),
  ).length;

  const feedFilters = [
    { value: 'for-you', label: 'For you' },
    { value: 'urgent', label: `Urgent ${urgentCount ? `(${urgentCount})` : ''}`.trim() },
    {
      value: 'university',
      label: normalizedUniversity ? `My university ${universityCount ? `(${universityCount})` : ''}`.trim() : 'My campus',
    },
    {
      value: 'department',
      label: normalizedDepartment ? `My course ${departmentCount ? `(${departmentCount})` : ''}`.trim() : 'My course',
    },
    { value: 'materials', label: `Materials ${materialsCount ? `(${materialsCount})` : ''}`.trim() },
    { value: 'sapa', label: `Sapa ${sapaCount ? `(${sapaCount})` : ''}`.trim() },
    { value: 'opportunity', label: `Opportunities ${opportunityCount ? `(${opportunityCount})` : ''}`.trim() },
    { value: 'event', label: 'Events' },
    { value: 'hostel', label: 'Hostel gist' },
  ];

  const filteredPosts = prioritizedPosts.filter((post) => {
    if (activeFilter === 'for-you') return true;
    if (activeFilter === 'urgent') {
      return post.signalLevel === 'urgent' || post._categoryMeta.value === 'urgent';
    }
    if (activeFilter === 'university') {
      if (!normalizedUniversity) return true;
      return normalizeAcademicValue(post.authorUniversity) === normalizedUniversity;
    }
    if (activeFilter === 'department') {
      if (!normalizedDepartment) return true;
      return (
        normalizeAcademicValue(post.authorDepartment) === normalizedDepartment &&
        (!normalizedUniversity || normalizeAcademicValue(post.authorUniversity) === normalizedUniversity)
      );
    }

    return post._categoryMeta.value === activeFilter;
  });

  return (
    <Box
      className="vasiq-feed-page"
      sx={{
        ...pageBgSx,
      }}
    >
      <Container
        className="vasiq-feed-container"
        maxWidth={false}
      >
        <Box
          className="vasiq-feed-grid"
        >
          <Box
            className="vasiq-feed-main"
          >
            <Box className="vasiq-feed-main-stack">
              <FeedShellCard
                className="vasiq-feed-card-intro"
                sx={{
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))',
                  boxShadow: '0 18px 54px rgba(15,23,42,0.10)',
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 950, letterSpacing: 1.2 }}>
                      Campus feed
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 950, lineHeight: 1.1 }}>
                      What students are posting now
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                      Classes, materials, hostel updates, sapa tips, opportunities, and campus gist.
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`${filteredPosts.length} visible posts`}
                    sx={{ borderRadius: 999, fontWeight: 900, bgcolor: 'rgba(15,118,110,0.1)', color: '#0f766e' }}
                  />
                </Stack>
              </FeedShellCard>

              <FeedShellCard className="vasiq-feed-card-composer">
                <PostComposer onSubmit={handleCreatePost} busy={posting} profile={profile} />
              </FeedShellCard>

              {feedStatus ? (
                <Alert severity="info" sx={{ borderRadius: 4, background: 'rgba(239,246,255,0.78)', border: '1px solid rgba(59,130,246,0.18)' }}>
                  {feedStatus}
                </Alert>
              ) : null}

              <FeedShellCard className="vasiq-feed-card-filters">
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.2} mb={1.4}>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 950, letterSpacing: 1.3 }}>
                      Signal filters
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#64748b' }}>
                      Pick the updates you want to see first.
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`Showing ${filteredPosts.length} posts`}
                    sx={{ borderRadius: 999, fontWeight: 900, bgcolor: 'rgba(15,118,110,0.1)', color: '#0f766e' }}
                  />
                </Stack>

                <Box className="vasiq-feed-chip-row">
                  {feedFilters.map((filter) => (
                    <Chip
                      key={filter.value}
                      label={filter.label}
                      clickable
                      onClick={() => setActiveFilter(filter.value)}
                      color={activeFilter === filter.value ? 'primary' : 'default'}
                      variant={activeFilter === filter.value ? 'filled' : 'outlined'}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        px: 0.6,
                        bgcolor: activeFilter === filter.value ? undefined : 'rgba(255,255,255,0.62)',
                      }}
                    />
                  ))}
                </Box>
              </FeedShellCard>

              <Box className="vasiq-feed-post-list">
                {postsReady ? (
                  filteredPosts.length ? (
                    filteredPosts.map((post) => (
                      <Box
                        key={post.id}
                        className="vasiq-feed-post-shell"
                      >
                        <PostCard
                          post={post}
                          isLiked={post.likes?.includes(currentUser.uid)}
                          onLike={() => handleLike(post)}
                          onComment={(text) => handleComment(post.id, text)}
                          onCommentLike={(commentIndex) => handleCommentLike(post.id, commentIndex)}
                          onCommentReply={(replyTarget, text) => handleCommentReply(post.id, replyTarget, text)}
                          onReplyLike={(commentIndex, replyIndex) => handleReplyLike(post.id, commentIndex, replyIndex)}
                          onShare={() => handleShare(post)}
                          onReportPost={() => handleReportPost(post)}
                          onReportComment={(commentItem) => handleReportComment(post, commentItem)}
                          onReportReply={(commentItem, replyItem, replyIndex) => handleReportReply(post, commentItem, replyItem, replyIndex)}
                          onBlockAuthor={() => handleBlockAuthor(post)}
                          currentUserId={currentUser.uid}
                        />
                      </Box>
                    ))
                  ) : (
                    <FeedShellCard className="vasiq-feed-card-empty">
                      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 950 }}>
                        No posts yet
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a' }}>
                        Nothing matches this signal filter yet.
                      </Typography>
                      <Typography sx={{ mt: 0.7, color: '#64748b' }}>
                        Try another filter or post the first useful update students in your circle should see.
                      </Typography>
                    </FeedShellCard>
                  )
                ) : (
                  <FeedShellCard className="vasiq-feed-card-loading">
                    <Loader compact label="Refreshing the campus feed..." />
                  </FeedShellCard>
                )}
              </Box>
            </Box>
          </Box>

          <Box
            className="vasiq-feed-rail"
          >
            <Box className="vasiq-feed-rail-stack">
              <FeedShellCard className="vasiq-feed-card-rail">
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 950, letterSpacing: 1.2 }}>
                      Launch radar
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 950, color: '#0f172a' }}>
                      Campus board
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(15,118,110,0.12)', color: '#0f766e' }}>
                    <CampaignRoundedIcon />
                  </Avatar>
                </Stack>

                {announcementsReady ? (
                  <Stack spacing={1.4}>
                    {activeAnnouncements.length ? (
                      activeAnnouncements.map((item) => (
                        <Paper key={item.id} elevation={0} sx={{ p: 1.25, borderRadius: 3, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(148,163,184,0.18)' }}>
                          <Stack direction="row" spacing={1.4}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(15,118,110,0.12)', color: '#0f766e', fontWeight: 950 }}>
                              {item.tag?.slice(0, 1) || 'N'}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{item.title}</Typography>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>{item.message}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: '#64748b' }}>No active campus notices yet.</Typography>
                    )}
                  </Stack>
                ) : (
                  <Loader compact label="Refreshing campus notices..." />
                )}
              </FeedShellCard>

              <FeedShellCard className="vasiq-feed-card-rail">
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 950, letterSpacing: 1.2 }}>
                      Connectors
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 950, color: '#0f172a' }}>
                      Students in motion
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#059669' }}>
                    <GroupsRoundedIcon />
                  </Avatar>
                </Stack>

                {usersReady ? (
                  <Stack spacing={1.3}>
                    {spotlightUsers.map((user) => (
                      <Paper key={`contact-${user.id}`} elevation={0} sx={{ p: 1.1, borderRadius: 3, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(148,163,184,0.18)' }}>
                        <Stack direction="row" spacing={1.3} alignItems="center">
                          <Avatar src={user.avatarUrl || ''} sx={{ bgcolor: 'rgba(15,118,110,0.12)', color: '#0f766e', fontWeight: 950 }}>
                            {getUserDisplayName(user)[0] || 'S'}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography noWrap sx={{ fontWeight: 950, color: '#0f172a' }}>
                              {getUserDisplayName(user)}
                            </Typography>
                            <Typography noWrap variant="body2" sx={{ color: '#64748b' }}>
                              {user.department} / {user.level}
                            </Typography>
                            <Typography noWrap variant="caption" sx={{ color: '#94a3b8', fontWeight: 800 }}>
                              {user.university || 'University not set'}
                            </Typography>
                          </Box>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 0 5px rgba(34,197,94,0.12)' }} />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Loader compact label="Refreshing active contacts..." />
                )}
              </FeedShellCard>

              <FeedShellCard className="vasiq-feed-card-rail vasiq-feed-card-score" sx={{ background: 'linear-gradient(145deg, rgba(15,23,42,0.92), rgba(30,41,59,0.82))', color: '#fff' }}>
                <Stack direction="row" spacing={1.4} alignItems="center">
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.14)' }}>
                    <LocalFireDepartmentRoundedIcon />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>Signal score</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                      Feed ranks urgent posts, materials, course updates, and high-engagement gist first.
                    </Typography>
                  </Box>
                </Stack>
              </FeedShellCard>
            </Box>
          </Box>
        </Box>
      </Container>

      <Dialog
        open={Boolean(reportDialog)}
        onClose={closeReportDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            ...glassCardSx,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))',
          },
        }}
      >
        <Box component="form" onSubmit={handleSubmitReport}>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="overline" sx={{ color: 'error.main', fontWeight: 950 }}>
                  Safety report
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a' }}>
                  Report this {reportDialog?.targetName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.6 }}>
                  Reports help moderators keep VASIQ safe for students.
                </Typography>
              </Box>
              <IconButton onClick={closeReportDialog} disabled={reporting}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Reason"
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="Spam, harassment, scam, unsafe content..."
                autoFocus
                required
                sx={softInputSx}
              />
              <TextField
                label="Extra details"
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder="Optional context for the admin team"
                multiline
                minRows={4}
                sx={softInputSx}
              />
              <Paper elevation={0} sx={{ p: 2, borderRadius: 4, background: 'rgba(248,250,252,0.86)', border: '1px solid rgba(148,163,184,0.22)' }}>
                <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>Reported content</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>{reportDialog?.report.targetLabel}</Typography>
              </Paper>
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeReportDialog} disabled={reporting} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={reporting} sx={primaryButtonSx} startIcon={<ReportRoundedIcon />}>
              {reporting ? 'Sending...' : 'Send report'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default FeedPage;
