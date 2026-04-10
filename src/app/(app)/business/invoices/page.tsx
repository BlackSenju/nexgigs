"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Lock,
  FileText,
  Download,
  Printer,
  Search,
  X,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface JobRelation {
  title: string;
  category: string;
}

interface GiggerRelation {
  first_name: string;
  last_initial: string;
}

interface PosterRelation {
  first_name: string;
  last_initial: string;
  city: string;
  state: string;
  business_name: string | null;
}

interface CompletedJob {
  id: string;
  agreed_price: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  job: JobRelation;
  gigger: GiggerRelation;
}

interface InvoiceDetail {
  id: string;
  agreed_price: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  job: JobRelation & { id: string; description: string | null };
  gigger: GiggerRelation & { city: string; state: string };
  poster: PosterRelation;
}

type SubTier = "business_growth" | "enterprise";

function invoiceNumber(id: string): string {
  return `INV-${id.slice(0, 8).toUpperCase()}`;
}

function feePercent(tier: SubTier): number {
  return tier === "enterprise" ? 3 : 5;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function generateCsvBlob(
  jobs: readonly CompletedJob[],
  tier: SubTier
): Blob {
  const fee = feePercent(tier);
  const header = "Invoice #,Job Title,Gigger,Amount,Fee %,Fee Amount,Net Amount,Date,Status";
  const rows = jobs.map((j) => {
    const amount = Number(j.agreed_price);
    const feeAmount = amount * (fee / 100);
    const net = amount - feeAmount;
    const giggerName = `${j.gigger.first_name} ${j.gigger.last_initial}.`;
    const date = j.completed_at
      ? new Date(j.completed_at).toISOString().split("T")[0]
      : "";
    return [
      invoiceNumber(j.id),
      `"${j.job.title.replace(/"/g, '""')}"`,
      `"${giggerName}"`,
      amount.toFixed(2),
      `${fee}%`,
      feeAmount.toFixed(2),
      net.toFixed(2),
      date,
      "Paid",
    ].join(",");
  });

  return new Blob([header + "\n" + rows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
}

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<SubTier | null>(null);
  const [jobs, setJobs] = useState<readonly CompletedJob[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
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
        .select("tier")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      const userTier = subs?.[0]?.tier ?? "free";
      if (["business_growth", "enterprise"].includes(userTier)) {
        setTier(userTier as SubTier);
      }

      // Fetch completed jobs
      const { data: completed } = await supabase
        .from("nexgigs_hired_jobs")
        .select(
          `
          id, agreed_price, status, created_at, completed_at,
          job:nexgigs_jobs!job_id(title, category),
          gigger:nexgigs_profiles!gigger_id(first_name, last_initial)
        `
        )
        .eq("poster_id", user.id)
        .in("status", ["completed", "payment_released"])
        .order("completed_at", { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setJobs((completed as any as readonly CompletedJob[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const loadInvoiceDetail = useCallback(
    async (hiredJobId: string) => {
      setSelectedId(hiredJobId);
      setDetailLoading(true);

      const supabase = createClient();
      const { data } = await supabase
        .from("nexgigs_hired_jobs")
        .select(
          `
          *,
          job:nexgigs_jobs!job_id(id, title, category, description),
          gigger:nexgigs_profiles!gigger_id(first_name, last_initial, city, state),
          poster:nexgigs_profiles!poster_id(first_name, last_initial, city, state, business_name)
        `
        )
        .eq("id", hiredJobId)
        .single();

      setInvoiceDetail(data as InvoiceDetail | null);
      setDetailLoading(false);
    },
    []
  );

  const filteredJobs = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.job.title.toLowerCase().includes(q) ||
        j.gigger.first_name.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const handleDownloadCsv = useCallback(() => {
    if (!tier || jobs.length === 0) return;
    const blob = generateCsvBlob(jobs, tier);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexgigs-invoices-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [jobs, tier]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
      </div>
    );
  }

  // Tier gate
  if (!tier) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <BackButton fallbackHref="/dashboard" />
        <div className="text-center py-16">
          <Lock className="w-10 h-10 text-zinc-600 mx-auto" />
          <h1 className="mt-4 text-xl font-black text-white">
            Invoice Generation
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            Generate and download invoices for completed jobs. Available on
            Business Growth ($79.99/mo) and Enterprise ($199.99/mo) plans.
          </p>
          <Link href="/subscription?tab=business">
            <Button className="mt-6" variant="primary">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-orange" />
          Invoices
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            disabled={jobs.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>
      <p className="text-sm text-zinc-400 mb-4">
        Invoices for your completed jobs. {jobs.length} total.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by job title or gigger name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
        />
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="mt-2 text-sm text-zinc-400">
            {search
              ? "No invoices match your search."
              : "No completed jobs yet. Invoices will appear here after jobs are completed."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredJobs.map((j) => {
            const amount = Number(j.agreed_price);
            return (
              <button
                key={j.id}
                onClick={() => loadInvoiceDetail(j.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-colors",
                  selectedId === j.id
                    ? "border-brand-orange bg-brand-orange/5"
                    : "border-zinc-800 bg-card hover:border-zinc-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {j.job.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {j.gigger.first_name} {j.gigger.last_initial}. &middot;{" "}
                      {j.job.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {formatDate(j.completed_at)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:static print:bg-transparent print:p-0">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-6 print:max-w-none print:max-h-none print:rounded-none print:border-none print:bg-white print:text-black">
            {/* Close button (hidden in print) */}
            <button
              onClick={() => {
                setSelectedId(null);
                setInvoiceDetail(null);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
              </div>
            ) : invoiceDetail ? (
              <div>
                {/* Invoice Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white print:text-black">
                      INVOICE
                    </h2>
                    <p className="text-sm text-zinc-400 print:text-gray-500">
                      {invoiceNumber(invoiceDetail.id)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-900/30 text-green-400 border border-green-700/30 print:bg-green-100 print:text-green-700 print:border-green-300">
                      Paid
                    </span>
                  </div>
                </div>

                {/* From / To */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 print:text-gray-400">
                      From
                    </p>
                    <p className="text-sm font-bold text-white print:text-black">
                      {invoiceDetail.poster.business_name ||
                        `${invoiceDetail.poster.first_name} ${invoiceDetail.poster.last_initial}.`}
                    </p>
                    <p className="text-xs text-zinc-400 print:text-gray-500">
                      {invoiceDetail.poster.city},{" "}
                      {invoiceDetail.poster.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 print:text-gray-400">
                      To
                    </p>
                    <p className="text-sm font-bold text-white print:text-black">
                      {invoiceDetail.gigger.first_name}{" "}
                      {invoiceDetail.gigger.last_initial}.
                    </p>
                    <p className="text-xs text-zinc-400 print:text-gray-500">
                      {invoiceDetail.gigger.city},{" "}
                      {invoiceDetail.gigger.state}
                    </p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="mb-6 p-3 rounded-lg bg-zinc-800/50 print:bg-gray-100">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 print:text-gray-400">
                    Job Details
                  </p>
                  <p className="text-sm font-bold text-white print:text-black">
                    {invoiceDetail.job.title}
                  </p>
                  <p className="text-xs text-zinc-400 print:text-gray-500">
                    Category: {invoiceDetail.job.category}
                  </p>
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 print:text-gray-500">
                      Agreed Price
                    </span>
                    <span className="text-white font-semibold print:text-black">
                      {formatCurrency(Number(invoiceDetail.agreed_price))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 print:text-gray-500">
                      Platform Fee ({feePercent(tier)}%)
                    </span>
                    <span className="text-zinc-400 print:text-gray-500">
                      -
                      {formatCurrency(
                        Number(invoiceDetail.agreed_price) *
                          (feePercent(tier) / 100)
                      )}
                    </span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 print:border-gray-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-white font-bold print:text-black">
                        Net Amount
                      </span>
                      <span className="text-brand-orange font-black text-lg print:text-green-700">
                        {formatCurrency(
                          Number(invoiceDetail.agreed_price) *
                            (1 - feePercent(tier) / 100)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="flex justify-between text-xs text-zinc-500 mb-6 print:text-gray-400">
                  <span>
                    Hired: {formatDate(invoiceDetail.created_at)}
                  </span>
                  <span>
                    Completed: {formatDate(invoiceDetail.completed_at)}
                  </span>
                </div>

                {/* Actions (hidden in print) */}
                <div className="flex gap-2 print:hidden">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedId(null);
                      setInvoiceDetail(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-400">
                  Failed to load invoice details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
