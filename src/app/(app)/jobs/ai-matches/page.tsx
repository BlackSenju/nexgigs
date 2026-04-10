"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Briefcase,
  MapPin,
  DollarSign,
  Zap,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getAIJobMatches } from "@/lib/actions/job-matching";

interface JobMatch {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number | null;
  hourly_rate: number | null;
  city: string | null;
  state: string | null;
  created_at: string;
  applications_count: number | null;
  poster: { first_name: string; last_initial: string } | null;
  matchScore: number;
}

interface MatchReason {
  jobId: string;
  reason: string;
}

export default function AIMatchesPage() {
  const [isElite, setIsElite] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [reasons, setReasons] = useState<MatchReason[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState("");

  // Check subscription tier
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setIsElite(false);
        setInitialLoad(false);
        return;
      }
      supabase
        .from("nexgigs_subscriptions")
        .select("tier")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        .then(({ data: sub }) => {
          setIsElite(sub?.tier === "elite");
          setInitialLoad(false);
        });
    });
  }, []);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAIJobMatches();
      if (result.error) {
        setError(result.error);
        if (result.usage) setUsage(result.usage);
      } else {
        setMatches(result.matches ?? []);
        setReasons(result.reasons ?? []);
        setSkills(result.skillsUsed ?? []);
        setMessage(result.message ?? "");
        if (result.usage) setUsage(result.usage);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get max score for percentage bar calculation
  const maxScore = matches.length > 0
    ? Math.max(...matches.map((m) => m.matchScore), 1)
    : 1;

  const getReasonForJob = (jobId: string): string | null => {
    const found = reasons.find((r) => r.jobId === jobId);
    return found?.reason ?? null;
  };

  // Loading state
  if (initialLoad) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
      </div>
    );
  }

  // Not elite - upgrade prompt
  if (!isElite) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <BackButton fallbackHref="/jobs" />
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-orange/10 mb-4">
            <Lock className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">
            AI Job Matching
          </h1>
          <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
            Get personalized job recommendations based on your skills, location,
            and history. Available exclusively for Elite subscribers.
          </p>
          <Link href="/subscription">
            <Button variant="primary" className="px-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Elite - $14.99/mo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/jobs" />

      {/* Header */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-orange" />
            AI Job Matches
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Personalized picks based on your skills and location
          </p>
        </div>
        {usage && (
          <div className="text-right">
            <div className="text-xs text-zinc-500">Daily uses</div>
            <div className="text-sm font-bold text-brand-orange">
              {usage.limit - usage.remaining}/{usage.limit}
            </div>
          </div>
        )}
      </div>

      {/* Skills section */}
      {skills.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Your Skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Refresh button */}
      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={fetchMatches}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Finding matches...
            </>
          ) : matches.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Get New Matches
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Find My Matches
            </>
          )}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-900/20 border border-red-800/50 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Message */}
      {message && !error && (
        <div className="mt-4 p-3 rounded-xl bg-brand-orange/5 border border-brand-orange/20 text-center">
          <p className="text-sm text-brand-orange">{message}</p>
        </div>
      )}

      {/* Matches list */}
      {matches.length > 0 && (
        <div className="mt-4 space-y-3">
          {matches.map((job, index) => {
            const reason = getReasonForJob(job.id);
            const scorePercent = Math.round((job.matchScore / maxScore) * 100);

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div
                  className={cn(
                    "p-4 rounded-xl border bg-card hover:border-brand-orange/50 transition-colors cursor-pointer",
                    index < 3
                      ? "border-brand-orange/30"
                      : "border-zinc-800"
                  )}
                >
                  {/* Top row: title + score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {job.category}
                        </span>
                        {job.poster && (
                          <span>
                            by {job.poster.first_name} {job.poster.last_initial}.
                          </span>
                        )}
                      </div>
                    </div>
                    {index < 3 && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                        Top {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                    {(job.price || job.hourly_rate) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {job.price
                          ? `$${job.price}`
                          : `$${job.hourly_rate}/hr`}
                      </span>
                    )}
                    {job.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.city}, {job.state}
                      </span>
                    )}
                    {job.applications_count !== null && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {job.applications_count} applicant
                        {job.applications_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Match score bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-500">Match quality</span>
                      <span className="text-brand-orange font-bold">
                        {scorePercent}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          scorePercent >= 70
                            ? "bg-green-500"
                            : scorePercent >= 40
                              ? "bg-brand-orange"
                              : "bg-zinc-500"
                        )}
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* AI reason for top 3 */}
                  {reason && (
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] text-brand-orange/80">
                      <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state (after fetch, no matches) */}
      {!loading && matches.length === 0 && !error && !message && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 mb-3">
            <Sparkles className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            No matching jobs right now. Add more skills in{" "}
            <Link href="/settings" className="text-brand-orange hover:underline">
              Settings
            </Link>{" "}
            to improve your matches.
          </p>
        </div>
      )}
    </div>
  );
}
