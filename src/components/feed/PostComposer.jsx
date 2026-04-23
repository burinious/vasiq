import { useEffect, useRef, useState } from 'react';
import { Film, ImagePlus, SendHorizontal } from 'lucide-react';
import { uploadImage } from '../../firebase/cloudinary';
import { getUserDisplayName, getUserFirstName } from '../../utils/userIdentity';
import GifPicker from './GifPicker';

function PostComposer({ onSubmit, busy, profile }) {
  const [content, setContent] = useState('');
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
      });
      if (previewSnapshot) {
        URL.revokeObjectURL(previewSnapshot);
      }
    } catch (submitError) {
      setContent(contentSnapshot);
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
    <section className="panel composer-panel social-composer-panel feed-composer-clean">
      <form onSubmit={handleSubmit} className="composer-form composer-form-shell">
        <div className="composer-topline">
          <div className="avatar avatar-sm composer-avatar">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={publicName} />
            ) : (
              <span>{publicName[0]?.toUpperCase() || 'Y'}</span>
            )}
          </div>
          <div className="composer-identity">
            <strong>{publicName}</strong>
            <span>Post a useful campus update, flyer, project moment, or quick gist.</span>
          </div>
          <span className="composer-audience-pill">Campus pulse</span>
        </div>

        <div className="composer-main">
          <textarea
            className="input textarea composer-textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`What's happening on campus, ${firstName}?`}
            rows={4}
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

          <div className="composer-toolbar composer-toolbar-clean">
            <button
              type="button"
              className="composer-tool composer-tool-upload"
              onClick={openFilePicker}
            >
              <ImagePlus size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>{file ? 'Change photo' : 'Photo'}</span>
            </button>
            <button
              type="button"
              className="composer-tool composer-media-button"
              onClick={() => setGifPickerOpen(true)}
            >
              <Film size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>{selectedGif ? 'Change Klipy GIF' : 'Klipy GIF'}</span>
            </button>
          </div>

          {preview || selectedGif ? (
            <div className="preview-card composer-attachment-card">
              <img
                src={selectedGif?.gifUrl || preview}
                alt={selectedGif?.title || 'Post preview'}
                className="preview-image composer-attachment-preview"
              />
              <div className="composer-attachment-copy">
                <span className="file-pill">
                  <ImagePlus size={14} strokeWidth={2.2} aria-hidden="true" />
                  <span>{selectedGif ? 'Klipy GIF attached' : 'Photo attached'}</span>
                </span>
                <strong>
                  {file
                    ? file.name
                    : selectedGif
                      ? selectedGif.title || 'Selected GIF'
                      : 'Attachment ready'}
                </strong>
                <p className="helper-text">
                  This visual will publish with your update for the campus feed.
                </p>
              </div>
              <button
                type="button"
                className="preview-clear-button"
                onClick={() => {
                  resetComposer(preview);
                }}
              >
                Remove
              </button>
            </div>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          <div className="form-actions composer-actions">
            <div className="composer-hint">
              <span className="composer-dot" />
              <span>Keep it campus-safe and useful.</span>
            </div>
            <button
              type="submit"
              className="primary-button composer-submit-button"
              disabled={busy || (!content.trim() && !hasAttachment)}
            >
              <SendHorizontal size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>{busy ? 'Posting...' : 'Share'}</span>
            </button>
          </div>
        </div>
      </form>
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
    </section>
  );
}

export default PostComposer;
