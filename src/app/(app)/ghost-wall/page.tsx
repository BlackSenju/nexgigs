"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ghost, Flag, Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/client";

interface GhostEntry {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly ghost_count: number;
  readonly last_ghost: string;
  readonly types: readonly string[];
}

export default function GhostWallPage() {
  const [ghosts, setGhosts] = useState<readonly GhostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGhosts() {
      try {
        const supabase = createClient();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data, error: queryError } = await supabase
          .from("nexgigs_ghost_reports")
          .select(`
            id, ghost_type, created_at,
            reported:nexgigs_profiles!reported_id(id, first_name, last_initial, city)
          `)
          .gte("created_at", ninetyDaysAgo.toISOString())
          .order("created_at", { ascending: false });

        if (queryError) {
          setError("Failed to load ghost reports.");
          setLoading(false);
          return;
        }

        // Group reports by reported user
        const reportsByUser = new Map<
          string,
          {
            name: string;
            city: string;
            types: string[];
            lastGhost: string;
          }
        >();

        for (const report of data ?? []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const reported = report.reported as any;
          if (!reported?.id) continue;

          const userId = reported.id as string;
          const existing = reportsByUser.get(userId);

          if (existing) {
            reportsByUser.set(userId, {
              ...existing,
              types: [...existing.types, report.ghost_type],
              lastGhost:
                report.created_at > existing.lastGhost
                  ? report.created_at
                  : existing.lastGhost,
            });
          } else {
            reportsByUser.set(userId, {
              name: `${reported.first_name} ${reported.last_initial}.`,
              city: reported.city ?? "Unknown",
              types: [report.ghost_type],
              lastGhost: report.created_at,
            });
          }
        }

        // Filter to 3+ reports and build entries
        const entries: GhostEntry[] = Array.from(reportsByUser.entries())
          .filter(([, info]) => info.types.length >= 3)
          .map(([userId, info]) => ({
            id: userId,
            name: info.name,
            city: info.city,
            ghost_count: info.types.length,
            last_ghost: info.lastGhost,
            types: info.types,
          }));

        // Sort by ghost count descending
        const sorted = [...entries].sort(
          (a, b) => b.ghost_count - a.ghost_count
        );

        setGhosts(sorted);
      } catch {
        setError("Something went wrong loading ghost reports.");
      } finally {
        setLoading(false);
      }
    }

    fetchGhosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Ghost className="w-6 h-6 text-brand-red" />
        <h1 className="text-xl font-black text-white">Ghost Wall of Shame</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Users with 3+ ghost reports in the last 90 days appear here.
        Don&apos;t ghost — it hurts the community.
      </p>

      {/* Warning banner */}
      <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
        <div className="text-sm text-zinc-300">
          <strong className="text-brand-red">How it works:</strong> If a user
          no-shows, abandons a job, or stops responding, anyone involved can
          report them. 3 reports in 90 days = automatic Ghost Wall listing.
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-card border border-brand-red/20 text-center">
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && ghosts.length === 0 && (
        <div className="p-6 rounded-xl bg-card border border-zinc-800 text-center">
          <Ghost className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">
            No ghosts on the wall — the community is strong!
          </p>
        </div>
      )}

      {/* Ghost list */}
      {!loading && !error && ghosts.length > 0 && (
        <div className="space-y-3">
          {ghosts.map((ghost) => (
            <div
              key={ghost.id}
              className="p-4 rounded-xl bg-card border border-brand-red/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center">
                  <Ghost className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{ghost.name}</span>
                    <span className="text-xs text-brand-red font-bold">
                      {ghost.ghost_count} reports
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {ghost.city} &middot; Last report:{" "}
                    {new Date(ghost.last_ghost).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {ghost.types.map((type, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report CTA */}
      <div className="mt-8 p-4 rounded-xl bg-card border border-zinc-800 text-center">
        <Flag className="w-6 h-6 text-zinc-500 mx-auto" />
        <p className="mt-2 text-sm text-zinc-400">
          Been ghosted? Report it from your job details page after the incident.
        </p>
      </div>
    </div>
  );
}
