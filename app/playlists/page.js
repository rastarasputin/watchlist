// Playlists + discovery page
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { posterUrl } from '@/lib/tmdb'
import CreatePlaylistForm from './_components/CreatePlaylistForm'
import Companion from './_components/Companion'

export default async function PlaylistsPage() {
  const playlists = await db.playlist.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      films: {
        include: { film: true },
        orderBy: { order: 'asc' },
        take: 1,
      },
      _count: { select: { films: true } },
    },
  })

  return (
    <div>
      {/* ── Discovery ── */}
      {/* No header — the companion's opening question is the entry point */}
      <div className="pb-20 mb-20 border-b border-neutral-900">
        <Companion />
      </div>

      {/* ── Collections ── */}
      <div>
        <div className="flex items-end justify-between pb-8 mb-10 border-b border-neutral-900">
          <h1
            className="text-xs text-neutral-600 uppercase tracking-widest"
          >
            Playlists
          </h1>
          <CreatePlaylistForm />
        </div>

        {playlists.length === 0 ? (
          <p className="text-neutral-700 py-24 text-center text-sm">
            No playlists yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-px bg-neutral-900">
            {playlists.map((playlist) => {
              const coverFilm = playlist.films[0]?.film
              const cover = coverFilm ? posterUrl(coverFilm.posterPath) : null

              return (
                <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="group relative block aspect-[2/3] overflow-hidden bg-neutral-950">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={playlist.name}
                      fill
                      className="object-cover transition-opacity duration-500 group-hover:opacity-40"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-800 text-xs">
                      —
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p
                      className="text-xs text-neutral-100 leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {playlist.name}
                    </p>
                    <p
                      className="text-xs text-neutral-500 mt-1 tabular-nums"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {playlist._count.films}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
