import { useEffect, useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
import PostCard from '../components/feed/PostCard';
import PostComposer from '../components/feed/PostComposer';
import StatusBoard from '../components/feed/StatusBoard';
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
import { getUserDisplayName } from '../utils/userIdentity';

function createClientPostId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
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

  const handleCommentReply = async (postId, commentId, text) => {
    setFeedStatus('');

    try {
      await replyToPostComment(postId, commentId, {
        userId: currentUser.uid,
        userName: publicName,
        text,
      });
    } catch (error) {
      setFeedStatus(error.message || 'Unable to reply to this comment.');
      throw error;
    }
  };

  const handleReplyLike = async (postId, commentId, replyId) => {
    setFeedStatus('');

    try {
      await togglePostReplyLike(postId, commentId, replyId, currentUser.uid);
    } catch (error) {
      setFeedStatus(error.message || 'Unable to like this reply.');
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
  const normalizedDepartment = profile?.department?.trim().toLowerCase() || '';
  const prioritizedPosts = [...visiblePosts]
    .map((post) => {
      const categoryMeta = getPostCategoryMeta(
        post.category || (post.signalLevel === 'urgent' ? 'urgent' : 'social'),
      );
      const normalizedAuthorDepartment = post.authorDepartment?.trim().toLowerCase() || '';
      const createdAtTime =
        typeof post.createdAt?.toMillis === 'function'
          ? post.createdAt.toMillis()
          : new Date(post.createdAt || 0).getTime();
      const engagementScore =
        (post.likes?.length || 0) + (post.comments?.length || 0) * 2 + (post.shareCount || 0) * 3;
      const recencyBoost = Math.max(0, 5 - Math.floor((Date.now() - createdAtTime) / (1000 * 60 * 60 * 6)));
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
        normalizedDepartment && normalizedAuthorDepartment === normalizedDepartment ? 32 : 0;

      return {
        ...post,
        _categoryMeta: categoryMeta,
        _createdAtTime: createdAtTime,
        _priorityScore: categoryBoost + departmentBoost + engagementScore + recencyBoost,
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
    .slice(0, 6);
  const activeAnnouncements = announcements.filter((item) => item.isActive !== false).slice(0, 3);
  const bannerAnnouncement = activeAnnouncements[activeBannerIndex] || activeAnnouncements[0];
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
  const departmentCount = prioritizedPosts.filter(
    (post) =>
      normalizedDepartment &&
      post.authorDepartment?.trim().toLowerCase() === normalizedDepartment,
  ).length;

  const feedFilters = [
    { value: 'for-you', label: 'For you' },
    { value: 'urgent', label: `Urgent ${urgentCount ? `(${urgentCount})` : ''}`.trim() },
    {
      value: 'department',
      label: normalizedDepartment ? 'My department' : 'Campus circle',
    },
    { value: 'materials', label: `Materials ${materialsCount ? `(${materialsCount})` : ''}`.trim() },
    { value: 'sapa', label: `Sapa ${sapaCount ? `(${sapaCount})` : ''}`.trim() },
    { value: 'opportunity', label: 'Opportunities' },
    { value: 'event', label: 'Events' },
    { value: 'hostel', label: 'Hostel gist' },
  ];

  const filteredPosts = prioritizedPosts.filter((post) => {
    if (activeFilter === 'for-you') return true;
    if (activeFilter === 'urgent') {
      return post.signalLevel === 'urgent' || post._categoryMeta.value === 'urgent';
    }
    if (activeFilter === 'department') {
      if (!normalizedDepartment) {
        return true;
      }

      return post.authorDepartment?.trim().toLowerCase() === normalizedDepartment;
    }

    return post._categoryMeta.value === activeFilter;
  });

  useEffect(() => {
    if (activeAnnouncements.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((currentIndex) => (currentIndex + 1) % activeAnnouncements.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [activeAnnouncements.length]);

  useEffect(() => {
    if (activeBannerIndex >= activeAnnouncements.length) {
      setActiveBannerIndex(0);
    }
  }, [activeAnnouncements.length, activeBannerIndex]);

  useEffect(() => {
    if (!reportDialog) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeReportDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportDialog, reporting]);

  return (
    <div className="social-feed-layout">
      <div className="feed-main-column social-feed-main">
        <section className="panel feed-banner-slider">
          <div className="feed-banner-icon" aria-hidden="true">
            <Megaphone size={20} strokeWidth={2.2} />
          </div>
          <div className="feed-banner-copy">
            <span>Campus bulletin</span>
            <h1>{bannerAnnouncement?.title || `${profile?.department || 'Campus'} pulse is moving.`}</h1>
            <p>
              {bannerAnnouncement?.message ||
                'Push useful class changes, event drops, hostel updates, and real opportunities students can act on.'}
            </p>
          </div>
          <div className="feed-banner-meta">
            <span>{urgentCount} urgent</span>
            <span>{materialsCount} materials</span>
            <span>{opportunityCount} opportunities</span>
          </div>
          {activeAnnouncements.length > 1 ? (
            <div className="feed-banner-dots" aria-label="Campus bulletin slides">
              {activeAnnouncements.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={index === activeBannerIndex ? 'is-active' : ''}
                  onClick={() => setActiveBannerIndex(index)}
                  aria-label={`Show ${item.title}`}
                />
              ))}
            </div>
          ) : null}
        </section>

        <StatusBoard users={users} />

        <PostComposer onSubmit={handleCreatePost} busy={posting} profile={profile} />

        {feedStatus ? <p className="status-text feed-status-note">{feedStatus}</p> : null}

        <section className="panel feed-filter-panel">
          <div className="feed-filter-header">
            <div>
              <p className="eyebrow">Signal filters</p>
              <h2>Open what matters first</h2>
            </div>
            <span className="feed-filter-summary">
              {normalizedDepartment
                ? `${profile.department} updates are ranked higher for you`
                : 'Complete your profile to see tighter class and hostel signal'}
            </span>
          </div>
          <div className="feed-filter-row">
            {feedFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`feed-filter-chip ${
                  activeFilter === filter.value ? 'feed-filter-chip-active' : ''
                }`}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="feed-list">
          {postsReady ? (
            filteredPosts.length ? (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={post.likes?.includes(currentUser.uid)}
                  onLike={() => handleLike(post)}
                  onComment={(text) => handleComment(post.id, text)}
                  onCommentLike={(commentIndex) => handleCommentLike(post.id, commentIndex)}
                  onCommentReply={(commentIndex, text) =>
                    handleCommentReply(post.id, commentIndex, text)
                  }
                  onReplyLike={(commentIndex, replyIndex) =>
                    handleReplyLike(post.id, commentIndex, replyIndex)
                  }
                  onShare={() => handleShare(post)}
                  onReportPost={() => handleReportPost(post)}
                  onReportComment={(commentItem) => handleReportComment(post, commentItem)}
                  onReportReply={(commentItem, replyItem, replyIndex) =>
                    handleReportReply(post, commentItem, replyItem, replyIndex)
                  }
                  onBlockAuthor={() => handleBlockAuthor(post)}
                  currentUserId={currentUser.uid}
                />
              ))
            ) : (
              <article className="panel feed-empty-state">
                <p className="eyebrow">No posts yet</p>
                <h2>Nothing matches this signal filter yet.</h2>
                <p>
                  Try another filter or post the first useful update students in your
                  circle should see.
                </p>
              </article>
            )
          ) : (
            <Loader compact label="Refreshing the campus feed..." />
          )}
        </section>
      </div>

      <aside className="feed-right-rail">
        <section className="panel feed-right-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Launch radar</p>
              <h2>Campus board</h2>
            </div>
          </div>
          {announcementsReady ? (
            <div className="trend-list">
              {activeAnnouncements.map((item) => (
                <article key={item.id} className="trend-item">
                  <span className="trend-index">{item.tag?.slice(0, 1) || 'N'}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Loader compact label="Refreshing campus notices..." />
          )}
        </section>

        <section className="panel feed-right-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Connectors</p>
              <h2>Students in motion</h2>
            </div>
          </div>
          {usersReady ? (
            <div className="mini-contact-list">
              {spotlightUsers.map((user) => (
                <article key={`contact-${user.id}`} className="mini-contact-item">
                  <div className="avatar avatar-sm">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={getUserDisplayName(user)} />
                    ) : (
                      <span>{getUserDisplayName(user)[0] || 'S'}</span>
                    )}
                  </div>
                  <div>
                    <strong>{getUserDisplayName(user)}</strong>
                    <p>
                      {user.department} / {user.level}
                    </p>
                  </div>
                  <span className="mini-contact-presence" />
                </article>
              ))}
            </div>
          ) : (
            <Loader compact label="Refreshing active contacts..." />
          )}
        </section>
      </aside>

      {reportDialog ? (
        <div
          className="report-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReportDialog();
            }
          }}
        >
          <form className="report-modal panel" onSubmit={handleSubmitReport}>
            <div className="report-modal-heading">
              <p className="eyebrow">Safety report</p>
              <h2>Report this {reportDialog.targetName}</h2>
              <span>
                Reports help moderators keep VASIQ safe for students. Add a clear reason so it can
                be reviewed properly.
              </span>
            </div>

            <label className="report-field">
              <span>Reason</span>
              <input
                className="input elevated-input"
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="Spam, harassment, scam, unsafe content..."
                autoFocus
                required
              />
            </label>

            <label className="report-field">
              <span>Extra details</span>
              <textarea
                className="input textarea elevated-input"
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder="Optional context for the admin team"
                rows={4}
              />
            </label>

            <div className="report-preview">
              <strong>Reported content</strong>
              <p>{reportDialog.report.targetLabel}</p>
            </div>

            <div className="report-modal-actions">
              <button type="button" className="ghost-button" onClick={closeReportDialog}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={reporting}>
                {reporting ? 'Sending...' : 'Send report'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default FeedPage;
