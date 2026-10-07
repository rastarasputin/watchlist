'use client'

import { useState } from 'react'
import { createPlaylist } from '@/app/actions'

export default function CreatePlaylistForm() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-600 px-3 py-1.5 uppercase tracking-wide transition-colors"
      >
        New Playlist
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createPlaylist(formData)
        setOpen(false)
      }}
      className="flex items-center gap-2"
    >
      <input
        name="name"
        type="text"
        placeholder="Playlist name"
        autoFocus
        required
        className="bg-transparent border border-neutral-700 text-neutral-200 px-3 py-1.5 text-xs focus:outline-none focus:border-neutral-500 placeholder:text-neutral-700 w-48"
      />
      <button
        type="submit"
        className="text-xs text-neutral-950 bg-neutral-200 hover:bg-white px-3 py-1.5 transition-colors"
      >
        Create
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-neutral-700 hover:text-neutral-400 px-2 py-1.5 transition-colors"
      >
        Cancel
      </button>
    </form>
  )
}
