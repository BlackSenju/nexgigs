import type { HowItWorksStep } from "@/lib/actions/storefronts";

export interface HowItWorksSectionProps {
  steps: HowItWorksStep[] | null;
}

export function HowItWorksSection({ steps }: HowItWorksSectionProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <section className="py-12" aria-label="How it works">
      <div className="px-6 sm:px-10">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          How it works
        </h2>
        <p className="text-zinc-400 text-sm mb-8">
          From first message to done — here&apos;s exactly what to expect.
        </p>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => (
            <li
              key={step.step}
              className="rounded-2xl p-5 ring-1 ring-zinc-800 bg-card flex flex-col gap-2"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black bg-[color:var(--sf-brand)] text-[color:var(--sf-on-brand)]">
                {step.step}
              </div>
              <h3 className="text-base font-bold text-white">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
