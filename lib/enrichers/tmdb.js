// ─── Enricher: TMDB ──────────────────────────────────────────────────────────
//
// Given a TMDB id, fetches full film metadata and returns it in the shape
// expected by the Film database model.
//
// To add a second enricher (e.g. Criterion, Letterboxd essays, Metacritic):
//   - Create enrichers/your-source.js with an `enrich(tmdbId)` function
//   - Merge its output in sync.js alongside this one
//
// This module is only used during import/sync.
// For UI needs (poster URLs, streaming providers) see lib/tmdb.js.

import { tmdbFetch } from '../tmdb.js'

export async function enrich(tmdbId) {
  const [details, credits, videos] = await Promise.all([
    tmdbFetch(`/movie/${tmdbId}`),
    tmdbFetch(`/movie/${tmdbId}/credits`),
    tmdbFetch(`/movie/${tmdbId}/videos`),
  ])

  const director = credits.crew?.find((p) => p.job === 'Director')?.name ?? null
  const cast = credits.cast?.slice(0, 5).map((p) => p.name) ?? []
  const trailer = videos.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  )

  return {
    tmdbId:       details.id,
    title:        details.title,
    year:         new Date(details.release_date).getFullYear(),
    runtime:      details.runtime ?? null,
    genres:       JSON.stringify(details.genres?.map((g) => g.name) ?? []),
    posterPath:   details.poster_path ?? null,
    backdropPath: details.backdrop_path ?? null,
    synopsis:     details.overview ?? null,
    director,
    cast:         JSON.stringify(cast),
    trailerKey:   trailer?.key ?? null,
  }
}
