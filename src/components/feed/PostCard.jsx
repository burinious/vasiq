import { useEffect, useMemo, useState } from 'react';
import { Flag, Heart, MessageCircle, Reply, Share2, ShieldOff, Sparkles } from 'lucide-react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { optimizeCloudinaryImage } from '../../firebase/cloudinary';
import { listenToPostComments } from '../../firebase/firestore';
import { getPostCategoryMeta, getSignalLevelMeta } from '../../lib/campusSignal';
import { glassCardSx, primaryButtonSx, softInputSx } from '../../styles/premiumTheme';

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
  const [liveComments, setLiveComments] = useState([]);
  const authorName = post.authorDisplayName || post.authorName || 'Student';
  const categoryMeta = getPostCategoryMeta(
    post.category || (post.signalLevel === 'urgent' ? 'urgent' : 'social'),
  );
  const signalMeta = getSignalLevelMeta(post.signalLevel || 'general');
  const likeCount = post.likes?.length || 0;
  const shareCount = post.shareCount || 0;

  useEffect(() => {
    if (!post.id) return undefined;

    return listenToPostComments(post.id, setLiveComments);
  }, [post.id]);

  const legacyComments = useMemo(
    () =>
      (post.comments || []).map((item, index) => ({
        ...item,
        id: item.id ? `legacy-id-${item.id}` : `legacy-index-${index}`,
        likes: item.likes || [],
        replies: (item.replies || []).map((replyItem, replyIndex) => ({
          ...replyItem,
          id: replyItem.id ? `legacy-id-${replyItem.id}` : `legacy-index-${replyIndex}`,
          likes: replyItem.likes || [],
          isLegacy: true,
        })),
        isLegacy: true,
      })),
    [post.comments],
  );
  const allComments = useMemo(
    () => [...legacyComments, ...liveComments],
    [legacyComments, liveComments],
  );
  const commentCount = Math.max(post.commentsCount || 0, allComments.length);
  const visibleComments = allComments
    .map((item) => ({
      ...item,
      likes: item.likes || [],
      replies: (item.replies || []).map((replyItem, replyIndex) => ({
        ...replyItem,
        id:
          replyItem.id ||
          (item.isLegacy ? `legacy-index-${replyIndex}` : ''),
        likes: replyItem.likes || [],
      })),
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
        await onCommentReply(activeReplyTarget, trimmedComment);
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
    <Card
      component="article"
      sx={{
        ...glassCardSx,
        overflow: 'hidden',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 28px 90px rgba(15,23,42,0.14)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.4 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.7} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Avatar
              src={
                post.authorAvatar
                  ? optimizeCloudinaryImage(post.authorAvatar, 'f_auto,q_auto,c_fill,w_160,h_160')
                  : ''
              }
              alt={authorName}
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'rgba(15,118,110,0.12)',
                color: '#0f766e',
                fontWeight: 950,
                border: '2px solid rgba(255,255,255,0.82)',
                boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
              }}
            >
              {authorName?.[0] || 'V'}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h6" sx={{ fontWeight: 950, color: '#0f172a', lineHeight: 1.1 }}>
                  {authorName}
                </Typography>
                <Chip
                  size="small"
                  icon={<Sparkles size={12} strokeWidth={2.2} />}
                  label="Campus"
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    bgcolor: 'rgba(15,118,110,0.1)',
                    color: '#0f766e',
                  }}
                />
                <Chip size="small" label={categoryMeta.label} sx={{ borderRadius: 999, fontWeight: 900 }} />
                {signalMeta.value !== 'general' ? (
                  <Chip
                    size="small"
                    color={signalMeta.value === 'urgent' ? 'error' : 'warning'}
                    label={signalMeta.label}
                    sx={{ borderRadius: 999, fontWeight: 900 }}
                  />
                ) : null}
              </Stack>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                {post.authorUniversity ? `${post.authorUniversity} / ` : ''}
                {post.authorDepartment || 'Campus community'}
                {post.authorLevel ? ` / ${post.authorLevel}` : ''}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800 }}>
                {formatTimestamp(post.createdAt)}
                {post.authorResidence ? ` / ${post.authorResidence}` : ' / Campus circle'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            <Button
              type="button"
              onClick={onReportPost}
              size="small"
              startIcon={<Flag size={14} strokeWidth={2.2} />}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, color: '#64748b' }}
            >
              Report
            </Button>
            {post.userId && post.userId !== currentUserId ? (
              <Button
                type="button"
                onClick={onBlockAuthor}
                size="small"
                startIcon={<ShieldOff size={14} strokeWidth={2.2} />}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, color: '#b91c1c' }}
              >
                Block
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {post.content ? (
          <Typography
            sx={{
              mt: 2.4,
              color: '#1e293b',
              fontSize: '1rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {post.content}
          </Typography>
        ) : null}

        {post.imageUrl ? (
          <Box
            component="img"
            src={optimizeCloudinaryImage(post.imageUrl)}
            alt="Post attachment"
            sx={{
              width: '100%',
              maxHeight: { xs: 360, md: 520 },
              objectFit: 'cover',
              mt: 2,
              borderRadius: 4,
              border: '1px solid rgba(148,163,184,0.18)',
            }}
          />
        ) : null}

        <Stack direction="row" spacing={1} mt={2.4} flexWrap="wrap" useFlexGap>
          <Button
            type="button"
            onClick={onLike}
            size="small"
            aria-label={`Love post, ${likeCount} reactions`}
            startIcon={<Heart size={18} strokeWidth={2.2} fill={isLiked ? 'currentColor' : 'none'} />}
            variant={isLiked ? 'contained' : 'outlined'}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
          >
            {likeCount}
          </Button>
          <Button
            type="button"
            aria-label={`${commentCount} comments`}
            size="small"
            startIcon={<MessageCircle size={18} strokeWidth={2.2} />}
            variant="outlined"
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
          >
            {commentCount}
          </Button>
          <Button
            type="button"
            aria-label={`${shareCount} shares`}
            onClick={onShare}
            size="small"
            startIcon={<Share2 size={18} strokeWidth={2.2} />}
            variant="outlined"
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
          >
            {shareCount}
          </Button>
        </Stack>

        <Box component="form" onSubmit={handleSubmitComment} sx={{ mt: 2.4 }}>
          {replyTarget ? (
            <Chip
              label={`Replying to ${replyTarget.name}`}
              onDelete={() => setReplyTarget(null)}
              sx={{ mb: 1, borderRadius: 999, fontWeight: 900 }}
            />
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={replyTarget ? `Reply to ${replyTarget.name}` : 'Reply to this post'}
              sx={softInputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MessageCircle size={17} strokeWidth={2.2} />
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" size="small" sx={{ ...primaryButtonSx, py: 0.9 }}>
              Reply
            </Button>
          </Stack>
        </Box>

        {commentCount ? (
          <Stack spacing={1.5} mt={2.4}>
            {visibleComments.map((item) => {
              const commentLikes = item.likes.length;
              const isCommentLiked = item.likes.includes(currentUserId);

              return (
                <Paper
                  key={item.id || `${item.userId}-${item.createdAt}`}
                  elevation={0}
                  sx={{
                    p: 1.6,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.68)',
                    border: '1px solid rgba(148,163,184,0.18)',
                  }}
                >
                  <Stack spacing={0.8}>
                    <Box>
                      <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{item.userName}</Typography>
                      <Typography variant="body2" sx={{ color: '#475569', whiteSpace: 'pre-wrap' }}>
                        {item.text}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      <Button
                        size="small"
                        type="button"
                        onClick={() => onCommentLike(item.id)}
                        startIcon={<Heart size={13} strokeWidth={2.2} fill={isCommentLiked ? 'currentColor' : 'none'} />}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                      >
                        {commentLikes || 'Like'}
                      </Button>
                      <Button
                        size="small"
                        type="button"
                        onClick={() =>
                          setReplyTarget({
                            commentId: item.id,
                            name: item.userName || 'comment',
                            parentReplyId: '',
                            parentReplyName: '',
                          })
                        }
                        startIcon={<Reply size={13} strokeWidth={2.2} />}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                      >
                        Reply
                      </Button>
                      <Button
                        size="small"
                        type="button"
                        onClick={() => onReportComment(item)}
                        startIcon={<Flag size={13} strokeWidth={2.2} />}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, color: '#64748b' }}
                      >
                        Report
                      </Button>
                    </Stack>
                  </Stack>

                  {item.replies.length ? (
                    <Stack
                      spacing={1}
                      mt={1.2}
                      pl={{ xs: 1, sm: 2 }}
                      sx={{ borderLeft: '2px solid rgba(16,185,129,0.14)' }}
                    >
                      {item.replies.map((replyItem, replyIndex) => {
                        const replyLikes = replyItem.likes || [];
                        const isReplyLiked = replyLikes.includes(currentUserId);
                        const replyId = replyItem.id || '';
                        const canLikeReply = Boolean(item.id && replyId);

                        return (
                          <Box key={replyItem.id || `${replyItem.userId}-${replyItem.createdAt}-${replyIndex}`}>
                            <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>
                              {replyItem.userName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                              {replyItem.parentReplyName ? (
                                <Box component="span" sx={{ color: '#0f766e', fontWeight: 900 }}>
                                  @{replyItem.parentReplyName}{' '}
                                </Box>
                              ) : null}
                              {replyItem.text}
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              <Button
                                size="small"
                                type="button"
                                disabled={!canLikeReply}
                                title={canLikeReply ? 'Like this reply' : 'This reply is missing a stable id'}
                                onClick={() => onReplyLike(item.id, replyId)}
                                startIcon={<Heart size={13} strokeWidth={2.2} fill={isReplyLiked ? 'currentColor' : 'none'} />}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                              >
                                {replyLikes.length || 'Like'}
                              </Button>
                              <Button
                                size="small"
                                type="button"
                                onClick={() =>
                                  setReplyTarget({
                                    commentId: item.id,
                                    name: replyItem.userName || 'reply',
                                    parentReplyId: replyId,
                                    parentReplyName: replyItem.userName || 'reply',
                                  })
                                }
                                startIcon={<Reply size={13} strokeWidth={2.2} />}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                              >
                                Reply
                              </Button>
                              <Button
                                size="small"
                                type="button"
                                onClick={() => onReportReply(item, replyItem, replyIndex)}
                                startIcon={<Flag size={13} strokeWidth={2.2} />}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, color: '#64748b' }}
                              >
                                Report
                              </Button>
                            </Stack>
                            {replyIndex < item.replies.length - 1 ? <Divider sx={{ mt: 1 }} /> : null}
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : null}
                </Paper>
              );
            })}
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default PostCard;
