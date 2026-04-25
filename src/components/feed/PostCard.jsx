import { useState } from 'react';
import { Flag, Heart, MessageCircle, Reply, Share2, ShieldOff, Sparkles } from 'lucide-react';
import { optimizeCloudinaryImage } from '../../firebase/cloudinary';
import { getPostCategoryMeta, getSignalLevelMeta } from '../../lib/campusSignal';

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Just now';
  if (typeof timestamp?.toDate === 'function') {
    return timestamp.toDate().toLocaleString();
  }

  return new Date(timestamp).toLocaleString();
}

function PostCard({
  post,
  isLiked,
  onLike,
  onComment,
  onCommentLike,
  onCommentReply,
  onReplyLike,
  onShare,
  onReportPost,
  onReportComment,
  onReportReply,
  onBlockAuthor,
  currentUserId,
}) {
  const [comment, setComment] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const hasImage = Boolean(post.imageUrl);
  const authorName = post.authorDisplayName || post.authorName || 'Student';
  const categoryMeta = getPostCategoryMeta(
    post.category || (post.signalLevel === 'urgent' ? 'urgent' : 'social'),
  );
  const signalMeta = getSignalLevelMeta(post.signalLevel || 'general');
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;
  const shareCount = post.shareCount || 0;
  const visibleComments = (post.comments || [])
    .map((item) => ({
      ...item,
      likes: item.likes || [],
      replies: item.replies || [],
    }))
    .reverse();

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    const trimmedComment = comment.trim();
    if (!trimmedComment) return;

    setComment('');
    const activeReplyTarget = replyTarget;
    setReplyTarget(null);

    try {
      if (activeReplyTarget) {
        await onCommentReply(activeReplyTarget.commentId, trimmedComment);
      } else {
        await onComment(trimmedComment);
      }
    } catch (error) {
      setComment(trimmedComment);
      setReplyTarget(activeReplyTarget);
      throw error;
    }
  };

  return (
    <article className={`panel post-card ${hasImage ? 'post-card-media' : ''}`}>
      <div className="post-header">
        <div className="post-author-cluster">
          <div className="avatar avatar-sm">
            {post.authorAvatar ? (
              <img
                src={optimizeCloudinaryImage(
                  post.authorAvatar,
                  'f_auto,q_auto,c_fill,w_160,h_160',
                )}
                alt={authorName}
              />
            ) : (
              <span>{authorName?.[0] || 'V'}</span>
            )}
          </div>
          <div>
            <div className="post-author-line">
              <h3>{authorName}</h3>
              <span className="post-author-badge">
                <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" />
                <span>Campus</span>
              </span>
              <span className={`post-category-pill post-category-pill-${categoryMeta.value}`}>
                {categoryMeta.label}
              </span>
              {signalMeta.value !== 'general' ? (
                <span className={`post-signal-pill post-signal-pill-${signalMeta.value}`}>
                  {signalMeta.label}
                </span>
              ) : null}
            </div>
            <p>
              {post.authorDepartment || 'Campus community'}
              {post.authorLevel ? ` / ${post.authorLevel}` : ''}
            </p>
            <span className="post-time">
              {formatTimestamp(post.createdAt)}
              {post.authorResidence ? ` - ${post.authorResidence}` : ' - Campus circle'}
            </span>
          </div>
        </div>
        <div className="post-safety-actions">
          <button type="button" onClick={onReportPost} aria-label="Report post">
            <Flag size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>Report</span>
          </button>
          {post.userId && post.userId !== currentUserId ? (
            <button type="button" onClick={onBlockAuthor} aria-label="Block post author">
              <ShieldOff size={14} strokeWidth={2.2} aria-hidden="true" />
              <span>Block</span>
            </button>
          ) : null}
        </div>
      </div>

      <p className="post-copy">{post.content}</p>

      {post.imageUrl ? (
        <img
          className="post-image"
          src={optimizeCloudinaryImage(post.imageUrl)}
          alt="Post attachment"
        />
      ) : null}

      <div className="post-actions post-actions-compact">
        <button
          type="button"
          className={`action-pill action-counter-pill ${isLiked ? 'action-pill-active' : ''}`}
          onClick={onLike}
          aria-label={`Love post, ${likeCount} reactions`}
        >
          <Heart size={18} strokeWidth={2.2} aria-hidden="true" />
          <sup>{likeCount}</sup>
        </button>
        <button
          type="button"
          className="action-pill action-counter-pill"
          aria-label={`${commentCount} comments`}
        >
          <MessageCircle size={18} strokeWidth={2.2} aria-hidden="true" />
          <sup>{commentCount}</sup>
        </button>
        <button
          type="button"
          className="action-pill action-counter-pill"
          aria-label={`${shareCount} shares`}
          onClick={onShare}
        >
          <Share2 size={18} strokeWidth={2.2} aria-hidden="true" />
          <sup>{shareCount}</sup>
        </button>
      </div>

      <form className="comment-form" onSubmit={handleSubmitComment}>
        <div className="comment-input-shell">
          {replyTarget ? (
            <div className="comment-replying-pill">
              <span>Replying to {replyTarget.name}</span>
              <button type="button" onClick={() => setReplyTarget(null)}>
                Cancel
              </button>
            </div>
          ) : null}
          <input
            className="input"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={replyTarget ? `Reply to ${replyTarget.name}` : 'Reply to this post'}
          />
        </div>
        <button type="submit" className="secondary-button">
          Reply
        </button>
      </form>

      {commentCount ? (
        <div className="comment-list">
          {visibleComments.map((item) => {
            const commentLikes = item.likes.length;
            const isCommentLiked = item.likes.includes(currentUserId);

            return (
              <div key={item.id || `${item.userId}-${item.createdAt}`} className="comment-item">
                <strong>{item.userName}</strong>
                <p>{item.text}</p>
                <div className="comment-actions">
                  <button
                    type="button"
                    className={isCommentLiked ? 'comment-action-active' : ''}
                    onClick={() => onCommentLike(item.id)}
                  >
                    <Heart size={13} strokeWidth={2.2} aria-hidden="true" />
                    <span>{commentLikes ? commentLikes : 'Like'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyTarget({
                        commentId: item.id,
                        name: item.userName || 'comment',
                      })
                    }
                  >
                    <Reply size={13} strokeWidth={2.2} aria-hidden="true" />
                    <span>Reply</span>
                  </button>
                  <button type="button" onClick={() => onReportComment(item)}>
                    <Flag size={13} strokeWidth={2.2} aria-hidden="true" />
                    <span>Report</span>
                  </button>
                </div>
                {item.replies.length ? (
                  <div className="comment-replies">
                    {item.replies.map((replyItem, replyIndex) => {
                      const replyLikes = replyItem.likes || [];
                      const isReplyLiked = replyLikes.includes(currentUserId);

                      return (
                        <div
                          key={replyItem.id || `${replyItem.userId}-${replyItem.createdAt}-${replyIndex}`}
                          className="comment-reply-item"
                        >
                          <strong>{replyItem.userName}</strong>
                          <p>{replyItem.text}</p>
                          <div className="comment-actions">
                            <button
                              type="button"
                              className={isReplyLiked ? 'comment-action-active' : ''}
                              onClick={() => onReplyLike(item.id, replyItem.id)}
                            >
                              <Heart size={13} strokeWidth={2.2} aria-hidden="true" />
                              <span>{replyLikes.length ? replyLikes.length : 'Like'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onReportReply(item, replyItem, replyIndex)}
                            >
                              <Flag size={13} strokeWidth={2.2} aria-hidden="true" />
                              <span>Report</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export default PostCard;
