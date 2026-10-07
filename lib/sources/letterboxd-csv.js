// ─── Source: Letterboxd CSV ──────────────────────────────────────────────────
//
// Ingests a Letterboxd watchlist CSV export and returns a normalized array of
// WatchlistEntry objects. This is the current ingestion path.
//
// How to export from Letterboxd:
//   Profile → Settings → Import & Export → Export Your Data → watchlist.csv
//
// WatchlistEntry shape (contract shared with all sources):
//   {
//     sourceId:   string | null  — stable ID from the source (Letterboxd URI, e.g. "https://boxd.it/dR3i")
//     title:      string         — film title as the source knows it
//     year:       number | null  — release year (used to disambiguate title searches)
//     rating:     number | null  — the user's star rating in this source (0.5–5 scale)
//     dateAdded:  Date           — when the user added this film to their watchlist
//   }
//
// To add a new source (e.g. Letterboxd API), implement a file in this folder
// that exports an `ingest` function returning the same WatchlistEntry shape.

import { parse } from 'csv-parse/sync'

export function ingest(csvText) {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  return records.map((row) => ({
    sourceId:  row['Letterboxd URI'] || null,
    title:     row['Name'],
    year:      parseInt(row['Year'], 10) || null,
    rating:    row['Rating'] ? parseFloat(row['Rating']) : null,
    dateAdded: row['Date'] ? new Date(row['Date']) : new Date(),
  }))
}
