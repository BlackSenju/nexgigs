"use client";

import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

const FILTER_CATEGORIES = [
  "All",
  "Home & Yard",
  "Creative & Digital",
  "Tech Help",
  "Personal Errands",
  "Hair & Beauty",
  "Events",
  "Food & Cooking",
  "Auto & Vehicle",
  "Fitness & Wellness",
  "Tutoring",
  "Trades (Licensed)",
];

export function JobFilters({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button className="flex-shrink-0 p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
        <SlidersHorizontal className="w-4 h-4" />
      </button>
      {FILTER_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            selected === cat
              ? "bg-brand-orange text-white"
              : "bg-card text-zinc-400 border border-zinc-700 hover:text-white"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
