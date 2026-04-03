"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/lib/us-states";
import { ChevronDown, Search } from "lucide-react";

interface StateSelectProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  error?: string;
  id?: string;
}

export function StateSelect({ value, onChange, label, error, id }: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = US_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const selected = US_STATES.find((s) => s.code === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1" ref={ref}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/50",
            error ? "border-brand-red" : "border-zinc-700 focus:border-brand-orange",
            selected ? "text-white" : "text-zinc-500"
          )}
        >
          {selected ? `${selected.code} — ${selected.name}` : "Select state"}
          <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-card shadow-xl max-h-60 overflow-hidden">
            <div className="p-2 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search states..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {filtered.map((state) => (
                <button
                  key={state.code}
                  type="button"
                  onClick={() => {
                    onChange(state.code);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors",
                    value === state.code
                      ? "text-brand-orange bg-brand-orange/5"
                      : "text-zinc-300"
                  )}
                >
                  <span className="font-medium">{state.code}</span>
                  <span className="text-zinc-500 ml-2">{state.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-xs text-zinc-500 text-center">No states found</p>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  );
}
