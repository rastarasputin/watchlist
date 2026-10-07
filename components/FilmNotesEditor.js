'use client'

// Inline editorial annotation for the film detail page.
// Two fields: notes (freeform reflection) and qualities (short descriptors).
// Both are click-to-edit; both save via server actions.

import { useState } from 'react'
import { updateFilmNotes, updateFilmTags } from '@/app/actions'

function NotesField({ filmId, initialValue }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const fd = new FormData()
    fd.append('filmId', filmId)
    fd.append('notes', value)
    await updateFilmNotes(fd)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="block w-full text-left">
        {value ? (
          <p className="text-sm text-neutral-400 leading-relaxed font-light whitespace-pre-wrap hover:text-neutral-300 transition-colors">
            {value}
          </p>
        ) : (
          <p className="text-xs text-neutral-800 italic hover:text-neutral-600 transition-colors">
            What did this film do to you? Why does it belong in this library?
          </p>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={4}
        placeholder="What did this film do to you? Why does it belong here?"
        className="w-full bg-transparent border border-neutral-800 focus:border-neutral-600 text-sm text-neutral-300 placeholder:text-neutral-700 p-3 resize-none focus:outline-none font-light leading-relaxed transition-colors"
      />
      <div className="flex gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="text-xs text-neutral-200 hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => { setValue(initialValue ?? ''); setEditing(false) }}
          className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function QualitiesField({ filmId, initialTags }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState((initialTags ?? []).join(', '))
  const [saving, setSaving] = useState(false)

  const tags = initialTags ?? []

  async function save() {
    setSaving(true)
    const fd = new FormData()
    fd.append('filmId', filmId)
    fd.append('tags', value)
    await updateFilmTags(fd)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="block text-left">
        {tags.length > 0 ? (
          // Dot-separated — reads like editorial shorthand, not a tag cloud
          <p
            className="text-xs text-neutral-500 leading-relaxed hover:text-neutral-400 transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tags.join('  ·  ')}
          </p>
        ) : (
          <p className="text-xs text-neutral-800 italic hover:text-neutral-600 transition-colors">
            Describe its register — tone, texture, who it's for, when to watch it.
          </p>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="late-night, quietly devastating, Tarkovsky-adjacent, rewatchable"
        className="w-full bg-transparent border border-neutral-800 focus:border-neutral-600 text-xs text-neutral-400 placeholder:text-neutral-700 px-3 py-2 focus:outline-none transition-colors"
        style={{ fontFamily: 'var(--font-display)' }}
      />
      <p className="text-xs text-neutral-800">Comma-separated</p>
      <div className="flex gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="text-xs text-neutral-200 hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => { setValue(tags.join(', ')); setEditing(false) }}
          className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function FilmNotesEditor({ filmId, notes, tags }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-neutral-700 uppercase tracking-widest mb-3">Notes</p>
        <NotesField filmId={filmId} initialValue={notes} />
      </div>
      <div>
        <p className="text-xs text-neutral-700 uppercase tracking-widest mb-3">Qualities</p>
        <QualitiesField filmId={filmId} initialTags={tags} />
      </div>
    </div>
  )
}
