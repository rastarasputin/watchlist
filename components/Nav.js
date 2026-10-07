import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="px-8 py-4 flex items-center justify-between border-b border-neutral-900">
      <Link
        href="/"
        className="text-white text-sm tracking-[0.15em] uppercase"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Watchlist
      </Link>
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xs text-white hover:text-neutral-400 tracking-widest uppercase transition-colors duration-200">
          Library
        </Link>
        <Link href="/playlists" className="text-xs text-white hover:text-neutral-400 tracking-widest uppercase transition-colors duration-200">
          Playlists
        </Link>
        <Link href="/admin" className="text-xs text-neutral-600 hover:text-neutral-300 tracking-widest uppercase transition-colors duration-200">
          Sync
        </Link>
      </div>
    </nav>
  )
}
