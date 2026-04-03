"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Users,
  Briefcase,
  DollarSign,
  Ghost,
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  Trash2,
  Activity,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  getAdminStats,
  getAdminUsers,
  getAdminJobs,
  getAdminGhostReports,
  getAdminAuditLog,
  adminDeleteJob,
  adminSuspendUser,
  adminUnsuspendUser,
} from "@/lib/actions/admin";

const TABS = ["Overview", "Users", "Jobs", "Ghost Reports", "Audit Log"];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [ghostReports, setGhostReports] = useState<Array<Record<string, unknown>>>([]);
  const [auditLog, setAuditLog] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    async function load() {
      // Check admin access
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("nexgigs_profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) { setLoading(false); return; }
      setAuthorized(true);

      // Load all data in parallel
      const [statsData, usersData, jobsData, ghostData, auditData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminJobs(),
        getAdminGhostReports(),
        getAdminAuditLog(),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setJobs(jobsData);
      setGhostReports(ghostData);
      setAuditLog(auditData);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Shield className="w-10 h-10 text-brand-red mx-auto" />
        <h1 className="mt-4 text-xl font-black text-white">Access Denied</h1>
        <p className="mt-2 text-zinc-400">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-brand-orange" />
        <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              tab === t ? "bg-brand-orange text-white" : "text-zinc-400 hover:text-white bg-card"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers ?? 0} />
            <StatCard icon={Briefcase} label="Total Jobs" value={stats.totalJobs ?? 0} />
            <StatCard icon={Activity} label="Active Jobs" value={stats.activeJobs ?? 0} />
            <StatCard icon={CheckCircle} label="Completed" value={stats.completedJobs ?? 0} />
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue ?? 0}`} />
            <StatCard icon={Ghost} label="Ghost Reports" value={stats.ghostReports ?? 0} color="red" />
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "Users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id as string} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-zinc-800">
              <Avatar
                src={u.avatar_url as string}
                firstName={u.first_name as string}
                lastInitial={u.last_initial as string}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {u.first_name as string} {u.last_initial as string}.
                  </span>
                  {Boolean(u.is_admin) && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange">Admin</span>
                  )}
                  {Boolean(u.identity_verified) && (
                    <Shield className="w-3 h-3 text-green-400" />
                  )}
                  {u.verification_tier === "suspended" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red">Suspended</span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {u.city as string}, {u.state as string} &middot;{" "}
                  {u.is_gigger ? "Gigger" : ""}{u.is_gigger && u.is_poster ? " + " : ""}{u.is_poster ? "Poster" : ""} &middot;{" "}
                  {new Date(u.created_at as string).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-1">
                <Link href={`/profile/${u.id}`}>
                  <Button variant="ghost" size="sm"><Eye className="w-3.5 h-3.5" /></Button>
                </Link>
                {u.verification_tier === "suspended" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await adminUnsuspendUser(u.id as string);
                      setUsers(users.map((x) => x.id === u.id ? { ...x, verification_tier: "basic" } : x));
                    }}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await adminSuspendUser(u.id as string);
                      setUsers(users.map((x) => x.id === u.id ? { ...x, verification_tier: "suspended" } : x));
                    }}
                  >
                    <Ban className="w-3.5 h-3.5 text-brand-red" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && <EmptyMsg text="No users yet." />}
        </div>
      )}

      {/* Jobs */}
      {tab === "Jobs" && (
        <div className="space-y-2">
          {jobs.map((j) => {
            const poster = j.poster as Record<string, string> | null;
            return (
              <div key={j.id as string} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-zinc-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{j.title as string}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      j.status === "open" ? "bg-green-900/30 text-green-400" :
                      j.status === "hired" ? "bg-blue-900/30 text-blue-400" :
                      j.status === "completed" ? "bg-zinc-800 text-zinc-400" :
                      "bg-zinc-800 text-zinc-500"
                    )}>
                      {j.status as string}
                    </span>
                    {Boolean(j.is_urgent) && <span className="text-xs text-brand-red">Urgent</span>}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {j.category as string} &middot; {j.city as string}, {j.state as string} &middot;{" "}
                    {poster ? `${poster.first_name} ${poster.last_initial}.` : "Unknown"} &middot;{" "}
                    {Number(j.applications_count ?? 0)} apps &middot;{" "}
                    {j.price ? `$${j.price}` : j.hourly_rate ? `$${j.hourly_rate}/hr` : "Open"}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link href={`/jobs/${j.id}`}>
                    <Button variant="ghost" size="sm"><Eye className="w-3.5 h-3.5" /></Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await adminDeleteJob(j.id as string);
                      setJobs(jobs.filter((x) => x.id !== j.id));
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-brand-red" />
                  </Button>
                </div>
              </div>
            );
          })}
          {jobs.length === 0 && <EmptyMsg text="No jobs posted yet." />}
        </div>
      )}

      {/* Ghost Reports */}
      {tab === "Ghost Reports" && (
        <div className="space-y-2">
          {ghostReports.map((r) => {
            const reporter = r.reporter as Record<string, string> | null;
            const reported = r.reported as Record<string, string> | null;
            return (
              <div key={r.id as string} className="p-3 rounded-xl bg-card border border-brand-red/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-red font-medium">{r.ghost_type as string}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(r.created_at as string).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-1 text-sm text-zinc-300">
                  <span className="text-white font-medium">
                    {reported ? `${reported.first_name} ${reported.last_initial}.` : "Unknown"}
                  </span>{" "}
                  reported by{" "}
                  <span className="text-zinc-400">
                    {reporter ? `${reporter.first_name} ${reporter.last_initial}.` : "Unknown"}
                  </span>
                </div>
                {Boolean(r.description) && (
                  <p className="mt-1 text-xs text-zinc-500">{r.description as string}</p>
                )}
              </div>
            );
          })}
          {ghostReports.length === 0 && <EmptyMsg text="No ghost reports filed." />}
        </div>
      )}

      {/* Audit Log */}
      {tab === "Audit Log" && (
        <div className="space-y-1">
          {auditLog.map((entry) => {
            const user = entry.user as Record<string, string> | null;
            return (
              <div key={entry.id as string} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card text-xs">
                <span className="text-zinc-500 w-32 flex-shrink-0">
                  {new Date(entry.created_at as string).toLocaleString()}
                </span>
                <span className="text-brand-orange font-mono w-28 flex-shrink-0">
                  {entry.action as string}
                </span>
                <span className="text-zinc-400">
                  {user ? `${user.first_name} ${user.last_initial}.` : "System"}
                </span>
                {Boolean(entry.resource_type) && (
                  <span className="text-zinc-600">
                    {entry.resource_type as string}:{(entry.resource_id as string)?.slice(0, 8)}
                  </span>
                )}
              </div>
            );
          })}
          {auditLog.length === 0 && <EmptyMsg text="No audit events yet." />}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "orange",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: "orange" | "red";
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-zinc-800">
      <Icon className={cn("w-5 h-5", color === "red" ? "text-brand-red" : "text-brand-orange")} />
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{text}</p>;
}
