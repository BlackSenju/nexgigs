"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Briefcase,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Clock,
  Loader2,
  Lock,
  CheckCircle,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type TimePeriod = "7d" | "30d" | "all";

interface Job {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  applications_count: number;
  views_count: number;
}

interface Application {
  id: string;
  job_id: string;
  gigger_id: string;
  bid_amount: number;
  status: string;
  created_at: string;
}

interface HiredJob {
  id: string;
  job_id: string;
  gigger_id: string;
  agreed_price: number;
  status: string;
  created_at: string;
}

function getDateThreshold(period: TimePeriod): Date | null {
  if (period === "all") return null;
  const now = new Date();
  const days = period === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function filterByDate<T extends { created_at: string }>(
  items: readonly T[],
  threshold: Date | null
): readonly T[] {
  if (!threshold) return items;
  return items.filter((item) => new Date(item.created_at) >= threshold);
}

function getWeekLabel(date: Date): string {
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getLast8Weeks(): readonly { start: Date; label: string }[] {
  const weeks: { start: Date; label: string }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    weeks.push({ start: new Date(d), label: getWeekLabel(d) });
  }
  return weeks;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  hired: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

function StatusBadge({ status }: { readonly status: string }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize",
        STATUS_COLORS[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
      )}
    >
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-zinc-800">
      <Icon className="w-5 h-5 text-brand-orange" />
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function UpgradePrompt() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-zinc-500" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">
          Business Analytics
        </h1>
        <p className="text-sm text-zinc-400 mb-6 max-w-md">
          Unlock hiring metrics, job performance tracking, and application
          trends with a Business Growth or Enterprise subscription.
        </p>
        <Link href="/subscription?tab=business">
          <Button variant="primary">
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade to Business Growth
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function BusinessAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [jobs, setJobs] = useState<readonly Job[]>([]);
  const [applications, setApplications] = useState<readonly Application[]>([]);
  const [hiredJobs, setHiredJobs] = useState<readonly HiredJob[]>([]);
  const [period, setPeriod] = useState<TimePeriod>("all");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Check subscription tier
    const { data: subs } = await supabase
      .from("nexgigs_subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    const allowedTiers = ["business_growth", "enterprise"];
    const currentTier = subs?.[0]?.tier ?? "free";

    if (!allowedTiers.includes(currentTier)) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    // Fetch user's jobs
    const { data: jobsData } = await supabase
      .from("nexgigs_jobs")
      .select("id, title, category, status, created_at, applications_count, views_count")
      .eq("poster_id", user.id)
      .order("created_at", { ascending: false });

    const fetchedJobs: readonly Job[] = jobsData ?? [];
    setJobs(fetchedJobs);

    if (fetchedJobs.length === 0) {
      setLoading(false);
      return;
    }

    const jobIds = fetchedJobs.map((j) => j.id);

    // Fetch applications and hired jobs in parallel
    const [appsResult, hiredResult] = await Promise.all([
      supabase
        .from("nexgigs_applications")
        .select("id, job_id, gigger_id, bid_amount, status, created_at")
        .in("job_id", jobIds),
      supabase
        .from("nexgigs_hired_jobs")
        .select("id, job_id, gigger_id, agreed_price, status, created_at")
        .in("job_id", jobIds),
    ]);

    setApplications(appsResult.data ?? []);
    setHiredJobs(hiredResult.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered data based on time period
  const dateThreshold = useMemo(() => getDateThreshold(period), [period]);

  const filteredJobs = useMemo(
    () => filterByDate(jobs, dateThreshold),
    [jobs, dateThreshold]
  );
  const filteredApplications = useMemo(
    () => filterByDate(applications, dateThreshold),
    [applications, dateThreshold]
  );
  const filteredHiredJobs = useMemo(
    () => filterByDate(hiredJobs, dateThreshold),
    [hiredJobs, dateThreshold]
  );

  // Stats
  const totalJobsPosted = filteredJobs.length;

  const totalApplications = filteredJobs.reduce(
    (sum, j) => sum + (j.applications_count ?? 0),
    0
  );

  const acceptedApplications = filteredApplications.filter(
    (a) => a.status === "accepted"
  ).length;
  const totalAppsForRate = filteredApplications.length;
  const hireRate =
    totalAppsForRate > 0
      ? Math.round((acceptedApplications / totalAppsForRate) * 100)
      : 0;

  const totalSpent = filteredHiredJobs
    .filter((h) => h.status === "completed")
    .reduce((sum, h) => sum + (h.agreed_price ?? 0), 0);

  // Categories chart data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of filteredJobs) {
      const cat = job.category || "Uncategorized";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = entries.length > 0 ? entries[0][1] : 0;
    return { entries, maxCount };
  }, [filteredJobs]);

  // Application trends (last 8 weeks)
  const weeklyTrends = useMemo(() => {
    const weeks = getLast8Weeks();
    const weekCounts: Record<string, number> = {};
    for (const week of weeks) {
      weekCounts[week.start.toISOString().split("T")[0]] = 0;
    }
    for (const app of applications) {
      const weekKey = getWeekStart(new Date(app.created_at));
      if (weekKey in weekCounts) {
        weekCounts[weekKey] = (weekCounts[weekKey] ?? 0) + 1;
      }
    }
    const data = weeks.map((w) => ({
      label: w.label,
      count: weekCounts[w.start.toISOString().split("T")[0]] ?? 0,
    }));
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    return { data, maxCount };
  }, [applications]);

  // Hired job IDs set for quick lookup
  const hiredJobIds = useMemo(
    () => new Set(hiredJobs.map((h) => h.job_id)),
    [hiredJobs]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return <UpgradePrompt />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />

      <div className="flex items-center justify-between mt-2 mb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-orange" />
            Business Analytics
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Track your hiring performance and job metrics.
          </p>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "7d", label: "Last 7 Days" },
            { key: "30d", label: "Last 30 Days" },
            { key: "all", label: "All Time" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriod(opt.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              period === opt.key
                ? "bg-brand-orange text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Briefcase}
          label="Total Jobs Posted"
          value={String(totalJobsPosted)}
        />
        <StatCard
          icon={Users}
          label="Applications Received"
          value={String(totalApplications)}
        />
        <StatCard
          icon={TrendingUp}
          label="Hire Rate"
          value={`${hireRate}%`}
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
        />
      </div>

      {/* Jobs Performance Table */}
      <div className="rounded-xl border border-zinc-800 bg-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-orange" />
            Jobs Performance
          </h2>
        </div>
        {filteredJobs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            No jobs found for this time period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                  <th className="px-4 py-2 text-left font-medium">Title</th>
                  <th className="px-4 py-2 text-left font-medium">Posted</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-center font-medium">
                    <Eye className="w-3.5 h-3.5 inline" />
                  </th>
                  <th className="px-4 py-2 text-center font-medium">
                    <Users className="w-3.5 h-3.5 inline" />
                  </th>
                  <th className="px-4 py-2 text-center font-medium">Hired</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-white font-medium max-w-[200px] truncate">
                      {job.title}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 text-xs whitespace-nowrap">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-2.5 text-center text-zinc-300">
                      {job.views_count ?? 0}
                    </td>
                    <td className="px-4 py-2.5 text-center text-zinc-300">
                      {job.applications_count ?? 0}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {hiredJobIds.has(job.id) ? (
                        <CheckCircle className="w-4 h-4 text-green-400 inline" />
                      ) : (
                        <span className="text-zinc-600">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Categories Chart */}
      <div className="rounded-xl border border-zinc-800 bg-card p-4 mb-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-brand-orange" />
          Top Categories
        </h2>
        {categoryData.entries.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">
            No category data available.
          </p>
        ) : (
          <div className="space-y-2.5">
            {categoryData.entries.map(([category, count]) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-28 truncate text-right flex-shrink-0">
                  {category}
                </span>
                <div className="flex-1 h-6 bg-zinc-800 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-brand-orange/80 rounded-md transition-all duration-500"
                    style={{
                      width: `${(count / categoryData.maxCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-white w-8 text-right flex-shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Trends */}
      <div className="rounded-xl border border-zinc-800 bg-card p-4 mb-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-orange" />
          Application Trends (Last 8 Weeks)
        </h2>
        <div className="flex items-end gap-2 h-32">
          {weeklyTrends.data.map((week) => (
            <div
              key={week.label}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <span className="text-[10px] text-zinc-400 mb-1 font-medium">
                {week.count > 0 ? week.count : ""}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-500",
                  week.count > 0 ? "bg-brand-orange/70" : "bg-zinc-800"
                )}
                style={{
                  height: `${Math.max(
                    (week.count / weeklyTrends.maxCount) * 100,
                    4
                  )}%`,
                }}
              />
              <span className="text-[9px] text-zinc-500 mt-1.5 whitespace-nowrap">
                {week.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
