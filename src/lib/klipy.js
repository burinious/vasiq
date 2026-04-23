const KLIPY_API_KEY = import.meta.env.VITE_KLIPY_API_KEY;
const KLIPY_BASE_URL = 'https://api.klipy.com/api/v1';
const KLIPY_LOCALE = 'en_NG';

export const klipyReady = Boolean(KLIPY_API_KEY);

function buildKlipyUrl(endpoint, params = {}) {
  const searchParams = new URLSearchParams({
    per_page: '16',
    rating: 'pg',
    locale: KLIPY_LOCALE,
    ...params,
  });

  return `${KLIPY_BASE_URL}/${encodeURIComponent(KLIPY_API_KEY)}/gifs/${endpoint}?${searchParams.toString()}`;
}

function unwrapItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function pickUrl(source) {
  if (!source) return '';
  if (typeof source === 'string') return source;
  if (Array.isArray(source)) return source.map(pickUrl).find(Boolean) || '';

  return (
    source.url ||
    source.src ||
    source.gif ||
    source.webp ||
    source.mp4 ||
    source.preview ||
    Object.values(source).map(pickUrl).find(Boolean) ||
    ''
  );
}

function pickFileUrl(files, preferredKeys) {
  if (!files) return '';

  for (const key of preferredKeys) {
    const url = pickUrl(files[key]);
    if (url) return url;
  }

  return Object.values(files).map(pickUrl).find(Boolean) || '';
}

function pickVariantUrl(file, sizeKeys, formatKeys) {
  for (const size of sizeKeys) {
    for (const format of formatKeys) {
      const url = pickUrl(file?.[size]?.[format]);
      if (url) return url;
    }
  }

  return '';
}

function normalizeKlipyGif(item, query = '') {
  const files = item.file || item.files || item.media_formats || item.images || {};
  const previewUrl =
    pickVariantUrl(files, ['xs', 'sm', 'md', 'hd'], ['webp', 'gif']) ||
    pickFileUrl(files, ['nanogif', 'tinygif', 'preview', 'sm', 'small', 'webp', 'gif']) ||
    pickUrl(item.blur_preview || item.preview_url || item.previewUrl || item.thumbnail || item.url);
  const gifUrl =
    pickVariantUrl(files, ['hd', 'md', 'sm', 'xs'], ['gif', 'webp']) ||
    pickFileUrl(files, ['gif', 'original', 'md', 'medium', 'tinygif', 'webp']) ||
    pickUrl(item.gif_url || item.gifUrl || item.url || previewUrl);

  return {
    id: String(item.id || item.slug || gifUrl || previewUrl),
    title: item.title || item.name || item.content_description || query || 'GIF',
    previewUrl,
    gifUrl,
    query,
  };
}

async function requestKlipy(endpoint, params = {}) {
  if (!klipyReady) {
    throw new Error('Klipy API key is missing.');
  }

  const response = await fetch(buildKlipyUrl(endpoint, params), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load GIFs right now.');
  }

  return response.json();
}

export async function fetchFeaturedGifs(limit = 12) {
  const payload = await requestKlipy('trending', { per_page: String(limit) });
  return unwrapItems(payload)
    .map((item) => normalizeKlipyGif(item))
    .filter((item) => item.previewUrl && item.gifUrl);
}

export async function searchKlipyGifs(searchTerm, limit = 16) {
  const query = searchTerm.trim();

  if (!query) {
    return [];
  }

  const payload = await requestKlipy('search', {
    q: query,
    per_page: String(limit),
  });

  return unwrapItems(payload)
    .map((item) => normalizeKlipyGif(item, query))
    .filter((item) => item.previewUrl && item.gifUrl);
}

export async function registerKlipyShare() {
  // Klipy's direct GIF API does not require a client-side share call for posting.
}
