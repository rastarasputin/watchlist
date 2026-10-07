// ─── Film Matcher ─────────────────────────────────────────────────────────────
//
// Given a WatchlistEntry, determines whether we already have this film in the
// database and, if not, what its TMDB id is for enrichment.
//
// Lookup strategy (tried in order, stops at first match):
//   1. sourceId (e.g. Letterboxd URI)  — instant DB lookup, no API call
//   2. tmdbId                           — if the film was imported before sourceId tracking
//   3. TMDB title+year search           — for genuinely new films
//
// Returns:
//   {
//     existingFilm: Film | null   — the DB record if the film already exists
//     tmdbId:       number | null — TMDB id to use for enrichment (null = not found on TMDB)
//   }

import { searchFilm } from './tmdb.js'

export async function matchFilm(entry, db) {
  // ── 1. Fast path: match by sourceId stored in DB ────────────────────────────
  if (entry.sourceId) {
    const film = await db.film.findFirst({
      where: { letterboxdUri: entry.sourceId },
    })
    if (film) {
      return { existingFilm: film, tmdbId: film.tmdbId }
    }
  }

  // ── 2. Search TMDB to get a stable tmdbId ────────────────────────────────────
  const tmdbResult = await searchFilm(entry.title, entry.year)
  if (!tmdbResult) {
    return { existingFilm: null, tmdbId: null }
  }

  // ── 3. Check DB by tmdbId (backfill path for records imported before sourceId) ─
  const filmByTmdb = await db.film.findUnique({
    where: { tmdbId: tmdbResult.id },
  })

  return {
    existingFilm: filmByTmdb ?? null,
    tmdbId: tmdbResult.id,
  }
}
