'use server'

// All database mutations live here.
// These are Server Actions — they run on the server, not in the browser.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export async function createPlaylist(formData) {
  const name = formData.get('name')?.toString().trim()
  if (!name) return

  const playlist = await db.playlist.create({
    data: { name },
  })

  revalidatePath('/playlists')
  redirect(`/playlists/${playlist.id}`)
}

export async function deletePlaylist(formData) {
  const id = parseInt(formData.get('id'))
  await db.playlist.delete({ where: { id } })
  revalidatePath('/playlists')
  redirect('/playlists')
}

export async function addFilmToPlaylist(formData) {
  const playlistId = parseInt(formData.get('playlistId'))
  const filmId = parseInt(formData.get('filmId'))

  // Find the current max order so the new film goes at the end
  const last = await db.playlistFilm.findFirst({
    where: { playlistId },
    orderBy: { order: 'desc' },
  })

  await db.playlistFilm.create({
    data: {
      playlistId,
      filmId,
      order: (last?.order ?? -1) + 1,
    },
  })

  revalidatePath(`/playlists/${playlistId}`)
  revalidatePath(`/films/${filmId}`)
}

export async function removeFilmFromPlaylist(formData) {
  const playlistId = parseInt(formData.get('playlistId'))
  const filmId = parseInt(formData.get('filmId'))

  await db.playlistFilm.delete({
    where: { playlistId_filmId: { playlistId, filmId } },
  })

  revalidatePath(`/playlists/${playlistId}`)
  revalidatePath(`/films/${filmId}`)
}

// ── Creative companion actions ──────────────────────────────────────────────

export async function updateFilmNotes(formData) {
  const id = parseInt(formData.get('filmId'))
  const notes = formData.get('notes')?.toString() ?? ''
  await db.film.update({ where: { id }, data: { notes: notes || null } })
  revalidatePath(`/films/${id}`)
}

export async function updateFilmTags(formData) {
  const id = parseInt(formData.get('filmId'))
  const raw = formData.get('tags')?.toString() ?? ''
  // Parse comma-separated tags into a JSON array, stripping whitespace
  const parsed = raw.split(',').map(t => t.trim()).filter(Boolean)
  await db.film.update({
    where: { id },
    data: { tags: parsed.length ? JSON.stringify(parsed) : null },
  })
  revalidatePath(`/films/${id}`)
}

// Create a playlist from a set of film IDs (used by the Explore page)
export async function createPlaylistFromExplore(formData) {
  const name = formData.get('name')?.toString().trim()
  const filmIdsRaw = formData.get('filmIds')?.toString() || '[]'
  const filmIds = JSON.parse(filmIdsRaw)

  if (!name || filmIds.length === 0) return

  const playlist = await db.playlist.create({ data: { name } })

  await db.playlistFilm.createMany({
    data: filmIds.map((filmId, order) => ({ playlistId: playlist.id, filmId, order })),
  })

  revalidatePath('/playlists')
  redirect(`/playlists/${playlist.id}`)
}
