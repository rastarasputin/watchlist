'use client'

// Admin page — re-sync your Letterboxd watchlist from a CSV export.
// Safe to run as many times as you like. Your playlists and enrichment are preserved.

import { useState, useRef } from 'react'

export default function AdminPage() {
  const [status, setStatus] = useState('idle') // idle | syncing | done | error
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  async function handleSync(e) {
    e.preventDefault()

    const file = fileRef.current?.files?.[0]
    if (!file) return

    setStatus('syncing')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('csv', file)

      const res = await fetch('/api/sync', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Sync failed')

      setResult(data)
      setStatus('done')
    } catch (err) {
      setResult({ error: err.message })
      setStatus('error')
    }
  }

  return (
    <div className="max-w-md space-y-10">
      <div>
        <p className="text-xs text-neutral-600 uppercase tracking-widest mb-4">Sync</p>
        <h1 className="text-xl font-medium">Re-sync Watchlist</h1>
        <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
          Upload your Letterboxd export to add new films and update ratings.
          Playlists, watched status, and personal enrichment are always preserved.
        </p>
        <p className="text-neutral-700 text-xs mt-2">
          Letterboxd → Profile → Settings → Import & Export → Export Your Data
        </p>
      </div>

      <form onSubmit={handleSync} className="space-y-4">
        <div className="border border-neutral-800 p-4">
          <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-3">
            Letterboxd watchlist CSV
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            required
            className="block w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:border file:border-neutral-700 file:text-xs file:bg-transparent file:text-neutral-400 hover:file:text-neutral-200 file:cursor-pointer file:transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'syncing'}
          className="w-full py-2.5 bg-neutral-100 text-neutral-950 text-xs font-medium tracking-wide uppercase hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'syncing' ? 'Syncing…' : 'Sync watchlist'}
        </button>
      </form>

      {/* Loading state */}
      {status === 'syncing' && (
        <div className="text-xs text-neutral-600 space-y-1">
          <p>New films require a TMDB lookup — this may take a few minutes.</p>
          <p>Existing films update instantly.</p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <div className="border border-neutral-800 p-5 space-y-4">
          <p className="text-xs text-neutral-500 uppercase tracking-widest">Sync complete</p>
          <div className="flex gap-8">
            <Stat label="Added" value={result.added} />
            <Stat label="Updated" value={result.updated} />
          </div>
          {result.failed?.length > 0 && (
            <div className="border-t border-neutral-900 pt-4">
              <p className="text-xs text-neutral-700 mb-2">{result.failed.length} not found on TMDB</p>
              <ul className="space-y-1">
                {result.failed.map((f, i) => (
                  <li key={i} className="text-xs text-neutral-700">{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && result?.error && (
        <div className="border border-neutral-800 p-4 text-xs text-neutral-500">
          {result.error}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-2xl font-light text-neutral-200">{value}</p>
      <p className="text-xs text-neutral-600 mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}
