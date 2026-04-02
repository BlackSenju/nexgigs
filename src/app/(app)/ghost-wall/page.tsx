"use client";

import { AlertTriangle, Ghost, Flag } from "lucide-react";

const SAMPLE_GHOSTS = [
  {
    id: "gw1",
    name: "Tyler B.",
    city: "Milwaukee",
    ghost_count: 4,
    last_ghost: "2026-03-25",
    types: ["No-show", "No-show", "Abandoned job", "No-show"],
  },
  {
    id: "gw2",
    name: "Jessica F.",
    city: "Milwaukee",
    ghost_count: 3,
    last_ghost: "2026-03-20",
    types: ["No-show", "Stopped responding", "No-show"],
  },
  {
    id: "gw3",
    name: "Brandon K.",
    city: "Milwaukee",
    ghost_count: 3,
    last_ghost: "2026-03-18",
    types: ["Abandoned job", "No-show", "Stopped responding"],
  },
];

export default function GhostWallPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
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

      {/* Ghost list */}
      <div className="space-y-3">
        {SAMPLE_GHOSTS.map((ghost) => (
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
