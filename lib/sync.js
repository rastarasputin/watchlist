// ─── Sync Orchestrator ───────────────────────────────────────────────────────
//
// Receives a normalized WatchlistEntry[] from any source and syncs it to the DB.
// Does not know or care where the entries came from (CSV, API, or otherwise).
//
// For each entry it:
//   1. Calls the matcher   → finds existing DB record or TMDB id
//   2. If existing:          updates only source-provided fields (rating, dateAdded)
//   3. If new:               calls the enricher → creates a full DB record
//
// ─── User-authored data ────────────────────────────────────────────────────
// The following fields are NEVER touched by sync, regardless of source content.
// They represent your personal enrichment of the library:
//
//   Film.watched               — your viewing history
//   PlaylistFilm.*             — your curated playlists
//
// Reserved for future schema additions:
//   Film.notes                 — personal notes per film
//   Film.tags                  — custom tags
//   Film.referenceAnnotations  — creative-reference metadata (mood, visual refs, etc.)
// ──────────────────────────────────────────────────────────────────────────

import { matchFilm } from './matcher.js'
import { enrich } from './enrichers/tmdb.js'

// Fields a source is allowed to write. Everything else belongs to the user.
const SOURCE_WRITABLE_FIELDS = ['letterboxdUri', 'letterboxdRating', 'dateAdded']

export async function syncEntries(entries, db) {
  const stats = { added: 0, updated: 0, failed: [] }

  for (const entry of entries) {
    try {
      const { existingFilm, tmdbId } = await matchFilm(entry, db)

      if (existingFilm) {
        // Film already in library — update only what the source provides
        await db.film.update({
          where: { id: existingFilm.id },
          data: {
            letterboxdUri:    entry.sourceId,
            letterboxdRating: entry.rating,
            dateAdded:        entry.dateAdded,
          },
        })
        stats.updated++

        if (tmdbId) await sleep(300) // only delay when we hit TMDB
        continue
      }

      if (!tmdbId) {
        stats.failed.push(`${entry.title} (${entry.year}) — not found on TMDB`)
        continue
      }

      // New film — enrich from TMDB and create
      const metadata = await enrich(tmdbId)
      await db.film.create({
        data: {
          ...metadata,
          letterboxdUri:    entry.sourceId,
          letterboxdRating: entry.rating,
          dateAdded:        entry.dateAdded,
        },
      })
      stats.added++
      await sleep(300)

    } catch (err) {
      stats.failed.push(`${entry.title} — ${err.message}`)
    }
  }

  return stats
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
