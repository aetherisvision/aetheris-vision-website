/**
 * Unsplash API client — global singleton
 *
 * Usage:
 *   import { unsplash, searchPhotos, getPhoto, getRandomPhoto } from '@/lib/unsplash';
 *
 * Requires env var:
 *   UNSPLASH_ACCESS_KEY — from https://unsplash.com/developers
 *
 * Rate limits:
 *   Demo (development): 50 req/hr
 *   Production (after approval): 5,000 req/hr
 */

import { createApi } from 'unsplash-js';
import type { SearchOrderBy } from 'unsplash-js/dist/methods/search/types/request';

// ── Singleton client ───────────────────────────────────────────────────────────

if (!process.env.UNSPLASH_ACCESS_KEY) {
  throw new Error('Missing env var: UNSPLASH_ACCESS_KEY');
}

export const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UnsplashPhoto {
  id: string;
  url: string;         // full-size
  thumb: string;       // thumbnail
  small: string;       // small (400px)
  regular: string;     // regular (1080px)
  alt: string;
  credit: {
    name: string;
    link: string;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapPhoto(photo: {
  id: string;
  urls: { full: string; thumb: string; small: string; regular: string };
  alt_description?: string | null;
  user: { name: string; links: { html: string } };
}): UnsplashPhoto {
  return {
    id: photo.id,
    url: photo.urls.full,
    thumb: photo.urls.thumb,
    small: photo.urls.small,
    regular: photo.urls.regular,
    alt: photo.alt_description ?? '',
    credit: {
      name: photo.user.name,
      link: `${photo.user.links.html}?utm_source=aetheris_vision&utm_medium=referral`,
    },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Search Unsplash for photos by keyword.
 *
 * @param query     Search term, e.g. "weather atmosphere"
 * @param perPage   Results per page (default 10, max 30)
 * @param page      Page number (default 1)
 * @param orderBy   'relevant' | 'latest' (default 'relevant')
 */
export async function searchPhotos(
  query: string,
  perPage = 10,
  page = 1,
  orderBy: SearchOrderBy = 'relevant'
): Promise<UnsplashPhoto[]> {
  const result = await unsplash.search.getPhotos({ query, perPage, page, orderBy });
  if (result.type === 'error') {
    throw new Error(`Unsplash search error: ${result.errors.join(', ')}`);
  }
  return result.response.results.map(mapPhoto);
}

/**
 * Fetch a single photo by Unsplash photo ID.
 *
 * @param photoId   Unsplash photo ID
 */
export async function getPhoto(photoId: string): Promise<UnsplashPhoto> {
  const result = await unsplash.photos.get({ photoId });
  if (result.type === 'error') {
    throw new Error(`Unsplash photo error: ${result.errors.join(', ')}`);
  }
  return mapPhoto(result.response);
}

/**
 * Get a random photo, optionally filtered by query.
 *
 * @param query   Optional search term to filter by topic
 */
export async function getRandomPhoto(query?: string): Promise<UnsplashPhoto> {
  const result = await unsplash.photos.getRandom(query ? { query } : {});
  if (result.type === 'error') {
    throw new Error(`Unsplash random photo error: ${result.errors.join(', ')}`);
  }
  const photo = Array.isArray(result.response) ? result.response[0] : result.response;
  return mapPhoto(photo);
}

/**
 * Trigger a download event — required by Unsplash API guidelines
 * whenever a photo is actually displayed/downloaded.
 *
 * @param photoId   Unsplash photo ID
 */
export async function trackDownload(photoId: string): Promise<void> {
  await unsplash.photos.trackDownload({ downloadLocation: photoId });
}
