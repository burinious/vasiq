import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { getPresenceTheme } from '../../utils/presenceTheme';
import { getUserDisplayName, getUserFirstName } from '../../utils/userIdentity';
import { glassCardSx, primaryButtonSx, softInputSx } from '../../styles/premiumTheme';

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
    <Box component="section" sx={{ display: 'grid', gap: { xs: 2, md: 2.4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 950, letterSpacing: 1.2 }}>
            Stories
          </Typography>
          <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 950 }}>
            Campus moments
          </Typography>
        </Box>
        <Chip label={`${visibleStories.length} active`} sx={{ borderRadius: 999, fontWeight: 900 }} />
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          mx: { xs: -0.5, sm: 0 },
          px: { xs: 0.5, sm: 0 },
          overflowX: 'auto',
          pb: 0.5,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Paper
          component="button"
          type="button"
          onClick={() => setCreating((value) => !value)}
          elevation={0}
          sx={{
            minWidth: { xs: 154, sm: 164 },
            height: { xs: 188, sm: 196 },
            p: 1.8,
            borderRadius: 4,
            border: '1px dashed rgba(16,185,129,0.45)',
            bgcolor: 'rgba(255,255,255,0.66)',
            display: 'grid',
            alignContent: 'space-between',
            textAlign: 'left',
            color: '#0f172a',
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(15,118,110,0.12)', color: '#0f766e', width: 48, height: 48 }}>
            <Plus size={23} strokeWidth={2.4} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 950 }}>Create story</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Share a campus moment</Typography>
          </Box>
        </Paper>

        {visibleStories.map((story) => {
          const theme = getPresenceTheme(story);
          const publicName = story.name || getUserDisplayName(story);

          return (
            <Paper
              key={`${story.id || story.userId}-story`}
              elevation={0}
              sx={{
                minWidth: { xs: 154, sm: 164 },
                height: { xs: 188, sm: 196 },
                p: 1.8,
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.44)',
                background: theme.cardStyle?.background || 'linear-gradient(145deg, rgba(255,255,255,0.84), rgba(255,255,255,0.56))',
                color: theme.cardStyle?.color || '#0f172a',
                display: 'grid',
                alignContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Avatar src={story.avatarUrl || ''} alt={publicName} sx={{ width: 44, height: 44, fontWeight: 950 }}>
                  {publicName?.[0] || 'S'}
                </Avatar>
                <Chip size="small" label={story.storyTime} sx={{ borderRadius: 999, fontWeight: 900, bgcolor: 'rgba(255,255,255,0.48)' }} />
              </Stack>
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{publicName?.split(' ')[0]}</Typography>
                <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {story.statusText}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      {creating ? (
        <Box component="form" onSubmit={handleSubmitStory}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              inputProps={{ maxLength: 180 }}
              onChange={(event) => setStoryText(event.target.value)}
              placeholder="Drop quick campus gist, location, update, or moment"
              value={storyText}
              sx={softInputSx}
            />
            <Button type="submit" variant="contained" disabled={submitting} sx={primaryButtonSx}>
              {submitting ? 'Posting...' : 'Post story'}
            </Button>
          </Stack>
          {storyError ? <Alert severity="error" sx={{ mt: 1, borderRadius: 3 }}>{storyError}</Alert> : null}
        </Box>
      ) : null}

      {featuredStory ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <Paper
            elevation={0}
            sx={{
              ...glassCardSx,
              p: 2,
              flex: 1.2,
              background: featuredTheme.cardStyle?.background || glassCardSx.background,
              color: featuredTheme.cardStyle?.color || '#0f172a',
              boxShadow: '0 14px 42px rgba(15,23,42,0.08)',
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Avatar src={featuredStory.avatarUrl || ''} alt={featuredStory.name || getUserDisplayName(featuredStory)}>
                {(featuredStory.name || getUserDisplayName(featuredStory))[0] || 'S'}
              </Avatar>
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 950 }}>Campus now</Typography>
                <Typography sx={{ fontWeight: 950 }}>{featuredStory.name || getUserDisplayName(featuredStory)}</Typography>
              </Box>
            </Stack>
            <Typography sx={{ mt: 1.5 }}>{featuredStory.statusText}</Typography>
            <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={featuredStory.department || 'Campus'} sx={{ borderRadius: 999, fontWeight: 900 }} />
              <Chip size="small" label={featuredStory.level || 'Story'} sx={{ borderRadius: 999, fontWeight: 900 }} />
              <Chip size="small" label={featuredStory.isLiveStory ? '24h' : 'profile'} sx={{ borderRadius: 999, fontWeight: 900 }} />
            </Stack>
          </Paper>

          <Stack spacing={1} sx={{ flex: 1 }}>
            {otherStories.slice(0, 3).map((story) => {
              const theme = getPresenceTheme(story);
              const publicName = story.name || getUserDisplayName(story);

              return (
                <Paper
                  key={story.id || story.userId}
                  elevation={0}
                  sx={{
                    p: 1.4,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.44)',
                    background: theme.cardStyle?.background || 'rgba(255,255,255,0.72)',
                  }}
                >
                  <Stack direction="row" spacing={1.1} alignItems="center">
                    <Avatar src={story.avatarUrl || ''} alt={publicName} sx={{ width: 36, height: 36 }}>
                      {publicName[0] || 'S'}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 950 }}>{getUserFirstName(story)}</Typography>
                      <Typography noWrap variant="body2" sx={{ color: '#64748b' }}>
                        {story.statusText}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      ) : null}
    </Box>
  );
}

export default StatusBoard;
