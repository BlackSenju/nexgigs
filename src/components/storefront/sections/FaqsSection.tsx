"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/actions/storefronts";

export interface FaqsSectionProps {
  faqs: Faq[] | null;
}

export function FaqsSection({ faqs }: FaqsSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="py-12" aria-label="Frequently asked questions">
      <div className="px-6 sm:px-10 max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">
          Common questions
        </h2>

        <ul className="divide-y divide-zinc-800 ring-1 ring-zinc-800 rounded-2xl bg-card">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-900/40"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={
                      "w-5 h-5 text-zinc-500 mt-0.5 shrink-0 transition-transform " +
                      (isOpen ? "rotate-180" : "")
                    }
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1 text-sm text-zinc-300 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
