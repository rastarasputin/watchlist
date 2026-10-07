// Prisma client singleton — reuse one connection across hot-reloads in dev
import { resolve } from 'path'
import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Resolve the database path to an absolute path so it works regardless
// of what directory Node is invoked from.
function getDbPath() {
  const url = process.env.DATABASE_URL ?? 'file:dev.db'
  // Strip the "file:" prefix that Prisma uses in DATABASE_URL
  const relativePath = url.replace(/^file:/, '')
  return resolve(/*turbopackIgnore: true*/ process.cwd(), relativePath)
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: getDbPath() })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient()
}

export const db = globalForPrisma.prisma
