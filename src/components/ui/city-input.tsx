"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";

interface CityInputProps {
  value: string;
  onChange: (city: string) => void;
  onSelect?: (result: {
    city: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  state?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  id?: string;
}

interface Suggestion {
  place_name: string;
  text: string;
  context: Array<{ id: string; text: string; short_code?: string }>;
  center: [number, number];
}

export function CityInput({
  value,
  onChange,
  onSelect,
  state,
  label,
  error,
  placeholder = "Start typing a city...",
  id,
}: CityInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!token || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const stateFilter = state ? `,${state}` : "";
        const encoded = encodeURIComponent(`${query}${stateFilter}`);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=US&types=place&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    },
    [token, state]
  );

  function handleChange(val: string) {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  function handleSelect(suggestion: Suggestion) {
    const cityName = suggestion.text;
    onChange(cityName);
    setOpen(false);
    setSuggestions([]);

    if (onSelect) {
      let stateCode: string | undefined;
      let zipCode: string | undefined;

      for (const ctx of suggestion.context ?? []) {
        if (ctx.id.startsWith("region.")) {
          stateCode = ctx.short_code?.replace("US-", "");
        }
        if (ctx.id.startsWith("postcode.")) {
          zipCode = ctx.text;
        }
      }

      onSelect({
        city: cityName,
        state: stateCode,
        zipCode,
        latitude: suggestion.center[1],
        longitude: suggestion.center[0],
      });
    }
  }

  return (
    <div className="space-y-1" ref={ref}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full pl-10 pr-8 rounded-lg border bg-card py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/50",
            error ? "border-brand-red" : "border-zinc-700 focus:border-brand-orange"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
        )}

        {open && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-card shadow-xl max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
                <span className="text-zinc-300">{s.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  );
}
