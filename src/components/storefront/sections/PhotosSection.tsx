export interface PhotosSectionProps {
  photos: string[] | null;
}

export function PhotosSection({ photos }: PhotosSectionProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <section className="py-12" aria-label="Photo gallery">
      <div className="px-6 sm:px-10">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          The proof
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          Real work, real results.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div
              key={url}
              className="aspect-square rounded-xl overflow-hidden ring-1 ring-zinc-800 bg-zinc-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
