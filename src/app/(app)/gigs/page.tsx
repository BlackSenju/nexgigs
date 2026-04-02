"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Clock, CheckCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TABS = ["Active", "Applied", "Completed", "Posted"];

const SAMPLE_GIGS = {
  Active: [
    {
      id: "h1",
      title: "WiFi setup + smart home install",
      poster: "David L.",
      price: 140,
      status: "In Progress",
      started_at: "2026-04-01",
      location: "Wauwatosa, Milwaukee",
    },
  ],
  Applied: [
    {
      id: "a1",
      title: "Logo design for new food truck",
      poster: "Marcus J.",
      bid: 180,
      status: "Pending",
      applied_at: "2026-03-30",
      location: "Third Ward, Milwaukee",
    },
    {
      id: "a2",
      title: "DJ needed for birthday party",
      poster: "Andre W.",
      bid: 275,
      status: "Pending",
      applied_at: "2026-03-29",
      location: "Walker's Point, Milwaukee",
    },
  ],
  Completed: [
    {
      id: "c1",
      title: "Lawn mowed + hedges trimmed",
      poster: "Sarah M.",
      earned: 75,
      completed_at: "2026-03-28",
      rating: 5,
      location: "Bay View, Milwaukee",
    },
  ],
  Posted: [
    {
      id: "p1",
      title: "Need help painting garage",
      applicants: 4,
      price: 200,
      status: "Open",
      posted_at: "2026-03-31",
      location: "Bay View, Milwaukee",
    },
  ],
};

export default function MyGigsPage() {
  const [tab, setTab] = useState("Active");

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-black text-white mb-4">My Gigs</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-card rounded-xl p-1 border border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-colors",
              tab === t
                ? "bg-brand-orange text-white"
                : "text-zinc-400 hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Active gigs */}
      {tab === "Active" && (
        <div className="space-y-3">
          {SAMPLE_GIGS.Active.map((gig) => (
            <div
              key={gig.id}
              className="p-4 rounded-xl bg-card border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-400 font-medium">
                  {gig.status}
                </span>
                <span className="text-xs text-zinc-500">
                  Started {gig.started_at}
                </span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white">
                {gig.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {gig.location}
                </span>
                <span className="font-bold text-white">${gig.price}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1">
                  Track Progress
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Message {gig.poster}
                </Button>
              </div>
            </div>
          ))}
          {SAMPLE_GIGS.Active.length === 0 && (
            <EmptyState text="No active gigs. Browse jobs to find work." />
          )}
        </div>
      )}

      {/* Applied */}
      {tab === "Applied" && (
        <div className="space-y-3">
          {SAMPLE_GIGS.Applied.map((gig) => (
            <div
              key={gig.id}
              className="p-4 rounded-xl bg-card border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {gig.status}
                </span>
                <span className="text-xs text-zinc-500">
                  Applied {gig.applied_at}
                </span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white">
                {gig.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">{gig.poster}</span>
                <span className="text-zinc-300">
                  Your bid: <span className="font-bold text-white">${gig.bid}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {tab === "Completed" && (
        <div className="space-y-3">
          {SAMPLE_GIGS.Completed.map((gig) => (
            <div
              key={gig.id}
              className="p-4 rounded-xl bg-card border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Completed
                </span>
                <span className="text-xs text-zinc-500">{gig.completed_at}</span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white">
                {gig.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">{gig.poster}</span>
                <span className="text-green-400 font-bold">+${gig.earned}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posted */}
      {tab === "Posted" && (
        <div className="space-y-3">
          {SAMPLE_GIGS.Posted.map((gig) => (
            <div
              key={gig.id}
              className="p-4 rounded-xl bg-card border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-orange font-medium">
                  {gig.status}
                </span>
                <span className="text-xs text-zinc-500">{gig.posted_at}</span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white">
                {gig.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  {gig.applicants} applicants
                </span>
                <span className="font-bold text-white">${gig.price}</span>
              </div>
              <Button size="sm" className="mt-3 w-full">
                Review Applicants
              </Button>
            </div>
          ))}
          <Link href="/jobs/post">
            <Button variant="outline" className="w-full mt-2">
              Post a New Job
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <Briefcase className="w-8 h-8 text-zinc-700 mx-auto" />
      <p className="mt-2 text-sm text-zinc-500">{text}</p>
      <Link href="/jobs">
        <Button variant="outline" size="sm" className="mt-4">
          Browse Jobs
        </Button>
      </Link>
    </div>
  );
}
