"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flame, Zap, TrendingUp } from "lucide-react";

interface DemandAlert {
  category: string;
  jobCount: number;
  avgApplications: number;
  level: "hot" | "warm";
}

export function DemandAlerts({
  onCategorySelect,
}: {
  onCategorySelect?: (category: string) => void;
}) {
  const [alerts, setAlerts] = useState<DemandAlert[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: jobs } = await supabase
        .from("nexgigs_jobs")
        .select("category, applications_count")
        .eq("status", "open");

      if (!jobs || jobs.length === 0) return;

      // Group by category
      const categoryMap: Record<string, { count: number; totalApps: number }> =
        {};
      for (const job of jobs) {
        if (!categoryMap[job.category]) {
          categoryMap[job.category] = { count: 0, totalApps: 0 };
        }
        categoryMap[job.category].count++;
        categoryMap[job.category].totalApps += Number(
          job.applications_count ?? 0
        );
      }

      // Find high demand categories
      const demandAlerts: DemandAlert[] = [];
      for (const [category, data] of Object.entries(categoryMap)) {
        const avgApps = data.totalApps / data.count;
        if (data.count >= 3 && avgApps < 3) {
          demandAlerts.push({
            category,
            jobCount: data.count,
            avgApplications: avgApps,
            level: "hot",
          });
        } else if (data.count >= 2 && avgApps < 5) {
          demandAlerts.push({
            category,
            jobCount: data.count,
            avgApplications: avgApps,
            level: "warm",
          });
        }
      }

      // Sort by demand level then job count
      demandAlerts.sort((a, b) => {
        if (a.level !== b.level) return a.level === "hot" ? -1 : 1;
        return b.jobCount - a.jobCount;
      });

      setAlerts(demandAlerts.slice(0, 5));
    }
    load();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> High Demand Right Now
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {alerts.map((alert) => (
          <button
            key={alert.category}
            onClick={() => onCategorySelect?.(alert.category)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 bg-card hover:border-brand-orange/50 transition-colors"
          >
            {alert.level === "hot" ? (
              <Flame className="w-3 h-3 text-orange-400" />
            ) : (
              <Zap className="w-3 h-3 text-yellow-400" />
            )}
            <span className="text-xs text-white font-medium">
              {alert.category}
            </span>
            <span className="text-[10px] text-zinc-500">
              {alert.jobCount} jobs
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
