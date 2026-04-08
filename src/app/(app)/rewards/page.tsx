"use client";

import { useState, useEffect } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Zap, Award, Crown, Rocket, Eye, Bell, Palette,
  Gift, DollarSign, Loader2, CheckCircle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  name: string;
  description: string;
  xpCost: number;
  icon: React.ComponentType<{ className?: string }>;
  category: "badge" | "boost" | "feature" | "cash";
  comingSoon?: boolean;
}

const REWARDS: Reward[] = [
  { id: "badge-color", name: "Custom Badge Color", description: "Customize your profile badge color", xpCost: 500, icon: Palette, category: "badge" },
  { id: "featured-24h", name: "Featured in Search", description: "Appear at the top of search results for 24 hours", xpCost: 1000, icon: Eye, category: "boost" },
  { id: "trusted-badge", name: "Trusted Badge", description: "Show a \"Trusted\" badge on your profile permanently", xpCost: 2000, icon: CheckCircle, category: "badge" },
  { id: "priority-alerts", name: "Priority Job Alerts", description: "See new jobs 1 hour before everyone else for 30 days", xpCost: 3000, icon: Bell, category: "feature" },
  { id: "profile-highlight", name: "Gold Profile", description: "Gold border on your profile for 7 days", xpCost: 5000, icon: Crown, category: "badge" },
  { id: "free-boost", name: "Free Job Boost", description: "Push one of your jobs to the top of the feed", xpCost: 7500, icon: Rocket, category: "boost" },
  { id: "pro-badge", name: "NexGigs Pro Badge", description: "Permanent \"NexGigs Pro\" badge on your profile", xpCost: 10000, icon: Award, category: "badge" },
  { id: "cash-5", name: "$5 NexGigs Credit", description: "Redeem for $5 credit towards any gig", xpCost: 25000, icon: DollarSign, category: "cash", comingSoon: true },
  { id: "cash-10", name: "$10 NexGigs Credit", description: "Redeem for $10 credit towards any gig", xpCost: 50000, icon: DollarSign, category: "cash", comingSoon: true },
  { id: "cash-25", name: "$25 NexGigs Credit", description: "Redeem for $25 credit towards any gig", xpCost: 100000, icon: DollarSign, category: "cash", comingSoon: true },
  { id: "advance-50", name: "$50 Cash Advance", description: "Get $50 advance on your next gig earnings", xpCost: 15000, icon: Gift, category: "cash", comingSoon: true },
  { id: "advance-100", name: "$100 Cash Advance", description: "Get $100 advance on your next gig earnings", xpCost: 30000, icon: Gift, category: "cash", comingSoon: true },
];

const TABS = ["All", "Badges", "Boosts", "Features", "Cash"];

export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [levelTitle, setLevelTitle] = useState("Task Starter");
  const [activeTab, setActiveTab] = useState("All");
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("nexgigs_user_xp")
        .select("total_xp, current_level, level_title")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setUserXp(Number(data.total_xp ?? 0));
        setUserLevel(Number(data.current_level ?? 1));
        setLevelTitle(String(data.level_title ?? "Task Starter"));
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredRewards = REWARDS.filter((r) => {
    if (activeTab === "All") return true;
    if (activeTab === "Badges") return r.category === "badge";
    if (activeTab === "Boosts") return r.category === "boost";
    if (activeTab === "Features") return r.category === "feature";
    if (activeTab === "Cash") return r.category === "cash";
    return true;
  });

  async function handleRedeem(reward: Reward) {
    if (reward.comingSoon || userXp < reward.xpCost) return;
    setRedeeming(reward.id);
    // TODO: Implement actual redemption — deduct XP, grant reward
    await new Promise((r) => setTimeout(r, 1000));
    setRedeeming(null);
    alert("Reward redeemed! This feature is being activated for your account.");
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/profile/me" />
      <h1 className="text-xl font-black text-white mb-1">XP Rewards</h1>
      <p className="text-sm text-zinc-400 mb-4">
        Spend your XP on rewards, boosts, and perks
      </p>

      {/* XP Balance */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-brand-orange/20 to-brand-orange/5 border border-brand-orange/30 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Your XP Balance</div>
            <div className="text-3xl font-black text-brand-orange">{userXp.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400">Level {userLevel}</div>
            <div className="text-sm font-bold text-white">{levelTitle}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
          <Zap className="w-3 h-3 text-brand-orange" />
          Earn XP by completing gigs, getting 5-star ratings, and hitting milestones
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              activeTab === tab
                ? "bg-brand-orange text-white"
                : "bg-card text-zinc-400 border border-zinc-700 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="space-y-3">
        {filteredRewards.map((reward) => {
          const canAfford = userXp >= reward.xpCost;
          const Icon = reward.icon;

          return (
            <div
              key={reward.id}
              className={cn(
                "p-4 rounded-xl border transition-colors",
                reward.comingSoon
                  ? "bg-card/50 border-zinc-800 opacity-60"
                  : canAfford
                  ? "bg-card border-brand-orange/30 hover:border-brand-orange/50"
                  : "bg-card border-zinc-800"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  reward.category === "cash" ? "bg-green-900/30" :
                  reward.category === "boost" ? "bg-blue-900/30" :
                  reward.category === "feature" ? "bg-purple-900/30" :
                  "bg-brand-orange/10"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    reward.category === "cash" ? "text-green-400" :
                    reward.category === "boost" ? "text-blue-400" :
                    reward.category === "feature" ? "text-purple-400" :
                    "text-brand-orange"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{reward.name}</h3>
                    {reward.comingSoon && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">Coming Soon</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{reward.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1 text-sm font-bold text-brand-orange">
                      <Zap className="w-3.5 h-3.5" />
                      {reward.xpCost.toLocaleString()} XP
                    </span>
                    {reward.comingSoon ? (
                      <span className="flex items-center gap-1 text-xs text-zinc-600">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant={canAfford ? "primary" : "outline"}
                        disabled={!canAfford || redeeming === reward.id}
                        onClick={() => handleRedeem(reward)}
                      >
                        {redeeming === reward.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : canAfford ? (
                          "Redeem"
                        ) : (
                          `Need ${(reward.xpCost - userXp).toLocaleString()} more`
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
