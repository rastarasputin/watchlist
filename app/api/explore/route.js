export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { searchFilms } from '@/lib/explore'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const limit = parseInt(searchParams.get('limit') ?? '8')

  if (!q.trim()) {
    return Response.json([])
  }

  const films = await db.film.findMany({ orderBy: { title: 'asc' } })
  const results = searchFilms(films, q, limit)
  return Response.json(results)
}
