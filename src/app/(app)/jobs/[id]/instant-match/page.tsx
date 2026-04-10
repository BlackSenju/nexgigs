"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/distance";
import { findInstantMatches } from "@/lib/actions/instant-match";
import {
  Sparkles,
  Star,
  MapPin,
  Crown,
  Rocket,
  UserPlus,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

interface MatchResult {
  id: string;
  first_name: string;
  last_initial: string;
  avatar_url: string | null;
  city: string;
  state: string;
  bio: string | null;
  gigs_completed: number;
  average_rating: number;
  total_ratings: number;
  distance: number | null;
  matchScore: number;
  matchType: "best" | "rising_star" | "new_nearby";
  matchReason: string;
  skills: string[];
}

const MATCH_TYPE_CONFIG = {
  best: {
    label: "Top Pick",
    icon: Crown,
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    cardBorder: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  rising_star: {
    label: "Rising Star",
    icon: Rocket,
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    cardBorder: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  new_nearby: {
    label: "New & Near You",
    icon: UserPlus,
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cardBorder: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
};

export default function InstantMatchPage() {
  const { id } = useParams();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const result = await findInstantMatches(id as string);

    if (result.error) {
      setError(result.error);
      setMatches([]);
    } else {
      setMatches(result.matches);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-8 h-8 text-brand-orange" />
        </div>
        <h2 className="mt-6 text-lg font-bold text-white">
          Finding the best giggers for you...
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Matching skills, location, ratings &amp; availability
        </p>
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500 mx-auto mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <BackButton fallbackHref={`/jobs/${id}`} label="Back to job" />
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="mt-6 text-lg font-bold text-white">{error}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Try posting in a different category or check back later as more
          giggers join.
        </p>
        <Link href={`/jobs/${id}`}>
          <Button variant="outline" size="sm" className="mt-6">
            Back to Job
          </Button>
        </Link>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <BackButton fallbackHref={`/jobs/${id}`} label="Back to job" />
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="mt-6 text-lg font-bold text-white">
          No matching giggers found yet
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Try posting in a different category or check back later as more
          giggers join your area.
        </p>
        <Link href={`/jobs/${id}`}>
          <Button variant="outline" size="sm" className="mt-6">
            Back to Job
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <Link
        href={`/jobs/${id}`}
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to job
      </Link>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/30 mb-3">
          <Sparkles className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-medium text-brand-orange">
            AI Instant Match
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">
          Found Your Matches
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {matches.length} gigger{matches.length !== 1 ? "s" : ""} matched
          using skills, proximity &amp; fairness
        </p>
      </div>

      {/* Match Cards */}
      <div className="space-y-4">
        {matches.map((match) => {
          const config = MATCH_TYPE_CONFIG[match.matchType];
          const TypeIcon = config.icon;

          return (
            <div
              key={match.id}
              className={cn(
                "p-4 rounded-xl bg-card border transition-colors",
                config.cardBorder
              )}
            >
              {/* Match type badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    config.badgeClass
                  )}
                >
                  <TypeIcon className="w-3.5 h-3.5" />
                  {config.label}
                </div>
                <div className="text-xs text-zinc-500">
                  {match.matchScore}% match
                </div>
              </div>

              {/* Profile info */}
              <div className="flex items-start gap-3">
                <Avatar
                  src={match.avatar_url}
                  firstName={match.first_name}
                  lastInitial={match.last_initial}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">
                    {match.first_name} {match.last_initial}.
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.distance !== null
                        ? formatDistance(match.distance)
                        : `${match.city}, ${match.state}`}
                    </span>
                    {match.average_rating > 0 && (
                      <span className="flex items-center gap-0.5 text-brand-orange">
                        <Star className="w-3 h-3 fill-current" />
                        {match.average_rating.toFixed(1)}
                        {match.total_ratings > 0 && (
                          <span className="text-zinc-500">
                            ({match.total_ratings})
                          </span>
                        )}
                      </span>
                    )}
                    {match.gigs_completed > 0 && (
                      <span>
                        {match.gigs_completed} gig
                        {match.gigs_completed !== 1 ? "s" : ""} done
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {match.bio && (
                <p className="mt-2 text-xs text-zinc-400 line-clamp-2">
                  {match.bio}
                </p>
              )}

              {/* Skills */}
              {match.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {match.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                    >
                      {skill}
                    </span>
                  ))}
                  {match.skills.length > 5 && (
                    <span className="px-2 py-0.5 rounded-full text-xs text-zinc-500">
                      +{match.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Match reason */}
              <div className="mt-3 text-xs text-zinc-500">
                {match.matchReason}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Link href={`/profile/${match.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Profile
                  </Button>
                </Link>
                <Link
                  href={`/messages?to=${match.id}`}
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-brand-orange to-orange-600 hover:from-brand-orange/90 hover:to-orange-600/90"
                  >
                    Hire Now
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh */}
      <div className="mt-6 text-center space-y-3">
        <button
          onClick={loadMatches}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Not what you&apos;re looking for? Refresh matches
        </button>
        <div>
          <Link
            href={`/jobs/${id}`}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to job details
          </Link>
        </div>
      </div>
    </div>
  );
}
