// Playlist detail page — shows all films in a playlist
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import FilmGrid from '@/components/FilmGrid'

export default async function PlaylistPage({ params }) {
  const { id } = await params

  const playlist = await db.playlist.findUnique({
    where: { id: parseInt(id) },
    include: {
      films: {
        include: { film: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!playlist) notFound()

  const films = playlist.films.map((pf) => pf.film)

  return (
    <div>
      <div className="pb-8 mb-10 border-b border-neutral-900">
        <p className="text-xs text-neutral-700 uppercase tracking-widest mb-3">Playlist</p>
        <h1
          className="text-4xl text-neutral-100 leading-none tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {playlist.name}
        </h1>
        {playlist.description && (
          <p className="text-neutral-500 text-sm mt-3 font-light">{playlist.description}</p>
        )}
        <p
          className="text-xs text-neutral-700 mt-2 tabular-nums"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {films.length} films
        </p>
      </div>

      <FilmGrid films={films} />
    </div>
  )
}
