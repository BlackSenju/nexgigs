"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Zap, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

export function DesktopRightSidebar() {
  const [xp, setXp] = useState<Record<string, unknown> | null>(null);
  const [tier, setTier] = useState("free");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase
          .from("nexgigs_user_xp")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("nexgigs_subscriptions")
          .select("tier")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .single(),
      ]).then(([xpRes, subRes]) => {
        if (xpRes.data) setXp(xpRes.data);
        if (subRes.data?.tier) setTier(subRes.data.tier);
      });
    });
  }, []);

  return (
    <aside className="hidden xl:block fixed right-0 top-16 bottom-0 w-72 border-l border-zinc-800 bg-background overflow-y-auto">
      <div className="p-4 space-y-4">
        {xp && (
          <Link href="/rewards">
            <div className="p-4 rounded-xl bg-card border border-zinc-800 hover:border-brand-orange/30 transition-colors">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-orange" />
                <span className="text-xs font-bold text-white">
                  Level {Number(xp.current_level ?? 1)}
                </span>
              </div>
              <div className="mt-1 text-xs text-brand-orange">
                {String(xp.level_title ?? "Task Starter")}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-lg font-black text-white">
                    {Number(xp.total_xp ?? 0)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Total XP</div>
                </div>
                <div>
                  <div className="text-lg font-black text-white">
                    {Number(xp.gigs_completed ?? 0)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Gigs Done</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-brand-orange text-center">
                Spend XP →
              </div>
            </div>
          </Link>
        )}

        {tier === "free" && (
          <Link href="/subscription">
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-orange/10 to-orange-600/10 border border-brand-orange/20 hover:border-brand-orange/40 transition-colors">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
              <h3 className="mt-2 text-sm font-bold text-white">
                Upgrade to Pro
              </h3>
              <p className="mt-1 text-[11px] text-zinc-400">
                Save 40% on commissions, unlock AI features, and get priority
                placement.
              </p>
              <div className="mt-3 text-xs text-brand-orange font-medium">
                View Plans →
              </div>
            </div>
          </Link>
        )}

        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-brand-orange" />
            <h3 className="text-xs font-bold text-white">Pro Tips</h3>
          </div>
          <ul className="space-y-2 text-[11px] text-zinc-400">
            <li>• Complete your profile to get 2x more applications</li>
            <li>• Respond to messages fast — fast responders get hired more</li>
            <li>• Upload portfolio photos to build trust</li>
            <li>• Check the jobs map to find local work</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
