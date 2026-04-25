import { sanitizeAboutHtml } from "@/lib/sanitize";

export interface AboutSectionProps {
  aboutHtml: string | null;
  serviceAreas?: string[] | null;
}

export function AboutSection({ aboutHtml, serviceAreas }: AboutSectionProps) {
  if (!aboutHtml && (!serviceAreas || serviceAreas.length === 0)) return null;

  const safe = aboutHtml ? sanitizeAboutHtml(aboutHtml) : null;

  return (
    <section className="py-12" aria-label="About">
      <div className="px-6 sm:px-10 max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-5">
          About us
        </h2>

        {safe && (
          <div
            className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed [&_a]:text-[color:var(--sf-brand)]"
            dangerouslySetInnerHTML={{ __html: safe }}
          />
        )}

        {serviceAreas && serviceAreas.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Service area
            </h3>
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
