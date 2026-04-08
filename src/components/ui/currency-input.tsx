"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  error,
  placeholder = "0.00",
  min = 10,
  max = 10000,
  id,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  function handleChange(raw: string) {
    // Only allow numbers and one decimal
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChange(cleaned);
  }

  const numValue = Number(value);
  const belowMin = value && numValue < min && numValue > 0;
  const aboveMax = value && numValue > max;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
          <DollarSign className={cn("w-4 h-4", focused ? "text-brand-orange" : "text-zinc-500")} />
        </div>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-9 pr-4 rounded-lg border bg-card py-2.5 text-lg font-bold text-white placeholder:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/50",
            error || belowMin || aboveMax
              ? "border-brand-red"
              : "border-zinc-700 focus:border-brand-orange"
          )}
        />
      </div>
      {belowMin && (
        <p className="text-xs text-brand-red">Minimum bid is ${min}</p>
      )}
      {aboveMax && (
        <p className="text-xs text-brand-red">Maximum bid is ${max.toLocaleString()}</p>
      )}
      {error && <p className="text-xs text-brand-red">{error}</p>}
      {!error && !belowMin && !aboveMax && value && (
        <p className="text-xs text-zinc-500">
          You will receive ~${(numValue * 0.97).toFixed(2)} after 3% platform fee
        </p>
      )}
    </div>
  );
}
