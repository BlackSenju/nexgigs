"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Clock, CheckCircle, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const TABS = ["Active", "Applied", "Completed", "Posted"];

export default function MyGigsPage() {
  const [tab, setTab] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    active: Array<Record<string, unknown>>;
    applied: Array<Record<string, unknown>>;
    completed: Array<Record<string, unknown>>;
    posted: Array<Record<string, unknown>>;
  }>({ active: [], applied: [], completed: [], posted: [] });

  useEffect(() => {
    async function fetchGigs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [active, applied, completed, posted] = await Promise.all([
        supabase.from("nexgigs_hired_jobs").select(`*, job:nexgigs_jobs(*), poster:nexgigs_profiles!poster_id(first_name, last_initial)`)
          .eq("gigger_id", user.id).eq("status", "active"),
        supabase.from("nexgigs_applications").select(`*, job:nexgigs_jobs(*)`)
          .eq("gigger_id", user.id).eq("status", "pending"),
        supabase.from("nexgigs_hired_jobs").select(`*, job:nexgigs_jobs(*), poster:nexgigs_profiles!poster_id(first_name, last_initial)`)
          .eq("gigger_id", user.id).eq("status", "completed"),
        supabase.from("nexgigs_jobs").select("*")
          .eq("poster_id", user.id).order("created_at", { ascending: false }),
      ]);

      setData({
        active: active.data ?? [],
        applied: applied.data ?? [],
        completed: completed.data ?? [],
        posted: posted.data ?? [],
      });
      setLoading(false);
    }
    fetchGigs();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />
      <h1 className="text-xl font-black text-white mb-4">My Gigs</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-card rounded-xl p-1 border border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-colors",
              tab === t ? "bg-brand-orange text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            {t}
            {t === "Applied" && data.applied.length > 0 && (
              <span className="ml-1 text-xs">({data.applied.length})</span>
            )}
            {t === "Posted" && data.posted.length > 0 && (
              <span className="ml-1 text-xs">({data.posted.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Active */}
      {tab === "Active" && (
        <div className="space-y-3">
          {data.active.map((gig) => {
            const job = gig.job as Record<string, unknown>;
            const poster = gig.poster as Record<string, unknown>;
            return (
              <div key={gig.id as string} className="p-4 rounded-xl bg-card border border-zinc-800">
                <span className="text-xs text-green-400 font-medium">In Progress</span>
                <h3 className="mt-1 text-base font-bold text-white">{job?.title as string}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {job?.city as string}
                  </span>
                  <span className="font-bold text-white">${gig.agreed_price as number}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1">Track Progress</Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Message {poster?.first_name as string}
                  </Button>
                </div>
              </div>
            );
          })}
          {data.active.length === 0 && <EmptyState text="No active gigs. Browse jobs to find work." />}
        </div>
      )}

      {/* Applied */}
      {tab === "Applied" && (
        <div className="space-y-3">
          {data.applied.map((app) => {
            const job = app.job as Record<string, unknown>;
            return (
              <div key={app.id as string} className="p-4 rounded-xl bg-card border border-zinc-800">
                <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending
                </span>
                <h3 className="mt-1 text-base font-bold text-white">{job?.title as string}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{job?.city as string}</span>
                  {Number(app.bid_amount) > 0 && (
                    <span className="text-zinc-300">Your bid: <span className="font-bold text-white">${Number(app.bid_amount)}</span></span>
                  )}
                </div>
              </div>
            );
          })}
          {data.applied.length === 0 && <EmptyState text="No pending applications." />}
        </div>
      )}

      {/* Completed */}
      {tab === "Completed" && (
        <div className="space-y-3">
          {data.completed.map((gig) => {
            const job = gig.job as Record<string, unknown>;
            return (
              <div key={gig.id as string} className="p-4 rounded-xl bg-card border border-zinc-800">
                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Completed
                </span>
                <h3 className="mt-1 text-base font-bold text-white">{job?.title as string}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{job?.city as string}</span>
                  <span className="text-green-400 font-bold">+${gig.agreed_price as number}</span>
                </div>
              </div>
            );
          })}
          {data.completed.length === 0 && <EmptyState text="No completed gigs yet." />}
        </div>
      )}

      {/* Posted */}
      {tab === "Posted" && (
        <div className="space-y-3">
          {data.posted.map((job) => (
            <Link key={job.id as string} href={`/jobs/${job.id}`}>
              <div className="p-4 rounded-xl bg-card border border-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-orange font-medium">{job.status as string}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(job.created_at as string).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-white">{job.title as string}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{job.applications_count as number ?? 0} applicants</span>
                  <span className="font-bold text-white">
                    {job.price ? `$${job.price}` : job.hourly_rate ? `$${job.hourly_rate}/hr` : "Open"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          <Link href="/jobs/post">
            <Button variant="outline" className="w-full mt-2">Post a New Job</Button>
          </Link>
          {data.posted.length === 0 && <EmptyState text="You haven't posted any jobs yet." />}
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
        <Button variant="outline" size="sm" className="mt-4">Browse Jobs</Button>
      </Link>
    </div>
  );
}
