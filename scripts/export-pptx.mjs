// Generates a Google Slides-ready .pptx for the Watchlist case study.
// Usage: node scripts/export-pptx.mjs
// Output: case-study-assets/watchlist-case-study.pptx

import PptxGenJS from 'pptxgenjs'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = resolve(__dirname, '../case-study-assets')

function img(name) {
  const buf = readFileSync(`${ASSETS}/${name}`)
  return 'data:image/png;base64,' + buf.toString('base64')
}

// Pre-load images
const images = {
  hero:        img('02-library-hero.png'),
  grid:        img('03-grid.png'),
  companion:   img('04-companion.png'),
  playlists:   img('05-playlists.png'),
  filmDetail:  img('06-film-detail.png'),
  codeSchema:  img('code-04-schema.png'),
  codeMoods:   img('code-01-mood-genres.png'),
  codeWeights: img('code-02-score-weights.png'),
  codeVoice:   img('code-03-companion-voice.png'),
  codeFlow:    img('code-05-companion-flow.png'),
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:      '0A0A0A',
  surface: '111111',
  heading: 'F0F0F0',
  body:    'C8C8C8',
  subtle:  '6B6B6B',
  muted:   '404040',
  border:  '1F1F1F',
  accent:  'E8E8E8',
}

const F = {
  display: 'Courier New',
  body:    'Calibri',
}

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'   // 13.33" × 7.5" — matches Google Slides default
pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.33, height: 7.5 })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slide(bgColor = C.bg) {
  const s = pptx.addSlide()
  s.background = { color: bgColor }
  return s
}

function label(s, text, y = 0.55) {
  s.addText(text.toUpperCase(), {
    x: 0.7, y, w: 11.9, h: 0.25,
    fontFace: F.display, fontSize: 8,
    color: C.muted, charSpacing: 3,
  })
}

function heading(s, text, y = 0.95, size = 36, maxW = 11.9) {
  s.addText(text, {
    x: 0.7, y, w: maxW, h: 2,
    fontFace: F.display, fontSize: size,
    color: C.heading, lineSpacingMultiple: 1.1,
    autoFit: true,
  })
}

function body(s, text, y, opts = {}) {
  s.addText(text, {
    x: 0.7, y, w: opts.w ?? 7, h: opts.h ?? 0.6,
    fontFace: F.body, fontSize: opts.size ?? 13,
    color: opts.color ?? C.body,
    lineSpacingMultiple: 1.5,
    ...opts,
  })
}

function bullet(s, items, y, opts = {}) {
  const rows = items.map(t => ({
    text: [
      { text: '— ', options: { color: C.muted, fontFace: F.display } },
      { text: t,   options: { color: opts.color ?? C.body } },
    ],
  }))
  s.addText(rows, {
    x: 0.7, y, w: opts.w ?? 7.5, h: opts.h ?? (items.length * 0.5 + 0.2),
    fontFace: F.body, fontSize: opts.size ?? 13,
    lineSpacingMultiple: 1.6,
    paraSpaceAfter: 4,
  })
}

function rightImage(s, data, y = 0.4, h = 6.7) {
  s.addImage({ data, x: 7.3, y, w: 5.7, h, sizing: { type: 'contain', w: 5.7, h } })
}

function divider(s, y) {
  s.addShape(pptx.ShapeType.rect, {
    x: 0.7, y, w: 0.4, h: 0.01,
    fill: { color: C.border }, line: { color: C.border },
  })
}

function slideNum(s, current, total) {
  s.addText(`${current} / ${total}`, {
    x: 11.5, y: 7.1, w: 1.5, h: 0.25,
    fontFace: F.display, fontSize: 8,
    color: C.muted, align: 'right',
  })
}

const TOTAL = 13

// ─── Slide 01 — Opening ───────────────────────────────────────────────────────

;(() => {
  const s = slide()
  // Full-bleed hero image, dimmed
  s.addImage({ data: images.hero, x: 0, y: 0, w: 13.33, h: 7.5,
    sizing: { type: 'cover', w: 13.33, h: 7.5 }, transparency: 65 })
  // Gradient overlay via a dark rect at bottom
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 3.8, w: 13.33, h: 3.7,
    fill: { type: 'gradient', stops: [
      { position: 0,   color: '0A0A0A', transparency: 100 },
      { position: 100, color: '0A0A0A', transparency: 0   },
    ]},
    line: { color: '0A0A0A', transparency: 100 },
  })
  s.addText('Personal project — 2026', {
    x: 0.7, y: 5.1, w: 8, h: 0.3,
    fontFace: F.display, fontSize: 9, color: C.subtle, charSpacing: 2,
  })
  s.addText('Watchlist', {
    x: 0.7, y: 5.45, w: 10, h: 1.4,
    fontFace: F.display, fontSize: 64, color: C.heading,
  })
  s.addText('A personal film library rebuilt from a Letterboxd export.', {
    x: 0.7, y: 6.75, w: 7, h: 0.5,
    fontFace: F.body, fontSize: 12, color: C.subtle,
  })
  slideNum(s, 1, TOTAL)
})()

// ─── Slide 02 — Problem ──────────────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '01 — Problem')
  heading(s, 'Letterboxd is a social platform.\nThis needed to be a personal one.', 0.9, 30)
  bullet(s, [
    'Letterboxd is optimised for logging, rating, and being seen — not for private use.',
    'Your favourites exist, but inside someone else\'s interface and taxonomy.',
    'At 11pm you know you want something slow and devastating — not a genre filter.',
    'The gap: taste is specific and embodied. Retrieval assumes you know what to ask for.',
  ], 2.65, { w: 9.5 })
  // Callout box
  s.addShape(pptx.ShapeType.rect, {
    x: 0.7, y: 5.65, w: 0.04, h: 0.7,
    fill: { color: C.muted }, line: { color: C.muted },
  })
  s.addText('"I know what I like. I don\'t always know what I want to watch."', {
    x: 0.95, y: 5.7, w: 8, h: 0.6,
    fontFace: F.display, fontSize: 12, color: C.subtle,
    italic: true, lineSpacingMultiple: 1.4,
  })
  slideNum(s, 2, TOTAL)
})()

// ─── Slide 03 — Brief ────────────────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '02 — Brief')
  heading(s, 'Three things Letterboxd doesn\'t do.', 0.9, 34)
  bullet(s, [
    'Surface films by emotional register, not just genre.',
    'Feel like a personal collection, not a social database.',
    'Give the films room — not reduce them to star ratings and activity feeds.',
  ], 2.4, { w: 9.5 })
  divider(s, 4.4)
  s.addText('The question was never "how do we display films?" It was "what is the right relationship with this collection?"', {
    x: 0.7, y: 4.6, w: 9, h: 0.8,
    fontFace: F.body, fontSize: 12, color: C.subtle,
    lineSpacingMultiple: 1.6, italic: true,
  })
  slideNum(s, 3, TOTAL)
})()

// ─── Slide 04 — Setup / Data ─────────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '03 — Setup')
  heading(s, 'The data was a starting point,\nnot the product.', 0.9, 28, 6.2)
  body(s, 'A Letterboxd export is a flat CSV — title, URI, date added, rating. Every entry was enriched via TMDB: backdrop, poster, synopsis, director, cast, streaming.', 2.85, { w: 5.9, h: 0.9, size: 12 })
  body(s, 'The schema also carries a personal layer — notes and tags that feed back into search. That transforms a spreadsheet into a library.', 3.85, { w: 5.9, h: 0.8, size: 12, color: C.subtle })
  rightImage(s, images.codeSchema, 0.4, 6.7)
  slideNum(s, 4, TOTAL)
})()

// ─── Slide 05 — Design Direction ─────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '04 — Design direction')
  heading(s, 'A library, not a watchlist.', 0.9, 34)

  const cols = [
    { title: 'Typography', body: 'Xanh Mono for display — monospaced, editorial, precise. Not consumer. Work Sans 300 for body — light and unobtrusive.' },
    { title: 'Palette & layout', body: 'Near-black, neutrals. Films as objects, not content. Full-bleed backdrops at low opacity — atmosphere before information.' },
    { title: 'Tone of voice', body: '"Tonight\'s suggestion" not "Featured." "A moment." not "Loading…" The copy is curatorial throughout.' },
  ]

  cols.forEach((col, i) => {
    const x = 0.7 + i * 4.2
    s.addText(col.title.toUpperCase(), {
      x, y: 2.3, w: 3.8, h: 0.25,
      fontFace: F.display, fontSize: 8,
      color: C.muted, charSpacing: 2,
    })
    s.addShape(pptx.ShapeType.rect, { x, y: 2.62, w: 3.5, h: 0.01, fill: { color: C.border }, line: { color: C.border } })
    s.addText(col.body, {
      x, y: 2.72, w: 3.8, h: 1.5,
      fontFace: F.body, fontSize: 11.5, color: C.body,
      lineSpacingMultiple: 1.5,
    })
  })

  s.addImage({ data: images.hero, x: 0.7, y: 4.2, w: 11.93, h: 3,
    sizing: { type: 'cover', w: 11.93, h: 3 } })
  slideNum(s, 5, TOTAL)
})()

// ─── Slide 06 — The Library ──────────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '05 — The library')
  heading(s, 'Browse.', 0.9, 40, 5.5)
  body(s, 'Filter by genre, decade, runtime, streaming. "Tonight\'s suggestion" — a random pick from films with backdrops, resets on refresh. Serendipity as a feature, not an afterthought.', 1.9, { w: 5.9, h: 1, size: 12 })
  body(s, 'Watched indicator: a single pixel-thin line at the top of the poster card. Minimal — enough.', 3.05, { w: 5.9, h: 0.6, size: 11.5, color: C.subtle })
  s.addImage({ data: images.grid, x: 6.9, y: 0.4, w: 6.3, h: 7,
    sizing: { type: 'cover', w: 6.3, h: 7 } })
  slideNum(s, 6, TOTAL)
})()

// ─── Slide 07 — Film Page ────────────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '06 — Film page')
  heading(s, 'Atmosphere before information.', 0.9, 30, 5.5)
  body(s, 'Full-bleed backdrop at low opacity. Personal notes field — free text, for your own references and observations. Custom tags: mood labels, visual references, anything.', 2.1, { w: 5.9, h: 1, size: 12 })
  body(s, 'The annotations feed back into search. The more you write, the sharper the library gets.', 3.25, { w: 5.9, h: 0.6, size: 11.5, color: C.subtle })
  s.addImage({ data: images.filmDetail, x: 6.9, y: 0.4, w: 6.3, h: 7,
    sizing: { type: 'cover', w: 6.3, h: 7 } })
  slideNum(s, 7, TOTAL)
})()

// ─── Slide 08 — The Companion / Iteration ────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '07 — Iteration')
  heading(s, 'The search box was wrong.', 0.9, 32, 5.5)
  body(s, 'First version: a search box. Problem: search is transactional — it assumes you know what you want.', 2.15, { w: 5.9, h: 0.7, size: 12 })
  body(s, 'The insight: most of the time you know how you feel, not what you want. So the interface needed to meet you there.', 2.95, { w: 5.9, h: 0.8, size: 12 })
  divider(s, 3.95)
  body(s, 'Decision: make it conversational. Two steps — mood, then sharpener. The follow-up questions pattern-match emotional vocabulary and ask one precise question back.', 4.1, { w: 5.9, h: 0.9, size: 12 })
  rightImage(s, images.companion, 0.4, 6.7)
  slideNum(s, 8, TOTAL)
})()

// ─── Slide 09 — How search works ─────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '08 — Process')
  heading(s, 'No AI. Pure vocabulary.', 0.9, 34)
  body(s, 'In-memory keyword scoring, runs in under 5ms. A hand-built table maps emotional language to genres. "Melancholy" → Drama. "Noir" → Crime, Thriller, Mystery.', 2.05, { w: 9.5, h: 0.9, size: 12 })
  body(s, 'Why not an LLM? Latency felt wrong for something immediate and private. Being explicit about the vocabulary is also more honest — you can see exactly what the system knows about your taste.', 3.05, { w: 9.5, h: 0.8, size: 12, color: C.subtle })

  s.addImage({ data: images.codeMoods,   x: 0.7,  y: 4.1, w: 5.9, h: 3.2,
    sizing: { type: 'contain', w: 5.9, h: 3.2 } })
  s.addImage({ data: images.codeWeights, x: 6.75, y: 4.1, w: 5.9, h: 3.2,
    sizing: { type: 'contain', w: 5.9, h: 3.2 } })
  slideNum(s, 9, TOTAL)
})()

// ─── Slide 10 — Companion voice ──────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '08 — Process')
  heading(s, 'Editorial voice\nwritten as code.', 0.9, 30, 5.5)
  body(s, 'The opening questions rotate. The follow-ups don\'t offer a menu — they ask one more precise question. The copy was written before the code.', 2.35, { w: 5.5, h: 0.9, size: 12 })

  const callouts = [
    '"Something to sit inside, or to understand from a distance?"',
    '"Slow cinema proper, or just something that doesn\'t push?"',
    '"Style as the whole point, or in service of something else?"',
  ]
  callouts.forEach((text, i) => {
    s.addShape(pptx.ShapeType.rect, {
      x: 0.7, y: 3.55 + i * 0.88, w: 0.04, h: 0.65,
      fill: { color: C.muted }, line: { color: C.muted },
    })
    s.addText(text, {
      x: 0.95, y: 3.58 + i * 0.88, w: 5.5, h: 0.6,
      fontFace: F.display, fontSize: 11, color: C.subtle,
      italic: true, lineSpacingMultiple: 1.35,
    })
  })

  rightImage(s, images.codeVoice, 0.4, 6.7)
  slideNum(s, 10, TOTAL)
})()

// ─── Slide 11 — Iteration table ──────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '09 — Iteration')
  heading(s, 'Decisions made.', 0.9, 34)

  const rows = [
    ['Hero framing',    'Featured film',        '"Tonight\'s suggestion" — editorial framing changes the relationship with the content'],
    ['Discovery',       'Search box',           'The Companion — search assumes prior knowledge you often don\'t have at 11pm'],
    ['Mood → genre',    'Genre filter only',    'MOOD_GENRES vocabulary bridges how you think to how data is tagged'],
    ['Search engine',   'Explored Claude API',  'Latency + cost felt wrong; hand-built vocabulary is more immediate and honest'],
    ['Watched marker',  'Badge / icon overlay', '1px top border — present enough to register, absent enough not to dominate'],
  ]

  const headers = ['Decision', 'First version', 'Why it changed']
  const colX = [0.7, 2.9, 5.5]
  const colW = [2.0, 2.4, 7.5]

  // Header row
  headers.forEach((h, i) => {
    s.addText(h.toUpperCase(), {
      x: colX[i], y: 2.3, w: colW[i], h: 0.25,
      fontFace: F.display, fontSize: 7.5, color: C.muted, charSpacing: 2,
    })
  })
  s.addShape(pptx.ShapeType.rect, { x: 0.7, y: 2.6, w: 12, h: 0.01, fill: { color: C.border }, line: { color: C.border } })

  rows.forEach((row, ri) => {
    const y = 2.75 + ri * 0.8
    row.forEach((cell, ci) => {
      s.addText(cell, {
        x: colX[ci], y, w: colW[ci] - 0.1, h: 0.72,
        fontFace: ci === 0 ? F.display : F.body,
        fontSize: ci === 0 ? 10 : 11.5,
        color: ci === 0 ? C.subtle : C.body,
        lineSpacingMultiple: 1.35,
      })
    })
    s.addShape(pptx.ShapeType.rect, { x: 0.7, y: y + 0.73, w: 12, h: 0.01, fill: { color: '161616' }, line: { color: '161616' } })
  })

  slideNum(s, 11, TOTAL)
})()

// ─── Slide 12 — Learnings ─────────────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '10 — Learnings')
  heading(s, 'What this taught.', 0.9, 34)

  const cols = [
    { title: 'On design', items: [
      '"Reskinning" was the wrong frame. This was reimagining the relationship with the collection.',
      'Tone of voice is an interface decision. Copy was written before UI, not after.',
      'Personal data transformed by design becomes a different kind of object.',
    ]},
    { title: 'On product', items: [
      'The best interface matches how you actually think, not how the data is structured.',
      'No AI doesn\'t mean no intelligence — the vocabulary table is the intelligence, it\'s just explicit.',
      'A personal tool should feel made, not configured.',
    ]},
  ]

  cols.forEach((col, i) => {
    const x = 0.7 + i * 6.3
    s.addText(col.title.toUpperCase(), {
      x, y: 2.3, w: 5.8, h: 0.25,
      fontFace: F.display, fontSize: 8, color: C.muted, charSpacing: 2,
    })
    bullet(s, col.items, 2.65, { w: 5.8, x, h: 3 })
  })

  // Override x for second column bullets — manual
  const s2items = cols[1].items
  s.addText(s2items.map(t => [
    { text: '— ', options: { color: C.muted, fontFace: F.display } },
    { text: t,   options: { color: C.body } },
  ]), {
    x: 7.0, y: 2.65, w: 5.8, h: 3.2,
    fontFace: F.body, fontSize: 13,
    lineSpacingMultiple: 1.6, paraSpaceAfter: 4,
  })

  slideNum(s, 12, TOTAL)
})()

// ─── Slide 13 — What's next ───────────────────────────────────────────────────

;(() => {
  const s = slide()
  label(s, '11 — Next', 2.8)
  heading(s, 'Where it goes.', 3.1, 40)
  bullet(s, [
    'Direct sync from Letterboxd when their API opens',
    'Richer tagging — pull themes from notes into structured tags automatically',
    'Mobile-first viewing mode — the library you actually use on the sofa',
  ], 4.4, { w: 9 })
  slideNum(s, 13, TOTAL)
})()

// ─── Write file ───────────────────────────────────────────────────────────────

await pptx.writeFile({ fileName: `${ASSETS}/watchlist-case-study.pptx` })
console.log('Saved: case-study-assets/watchlist-case-study.pptx')
