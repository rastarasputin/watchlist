'use client'

// FilterBar reads and writes URL search params so filters survive page refresh
// and can be bookmarked/shared. No local state needed.
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']
const RUNTIMES = [
  { label: 'Under 90m', value: 'short' },
  { label: '90–120m', value: 'medium' },
  { label: 'Over 120m', value: 'long' },
]
const STREAMING_SERVICES = ['Netflix', 'Prime Video', 'Hulu', 'Max', 'Disney+', 'Apple TV+', 'Peacock', 'MUBI']
const DISCOVERY_MODES = ['YouTube', 'Web']

// Underline-only select — feels like a dropdown label, not a form field
const selectClass = [
  'bg-transparent text-white text-xs tracking-wider',
  'border-0 border-b border-neutral-800',
  'pb-0.5 pr-5 focus:outline-none',
  'hover:text-neutral-300 hover:border-neutral-600',
  'transition-colors duration-150',
].join(' ')

const activeSelectClass = [
  'bg-transparent text-white text-xs tracking-wider',
  'border-0 border-b border-neutral-400',
  'pb-0.5 pr-5 focus:outline-none',
  'hover:text-neutral-300 hover:border-neutral-300',
  'transition-colors duration-150',
].join(' ')

export default function FilterBar({ genres = [] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    router.push(pathname)
  }

  const active = {
    genre: searchParams.get('genre') ?? '',
    decade: searchParams.get('decade') ?? '',
    runtime: searchParams.get('runtime') ?? '',
    streaming: searchParams.get('streaming') ?? '',
    watched: searchParams.get('watched') ?? '',
  }

  const hasFilters = Object.values(active).some(Boolean)

  return (
    <div className="flex flex-wrap items-end gap-6">
      <select
        value={active.genre}
        onChange={(e) => updateParam('genre', e.target.value)}
        className={active.genre ? activeSelectClass : selectClass}
      >
        <option value="">Genre</option>
        {genres.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <select
        value={active.decade}
        onChange={(e) => updateParam('decade', e.target.value)}
        className={active.decade ? activeSelectClass : selectClass}
      >
        <option value="">Decade</option>
        {DECADES.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        value={active.runtime}
        onChange={(e) => updateParam('runtime', e.target.value)}
        className={active.runtime ? activeSelectClass : selectClass}
      >
        <option value="">Runtime</option>
        {RUNTIMES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      <select
        value={active.streaming}
        onChange={(e) => updateParam('streaming', e.target.value)}
        className={active.streaming ? activeSelectClass : selectClass}
      >
        <option value="">Service</option>
        <optgroup label="Streaming">
          {STREAMING_SERVICES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </optgroup>
        <optgroup label="Find on">
          {DISCOVERY_MODES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </optgroup>
      </select>

      <select
        value={active.watched}
        onChange={(e) => updateParam('watched', e.target.value)}
        className={active.watched ? activeSelectClass : selectClass}
      >
        <option value="">Status</option>
        <option value="unwatched">Unwatched</option>
        <option value="watched">Watched</option>
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-neutral-700 hover:text-neutral-500 tracking-wider transition-colors pb-0.5"
        >
          Reset
        </button>
      )}
    </div>
  )
}
