"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get earnings summary for the current user.
 */
export async function getEarningsSummary(year?: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const targetYear = year ?? new Date().getFullYear();
  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear}-12-31`;

  // Get all completed hired jobs for this gigger
  const { data: jobs } = await supabase
    .from("nexgigs_hired_jobs")
    .select(`
      id, agreed_price, completed_at, created_at,
      job:nexgigs_jobs(title, category, city),
      poster:nexgigs_profiles!poster_id(first_name, last_initial)
    `)
    .eq("gigger_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startDate)
    .lte("completed_at", endDate)
    .order("completed_at", { ascending: false });

  const completedJobs = jobs ?? [];

  // Calculate totals
  const totalEarned = completedJobs.reduce(
    (sum, j) => sum + Number(j.agreed_price ?? 0), 0
  );

  // Get user's tier to calculate fees
  const giggerCommission = 0.03; // Default free tier — TODO: pull from subscription
  const totalFees = totalEarned * giggerCommission;
  const netEarnings = totalEarned - totalFees;

  // Monthly breakdown
  const monthlyBreakdown: Array<{ month: string; earned: number; jobs: number }> = [];
  for (let m = 0; m < 12; m++) {
    const monthJobs = completedJobs.filter((j) => {
      const d = new Date(j.completed_at as string);
      return d.getMonth() === m;
    });
    const monthEarned = monthJobs.reduce(
      (sum, j) => sum + Number(j.agreed_price ?? 0), 0
    );
    monthlyBreakdown.push({
      month: new Date(targetYear, m).toLocaleString("en-US", { month: "short" }),
      earned: monthEarned,
      jobs: monthJobs.length,
    });
  }

  return {
    year: targetYear,
    totalEarned,
    totalFees,
    netEarnings,
    totalJobs: completedJobs.length,
    monthlyBreakdown,
    transactions: completedJobs.map((j) => ({
      id: j.id,
      amount: Number(j.agreed_price),
      fee: Number(j.agreed_price) * giggerCommission,
      net: Number(j.agreed_price) * (1 - giggerCommission),
      date: j.completed_at as string,
      jobTitle: String((j.job as unknown as Record<string, unknown>)?.title ?? "Unknown"),
      category: String((j.job as unknown as Record<string, unknown>)?.category ?? ""),
      city: String((j.job as unknown as Record<string, unknown>)?.city ?? ""),
      poster: (() => {
        const p = j.poster as unknown as Record<string, string> | null;
        return p ? `${p.first_name} ${p.last_initial}.` : "Unknown";
      })(),
    })),
    needs1099: totalEarned >= 600,
  };
}

/**
 * Generate CSV data for earnings export.
 */
export async function generateEarningsCSV(year?: number): Promise<string | null> {
  const data = await getEarningsSummary(year);
  if (!data) return null;

  const headers = "Date,Job Title,Category,City,Client,Gross Amount,Platform Fee,Net Earnings";
  const rows = data.transactions.map((t) =>
    `${new Date(t.date).toLocaleDateString()},\"${t.jobTitle}\",\"${t.category}\",\"${t.city}\",\"${t.poster}\",${t.amount.toFixed(2)},${t.fee.toFixed(2)},${t.net.toFixed(2)}`
  );

  const summary = [
    "",
    `Total Gross Earnings,$${data.totalEarned.toFixed(2)}`,
    `Total Platform Fees,$${data.totalFees.toFixed(2)}`,
    `Total Net Earnings,$${data.netEarnings.toFixed(2)}`,
    `Total Completed Jobs,${data.totalJobs}`,
    `Year,${data.year}`,
    `1099 Required (>=$600),${data.needs1099 ? "YES" : "NO"}`,
  ];

  return [headers, ...rows, ...summary].join("\n");
}
