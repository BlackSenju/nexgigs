"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { acceptApplication, rejectApplication } from "@/lib/actions/applications";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Users,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  DollarSign,
  Loader2,
} from "lucide-react";

type FilterStatus = "all" | "pending" | "accepted" | "rejected";

interface GiggerProfile {
  id: string;
  first_name: string;
  last_initial: string;
  city: string;
  state: string;
  avatar_url: string | null;
}

interface Application {
  id: string;
  job_id: string;
  gigger_id: string;
  status: string;
  bid_amount: number | null;
  created_at: string;
  gigger: GiggerProfile;
  job_title: string;
}

interface JobRow {
  id: string;
  title: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    accepted: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-semibold rounded-full border capitalize",
        styles[status] ?? "bg-zinc-700 text-zinc-400 border-zinc-600"
      )}
    >
      {status}
    </span>
  );
}

export default function ApplicantManagementPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get all jobs posted by this user
    const { data: jobs } = await supabase
      .from("nexgigs_jobs")
      .select("id, title")
      .eq("poster_id", user.id);

    if (!jobs || jobs.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const jobMap = new Map<string, string>(
      (jobs as JobRow[]).map((j) => [j.id, j.title])
    );
    const jobIds = jobs.map((j: JobRow) => j.id);

    // Get all applications for those jobs with gigger profile data
    const { data: apps } = await supabase
      .from("nexgigs_applications")
      .select(
        `
        id, job_id, gigger_id, status, bid_amount, created_at,
        gigger:nexgigs_profiles!gigger_id(
          id, first_name, last_initial, city, state, avatar_url
        )
      `
      )
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    const enriched: Application[] = (apps ?? []).map((app: Record<string, unknown>) => ({
      id: app.id as string,
      job_id: app.job_id as string,
      gigger_id: app.gigger_id as string,
      status: app.status as string,
      bid_amount: app.bid_amount as number | null,
      created_at: app.created_at as string,
      gigger: app.gigger as GiggerProfile,
      job_title: jobMap.get(app.job_id as string) ?? "Unknown Job",
    }));

    setApplications(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAccept(applicationId: string, jobId: string) {
    setActionLoading(applicationId);
    const result = await acceptApplication(applicationId, jobId);
    if (result.error) {
      alert(`Failed to accept: ${result.error}`);
      setActionLoading(null);
      return;
    }
    // Immutable update: accepted app becomes "accepted", other pending apps for same job become "rejected"
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) return { ...app, status: "accepted" };
        if (app.job_id === jobId && app.status === "pending")
          return { ...app, status: "rejected" };
        return app;
      })
    );
    setActionLoading(null);
  }

  async function handleReject(applicationId: string) {
    setActionLoading(applicationId);
    const result = await rejectApplication(applicationId);
    if (result.error) {
      alert(`Failed to reject: ${result.error}`);
      setActionLoading(null);
      return;
    }
    // Immutable update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status: "rejected" } : app
      )
    );
    setActionLoading(null);
  }

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const TABS: { label: string; value: FilterStatus; count: number }[] = [
    { label: "All", value: "all", count: stats.total },
    { label: "Pending", value: "pending", count: stats.pending },
    { label: "Accepted", value: "accepted", count: stats.accepted },
    { label: "Rejected", value: "rejected", count: stats.rejected },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4">
        <BackButton fallbackHref="/dashboard" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
          <span className="ml-2 text-zinc-400">Loading applicants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />

      {/* Header */}
      <h1 className="text-2xl font-black text-white">Applicant Management</h1>
      <p className="text-sm text-zinc-400 mt-1">
        Review and manage applications across all your posted jobs.
      </p>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <Users className="w-5 h-5 text-brand-orange" />
          <div className="mt-2 text-2xl font-black text-white">
            {stats.total}
          </div>
          <div className="text-xs text-zinc-400">Total Applications</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <Clock className="w-5 h-5 text-yellow-400" />
          <div className="mt-2 text-2xl font-black text-white">
            {stats.pending}
          </div>
          <div className="text-xs text-zinc-400">Pending</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div className="mt-2 text-2xl font-black text-white">
            {stats.accepted}
          </div>
          <div className="text-xs text-zinc-400">Accepted</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="mt-2 text-2xl font-black text-white">
            {stats.rejected}
          </div>
          <div className="text-xs text-zinc-400">Rejected</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors",
              filter === tab.value
                ? "bg-brand-orange text-white"
                : "bg-card text-zinc-400 border border-zinc-800 hover:text-white"
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">
              {filter === "all"
                ? "No applications yet. Post a job to start receiving applications!"
                : `No ${filter} applications.`}
            </p>
          </div>
        )}

        {filtered.map((app) => (
          <div
            key={app.id}
            className="p-4 rounded-xl bg-card border border-zinc-800"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar
                src={app.gigger?.avatar_url}
                firstName={app.gigger?.first_name}
                lastInitial={app.gigger?.last_initial}
                size="lg"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold text-sm">
                    {app.gigger?.first_name} {app.gigger?.last_initial}.
                  </span>
                  <StatusBadge status={app.status} />
                </div>

                {/* Job they applied to */}
                <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                  <Briefcase className="w-3 h-3" />
                  <span className="truncate">{app.job_title}</span>
                </div>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {app.gigger?.city && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {app.gigger.city}, {app.gigger.state}
                      </span>
                    </div>
                  )}
                  {app.bid_amount != null && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <DollarSign className="w-3 h-3" />
                      <span>${Number(app.bid_amount).toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>{relativeTime(app.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {app.status === "pending" && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={actionLoading === app.id}
                    onClick={() => handleAccept(app.id, app.job_id)}
                  >
                    {actionLoading === app.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={actionLoading === app.id}
                    onClick={() => handleReject(app.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
