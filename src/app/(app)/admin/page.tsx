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
  Send,
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
  adminToggleAdmin,
  adminSetTier,
} from "@/lib/actions/admin";
import { getAllTickets, respondToTicket } from "@/lib/actions/support";

const TABS = ["Overview", "Users", "Jobs", "Ghost Reports", "Support", "Audit Log"];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [ghostReports, setGhostReports] = useState<Array<Record<string, unknown>>>([]);
  const [auditLog, setAuditLog] = useState<Array<Record<string, unknown>>>([]);
  const [supportTickets, setSupportTickets] = useState<Array<Record<string, unknown>>>([]);

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
      const [statsData, usersData, jobsData, ghostData, auditData, ticketsData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminJobs(),
        getAdminGhostReports(),
        getAdminAuditLog(),
        getAllTickets(),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setJobs(jobsData);
      setGhostReports(ghostData);
      setAuditLog(auditData);
      setSupportTickets(ticketsData);
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
        <UserManagement
          users={users}
          setUsers={setUsers}
        />
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

      {/* Support */}
      {tab === "Support" && (
        <SupportManagement
          tickets={supportTickets}
          setSupportTickets={setSupportTickets}
        />
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

const ALL_TIERS = [
  { value: "free", label: "Free", color: "text-zinc-400" },
  { value: "pro", label: "Pro Gigger", color: "text-blue-400" },
  { value: "elite", label: "Elite Gigger", color: "text-purple-400" },
  { value: "business_starter", label: "Biz Starter", color: "text-green-400" },
  { value: "business_growth", label: "Biz Growth", color: "text-emerald-400" },
  { value: "enterprise", label: "Enterprise", color: "text-yellow-400" },
];

function UserManagement({
  users,
  setUsers,
}: {
  users: Array<Record<string, unknown>>;
  setUsers: (u: Array<Record<string, unknown>>) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState<string | null>(null);
  const [userTiers, setUserTiers] = useState<Record<string, string>>({});
  const [tierError, setTierError] = useState<string | null>(null);
  const [tiersLoaded, setTiersLoaded] = useState(false);

  // Load current tiers for all users on mount
  useEffect(() => {
    async function loadTiers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("nexgigs_subscriptions")
        .select("user_id, tier")
        .eq("status", "active");

      if (data) {
        const tierMap: Record<string, string> = {};
        for (const sub of data) {
          tierMap[sub.user_id] = sub.tier;
        }
        setUserTiers(tierMap);
      }
      setTiersLoaded(true);
    }
    loadTiers();
  }, []);

  const filtered = search
    ? users.filter((u) => {
        const name = `${u.first_name} ${u.last_initial}`.toLowerCase();
        const city = (u.city as string || "").toLowerCase();
        return name.includes(search.toLowerCase()) || city.includes(search.toLowerCase());
      })
    : users;

  async function handleSetTier(userId: string, tier: string) {
    setTierLoading(userId);
    setTierError(null);
    const result = await adminSetTier(userId, tier);
    if (result.error) {
      setTierError(result.error);
    } else {
      setUserTiers({ ...userTiers, [userId]: tier });
    }
    setTierLoading(null);
  }

  async function handleToggleAdmin(userId: string, currentlyAdmin: boolean) {
    const result = await adminToggleAdmin(userId, !currentlyAdmin);
    if (!result.error) {
      setUsers(users.map((u) => u.id === userId ? { ...u, is_admin: !currentlyAdmin } : u));
    }
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Search users by name or city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
      />

      <p className="text-xs text-zinc-500">
        {filtered.length} users{search ? ` matching "${search}"` : ""}
        {!tiersLoaded && " · Loading tiers..."}
      </p>

      {tierError && (
        <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/30 text-xs text-red-300">
          {tierError}
        </div>
      )}

      {filtered.map((u) => {
        const isExpanded = expandedUser === (u.id as string);
        const currentTier = userTiers[u.id as string] ?? "free";

        return (
          <div key={u.id as string} className="rounded-xl bg-card border border-zinc-800 overflow-hidden">
            {/* User Row */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => setExpandedUser(isExpanded ? null : (u.id as string))}
            >
              <Avatar
                src={u.avatar_url as string}
                firstName={u.first_name as string}
                lastInitial={u.last_initial as string}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">
                    {u.first_name as string} {u.last_initial as string}.
                  </span>
                  {Boolean(u.is_admin) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange font-bold">ADMIN</span>
                  )}
                  {Boolean(u.identity_verified) && (
                    <Shield className="w-3 h-3 text-green-400" />
                  )}
                  {u.verification_tier === "suspended" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red">SUSPENDED</span>
                  )}
                  {currentTier !== "free" && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 font-medium", ALL_TIERS.find((t) => t.value === currentTier)?.color ?? "text-zinc-400")}>
                      {ALL_TIERS.find((t) => t.value === currentTier)?.label ?? currentTier}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {u.city as string}, {u.state as string} &middot;{" "}
                  {u.is_gigger ? "Gigger" : ""}{u.is_gigger && u.is_poster ? " + " : ""}{u.is_poster ? "Poster" : ""} &middot;{" "}
                  {new Date(u.created_at as string).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-1">
                <Link href={`/profile/${u.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm"><Eye className="w-3.5 h-3.5" /></Button>
                </Link>
              </div>
            </div>

            {/* Expanded Controls */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-3">
                {/* Tier Control */}
                <div>
                  <label className="block text-[10px] text-zinc-500 font-medium mb-1.5 uppercase tracking-wider">Subscription Tier</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TIERS.map((tier) => (
                      <button
                        key={tier.value}
                        onClick={() => handleSetTier(u.id as string, tier.value)}
                        disabled={tierLoading === (u.id as string)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          currentTier === tier.value
                            ? "border-brand-orange bg-brand-orange/10 text-white"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                        )}
                      >
                        {tierLoading === (u.id as string) ? "..." : tier.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin & Suspend Controls */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("text-xs", Boolean(u.is_admin) ? "border-brand-orange text-brand-orange" : "")}
                    onClick={() => handleToggleAdmin(u.id as string, Boolean(u.is_admin))}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {Boolean(u.is_admin) ? "Remove Admin" : "Make Admin"}
                  </Button>

                  {u.verification_tier === "suspended" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-green-400 border-green-700"
                      onClick={async () => {
                        await adminUnsuspendUser(u.id as string);
                        setUsers(users.map((x) => x.id === u.id ? { ...x, verification_tier: "basic" } : x));
                      }}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Unsuspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-brand-red border-red-900"
                      onClick={async () => {
                        await adminSuspendUser(u.id as string);
                        setUsers(users.map((x) => x.id === u.id ? { ...x, verification_tier: "suspended" } : x));
                      }}
                    >
                      <Ban className="w-3 h-3 mr-1" /> Suspend
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {filtered.length === 0 && <EmptyMsg text="No users found." />}
    </div>
  );
}

const PRIORITY_ORDER: Record<string, number> = { vip: 0, urgent: 1, high: 2, normal: 3 };
const PRIORITY_BADGE: Record<string, string> = {
  vip: "bg-yellow-900/30 text-yellow-400",
  urgent: "bg-purple-900/30 text-purple-400",
  high: "bg-blue-900/30 text-blue-400",
  normal: "bg-zinc-800 text-zinc-400",
};
const STATUS_BADGE: Record<string, string> = {
  open: "bg-yellow-900/30 text-yellow-400",
  in_progress: "bg-blue-900/30 text-blue-400",
  resolved: "bg-green-900/30 text-green-400",
};

function SupportManagement({
  tickets,
  setSupportTickets,
}: {
  tickets: Array<Record<string, unknown>>;
  setSupportTickets: (t: Array<Record<string, unknown>>) => void;
}) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = tickets
    .filter((t) => {
      if (filter === "open") return t.status === "open" || t.status === "in_progress";
      if (filter === "resolved") return t.status === "resolved";
      return true;
    })
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority as string] ?? 3;
      const pb = PRIORITY_ORDER[b.priority as string] ?? 3;
      return pa - pb;
    });

  async function handleRespond(ticketId: string) {
    if (!responseText.trim()) return;
    setSending(true);
    const result = await respondToTicket(ticketId, responseText);
    if (!result.error) {
      setSupportTickets(
        tickets.map((t) =>
          t.id === ticketId
            ? { ...t, admin_response: responseText.trim(), status: "resolved", responded_at: new Date().toISOString() }
            : t
        )
      );
      setRespondingTo(null);
      setResponseText("");
    }
    setSending(false);
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {(["all", "open", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
              filter === f ? "bg-brand-orange text-white" : "text-zinc-400 hover:text-white bg-card"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-500">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.map((ticket) => {
        const user = ticket.user as Record<string, string> | null;
        const isResponding = respondingTo === (ticket.id as string);

        return (
          <div key={ticket.id as string} className="rounded-xl bg-card border border-zinc-800 overflow-hidden">
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {ticket.subject as string}
                  </span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap", PRIORITY_BADGE[ticket.priority as string] ?? "bg-zinc-800 text-zinc-400")}>
                    {(ticket.priority as string).toUpperCase()}
                  </span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap", STATUS_BADGE[ticket.status as string] ?? "bg-zinc-800 text-zinc-400")}>
                    {(ticket.status as string).replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="text-xs text-zinc-500 mb-1">
                {user ? `${user.first_name} ${user.last_initial}.` : "Unknown"} &middot;{" "}
                {ticket.category as string} &middot;{" "}
                {new Date(ticket.created_at as string).toLocaleDateString()}
              </div>
              <p className="text-xs text-zinc-400">{ticket.description as string}</p>

              {Boolean(ticket.admin_response) && (
                <div className="mt-2 p-2 rounded-lg bg-green-900/10 border border-green-800/30">
                  <span className="text-[10px] font-medium text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Resolved
                  </span>
                  <p className="text-xs text-zinc-300 mt-0.5">{ticket.admin_response as string}</p>
                </div>
              )}

              {!ticket.admin_response && (
                <div className="mt-2 flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setRespondingTo(isResponding ? null : (ticket.id as string));
                      setResponseText("");
                    }}
                  >
                    <Send className="w-3 h-3 mr-1" /> {isResponding ? "Cancel" : "Respond"}
                  </Button>
                </div>
              )}
            </div>

            {isResponding && (
              <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-2">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-background text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
                  placeholder="Type your response..."
                />
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleRespond(ticket.id as string)}
                  disabled={sending || !responseText.trim()}
                >
                  {sending ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending...</>
                  ) : (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Resolve &amp; Send</>
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
      {filtered.length === 0 && <EmptyMsg text="No support tickets found." />}
    </div>
  );
}
