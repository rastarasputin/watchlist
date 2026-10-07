import Link from 'next/link'
import Image from 'next/image'
import { posterUrl } from '@/lib/tmdb'

function filmSearchUrl(film, mode) {
  const q = `${film.title} (${film.year})`
  if (mode === 'YouTube') return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
  if (mode === 'Web') return `https://www.google.com/search?q=${encodeURIComponent(q)}`
  return `/films/${film.id}`
}

export default function FilmCard({ film, mode }) {
  const poster = posterUrl(film.posterPath)
  const href = filmSearchUrl(film, mode)
  const isExternal = mode === 'YouTube' || mode === 'Web'

  return (
    <Link
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="group block"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-neutral-900">
        {poster ? (
          <Image
            src={poster}
            alt={film.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-75"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3">
            <span
              className="text-neutral-600 text-xs text-center leading-relaxed"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {film.title}
            </span>
          </div>
        )}

        {/* External mode indicator */}
        {isExternal && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-neutral-400 text-xs" style={{ fontFamily: 'var(--font-display)' }}>↗</span>
          </div>
        )}

        {/* Watched: thin top bar */}
        {film.watched && !isExternal && (
          <div className="absolute top-0 inset-x-0 h-px bg-neutral-400" />
        )}
      </div>

      {/* Title and year below poster */}
      <div className="mt-2.5">
        <p
          className="text-xs text-white leading-snug line-clamp-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {film.title}
        </p>
        <p
          className="text-xs text-neutral-500 mt-0.5 tabular-nums"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {film.year}
        </p>
      </div>
    </Link>
  )
}
