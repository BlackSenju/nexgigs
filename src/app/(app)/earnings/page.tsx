"use client";

import { useState, useEffect } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { getEarningsSummary, generateEarningsCSV } from "@/lib/actions/earnings";
import {
  DollarSign, TrendingUp, Briefcase, FileText,
  Download, ExternalLink, Loader2, Info, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<Awaited<ReturnType<typeof getEarningsSummary>>>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getEarningsSummary(year);
      setData(result);
      setLoading(false);
    }
    load();
  }, [year]);

  async function handleDownloadCSV() {
    const csv = await generateEarningsCSV(year);
    if (!csv) return;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexgigs-earnings-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleOpenStripeDashboard() {
    try {
      const res = await fetch("/api/stripe/dashboard");
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
      else alert("Connect your Stripe account first from your profile settings.");
    } catch {
      alert("Failed to open Stripe dashboard.");
    }
  }

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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white">Earnings</h1>
          <p className="text-sm text-zinc-400">Track your income and download tax records</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-1.5 rounded-lg bg-card border border-zinc-700 text-white text-sm focus:outline-none focus:border-brand-orange"
        >
          {[2026, 2025, 2024].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <DollarSign className="w-5 h-5 text-green-400" />
          <div className="mt-2 text-2xl font-black text-white">
            ${(data?.netEarnings ?? 0).toFixed(2)}
          </div>
          <div className="text-xs text-zinc-400">Net Earnings</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <TrendingUp className="w-5 h-5 text-brand-orange" />
          <div className="mt-2 text-2xl font-black text-white">
            ${(data?.totalEarned ?? 0).toFixed(2)}
          </div>
          <div className="text-xs text-zinc-400">Gross Earnings</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <Briefcase className="w-5 h-5 text-brand-orange" />
          <div className="mt-2 text-2xl font-black text-white">{data?.totalJobs ?? 0}</div>
          <div className="text-xs text-zinc-400">Jobs Completed</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <Receipt className="w-5 h-5 text-zinc-400" />
          <div className="mt-2 text-2xl font-black text-white">
            ${(data?.totalFees ?? 0).toFixed(2)}
          </div>
          <div className="text-xs text-zinc-400">Platform Fees (deductible)</div>
        </div>
      </div>

      {/* 1099 notice */}
      {data?.needs1099 && (
        <div className="p-3 rounded-xl bg-yellow-900/20 border border-yellow-700/30 mb-6 flex gap-2">
          <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-200 leading-relaxed">
            <strong>1099-NEC:</strong> You earned ${data.totalEarned.toFixed(2)} this year, which exceeds the $600 IRS reporting threshold.
            Stripe will generate and file your 1099-NEC automatically. Access it from your Stripe dashboard below.
          </div>
        </div>
      )}

      {/* Monthly breakdown */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-6">
        <h2 className="text-sm font-bold text-white mb-3">Monthly Breakdown</h2>
        <div className="space-y-2">
          {(data?.monthlyBreakdown ?? []).map((m) => (
            <div key={m.month} className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 w-10">{m.month}</span>
              <div className="flex-1 mx-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-orange rounded-full transition-all"
                  style={{
                    width: data?.totalEarned
                      ? `${Math.max((m.earned / data.totalEarned) * 100, m.earned > 0 ? 4 : 0)}%`
                      : "0%",
                  }}
                />
              </div>
              <span className={cn("text-xs font-medium w-16 text-right", m.earned > 0 ? "text-white" : "text-zinc-600")}>
                ${m.earned.toFixed(0)}
              </span>
              <span className="text-[10px] text-zinc-500 w-12 text-right">
                {m.jobs} {m.jobs === 1 ? "job" : "jobs"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      {(data?.transactions ?? []).length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-6">
          <h2 className="text-sm font-bold text-white mb-3">Transaction History</h2>
          <div className="space-y-2">
            {data?.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{String(t.jobTitle)}</div>
                  <div className="text-xs text-zinc-500">
                    {String(t.poster)} &middot; {String(t.category)} &middot; {new Date(String(t.date)).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-bold text-green-400">+${t.net.toFixed(2)}</div>
                  <div className="text-[10px] text-zinc-500">fee: ${t.fee.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 mb-6">
        <Button className="w-full" onClick={handleDownloadCSV}>
          <Download className="w-4 h-4 mr-2" /> Download {year} Earnings (CSV)
        </Button>
        <Button variant="outline" className="w-full" onClick={handleOpenStripeDashboard}>
          <ExternalLink className="w-4 h-4 mr-2" /> Open Stripe Dashboard (1099)
        </Button>
      </div>

      {/* Tax tips */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <h2 className="text-sm font-bold text-white mb-3">
          <FileText className="w-4 h-4 inline mr-1 text-brand-orange" />
          Tax Tips for Giggers
        </h2>
        <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
          <p><strong className="text-zinc-300">You&apos;re an independent contractor.</strong> NexGigs does not withhold taxes. You&apos;re responsible for paying self-employment tax (15.3%) plus income tax.</p>
          <p><strong className="text-zinc-300">Save 25-30% of your earnings</strong> for taxes. Set up a separate savings account for tax payments.</p>
          <p><strong className="text-zinc-300">Track your expenses</strong> — these are deductible: tools, supplies, mileage, phone, internet, NexGigs platform fees, and any business-related purchases.</p>
          <p><strong className="text-zinc-300">Quarterly estimated taxes</strong> — if you expect to owe $1,000+ in taxes, the IRS requires quarterly payments (April 15, June 15, Sept 15, Jan 15).</p>
          <p><strong className="text-zinc-300">1099-NEC</strong> — if you earn $600+ on NexGigs, Stripe will automatically generate and file your 1099. Access it from your Stripe dashboard.</p>
          <p><strong className="text-zinc-300">Mileage deduction</strong> — track miles driven to/from gigs. The 2026 IRS rate is $0.70/mile. Use an app like Stride or Everlance.</p>
          <p className="text-zinc-500 italic">This is not tax advice. Consult a tax professional for your specific situation.</p>
        </div>
      </div>
    </div>
  );
}
