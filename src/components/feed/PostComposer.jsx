import { useEffect, useRef, useState } from 'react';
import { Film, ImagePlus, SendHorizontal, X } from 'lucide-react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { uploadImage } from '../../firebase/cloudinary';
import { POST_CATEGORIES, SIGNAL_LEVELS } from '../../lib/campusSignal';
import { getUserDisplayName, getUserFirstName } from '../../utils/userIdentity';
import { glassCardSx, softInputSx } from '../../styles/premiumTheme';
import GifPicker from './GifPicker';

function PostComposer({ onSubmit, busy, profile }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('academic');
  const [signalLevel, setSignalLevel] = useState('general');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [selectedGif, setSelectedGif] = useState(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const publicName = getUserDisplayName(profile, 'Student');
  const firstName = getUserFirstName(profile, 'Student');
  const hasAttachment = Boolean(file || selectedGif);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedGif(null);
    setFile(nextFile || null);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : '');
  };

  const resetComposer = (previewUrl = preview, revokePreview = true) => {
    setContent('');
    setCategory('academic');
    setSignalLevel('general');
    setFile(null);
    setSelectedGif(null);
    if (revokePreview && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const contentSnapshot = content;
    const categorySnapshot = category;
    const signalLevelSnapshot = signalLevel;
    const fileSnapshot = file;
    const previewSnapshot = preview;
    const gifSnapshot = selectedGif;

    try {
      let imageUrl = gifSnapshot?.gifUrl || '';
      let mediaType = gifSnapshot ? 'gif' : '';

      if (fileSnapshot) {
        imageUrl = await uploadImage(fileSnapshot, 'varsiq/posts');
        mediaType = 'image';
      }

      resetComposer(previewSnapshot, false);

      await onSubmit({
        content: contentSnapshot.trim(),
        imageUrl,
        mediaType,
        category: categorySnapshot,
        signalLevel: signalLevelSnapshot,
      });
      if (previewSnapshot) {
        URL.revokeObjectURL(previewSnapshot);
      }
    } catch (submitError) {
      setContent(contentSnapshot);
      setCategory(categorySnapshot);
      setSignalLevel(signalLevelSnapshot);
      setFile(fileSnapshot);
      setPreview(previewSnapshot);
      setSelectedGif(gifSnapshot);
      if (fileInputRef.current && fileSnapshot) {
        fileInputRef.current.value = '';
      }
      setError(submitError.message || 'Unable to create post.');
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <Box component="section" sx={{ display: 'grid', gap: 2, width: '100%', minWidth: 0 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ minWidth: 0 }}>
        <Stack spacing={{ xs: 1.55, md: 2.2 }} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={{ xs: 1.2, sm: 1.7 }} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              src={profile?.avatarUrl || ''}
              alt={publicName}
              sx={{
                width: { xs: 42, sm: 48 },
                height: { xs: 42, sm: 48 },
                bgcolor: 'rgba(15,118,110,0.12)',
                color: '#0f766e',
                fontWeight: 950,
              }}
            >
              {publicName[0]?.toUpperCase() || 'Y'}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>{publicName}</Typography>
              <Typography noWrap variant="body2" sx={{ color: '#64748b' }}>
                Drop classes, materials, sapa tips, opportunities, or campus gist.
              </Typography>
            </Box>
            <Chip
              label="Campus pulse"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                borderRadius: 999,
                fontWeight: 900,
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={0.8}
            flexWrap={{ xs: 'nowrap', sm: 'wrap' }}
            useFlexGap
            sx={{
              pt: 0.2,
              minWidth: 0,
              overflowX: { xs: 'auto', sm: 'visible' },
              pb: { xs: 0.4, sm: 0 },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {POST_CATEGORIES.map((item) => (
              <Chip
                key={item.value}
                label={item.shortLabel}
                size="small"
                clickable
                title={item.description}
                onClick={() => setCategory(item.value)}
                color={category === item.value ? 'primary' : 'default'}
                variant={category === item.value ? 'filled' : 'outlined'}
                sx={{ borderRadius: 999, fontWeight: 900, flex: '0 0 auto' }}
              />
            ))}
          </Stack>

          <FormControl
            fullWidth
            sx={{
              ...softInputSx,
              width: { xs: '100%', sm: 280 },
              maxWidth: '100%',
            }}
          >
            <InputLabel id="composer-signal-label">Signal level</InputLabel>
            <Select
              labelId="composer-signal-label"
              label="Signal level"
              value={signalLevel}
              onChange={(event) => setSignalLevel(event.target.value)}
            >
              {SIGNAL_LEVELS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`What's the update, ${firstName}? Keep it short and useful.`}
            multiline
            minRows={3}
            sx={{
              ...softInputSx,
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                ...softInputSx['& .MuiOutlinedInput-root'],
                alignItems: 'flex-start',
                borderRadius: { xs: 2.5, sm: 3 },
                '& textarea': {
                  py: 0.6,
                  fontSize: { xs: '0.92rem', sm: '1rem' },
                },
              },
            }}
          />

          <input
            ref={fileInputRef}
            className="composer-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            tabIndex={-1}
            aria-hidden="true"
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              type="button"
              variant="outlined"
              onClick={openFilePicker}
              startIcon={<ImagePlus size={16} strokeWidth={2.2} />}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
            >
              {file ? 'Change photo' : 'Photo'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => setGifPickerOpen(true)}
              startIcon={<Film size={16} strokeWidth={2.2} />}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
            >
              {selectedGif ? 'Change GIF' : 'GIF'}
            </Button>
            <Button
              type="submit"
              variant="outlined"
              disabled={busy || (!content.trim() && !hasAttachment)}
              startIcon={<SendHorizontal size={16} strokeWidth={2.2} />}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
            >
              {busy ? 'Posting...' : 'Share'}
            </Button>
          </Stack>

          {preview || selectedGif ? (
            <Paper
              elevation={0}
              sx={{
                ...glassCardSx,
                p: 1.5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '150px 1fr auto' },
                gap: 1.5,
                alignItems: 'center',
                boxShadow: '0 14px 38px rgba(15,23,42,0.08)',
              }}
            >
              <Box
                component="img"
                src={selectedGif?.gifUrl || preview}
                alt={selectedGif?.title || 'Post preview'}
                sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 3 }}
              />
              <Box>
                <Chip
                  size="small"
                  icon={<ImagePlus size={14} strokeWidth={2.2} />}
                  label={selectedGif ? 'Klipy GIF attached' : 'Photo attached'}
                  sx={{ borderRadius: 999, fontWeight: 900, mb: 1 }}
                />
                <Typography sx={{ fontWeight: 950, color: '#0f172a' }}>
                  {file
                    ? file.name
                    : selectedGif
                      ? selectedGif.title || 'Selected GIF'
                      : 'Attachment ready'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  This visual will publish with your update for the campus feed.
                </Typography>
              </Box>
              <Button
                type="button"
                color="error"
                variant="outlined"
                onClick={() => {
                  resetComposer(preview);
                }}
                startIcon={<X size={15} strokeWidth={2.2} />}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
              >
                Remove
              </Button>
            </Paper>
          ) : null}

          {error ? <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert> : null}

          <Typography variant="body2" sx={{ color: '#64748b', display: { xs: 'none', sm: 'block' } }}>
            Low data friendly: text first, media only when it adds value.
          </Typography>
        </Stack>
      </Box>
      <GifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={(gif) => {
          if (preview) {
            URL.revokeObjectURL(preview);
          }
          setPreview('');
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setSelectedGif(gif);
        }}
      />
    </Box>
  );
}

export default PostComposer;
