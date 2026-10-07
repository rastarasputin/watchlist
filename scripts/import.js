// Sync your Letterboxd watchlist into the database (CLI version).
// Usage: npx tsx scripts/import.js path/to/watchlist.csv
//
// Safe to run repeatedly. Existing films are updated, new ones are imported.
// Your playlists, watched status, and any personal enrichment are preserved.
//
// To switch to the Letterboxd API source once available, replace the ingest
// call below with: import { ingest } from '../lib/sources/letterboxd-api.js'

import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '../app/generated/prisma/client.ts'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { ingest } from '../lib/sources/letterboxd-csv.js'
import { syncEntries } from '../lib/sync.js'

const dbUrl = (process.env.DATABASE_URL ?? 'file:dev.db').replace(/^file:/, '')
const adapter = new PrismaBetterSqlite3({ url: resolve(process.cwd(), dbUrl) })
const db = new PrismaClient({ adapter })

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/import.js path/to/watchlist.csv')
    process.exit(1)
  }

  const csvText = readFileSync(csvPath, 'utf-8')
  const entries = ingest(csvText)

  console.log(`Syncing ${entries.length} entries from CSV...`)
  const stats = await syncEntries(entries, db)

  console.log(`\nDone.`)
  console.log(`  Added:   ${stats.added}`)
  console.log(`  Updated: ${stats.updated}`)
  if (stats.failed.length > 0) {
    console.log(`  Failed:  ${stats.failed.length}`)
    stats.failed.forEach((f) => console.log(`    ✗ ${f}`))
  }

  await db.$disconnect()
}

main()
