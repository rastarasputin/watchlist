// ─── TMDB API client ─────────────────────────────────────────────────────────
//
// Low-level API access and UI helpers for The Movie Database.
// Used by:
//   lib/enrichers/tmdb.js   — film metadata during import
//   lib/matcher.js          — title search during import
//   app/films/[id]/page.js  — streaming providers and image URLs at render time
//
// Sign up for a free API key at https://www.themoviedb.org/settings/api
// and add it to .env as: TMDB_API_KEY=your_key_here

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function posterUrl(path, size = 'w500') {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function backdropUrl(path, size = 'w1280') {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

// Exported so enrichers can make arbitrary TMDB requests without duplicating auth logic
export async function tmdbFetch(path, params = {}) {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) throw new Error('Missing TMDB_API_KEY in .env.local')

  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.status} for ${path}`)
  return res.json()
}

// Search for a film by title and year, return the best match
export async function searchFilm(title, year) {
  const data = await tmdbFetch('/search/movie', { query: title, year })
  return data.results?.[0] ?? null
}

// Fetch backdrop stills for a film — used in the editorial image section on film pages.
// Returns up to 6 backdrops sorted by vote average (best quality first).
// Falls back to empty arrays if the request fails.
export async function getFilmImages(tmdbId) {
  try {
    const data = await tmdbFetch(`/movie/${tmdbId}/images`)
    const backdrops = (data.backdrops ?? [])
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 6)
    return { backdrops }
  } catch {
    return { backdrops: [] }
  }
}

// Get streaming/rent/buy providers for a film (US market)
// Returns { link, flatrate, rent, buy } — all arrays may be empty
export async function getWatchProviders(tmdbId) {
  try {
    const data = await tmdbFetch(`/movie/${tmdbId}/watch/providers`)
    const us = data.results?.US ?? {}
    return {
      link: us.link ?? null,          // JustWatch affiliate link for this film
      flatrate: us.flatrate ?? [],    // subscription streaming
      rent: us.rent ?? [],
      buy: us.buy ?? [],
    }
  } catch {
    return { link: null, flatrate: [], rent: [], buy: [] }
  }
}

