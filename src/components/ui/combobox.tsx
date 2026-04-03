"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Check } from "lucide-react";

interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  id?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  label,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  error,
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.value.toLowerCase().includes(search.toLowerCase()) ||
      (o.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const selected = options.find((o) => o.value === value);

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
          {selected ? selected.label : placeholder}
          <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-card shadow-xl max-h-64 overflow-hidden">
            <div className="p-2 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-52">
              {filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between",
                    value === option.value
                      ? "text-brand-orange bg-brand-orange/5"
                      : "text-zinc-300"
                  )}
                >
                  <div>
                    <div>{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-zinc-500">{option.description}</div>
                    )}
                  </div>
                  {value === option.value && <Check className="w-4 h-4" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-xs text-zinc-500 text-center">No results found</p>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  );
}
