import FilmCard from '@/components/FilmCard'

export default function FilmGrid({ films, mode }) {
  if (films.length === 0) {
    return (
      <div className="py-40 text-center">
        <p className="text-neutral-600 text-sm">No films found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
      {films.map((film) => (
        <FilmCard key={film.id} film={film} mode={mode} />
      ))}
    </div>
  )
}
