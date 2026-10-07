// POST /api/sync
// Accepts a multipart form upload with a "csv" file field.
// Ingests via the CSV source, syncs to DB, returns JSON stats.
//
// To switch to the Letterboxd API source once available, replace the ingest
// call below with: import { ingest } from '@/lib/sources/letterboxd-api'

import { db } from '@/lib/db'
import { ingest } from '@/lib/sources/letterboxd-csv'
import { syncEntries } from '@/lib/sync'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('csv')

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No CSV file uploaded.' }, { status: 400 })
    }

    const csvText = await file.text()
    const entries = ingest(csvText)
    const stats = await syncEntries(entries, db)

    return Response.json(stats)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
