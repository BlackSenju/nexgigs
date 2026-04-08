"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, X, Zap, ArrowUpRight } from "lucide-react";
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
  const [rewriting, setRewriting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rewrittenTitle, setRewrittenTitle] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ remaining: number; limit: number; feature: string } | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  async function handleGetSuggestions() {
    if (!title && !description) {
      setSuggestions(["Please enter a job title and description first."]);
      setShow(true);
      return;
    }
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
          title: title || "",
          description: description || "",
          category: category || "",
          price: price || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgrade) {
          setNeedsUpgrade(true);
          setSuggestions([data.error]);
          setUsageInfo({ remaining: 0, limit: data.limit ?? 0, feature: "tips" });
        } else {
          setSuggestions([`AI service returned an error (${res.status}). Your post can still be submitted.`]);
        }
        setShow(true);
        setLoading(false);
        return;
      }

      if (data.error) {
        setSuggestions([data.error]);
      } else if (data.blocked) {
        setBlocked(true);
        setBlockReason(data.reason || "Content not allowed");
      } else {
        setSuggestions(data.suggestions || ["Your listing looks good!"]);
        setImprovedDesc(data.improvedDescription || null);
        setWarnings(data.warnings || []);
        setNeedsUpgrade(false);
        // Update usage info: decrement remaining after successful call
        setUsageInfo((prev) =>
          prev && prev.feature === "tips"
            ? { ...prev, remaining: Math.max(0, prev.remaining - 1) }
            : { remaining: 0, limit: 0, feature: "tips" }
        );
      }
      setShow(true);
    } catch {
      setSuggestions(["AI assistant is temporarily unavailable. Your post will still be reviewed."]);
      setShow(true);
    }
    setLoading(false);
  }

  async function handleRewrite() {
    if (!title && !description) return;
    setRewriting(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "rewrite", title, description, category, price }),
      });
      const data = await res.json();
      if (!res.ok && data.upgrade) {
        setNeedsUpgrade(true);
        setSuggestions([data.error]);
        setUsageInfo({ remaining: 0, limit: data.limit ?? 0, feature: "rewrite" });
        setShow(true);
      } else if (data.rewrittenDescription && onApplySuggestion) {
        setRewrittenTitle(data.rewrittenTitle || null);
        setImprovedDesc(data.rewrittenDescription);
        setNeedsUpgrade(false);
        setUsageInfo((prev) =>
          prev && prev.feature === "rewrite"
            ? { ...prev, remaining: Math.max(0, prev.remaining - 1) }
            : { remaining: 0, limit: 0, feature: "rewrite" }
        );
        setShow(true);
      } else if (data.error) {
        setSuggestions([data.error]);
        setShow(true);
      }
    } catch {
      setSuggestions(["Rewrite service unavailable. Try again later."]);
      setShow(true);
    }
    setRewriting(false);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleGetSuggestions}
          disabled={loading || rewriting || (!title && !description)}
          className="text-brand-orange hover:text-orange-400"
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1" /> Tips</>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRewrite}
          disabled={loading || rewriting || (!title && !description)}
          className="text-brand-orange hover:text-orange-400"
        >
          {rewriting ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Rewriting...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1" /> Make it Professional</>
          )}
        </Button>
        {usageInfo && usageInfo.limit < 999 && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-500 ml-auto">
            <Zap className="w-3 h-3" />
            {usageInfo.remaining}/{usageInfo.limit} {usageInfo.feature} today
          </span>
        )}
      </div>

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

          {needsUpgrade && (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-orange-900/20 border border-orange-700/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-orange flex-shrink-0" />
                <span className="text-xs font-medium text-orange-200">Daily limit reached</span>
              </div>
              <p className="text-xs text-zinc-400">
                Upgrade your plan to unlock more AI-powered suggestions and rewrites.
              </p>
              <a
                href="/settings?tab=billing"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange hover:text-orange-300 transition-colors"
              >
                Upgrade plan <ArrowUpRight className="w-3 h-3" />
              </a>
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
