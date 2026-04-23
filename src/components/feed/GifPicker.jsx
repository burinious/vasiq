import { useEffect, useState } from 'react';
import { ImagePlus, Search, Sparkles, X } from 'lucide-react';
import {
  fetchFeaturedGifs,
  klipyReady,
  registerKlipyShare,
  searchKlipyGifs,
} from '../../lib/klipy';

function GifPicker({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !klipyReady) {
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    fetchFeaturedGifs()
      .then((items) => {
        if (isMounted) {
          setFeatured(items);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError.message || 'Unable to load trending GIFs.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !klipyReady) {
      return undefined;
    }

    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    const timer = window.setTimeout(() => {
      searchKlipyGifs(trimmed)
        .then((items) => {
          if (isMounted) {
            setResults(items);
          }
        })
        .catch((nextError) => {
          if (isMounted) {
            setError(nextError.message || 'Unable to search GIFs.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }, 280);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) {
    return null;
  }

  const visibleItems = query.trim() ? results : featured;

  return (
    <div className="gif-picker-inline" role="region" aria-label="Klipy GIF picker">
      <div className="gif-picker-modal">
        <div className="gif-picker-header">
          <div>
            <p className="eyebrow">Klipy GIFs</p>
            <h3>Search platform GIFs without uploading files</h3>
          </div>
          <button type="button" className="gif-picker-close" onClick={onClose} aria-label="Close GIF picker">
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {klipyReady ? (
          <>
            <label className="gif-picker-search">
              <Search size={16} strokeWidth={2.2} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search Klipy"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="gif-picker-subheader">
              <span className="gif-picker-pill">
                <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>{query.trim() ? 'Search results' : 'Trending right now'}</span>
              </span>
              <span className="helper-text">Powered by KLIPY</span>
            </div>

            {error ? <p className="error-text">{error}</p> : null}
            {loading ? <p className="helper-text">Loading GIFs...</p> : null}

            <div className="gif-picker-grid">
              {visibleItems.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  className="gif-picker-item"
                  onClick={async () => {
                    try {
                      onSelect(gif);
                    } finally {
                      onClose();
                    }

                    try {
                      await registerKlipyShare(gif.id, gif.query || query.trim());
                    } catch {
                      // Best-effort share signal only.
                    }
                  }}
                >
                  <img src={gif.previewUrl} alt={gif.title} loading="lazy" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="gif-picker-empty">
            <span className="gif-picker-pill">
              <ImagePlus size={14} strokeWidth={2.2} aria-hidden="true" />
              <span>Klipy setup needed</span>
            </span>
            <p>Add `VITE_KLIPY_API_KEY` to `.env` to enable platform GIF search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GifPicker;
