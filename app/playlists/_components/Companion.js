'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createPlaylistFromExplore } from '@/app/actions'

// Rotates on each page load — the curator shouldn't always open the same way
const OPENINGS = [
  "What are you after tonight?",
  "What does tonight feel like?",
  "Where are you, emotionally speaking?",
  "What kind of company are you looking for?",
  "Something to sit inside, or somewhere to go?",
  "What does the evening call for?",
  "What are you not in the mood for? That's sometimes easier.",
]

// Each follow-up listens for something specific and responds with precision —
// not a menu of options, but a single question that sharpens the request.
const FOLLOWUPS = [
  {
    pattern: /\b(sad|grief|loss|mourn|heartbreak|broken|devastat|bereav)\b/i,
    question: "Something to sit inside, or to understand from a distance?"
  },
  {
    pattern: /\b(lonely|alone|isolat|disconnect|absent|hollow|empty)\b/i,
    question: "Loneliness as the subject, or just as the atmosphere?"
  },
  {
    pattern: /\b(dark|disturb|dread|horror|brutal|bleak|uneas|sinister|menac)\b/i,
    question: "Psychologically unsettling, or does it need to go further?"
  },
  {
    pattern: /\b(romantic|love|tender|intimate|longing|desire|eros|passion)\b/i,
    question: "The longing, or the arrival?"
  },
  {
    pattern: /\b(slow|quiet|still|contemplat|meditat|patient|unhurried|breath)\b/i,
    question: "Slow cinema proper, or just something that doesn't push?"
  },
  {
    pattern: /\b(beauti|visual|cinemat|gorgeous|strik|image|colour|color|light|photograph|shot)\b/i,
    question: "Style as the whole point, or in service of something else?"
  },
  {
    pattern: /\b(funny|laugh|comedy|wit|sharp|dry|charm|humor|humour|irony)\b/i,
    question: "Sharp and dry, or something warmer?"
  },
  {
    pattern: /\b(angry|rage|frustrat|injustice|political|resist|protest|rebel)\b/i,
    question: "Anger that indicts something specific, or a more diffuse unease?"
  },
  {
    pattern: /\b(nostalgic|memory|past|childhood|time|loss of time|fading)\b/i,
    question: "The past as beautiful, or as something that haunts?"
  },
  {
    pattern: /\b(french|italian|japanese|korean|european|foreign|world cinema|subtitles?)\b/i,
    question: "Any period in mind, or completely open?"
  },
  {
    pattern: /\b(classic|vintage|noir|new wave|60s|70s|80s|old)\b/i,
    question: "How far back — New Wave, or further?"
  },
  {
    pattern: /\b(don'?t know|not sure|anything|surprise|whatever|no idea|unsure|open)\b/i,
    question: "Then tell me what you don't want."
  },
]

const DEFAULT_FOLLOWUP = "What does it look like — a place, a quality of light, a time of year?"

function pickFollowup(input) {
  for (const { pattern, question } of FOLLOWUPS) {
    if (pattern.test(input)) return question
  }
  return DEFAULT_FOLLOWUP
}

// Wraps a state update in a deliberate pause — makes responses feel considered
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function FilmMini({ film }) {
  const poster = film.posterPath ? `https://image.tmdb.org/t/p/w342${film.posterPath}` : null
  return (
    <Link href={`/films/${film.id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden bg-neutral-900">
        {poster ? (
          <Image
            src={poster}
            alt={film.title}
            fill
            className="object-cover transition-opacity duration-500 group-hover:opacity-60"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-800 text-xs">—</div>
        )}
      </div>
      <p
        className="mt-2 text-xs text-neutral-400 leading-snug line-clamp-2 group-hover:text-neutral-200 transition-colors duration-300"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {film.title}
      </p>
      <p className="text-xs text-neutral-700 tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
        {film.year}
      </p>
    </Link>
  )
}

export default function Companion() {
  const [phase, setPhase] = useState('open')   // open | thinking | followup | searching | done
  // Pick once on mount — the same line seeds both the display and the reset function
  const [opening] = useState(() => OPENINGS[Math.floor(Math.random() * OPENINGS.length)])
  const [messages, setMessages] = useState(() => [{ from: 'bot', text: opening }])
  const [input, setInput] = useState('')
  const [results, setResults] = useState([])
  const [noResults, setNoResults] = useState(false)
  const [playlistSaved, setPlaylistSaved] = useState(false)
  const firstInputRef = useRef('')
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, results, noResults])

  useEffect(() => {
    if (phase === 'open' || phase === 'followup') {
      inputRef.current?.focus()
    }
  }, [phase])

  async function handleSubmit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    setInput('')
    setMessages(m => [...m, { from: 'user', text }])

    if (phase === 'open') {
      firstInputRef.current = text
      setPhase('thinking')
      await delay(520)
      const followup = pickFollowup(text)
      setMessages(m => [...m, { from: 'bot', text: followup }])
      setPhase('followup')

    } else {
      const combined = `${firstInputRef.current} ${text}`
      setPhase('searching')
      await delay(420)
      setMessages(m => [...m, { from: 'bot', text: 'A moment.' }])

      try {
        const res = await fetch(`/api/explore?q=${encodeURIComponent(combined)}&limit=8`)
        const films = await res.json()

        if (films.length === 0) {
          await delay(300)
          setMessages(m => [
            ...m.slice(0, -1),
            { from: 'bot', text: "Nothing close in your library. Try different words — a texture, a place, a director's name." }
          ])
          setNoResults(true)
        } else {
          setResults(films)
        }
      } catch {
        setMessages(m => [...m.slice(0, -1), { from: 'bot', text: 'Something went wrong.' }])
        setNoResults(true)
      }

      setPhase('done')
    }
  }

  function reset() {
    setPhase('open')
    setMessages([{ from: 'bot', text: opening }])
    setInput('')
    setResults([])
    setNoResults(false)
    setPlaylistSaved(false)
    firstInputRef.current = ''
  }

  const showInput = phase === 'open' || phase === 'followup'
  const thinking = phase === 'thinking' || phase === 'searching'

  return (
    <div className="max-w-lg">

      {/* ── Conversation thread ── */}
      {/* Printed dialogue: no bubbles, no sides — just voice and response */}
      <div className="space-y-6 mb-10">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.from === 'bot' ? (
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                {msg.text}
              </p>
            ) : (
              <p
                className="text-sm text-neutral-200 leading-relaxed pl-5 italic"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {msg.text}
              </p>
            )}
          </div>
        ))}

        {/* Minimal 'thinking' pulse — barely there, just acknowledges the pause */}
        {thinking && (
          <span className="block text-xs text-neutral-800 select-none" aria-hidden>·</span>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      {showInput && (
        <form
          onSubmit={handleSubmit}
          className="relative border-b border-neutral-800 focus-within:border-neutral-600 transition-colors duration-300"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-transparent pb-2.5 pr-8 text-sm text-neutral-100 focus:outline-none font-light caret-neutral-500 placeholder:text-neutral-800"
          />
          <button
            type="submit"
            aria-label="Submit"
            className="absolute right-0 bottom-2.5 text-neutral-700 hover:text-neutral-300 transition-colors text-xs leading-none"
          >
            →
          </button>
        </form>
      )}

      {/* ── Results ── */}
      {results.length > 0 && (
        <div className="mt-14">
          <div className="grid grid-cols-4 gap-x-5 gap-y-8">
            {results.map(film => <FilmMini key={film.id} film={film} />)}
          </div>

          <div className="mt-10 pt-6 border-t border-neutral-900 flex items-center gap-6 flex-wrap">
            {!playlistSaved ? (
              <form
                action={async (formData) => {
                  await createPlaylistFromExplore(formData)
                  setPlaylistSaved(true)
                }}
                className="flex items-center gap-3"
              >
                <input type="hidden" name="filmIds" value={JSON.stringify(results.map(f => f.id))} />
                <input
                  name="name"
                  type="text"
                  placeholder="Name this selection"
                  className="bg-transparent border-b border-neutral-800 focus:border-neutral-600 text-xs text-neutral-400 placeholder:text-neutral-700 pb-0.5 w-40 focus:outline-none transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                />
                <button
                  type="submit"
                  className="text-xs text-neutral-600 hover:text-neutral-200 uppercase tracking-widest transition-colors shrink-0"
                >
                  Save
                </button>
              </form>
            ) : (
              <p className="text-xs text-neutral-700" style={{ fontFamily: 'var(--font-display)' }}>
                Saved.
              </p>
            )}

            <button
              onClick={reset}
              className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors ml-auto"
            >
              Ask something else
            </button>
          </div>
        </div>
      )}

      {/* ── No results ── */}
      {phase === 'done' && noResults && (
        <button
          onClick={reset}
          className="mt-6 text-xs text-neutral-700 hover:text-neutral-400 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
