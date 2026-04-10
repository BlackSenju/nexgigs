"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Lock,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Briefcase,
  Users,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  bulkPostJobs,
  bulkAcceptApplications,
  bulkRejectApplications,
  getAllPosterApplications,
  type BulkJobInput,
  type BulkPostResult,
} from "@/lib/actions/bulk-hiring";

type Tab = "post" | "manage";

interface JobRow {
  readonly key: string;
  readonly title: string;
  readonly category: string;
  readonly price: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly description: string;
}

interface JobRelation {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly poster_id: string;
}

interface GiggerRelation {
  readonly first_name: string;
  readonly last_initial: string;
  readonly city: string;
  readonly state: string;
}

interface ApplicationRow {
  readonly id: string;
  readonly status: string;
  readonly bid_amount: number | null;
  readonly message: string | null;
  readonly created_at: string;
  readonly gigger_id: string;
  readonly job_id: string;
  readonly job: JobRelation;
  readonly gigger: GiggerRelation;
}

function emptyRow(): JobRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    category: "",
    price: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
  };
}

function rowToInput(row: JobRow): BulkJobInput | null {
  const priceNum = Number(row.price);
  if (
    !row.title.trim() ||
    !row.description.trim() ||
    !row.category.trim() ||
    !row.city.trim() ||
    !row.state.trim() ||
    !row.zipCode.trim() ||
    !Number.isFinite(priceNum) ||
    priceNum <= 0
  ) {
    return null;
  }
  return {
    title: row.title.trim(),
    description: row.description.trim(),
    category: row.category.trim(),
    price: priceNum,
    city: row.city.trim(),
    state: row.state.trim(),
    zipCode: row.zipCode.trim(),
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "accepted":
      return "bg-green-900/30 text-green-400 border-green-700/30";
    case "rejected":
      return "bg-red-900/30 text-red-400 border-red-700/30";
    case "pending":
    default:
      return "bg-zinc-800 text-zinc-300 border-zinc-700";
  }
}

export default function BulkHiringPage() {
  const [loading, setLoading] = useState(true);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [tab, setTab] = useState<Tab>("post");

  // Post tab state
  const [rows, setRows] = useState<readonly JobRow[]>([emptyRow()]);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postResults, setPostResults] = useState<readonly BulkPostResult[] | null>(
    null
  );
  const [postError, setPostError] = useState<string | null>(null);

  // Manage tab state
  const [applications, setApplications] = useState<readonly ApplicationRow[]>(
    []
  );
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [jobFilter, setJobFilter] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionMsg, setBulkActionMsg] = useState<string | null>(null);

  // Check tier on mount
  useEffect(() => {
    async function checkTier() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("nexgigs_subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);
      setIsEnterprise(data?.[0]?.tier === "enterprise");
      setLoading(false);
    }
    checkTier();
  }, []);

  // Load applications when switching to manage tab
  const loadApplications = useCallback(async () => {
    setAppsLoading(true);
    setAppsError(null);
    const result = await getAllPosterApplications();
    if (result.error) {
      setAppsError(result.error);
      setApplications([]);
    } else {
      setApplications(
        (result.applications as unknown as readonly ApplicationRow[]) ?? []
      );
    }
    setAppsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "manage" && isEnterprise) {
      loadApplications();
    }
  }, [tab, isEnterprise, loadApplications]);

  // ---- Post tab handlers ----
  const handleRowChange = useCallback(
    (key: string, field: keyof Omit<JobRow, "key">, value: string) => {
      setRows((prev) =>
        prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
      );
    },
    []
  );

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()]);
  }, []);

  const handleRemoveRow = useCallback((key: string) => {
    setRows((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.key !== key)
    );
  }, []);

  const handlePostAll = useCallback(async () => {
    setPostError(null);
    setPostResults(null);

    const inputs: BulkJobInput[] = [];
    const invalidRows: number[] = [];
    rows.forEach((row, idx) => {
      const input = rowToInput(row);
      if (input) {
        inputs.push(input);
      } else {
        invalidRows.push(idx + 1);
      }
    });

    if (inputs.length === 0) {
      setPostError(
        "No valid rows to post. Each row needs title, description, category, price, city, state, and ZIP."
      );
      return;
    }

    if (invalidRows.length > 0) {
      setPostError(
        `Skipping invalid rows: ${invalidRows.join(", ")}. Fill all fields and try again.`
      );
      return;
    }

    setPostSubmitting(true);
    const result = await bulkPostJobs(inputs);
    setPostSubmitting(false);

    if (result.error) {
      setPostError(result.error);
      return;
    }

    setPostResults(result.results ?? []);

    // Clear successful rows; keep failed rows so user can fix
    if (result.results) {
      const failedTitles = new Set(
        result.results.filter((r) => !r.success).map((r) => r.title)
      );
      setRows((prev) => {
        const remaining = prev.filter((row) =>
          failedTitles.has(row.title.trim())
        );
        return remaining.length === 0 ? [emptyRow()] : remaining;
      });
    }
  }, [rows]);

  // ---- Manage tab handlers ----
  const filteredApplications = useMemo(() => {
    if (!jobFilter.trim()) return applications;
    const q = jobFilter.toLowerCase();
    return applications.filter((app) =>
      app.job?.title?.toLowerCase().includes(q)
    );
  }, [applications, jobFilter]);

  const allVisibleSelected = useMemo(() => {
    if (filteredApplications.length === 0) return false;
    return filteredApplications.every((app) => selectedIds.includes(app.id));
  }, [filteredApplications, selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (filteredApplications.every((app) => prev.includes(app.id))) {
        const visibleIds = new Set(filteredApplications.map((a) => a.id));
        return prev.filter((id) => !visibleIds.has(id));
      }
      const toAdd = filteredApplications
        .map((a) => a.id)
        .filter((id) => !prev.includes(id));
      return [...prev, ...toAdd];
    });
  }, [filteredApplications]);

  const handleBulkAccept = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setBulkActionMsg(null);
    const result = await bulkAcceptApplications(selectedIds);
    setBulkActionLoading(false);

    if (result.error) {
      setBulkActionMsg(`Error: ${result.error}`);
      return;
    }

    const acceptedCount = result.accepted?.length ?? 0;
    const failedCount = result.failed?.length ?? 0;
    setBulkActionMsg(
      `Accepted ${acceptedCount} application${acceptedCount === 1 ? "" : "s"}${
        failedCount > 0 ? `, ${failedCount} failed` : ""
      }`
    );
    setSelectedIds([]);
    loadApplications();
  }, [selectedIds, loadApplications]);

  const handleBulkReject = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setBulkActionMsg(null);
    const result = await bulkRejectApplications(selectedIds);
    setBulkActionLoading(false);

    if (result.error) {
      setBulkActionMsg(`Error: ${result.error}`);
      return;
    }

    setBulkActionMsg(
      `Rejected ${result.rejected ?? 0} application${
        result.rejected === 1 ? "" : "s"
      }`
    );
    setSelectedIds([]);
    loadApplications();
  }, [selectedIds, loadApplications]);

  // ---- Render ----
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!isEnterprise) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <BackButton fallbackHref="/dashboard" />
        <div className="text-center py-16">
          <Lock className="w-10 h-10 text-zinc-600 mx-auto" />
          <h1 className="mt-4 text-xl font-black text-white">
            Bulk Hiring Tools
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            Post multiple jobs at once and manage applicants in bulk.
            Available exclusively on the Enterprise plan ($199.99/mo).
          </p>
          <Link href="/subscription?tab=business">
            <Button className="mt-6" variant="primary">
              Upgrade to Enterprise
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />

      <div className="mb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-brand-orange" />
          Bulk Hiring
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Post multiple jobs and manage applicants in bulk.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex border-b border-zinc-800 mb-6">
        <button
          onClick={() => setTab("post")}
          className={cn(
            "px-4 py-2 text-sm font-semibold transition-colors",
            tab === "post"
              ? "text-brand-orange border-b-2 border-brand-orange"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <Briefcase className="w-4 h-4 inline mr-1" />
          Post Jobs
        </button>
        <button
          onClick={() => setTab("manage")}
          className={cn(
            "px-4 py-2 text-sm font-semibold transition-colors",
            tab === "manage"
              ? "text-brand-orange border-b-2 border-brand-orange"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Manage Applications
        </button>
      </div>

      {tab === "post" && (
        <div>
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div
                key={row.key}
                className="p-4 rounded-xl border border-zinc-800 bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-400">
                    Job #{idx + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(row.key)}
                      className="text-zinc-500 hover:text-brand-red transition-colors"
                      aria-label="Remove row"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Title
                    </label>
                    <Input
                      value={row.title}
                      onChange={(e) =>
                        handleRowChange(row.key, "title", e.target.value)
                      }
                      placeholder="e.g. Move a sofa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Category
                    </label>
                    <Input
                      value={row.category}
                      onChange={(e) =>
                        handleRowChange(row.key, "category", e.target.value)
                      }
                      placeholder="e.g. Moving"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Price ($)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={row.price}
                      onChange={(e) =>
                        handleRowChange(row.key, "price", e.target.value)
                      }
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      City
                    </label>
                    <Input
                      value={row.city}
                      onChange={(e) =>
                        handleRowChange(row.key, "city", e.target.value)
                      }
                      placeholder="Atlanta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      State
                    </label>
                    <Input
                      value={row.state}
                      onChange={(e) =>
                        handleRowChange(
                          row.key,
                          "state",
                          e.target.value.toUpperCase().slice(0, 2)
                        )
                      }
                      placeholder="GA"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      ZIP Code
                    </label>
                    <Input
                      value={row.zipCode}
                      onChange={(e) =>
                        handleRowChange(row.key, "zipCode", e.target.value)
                      }
                      placeholder="30301"
                      maxLength={10}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Description
                    </label>
                    <textarea
                      value={row.description}
                      onChange={(e) =>
                        handleRowChange(
                          row.key,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Describe the job in detail..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              disabled={rows.length >= 50}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Row
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePostAll}
              disabled={postSubmitting}
            >
              {postSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Posting...
                </>
              ) : (
                `Post All ${rows.length} Job${rows.length === 1 ? "" : "s"}`
              )}
            </Button>
            <span className="text-xs text-zinc-500">
              Max 50 jobs per batch
            </span>
          </div>

          {postError && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-700/30 text-sm text-red-300">
              {postError}
            </div>
          )}

          {postResults && postResults.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-zinc-800">
              <h3 className="text-sm font-bold text-white mb-2">
                Results:{" "}
                {postResults.filter((r) => r.success).length} posted,{" "}
                {postResults.filter((r) => !r.success).length} failed
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {postResults.map((r, i) => (
                  <div
                    key={`${r.title}-${i}`}
                    className="flex items-start gap-2 text-xs"
                  >
                    {r.success ? (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white truncate block">
                        {r.title}
                      </span>
                      {r.error && (
                        <span className="text-red-300 text-[10px]">
                          {r.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "manage" && (
        <div>
          {/* Filter */}
          <div className="mb-4">
            <Input
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              placeholder="Filter by job title..."
            />
          </div>

          {/* Bulk actions */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={toggleSelectAll}
              disabled={filteredApplications.length === 0}
              className="text-xs text-brand-orange hover:underline disabled:opacity-50"
            >
              {allVisibleSelected ? "Deselect all" : "Select all"}
            </button>
            <span className="text-xs text-zinc-500">
              {selectedIds.length} selected
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkAccept}
                disabled={selectedIds.length === 0 || bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accept Selected
                  </>
                )}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkReject}
                disabled={selectedIds.length === 0 || bulkActionLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject Selected
              </Button>
            </div>
          </div>

          {bulkActionMsg && (
            <div className="mb-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-white">
              {bulkActionMsg}
            </div>
          )}

          {appsError && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/30 text-sm text-red-300">
              {appsError}
            </div>
          )}

          {appsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="mt-2 text-sm text-zinc-400">
                {jobFilter
                  ? "No applications match your filter."
                  : "No applications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredApplications.map((app) => {
                const checked = selectedIds.includes(app.id);
                return (
                  <div
                    key={app.id}
                    className={cn(
                      "p-4 rounded-xl border transition-colors flex items-start gap-3",
                      checked
                        ? "border-brand-orange bg-brand-orange/5"
                        : "border-zinc-800 bg-card"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(app.id)}
                      className="mt-1 w-4 h-4 accent-brand-orange cursor-pointer"
                      aria-label={`Select application for ${app.job?.title}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-white truncate">
                            {app.job?.title ?? "Unknown job"}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {app.gigger?.first_name}{" "}
                            {app.gigger?.last_initial}. &middot;{" "}
                            {app.gigger?.city}, {app.gigger?.state}
                          </p>
                          {app.bid_amount !== null && (
                            <p className="text-xs text-brand-orange mt-1 font-semibold">
                              Bid: ${Number(app.bid_amount).toFixed(2)}
                            </p>
                          )}
                          {app.message && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                              {app.message}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              statusBadgeClass(app.status)
                            )}
                          >
                            {app.status}
                          </span>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            {formatDate(app.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
