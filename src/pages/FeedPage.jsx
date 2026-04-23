import { useEffect, useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
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

  const handleCreatePost = async ({ content, imageUrl, mediaType }) => {
    setPosting(true);
    const clientPostId = createClientPostId();

    try {
      const writePromise = createPost({
        userId: currentUser.uid,
        authorName: publicName,
        authorDepartment: profile?.showDepartment === false ? '' : profile?.department || '',
        authorAvatar: profile?.avatarUrl || '',
        content,
        imageUrl,
        mediaType,
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

  const handleCommentLike = async (postId, commentIndex) => {
    setFeedStatus('');

    try {
      await togglePostCommentLike(postId, commentIndex, currentUser.uid);
    } catch (error) {
      setFeedStatus(error.message || 'Unable to like this comment.');
    }
  };

  const handleCommentReply = async (postId, commentIndex, text) => {
    setFeedStatus('');

    try {
      await replyToPostComment(postId, commentIndex, {
        userId: currentUser.uid,
        userName: publicName,
        text,
      });
    } catch (error) {
      setFeedStatus(error.message || 'Unable to reply to this comment.');
      throw error;
    }
  };

  const handleReplyLike = async (postId, commentIndex, replyIndex) => {
    setFeedStatus('');

    try {
      await togglePostReplyLike(postId, commentIndex, replyIndex, currentUser.uid);
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
        targetId: `${post.id}:comment:${commentItem._index}`,
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
        targetId: `${post.id}:comment:${commentItem._index}:reply:${replyIndex}`,
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
  const spotlightUsers = users
    .filter((user) => user.id !== currentUser.uid && !blockedUserIds.includes(user.id))
    .slice(0, 6);
  const activeAnnouncements = announcements.filter((item) => item.isActive !== false).slice(0, 3);
  const bannerAnnouncement = activeAnnouncements[activeBannerIndex] || activeAnnouncements[0];

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
            <h1>{bannerAnnouncement?.title || 'Share what is happening on campus.'}</h1>
            <p>
              {bannerAnnouncement?.message ||
                'Post class updates, event flyers, project wins, and helpful student notices.'}
            </p>
          </div>
          <div className="feed-banner-meta">
            <span>{posts.length} posts</span>
            <span>{users.length} students</span>
            <span>{activeAnnouncements.length} notices</span>
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

        <PostComposer onSubmit={handleCreatePost} busy={posting} profile={profile} />

        {feedStatus ? <p className="status-text feed-status-note">{feedStatus}</p> : null}

        <section className="feed-list">
          {postsReady ? (
            visiblePosts.map((post) => (
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
            <Loader compact label="Refreshing the campus feed..." />
          )}
        </section>
      </div>

      <aside className="feed-right-rail">
        <section className="panel feed-right-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Campus Board</p>
              <h2>Announcements</h2>
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
              <p className="eyebrow">Contacts</p>
              <h2>Students online</h2>
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
