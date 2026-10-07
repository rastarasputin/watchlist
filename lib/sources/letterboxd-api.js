// ─── Source: Letterboxd API (stub) ───────────────────────────────────────────
//
// Future ingestion path once the official Letterboxd API is available.
// https://letterboxd.com/api-beta/
//
// When the API is ready, implement `ingest` here. The output must match the
// same WatchlistEntry shape as letterboxd-csv.js so sync.js needs no changes.
//
// Expected implementation:
//   - Authenticate with an API key + user token
//   - Fetch the user's watchlist from GET /member/{username}/watchlist
//   - Map each API film object to a WatchlistEntry:
//       sourceId:  film.links.letterboxd  (stable URI, same as the CSV's "Letterboxd URI")
//       title:     film.name
//       year:      film.releaseYear
//       rating:    film.memberRating?.rating ?? null
//       dateAdded: new Date(film.whenAdded)
//
// Usage (once implemented):
//   import { ingest } from '@/lib/sources/letterboxd-api'
//   const entries = await ingest({ username: 'you', apiKey: process.env.LETTERBOXD_API_KEY })
//   await syncEntries(entries, db)

export async function ingest({ username, apiKey } = {}) {
  throw new Error(
    'The Letterboxd API is not yet publicly available.\n' +
    'Use the CSV source (lib/sources/letterboxd-csv.js) until then.'
  )
}
