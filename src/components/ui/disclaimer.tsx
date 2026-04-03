"use client";

import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisclaimerProps {
  text: string;
  variant?: "warning" | "info";
  className?: string;
}

export function Disclaimer({ text, variant = "info", className }: DisclaimerProps) {
  return (
    <div
      className={cn(
        "flex gap-2.5 p-3 rounded-lg text-xs leading-relaxed",
        variant === "warning"
          ? "bg-yellow-900/20 border border-yellow-700/30 text-yellow-200"
          : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-400",
        className
      )}
    >
      {variant === "warning" ? (
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
      ) : (
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-zinc-500" />
      )}
      <span>{text}</span>
    </div>
  );
}
