"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const GOALS = {
  daily: 50,
  weekly: 300,
  monthly: 1000,
};

type Period = "daily" | "weekly" | "monthly";

export function EarningsTracker() {
  const [period, setPeriod] = useState<Period>("daily");
  const [earnings, setEarnings] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check subscription tier
      const { data: sub } = await supabase
        .from("nexgigs_subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();

      const userTier = sub?.tier ?? "free";
      setTier(userTier);

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();
      const weekStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      ).toISOString();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();

      const { data: jobs } = await supabase
        .from("nexgigs_hired_jobs")
        .select("agreed_price, created_at")
        .eq("gigger_id", user.id)
        .in("status", ["completed", "payment_released"])
        .gte("created_at", monthStart);

      const daily = (jobs ?? [])
        .filter((j) => j.created_at >= todayStart)
        .reduce((s, j) => s + Number(j.agreed_price ?? 0), 0);
      const weekly = (jobs ?? [])
        .filter((j) => j.created_at >= weekStart)
        .reduce((s, j) => s + Number(j.agreed_price ?? 0), 0);
      const monthly = (jobs ?? []).reduce(
        (s, j) => s + Number(j.agreed_price ?? 0),
        0
      );

      setEarnings({ daily, weekly, monthly });

      // Calculate streak (days in a row with earnings)
      const { data: allJobs } = await supabase
        .from("nexgigs_hired_jobs")
        .select("created_at")
        .eq("gigger_id", user.id)
        .in("status", ["completed", "payment_released"])
        .order("created_at", { ascending: false })
        .limit(30);

      let streakCount = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split("T")[0];
        const hasEarning = (allJobs ?? []).some((j) =>
          j.created_at.startsWith(dateStr)
        );
        if (hasEarning) {
          streakCount++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(streakCount);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;

  const isFree = !["pro", "elite"].includes(tier);
  const current = earnings[period];
  const goal = GOALS[period];
  const progress = Math.min(100, (current / goal) * 100);
  const remaining = Math.max(0, goal - current);
  const hitGoal = current >= goal;

  return (
    <div className="p-4 rounded-xl bg-card border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Target className="w-4 h-4 text-brand-orange" />
          Earnings Goal
        </h3>
        <div className="flex gap-1">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                period === p
                  ? "bg-brand-orange text-white"
                  : "text-zinc-500 hover:text-white"
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-white font-bold">${current.toFixed(0)}</span>
          <span className="text-zinc-500">${goal} goal</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              hitGoal ? "bg-green-400" : "bg-brand-orange"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Motivational message */}
      <div className="flex items-center gap-1.5">
        {hitGoal ? (
          <>
            <Flame className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              Goal reached! Keep going!
            </span>
          </>
        ) : (
          <>
            <TrendingUp className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-xs text-zinc-400">
              ${remaining.toFixed(0)} to hit your {period} goal
            </span>
          </>
        )}
        {streak > 1 && (
          <span className="ml-auto text-[10px] text-orange-400 flex items-center gap-0.5">
            <Flame className="w-3 h-3" /> {streak}-day streak
          </span>
        )}
      </div>

      {/* Upgrade prompt for free users */}
      {isFree && (
        <Link href="/subscription">
          <div className="mt-2 pt-2 border-t border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 hover:text-brand-orange transition-colors">
              Upgrade to Pro to set custom goals &rarr;
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
