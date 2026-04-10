"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { JobCard, type JobCardData } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { MapPin, Search, Loader2, List, Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const JobMap = lazy(() =>
  import("@/components/jobs/job-map").then((mod) => ({ default: mod.JobMap }))
);

export default function JobFeedPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState("Milwaukee");
  const [userState, setUserState] = useState("WI");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("nexgigs_jobs")
      .select(`
        id, title, description, category, city, neighborhood,
        price, price_min, price_max, hourly_rate, duration_type,
        is_urgent, is_remote, applications_count, created_at,
        latitude, longitude,
        poster_id,
        poster:nexgigs_profiles!poster_id(first_name, last_initial)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);

    if (selectedCategory !== "All") {
      query = query.eq("category", selectedCategory);
    }
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    const { data } = await query;

    // Fetch subscription tiers for all poster IDs in one query
    const posterIds = Array.from(new Set((data ?? []).map((j: Record<string, unknown>) => j.poster_id as string).filter(Boolean)));
    const tierMap: Record<string, string> = {};
    if (posterIds.length > 0) {
      const { data: subs } = await supabase
        .from("nexgigs_subscriptions")
        .select("user_id, tier")
        .in("user_id", posterIds)
        .eq("status", "active");
      for (const sub of subs ?? []) {
        tierMap[sub.user_id] = sub.tier;
      }
    }

    const mapped: JobCardData[] = (data ?? []).map((job: Record<string, unknown>) => {
      const poster = job.poster as Record<string, string> | null;
      return {
        id: job.id as string,
        title: job.title as string,
        category: job.category as string,
        description: job.description as string,
        city: job.city as string,
        neighborhood: job.neighborhood as string | undefined,
        price: job.price as number | undefined,
        price_min: job.price_min as number | undefined,
        price_max: job.price_max as number | undefined,
        hourly_rate: job.hourly_rate as number | undefined,
        duration_type: job.duration_type as string,
        is_urgent: job.is_urgent as boolean | undefined,
        is_remote: job.is_remote as boolean | undefined,
        latitude: job.latitude as number | undefined,
        longitude: job.longitude as number | undefined,
        poster_name: poster
          ? `${poster.first_name} ${poster.last_initial}.`
          : "Anonymous",
        poster_tier: tierMap[job.poster_id as string] ?? "free",
        created_at: job.created_at as string,
        applications_count: (job.applications_count as number) ?? 0,
      };
    });

    // Priority search placement: Pro/Elite/Business jobs appear first
    const tierOrder: Record<string, number> = {
      elite: 0, enterprise: 0, business_growth: 0,
      pro: 1, business_starter: 1,
      free: 2,
    };
    const sortedJobs = [...mapped].sort((a, b) => {
      const aOrder = tierOrder[a.poster_tier ?? "free"] ?? 2;
      const bOrder = tierOrder[b.poster_tier ?? "free"] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return 0; // maintain existing date order within same tier
    });

    setJobs(sortedJobs);
    setLoading(false);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Load user's city from profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("nexgigs_profiles")
          .select("city, state")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUserCity(profile.city);
              setUserState(profile.state);
            }
          });
      }
    });
  }, []);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      {/* Location header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-semibold text-white">
            {userCity}, {userState}
          </span>
          <span className="text-xs text-zinc-500">10 mi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {loading ? "..." : `${jobs.length} gigs`}
          </span>
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 transition-colors",
                viewMode === "list" ? "bg-brand-orange text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "p-1.5 transition-colors",
                viewMode === "map" ? "bg-brand-orange text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search gigs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50"
        />
      </div>

      {/* Category filters */}
      <div className="mb-4">
        <JobFilters selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {/* Map view */}
      {viewMode === "map" && (
        <div className="mb-4 h-80 sm:h-96">
          <Suspense
            fallback={
              <div className="w-full h-full rounded-xl bg-card border border-zinc-800 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            }
          >
            <JobMap
              jobs={jobs}
              onJobClick={(id) => {
                window.location.href = `/jobs/${id}`;
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="py-20 flex flex-col items-center text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="mt-2 text-sm">Loading gigs...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}

          {jobs.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-500">
                {searchQuery || selectedCategory !== "All"
                  ? "No gigs found. Try a different filter."
                  : "No gigs posted yet. Be the first to post a job!"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
