// Captures hi-res screenshots of the app + code snippet images for the case study.
// Usage: node scripts/screenshots.mjs
// Requires: dev server running at localhost:3000

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../case-study-assets')
mkdirSync(OUT, { recursive: true })

const BASE = 'http://localhost:3000'

// ─── App screenshots ───────────────────────────────────────────────────────────

const APP_SHOTS = [
  { name: '01-library',       url: '/',                  fullPage: true,  clip: null },
  { name: '02-library-hero',  url: '/',                  fullPage: false, clip: { x: 0, y: 0, width: 1440, height: 780 } },
  { name: '03-grid',          url: '/',                  fullPage: false, clip: { x: 0, y: 520, width: 1440, height: 860 } },
  { name: '04-companion',     url: '/playlists',         fullPage: false, clip: null },
  { name: '05-playlists',     url: '/playlists',         fullPage: true,  clip: null },
]

// ─── Code snippet images ───────────────────────────────────────────────────────

const CODE_SNIPPETS = [
  {
    name: 'code-01-mood-genres',
    label: 'lib/explore.js — Mood → Genre vocabulary',
    lang: 'javascript',
    code: `// Maps emotional language to TMDB genre names.
// The gap this bridges: users say "melancholy" — data says "Drama".
const MOOD_GENRES = {
  sad:           ['Drama', 'Romance'],
  melancholy:    ['Drama'],
  grief:         ['Drama'],
  lonely:        ['Drama'],
  isolation:     ['Drama', 'Thriller'],
  tender:        ['Drama', 'Romance'],
  wistful:       ['Drama', 'Romance'],
  dark:          ['Thriller', 'Crime', 'Horror', 'Mystery'],
  bleak:         ['Drama', 'Crime'],
  existential:   ['Drama'],
  quiet:         ['Drama'],
  slow:          ['Drama'],
  meditative:    ['Drama', 'Documentary'],
  atmospheric:   ['Drama', 'Horror', 'Thriller'],
  dreamlike:     ['Fantasy', 'Drama'],
  haunting:      ['Drama', 'Horror'],
  noir:          ['Crime', 'Thriller', 'Mystery'],
  // ... 80+ terms mapping mood to genre
}`,
  },
  {
    name: 'code-02-score-weights',
    label: 'lib/explore.js — Field weights',
    lang: 'javascript',
    code: `// Weighted scoring: intentional annotations beat raw metadata.
// title (6) > genre (5) > tags (4) > notes (3) > director (3) > cast (2) > synopsis (1)
function scoreFilm(film, terms) {
  let score = 0
  for (const term of terms) {
    if (title.includes(term))    score += 6
    if (genres.includes(term))   score += 5
    if (tags.includes(term))     score += 4   // your own tags, highest signal
    if (notes.includes(term))    score += 3   // your own notes
    if (director.includes(term)) score += 3
    if (cast.includes(term))     score += 2
    if (synopsis.includes(term)) score += 1

    // Mood → genre boost: "melancholy" → Drama films score +4
    for (const g of (MOOD_GENRES[term] ?? [])) {
      if (genres.includes(g.toLowerCase())) score += 4
    }
  }
  return score
}`,
  },
  {
    name: 'code-03-companion-voice',
    label: 'components/Companion.js — Editorial voice in code',
    lang: 'javascript',
    code: `// The curator doesn't always open the same way.
const OPENINGS = [
  "What are you after tonight?",
  "What does tonight feel like?",
  "Where are you, emotionally speaking?",
  "What kind of company are you looking for?",
  "Something to sit inside, or somewhere to go?",
  "What does the evening call for?",
  "What are you not in the mood for? That's sometimes easier.",
]

// Each follow-up sharpens the request — one question, not a menu.
const FOLLOWUPS = [
  {
    pattern: /\\b(sad|grief|loss|mourn|heartbreak|broken|devastat)\\b/i,
    question: "Something to sit inside, or to understand from a distance?"
  },
  {
    pattern: /\\b(slow|quiet|still|contemplat|meditat|patient|unhurried)\\b/i,
    question: "Slow cinema proper, or just something that doesn't push?"
  },
  {
    pattern: /\\b(beauti|visual|cinemat|gorgeous|strik|image|colour|light)\\b/i,
    question: "Style as the whole point, or in service of something else?"
  },
]`,
  },
  {
    name: 'code-04-schema',
    label: 'prisma/schema.prisma — Data model',
    lang: 'prisma',
    code: `model Film {
  id             Int      @id @default(autoincrement())
  tmdbId         Int      @unique
  title          String
  year           Int
  runtime        Int?
  genres         String   // JSON: enriched from TMDB
  posterPath     String?
  backdropPath   String?
  synopsis       String?
  director       String?
  cast           String?

  // Personal layer — these feed back into search
  notes          String?  // observations, creative references, free text
  tags           String?  // mood/creative labels e.g. '["melancholy","wide angles"]'

  letterboxdUri  String?  @unique   // stable re-sync key from export
  letterboxdRating Float?
  watched        Boolean  @default(false)
  playlists      PlaylistFilm[]
}`,
  },
  {
    name: 'code-05-companion-flow',
    label: 'components/Companion.js — Two-step conversation',
    lang: 'javascript',
    code: `async function handleSubmit(e) {
  e.preventDefault()
  const text = input.trim()

  if (phase === 'open') {
    // Step 1: receive mood, ask sharpening question
    firstInputRef.current = text
    setPhase('thinking')
    await delay(520)   // deliberate pause — feels considered, not instant
    const followup = pickFollowup(text)
    setMessages(m => [...m, { from: 'bot', text: followup }])
    setPhase('followup')

  } else {
    // Step 2: combine both inputs, search the library
    const combined = \`\${firstInputRef.current} \${text}\`
    setPhase('searching')
    await delay(420)
    setMessages(m => [...m, { from: 'bot', text: 'A moment.' }])

    const res = await fetch(\`/api/explore?q=\${encodeURIComponent(combined)}&limit=8\`)
    const films = await res.json()
    setResults(films)
    setPhase('done')
  }
}`,
  },
]

// ─── HTML template for code images ────────────────────────────────────────────

function codeHtml(label, lang, code) {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark-dimmed.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0d1117;
    font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
    padding: 0;
  }
  .window {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 10px;
    overflow: hidden;
    margin: 32px;
  }
  .titlebar {
    background: #21262d;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #30363d;
  }
  .dots { display: flex; gap: 6px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot-r { background: #ff5f57; }
  .dot-y { background: #febc2e; }
  .dot-g { background: #28c840; }
  .filename {
    font-size: 12px;
    color: #8b949e;
    font-family: 'SF Mono', monospace;
    flex: 1;
    text-align: center;
    margin-right: 54px;
  }
  pre {
    margin: 0;
    padding: 24px 28px;
    overflow: visible;
  }
  code {
    font-size: 13px;
    line-height: 1.7;
  }
  .hljs { background: transparent !important; }
</style>
</head>
<body>
<div class="window">
  <div class="titlebar">
    <div class="dots">
      <div class="dot dot-r"></div>
      <div class="dot dot-y"></div>
      <div class="dot dot-g"></div>
    </div>
    <span class="filename">${label}</span>
  </div>
  <pre><code class="language-${lang}">${escaped}</code></pre>
</div>
<script>hljs.highlightAll()</script>
</body>
</html>`
}

// ─── Run ───────────────────────────────────────────────────────────────────────

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,   // retina / 2x
  })

  // ── App screenshots ──
  console.log('\nCapturing app screenshots...')
  const page = await context.newPage()

  for (const shot of APP_SHOTS) {
    console.log(`  ${shot.name}`)
    await page.goto(BASE + shot.url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)   // let images settle

    const opts = { path: `${OUT}/${shot.name}.png` }
    if (shot.fullPage) opts.fullPage = true
    if (shot.clip)     opts.clip = shot.clip

    await page.screenshot(opts)
  }

  // ── Film detail page: grab the first film from DB ──
  console.log('  06-film-detail')
  await page.goto(BASE + '/films/1', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${OUT}/06-film-detail.png`, fullPage: false })

  await page.screenshot({ path: `${OUT}/06-film-detail-full.png`, fullPage: true })

  // ── Code snippet images ──
  console.log('\nRendering code snippets...')
  const codePage = await context.newPage()

  for (const snippet of CODE_SNIPPETS) {
    console.log(`  ${snippet.name}`)
    const html = codeHtml(snippet.label, snippet.lang, snippet.code)
    await codePage.setContent(html, { waitUntil: 'networkidle' })
    await codePage.waitForTimeout(300)
    const el = await codePage.$('.window')
    await el.screenshot({ path: `${OUT}/${snippet.name}.png` })
  }

  await browser.close()
  console.log(`\nDone. Files saved to: ${OUT}/`)
}

run().catch(err => { console.error(err); process.exit(1) })
