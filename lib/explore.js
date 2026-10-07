// ─── Mood / keyword search for the Explore page ──────────────────────────────
//
// v1: pure in-memory keyword scoring. No AI, no API cost, runs in <5ms.
//
// How it works:
//   1. Split the user's query into terms (ignoring short stop words)
//   2. For each term, check if it maps to known genres via MOOD_GENRES
//   3. Score every film in the library against the terms
//   4. Return films with score > 0, sorted by relevance
//
// Searchable fields, weighted:
//   title (6) > genre match (5) > mood→genre mapping (4) > tags (4) >
//   notes (3) > director (3) > cast (2) > synopsis (1)
//
// Tags and notes benefit the most because they are intentional annotations.
//
// ─── To upgrade to AI later ───────────────────────────────────────────────
// Replace `scoreFilm` with a call to the Claude API:
//   const response = await anthropic.messages.create({
//     model: 'claude-opus-4-6',
//     messages: [{ role: 'user', content: buildPrompt(query, films) }]
//   })
// The rest of this file (parsing, result rendering) stays the same.

// Maps mood, emotional register, visual style, and use-case words to TMDB genre names.
// These run against the user's query AND score against any film's tags/notes that
// contain the same vocabulary — so annotating films well makes this sharper.
const MOOD_GENRES = {
  // ── Emotional register ───────────────────────────────────────────────────
  sad:           ['Drama', 'Romance'],
  melancholy:    ['Drama'],
  melancholic:   ['Drama'],
  grief:         ['Drama'],
  loss:          ['Drama'],
  lonely:        ['Drama'],
  loneliness:    ['Drama'],
  isolation:     ['Drama', 'Thriller'],
  devastating:   ['Drama'],
  cathartic:     ['Drama'],
  tender:        ['Drama', 'Romance'],
  wistful:       ['Drama', 'Romance'],
  hopeful:       ['Drama', 'Romance', 'Family'],
  redemptive:    ['Drama', 'Family'],
  romantic:      ['Romance', 'Drama'],
  love:          ['Romance', 'Drama'],
  longing:       ['Drama', 'Romance'],
  desire:        ['Drama', 'Romance'],
  warm:          ['Drama', 'Romance', 'Family'],
  funny:         ['Comedy'],
  comedy:        ['Comedy'],
  laugh:         ['Comedy'],
  light:         ['Comedy', 'Romance'],
  witty:         ['Comedy'],
  dry:           ['Comedy', 'Drama'],
  sharp:         ['Comedy', 'Thriller'],
  dark:          ['Thriller', 'Crime', 'Horror', 'Mystery'],
  disturbing:    ['Horror', 'Thriller'],
  bleak:         ['Drama', 'Crime'],
  nihilistic:    ['Crime', 'Drama', 'Thriller'],
  existential:   ['Drama'],
  brutal:        ['Crime', 'Thriller', 'War'],
  raw:           ['Drama', 'Crime'],
  violent:       ['Action', 'Crime', 'Thriller', 'War'],
  angry:         ['Drama', 'Crime', 'War'],
  political:     ['History', 'Drama', 'Documentary'],
  psychological: ['Thriller', 'Drama', 'Mystery'],

  // ── Visual and cinematic register ────────────────────────────────────────
  quiet:         ['Drama'],
  slow:          ['Drama'],
  meditative:    ['Drama', 'Documentary'],
  contemplative: ['Drama'],
  atmospheric:   ['Drama', 'Horror', 'Thriller'],
  beautiful:     ['Drama', 'Romance'],
  gorgeous:      ['Drama', 'Romance'],
  sparse:        ['Drama'],
  minimalist:    ['Drama'],
  intimate:      ['Drama', 'Romance'],
  dreamlike:     ['Fantasy', 'Drama'],
  hypnotic:      ['Drama', 'Thriller'],
  haunting:      ['Drama', 'Horror'],
  surreal:       ['Fantasy', 'Drama'],
  visual:        ['Drama'],
  cinematic:     ['Drama'],
  noir:          ['Crime', 'Thriller', 'Mystery'],
  urban:         ['Crime', 'Thriller', 'Drama'],
  landscape:     ['Drama', 'Western', 'Adventure'],

  // ── Genres and forms ─────────────────────────────────────────────────────
  scary:         ['Horror', 'Thriller'],
  horror:        ['Horror'],
  tense:         ['Thriller', 'Mystery'],
  thriller:      ['Thriller'],
  crime:         ['Crime', 'Thriller'],
  mystery:       ['Mystery'],
  epic:          ['Action', 'Adventure', 'History', 'War'],
  war:           ['War', 'History'],
  historical:    ['History', 'Drama', 'War'],
  documentary:   ['Documentary'],
  nature:        ['Documentary'],
  animated:      ['Animation'],
  animation:     ['Animation'],
  anime:         ['Animation'],
  fantasy:       ['Fantasy'],
  scifi:         ['Science Fiction'],
  futuristic:    ['Science Fiction'],
  western:       ['Western'],
  musical:       ['Music'],
  music:         ['Music'],
  family:        ['Family'],
  adventure:     ['Adventure'],
  indie:         ['Drama', 'Comedy'],
  arthouse:      ['Drama'],

  // ── Narrative and thematic ────────────────────────────────────────────────
  portrait:      ['Drama', 'Documentary'],
  road:          ['Adventure', 'Drama'],
  childhood:     ['Drama', 'Family'],
  memory:        ['Drama'],
  identity:      ['Drama', 'Thriller'],

  // ── Use case and context ──────────────────────────────────────────────────
  comfort:       ['Comedy', 'Drama', 'Family', 'Romance'],
  rewatchable:   ['Drama', 'Comedy'],
  rewatch:       ['Drama', 'Comedy'],
  challenging:   ['Drama', 'Thriller'],
  accessible:    ['Comedy', 'Drama', 'Family'],
  sunday:        ['Drama', 'Documentary', 'Romance'],
  midnight:      ['Thriller', 'Horror', 'Drama'],

  // ── National cinema ───────────────────────────────────────────────────────
  french:        ['Drama', 'Romance', 'Comedy'],
  italian:       ['Drama', 'Thriller'],
  japanese:      ['Drama', 'Animation', 'Horror'],
  korean:        ['Drama', 'Thriller', 'Crime'],
  european:      ['Drama'],
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'am', 'are', 'was', 'were', 'be',
  'i', 'me', 'my', 'we', 'you', 'it', 'its', 'this', 'that', 'want',
  'give', 'something', 'today', 'feeling', 'feel', 'like', 'some', 'im',
  'just', 'very', 'really', 'quite', 'bit', 'little', 'about', 'more',
])

export function parseQuery(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // strip punctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

function scoreFilm(film, terms) {
  let score = 0
  const title    = film.title.toLowerCase()
  const genres   = (film.genres  ?? '').toLowerCase()
  const synopsis = (film.synopsis ?? '').toLowerCase()
  const director = (film.director ?? '').toLowerCase()
  const cast     = (film.cast    ?? '').toLowerCase()
  const notes    = (film.notes   ?? '').toLowerCase()
  const tags     = (film.tags    ?? '').toLowerCase()

  for (const term of terms) {
    if (title.includes(term))    score += 6
    if (genres.includes(term))   score += 5
    if (tags.includes(term))     score += 4
    if (notes.includes(term))    score += 3
    if (director.includes(term)) score += 3
    if (cast.includes(term))     score += 2
    if (synopsis.includes(term)) score += 1

    // Mood → genre mapping
    for (const g of (MOOD_GENRES[term] ?? [])) {
      if (genres.includes(g.toLowerCase())) score += 4
    }
  }

  return score
}

// Main function: returns films sorted by relevance, capped at `limit`.
export function searchFilms(films, query, limit = 24) {
  if (!query.trim()) return []
  const terms = parseQuery(query)
  if (terms.length === 0) return []

  return films
    .map(film => ({ film, score: scoreFilm(film, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ film }) => film)
}
