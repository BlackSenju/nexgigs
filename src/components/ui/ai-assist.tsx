"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIAssistProps {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  onApplySuggestion?: (text: string) => void;
  className?: string;
}

export function AIJobAssist({
  title,
  description,
  category,
  price,
  onApplySuggestion,
  className,
}: AIAssistProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [improvedDesc, setImprovedDesc] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [show, setShow] = useState(false);

  async function handleGetSuggestions() {
    if (!title && !description) return;
    setLoading(true);
    setSuggestions([]);
    setImprovedDesc(null);
    setWarnings([]);
    setBlocked(false);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "job_description",
          title,
          description,
          category,
          price,
        }),
      });
      const data = await res.json();

      if (data.blocked) {
        setBlocked(true);
        setBlockReason(data.reason || "Content not allowed");
      } else {
        setSuggestions(data.suggestions || []);
        setImprovedDesc(data.improvedDescription || null);
        setWarnings(data.warnings || []);
      }
      setShow(true);
    } catch {
      setSuggestions(["AI assistant is temporarily unavailable. Your post will still be reviewed."]);
      setShow(true);
    }
    setLoading(false);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleGetSuggestions}
        disabled={loading || (!title && !description)}
        className="text-brand-orange hover:text-orange-400"
      >
        {loading ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing...</>
        ) : (
          <><Sparkles className="w-3.5 h-3.5 mr-1" /> AI Suggestions</>
        )}
      </Button>

      {show && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 space-y-2 relative">
          <button
            onClick={() => setShow(false)}
            className="absolute top-2 right-2 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-medium text-brand-orange">
            <Sparkles className="w-3.5 h-3.5" /> AI Assistant
          </div>

          {blocked && (
            <div className="flex gap-2 p-2 rounded-lg bg-brand-red/10 border border-brand-red/30">
              <AlertTriangle className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">{blockReason}</div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="flex gap-2 p-2 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-200 space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <div key={i} className="flex gap-2 text-xs text-zinc-300">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {improvedDesc && onApplySuggestion && (
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-400 mb-1">Suggested description:</p>
              <p className="text-xs text-zinc-200 bg-zinc-800 rounded-lg p-2 leading-relaxed">
                {improvedDesc}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 w-full text-xs"
                onClick={() => {
                  onApplySuggestion(improvedDesc);
                  setShow(false);
                }}
              >
                Apply Suggested Description
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Inline content checker — shows warnings in real-time as user types.
 */
interface ContentCheckerProps {
  content: string;
  className?: string;
}

export function ContentChecker({ content, className }: ContentCheckerProps) {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState("");

  // Only check when content changes significantly (debounced check)
  if (content.length > 10 && content !== checked && content.length % 20 === 0) {
    // Use the rule-based moderation (instant, no API call)
    import("@/lib/moderation").then(({ moderateContent }) => {
      const result = moderateContent(content);
      setWarnings(result.warnings);
      setBlocked(result.blocked);
      setChecked(content);
    });
  }

  if (warnings.length === 0 && !blocked) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {blocked && (
        <div className="flex items-center gap-1.5 text-xs text-brand-red">
          <AlertTriangle className="w-3 h-3" />
          <span>This content contains prohibited language and cannot be posted.</span>
        </div>
      )}
      {warnings.map((w, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-yellow-400">
          <AlertTriangle className="w-3 h-3" />
          <span>{w}</span>
        </div>
      ))}
    </div>
  );
}
