// Library page — the main film grid
// Reads filter values from URL search params and queries the database

// Force dynamic so Next.js always renders this on the server per-request
// (it uses searchParams and a live database — no static version makes sense)
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'
import { backdropUrl } from '@/lib/tmdb'
import FilmGrid from '@/components/FilmGrid'
import FilterBar from '@/components/FilterBar'

// Build a Prisma `where` clause from the active URL filters
function buildWhere(filters) {
  const where = {}

  if (filters.genre) {
    // genres is stored as a JSON string, so we do a substring match
    where.genres = { contains: filters.genre }
  }

  if (filters.decade) {
    const startYear = parseInt(filters.decade)
    where.year = { gte: startYear, lt: startYear + 10 }
  }

  if (filters.runtime === 'short') {
    where.runtime = { lt: 90 }
  } else if (filters.runtime === 'medium') {
    where.runtime = { gte: 90, lte: 120 }
  } else if (filters.runtime === 'long') {
    where.runtime = { gt: 120 }
  }

  // YouTube and Web are discovery modes, not DB filters — skip streamingData match
  if (filters.streaming && filters.streaming !== 'YouTube' && filters.streaming !== 'Web') {
    where.streamingData = { contains: filters.streaming }
  }

  if (filters.watched === 'watched') {
    where.watched = true
  } else if (filters.watched === 'unwatched') {
    where.watched = false
  }

  return where
}

// Collect every distinct genre across all films for the filter dropdown
async function getAllGenres() {
  const films = await db.film.findMany({ select: { genres: true } })
  const genreSet = new Set()
  for (const film of films) {
    try {
      const parsed = JSON.parse(film.genres)
      for (const g of parsed) genreSet.add(g)
    } catch {}
  }
  return Array.from(genreSet).sort()
}

export default async function LibraryPage({ searchParams }) {
  const filters = await searchParams

  const [films, genres, featured] = await Promise.all([
    db.film.findMany({
      where: buildWhere(filters),
      orderBy: { dateAdded: 'desc' },
    }),
    getAllGenres(),
    // Random featured film: count eligible films, pick a random offset.
    // Runs server-side on each request (page is force-dynamic), so it changes on every refresh.
    // Biased toward films with a backdrop — they make better heroes visually.
    (async () => {
      const count = await db.film.count({ where: { backdropPath: { not: null } } })
      if (count === 0) return null
      const skip = Math.floor(Math.random() * count)
      return db.film.findFirst({ where: { backdropPath: { not: null } }, skip })
    })(),
  ])

  const backdrop = featured ? backdropUrl(featured.backdropPath) : null
  const mode = filters.streaming === 'YouTube' || filters.streaming === 'Web' ? filters.streaming : undefined

  return (
    <div>
      {/* ── Hero: featured film, full-bleed ── */}
      <div className="relative -mx-8 -mt-12 overflow-hidden mb-14" style={{ height: '68vh', minHeight: '380px' }}>
        {backdrop ? (
          <Image
            src={backdrop}
            alt={featured.title}
            fill
            className="object-cover opacity-35"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        {/* Gradient: dark at bottom for legibility, lighter at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/10" />

        {/* Label + title pinned to bottom */}
        {featured && (
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-12">
            <p
              className="text-xs text-neutral-500 uppercase tracking-widest mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Tonight's suggestion
            </p>
            <Link href={`/films/${featured.id}`} className="group/hero block">
              <h2
                className="text-[3.45rem] sm:text-[4.3rem] lg:text-[5.2rem] text-white leading-none tracking-tight max-w-5xl group-hover/hero:text-neutral-300 transition-colors duration-300"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {featured.title}
              </h2>
            </Link>
            <p
              className="text-neutral-500 text-base mt-4 tabular-nums"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {featured.year}
              {featured.director && (
                <span className="text-neutral-600"> · {featured.director}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Filter row ── */}
      <div className="flex items-end justify-between mb-10 pb-6 border-b border-neutral-900">
        {/* FilterBar is a Client Component (uses useSearchParams) so wrap in Suspense */}
        <Suspense>
          <FilterBar genres={genres} />
        </Suspense>
        <span
          className="text-xs text-neutral-700 tabular-nums shrink-0 pb-0.5"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {films.length}
        </span>
      </div>

      {/* ── Film grid ── */}
      <FilmGrid films={films} mode={mode} />
    </div>
  )
}
