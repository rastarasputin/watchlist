// Film detail page
export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posterUrl, backdropUrl, getWatchProviders, getFilmImages } from '@/lib/tmdb'
import FilmNotesEditor from '@/components/FilmNotesEditor'

function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

function webSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}


export default async function FilmPage({ params }) {
  const { id } = await params

  const film = await db.film.findUnique({
    where: { id: parseInt(id) },
    include: {
      playlists: {
        include: { playlist: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!film) notFound()

  const genres = JSON.parse(film.genres ?? '[]')
  const cast = JSON.parse(film.cast ?? '[]')
  const backdrop = backdropUrl(film.backdropPath)
  const poster = posterUrl(film.posterPath)

  // Fetch live data from TMDB — stays current, no DB storage needed
  const [providers, images] = await Promise.all([
    getWatchProviders(film.tmdbId),
    getFilmImages(film.tmdbId),
  ])
  const hasProviders = providers.flatrate.length > 0 || providers.rent.length > 0 || providers.buy.length > 0
  const tags = film.tags ? JSON.parse(film.tags) : []

  const filmLabel = `${film.title} (${film.year})`

  return (
    <div>
      {/* ── Hero: full-bleed backdrop with title overlaid ── */}
      <div className="relative -mx-8 -mt-12 overflow-hidden" style={{ height: '58vh', minHeight: '340px' }}>
        {backdrop ? (
          <Image
            src={backdrop}
            alt={film.title}
            fill
            className="object-cover opacity-30"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        {/* Deep gradient so title is always legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

        {/* Title block pinned to bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
          <p
            className="text-xs text-neutral-500 tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {[film.director, film.year].filter(Boolean).join('  ·  ')}
          </p>
          <h1
            className="text-5xl sm:text-6xl text-neutral-100 leading-none tracking-tight max-w-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {film.title}
          </h1>
        </div>
      </div>

      {/* ── Article body ── */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-10">
        {/* Poster column */}
        <div className="hidden lg:block">
          {poster && (
            <div className="relative w-full aspect-[2/3] overflow-hidden">
              <Image src={poster} alt={film.title} fill className="object-cover" />
            </div>
          )}
        </div>

        {/* Article text column */}
        <div>
          {/* Byline — director is already in the hero; this carries runtime and genre */}
          <div className="pb-6 mb-6 border-b border-neutral-900">
            <p
              className="text-xs text-neutral-600 tabular-nums"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {[
                String(film.year),
                film.runtime && `${film.runtime} min`,
                genres.join(' · '),
              ].filter(Boolean).join('  ·  ')}
            </p>
          </div>

          {/* Synopsis — the article body */}
          {film.synopsis && (
            <p className="text-base text-neutral-300 leading-[1.75] max-w-2xl font-light">
              {film.synopsis}
            </p>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <div className="mt-8">
              <p className="text-xs text-neutral-700 uppercase tracking-widest mb-2">With</p>
              <p className="text-sm text-neutral-500 font-light">{cast.join(', ')}</p>
            </div>
          )}

          {/* Rating */}
          {film.letterboxdRating && (
            <p
              className="text-xs text-neutral-800 tabular-nums mt-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Letterboxd&ensp;{film.letterboxdRating}
            </p>
          )}
        </div>
      </div>

      {/* ── Editorial annotation — comes before stills: the user's voice is primary ── */}
      <section className="mt-16 pt-10 border-t border-neutral-900">
        <FilmNotesEditor
          filmId={film.id}
          notes={film.notes ?? null}
          tags={tags}
        />
      </section>

      {/* ── Image spread — no label; the images speak ── */}
      {images.backdrops.length > 0 && (
        <section className="mt-16 pt-10 border-t border-neutral-900">
          <div className="space-y-1">
            {/* Row 1: full-width first still */}
            <div className="relative w-full aspect-video overflow-hidden bg-neutral-900">
              <Image
                src={`https://image.tmdb.org/t/p/w1280${images.backdrops[0].file_path}`}
                alt=""
                fill
                className="object-cover"
              />
            </div>

            {/* Row 2: wide + portrait (poster) — asymmetric */}
            {images.backdrops[1] && (
              <div className="flex gap-1" style={{ height: '42vw', maxHeight: '520px' }}>
                <div className="relative flex-[3] overflow-hidden bg-neutral-900">
                  <Image
                    src={`https://image.tmdb.org/t/p/w1280${images.backdrops[1].file_path}`}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                {poster && (
                  <div className="relative flex-[1] overflow-hidden bg-neutral-900">
                    <Image src={poster} alt={film.title} fill className="object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Row 3: up to three equal stills */}
            {images.backdrops.length >= 3 && (
              <div className="flex gap-1">
                {images.backdrops.slice(2, 5).map((img, i) => (
                  <div key={i} className="relative flex-1 aspect-video overflow-hidden bg-neutral-900">
                    <Image
                      src={`https://image.tmdb.org/t/p/w780${img.file_path}`}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Trailer — no label needed ── */}
      {film.trailerKey && (
        <section className="mt-16 pt-10 border-t border-neutral-900">
          <div className="aspect-video max-w-2xl bg-neutral-900">
            <iframe
              src={`https://www.youtube.com/embed/${film.trailerKey}`}
              title={`${film.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </section>
      )}

      {/* ── Find it ── */}
      <section className="mt-16 pt-10 border-t border-neutral-900">
        <p className="text-xs text-neutral-700 uppercase tracking-widest mb-8">Find it</p>

        <div className="space-y-10">
          {/* Streaming providers */}
          {hasProviders ? (
            <div className="space-y-4">
              {providers.flatrate.length > 0 && (
                <ProviderRow label="Stream" providers={providers.flatrate} justWatchLink={providers.link} />
              )}
              {providers.rent.length > 0 && (
                <ProviderRow label="Rent" providers={providers.rent} justWatchLink={providers.link} />
              )}
              {providers.buy.length > 0 && (
                <ProviderRow label="Buy" providers={providers.buy} justWatchLink={providers.link} />
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-600">
              Not currently streaming in the US.{' '}
              {providers.link && (
                <a href={providers.link} target="_blank" rel="noopener noreferrer"
                  className="text-neutral-500 underline underline-offset-2 hover:text-neutral-300 transition-colors">
                  Other regions ↗
                </a>
              )}
            </p>
          )}

          {/* Discovery */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <ExternalLink href={youtubeSearchUrl(`${filmLabel} trailer`)}>Trailer</ExternalLink>
            <ExternalLink href={youtubeSearchUrl(`${filmLabel} video essay`)}>Video essays</ExternalLink>
            <ExternalLink href={webSearchUrl(filmLabel)}>Web</ExternalLink>
          </div>
        </div>
      </section>

      {/* ── Collections ── */}
      {film.playlists.length > 0 && (
        <section className="mt-16 pt-10 border-t border-neutral-900">
          <p className="text-xs text-neutral-700 uppercase tracking-widest mb-6">Part of</p>
          <div className="flex flex-wrap gap-3">
            {film.playlists.map(({ playlist }) => (
              <a key={playlist.id} href={`/playlists/${playlist.id}`}
                className="text-xs text-neutral-500 hover:text-neutral-200 border-b border-neutral-800 hover:border-neutral-500 pb-px transition-colors">
                {playlist.name}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ProviderRow({ label, providers, justWatchLink }) {
  return (
    <div className="flex gap-6">
      <span className="text-xs text-neutral-700 w-10 shrink-0 pt-px">{label}</span>
      <p className="text-xs text-neutral-500 font-light leading-relaxed">
        {providers.map((p, i) => (
          <span key={p.provider_id}>
            {i > 0 && <span className="text-neutral-800">  ·  </span>}
            <a
              href={justWatchLink ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-200 transition-colors"
            >
              {p.provider_name}
            </a>
          </span>
        ))}
      </p>
    </div>
  )
}

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-300 border-b border-neutral-800 hover:border-neutral-600 pb-px transition-colors">
      {children}
      <span className="text-neutral-800">↗</span>
    </a>
  )
}
