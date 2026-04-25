"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";

export type ImprovableFieldKind =
  | "tagline"
  | "about_html"
  | "package_description"
  | "faq_answer";

export interface AIImproveButtonProps {
  field: ImprovableFieldKind;
  current: string;
  context?: { business_name?: string; industry?: string };
  onAccept: (improved: string) => void;
  className?: string;
}

/**
 * Inline ✨ Improve button that appears next to a text field. Calls
 * /api/storefront/ai/improve, shows the AI's suggestion in a small
 * popover, and lets the seller accept or discard.
 */
export function AIImproveButton({
  field,
  current,
  context,
  onAccept,
  className,
}: AIImproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const empty = !current || current.trim().length === 0;

  async function run() {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/storefront/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, current, context }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const json = await res.json();
      setSuggestion(json.improved as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  }

  if (suggestion !== null) {
    return (
      <div
        className={
          "rounded-lg ring-1 ring-brand-orange/40 bg-brand-orange/5 p-3 space-y-2 " +
          (className ?? "")
        }
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-orange">
          <Sparkles className="w-3.5 h-3.5" />
          AI suggestion
        </div>
        <div className="text-sm text-zinc-200 whitespace-pre-wrap">{suggestion}</div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onAccept(suggestion);
              setSuggestion(null);
            }}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-brand-orange text-white hover:bg-brand-orange/90"
          >
            <Check className="w-3 h-3" />
            Use this
          </button>
          <button
            type="button"
            onClick={() => setSuggestion(null)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-zinc-400 hover:text-white"
          >
            <X className="w-3 h-3" />
            Discard
          </button>
          <button
            type="button"
            onClick={run}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-zinc-400 hover:text-white"
          >
            <Sparkles className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={run}
        disabled={loading || empty}
        title={empty ? "Type something first" : "Improve with AI"}
        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange hover:text-brand-orange/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Thinking…
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            Improve with AI
          </>
        )}
      </button>
      {error && (
        <div className="mt-1 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}
