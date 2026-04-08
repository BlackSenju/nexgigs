"use client";

import { useState, useEffect, useCallback } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { redeemReward, getCreditBalance } from "@/lib/actions/rewards";
import {
  Zap, Award, Crown, Rocket, Eye, Bell, Palette,
  Gift, DollarSign, Loader2, CheckCircle, Lock, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  rewardKey: string;
  name: string;
  description: string;
  xpCost: number;
  icon: React.ComponentType<{ className?: string }>;
  category: "badge" | "boost" | "feature" | "cash";
  comingSoon?: boolean;
}

const REWARDS: Reward[] = [
  { id: "badge-color", rewardKey: "custom_badge_color", name: "Custom Badge Color", description: "Customize your profile badge color", xpCost: 500, icon: Palette, category: "badge" },
  { id: "featured-24h", rewardKey: "featured_search", name: "Featured in Search", description: "Appear at the top of search results for 24 hours", xpCost: 1000, icon: Eye, category: "boost", comingSoon: true },
  { id: "trusted-badge", rewardKey: "trusted_badge", name: "Trusted Badge", description: "Show a \"Trusted\" badge on your profile permanently", xpCost: 2000, icon: CheckCircle, category: "badge" },
  { id: "priority-alerts", rewardKey: "priority_alerts", name: "Priority Job Alerts", description: "See new jobs 1 hour before everyone else for 30 days", xpCost: 3000, icon: Bell, category: "feature", comingSoon: true },
  { id: "profile-highlight", rewardKey: "gold_profile_7d", name: "Gold Profile", description: "Gold border on your profile for 7 days", xpCost: 5000, icon: Crown, category: "badge" },
  { id: "free-boost", rewardKey: "free_boost", name: "Free Job Boost", description: "Push one of your jobs to the top of the feed", xpCost: 7500, icon: Rocket, category: "boost", comingSoon: true },
  { id: "pro-badge", rewardKey: "nexgigs_pro_badge", name: "NexGigs Pro Badge", description: "Permanent \"NexGigs Pro\" badge on your profile", xpCost: 10000, icon: Award, category: "badge" },
  { id: "credit-5", rewardKey: "credit_5", name: "$5 NexGigs Credit", description: "Redeem for $5 credit towards any gig", xpCost: 25000, icon: DollarSign, category: "cash" },
  { id: "credit-10", rewardKey: "credit_10", name: "$10 NexGigs Credit", description: "Redeem for $10 credit towards any gig", xpCost: 50000, icon: DollarSign, category: "cash" },
  { id: "credit-25", rewardKey: "credit_25", name: "$25 NexGigs Credit", description: "Redeem for $25 credit towards any gig", xpCost: 100000, icon: DollarSign, category: "cash" },
  { id: "advance-50", rewardKey: "cash_advance_50", name: "$50 Cash Advance", description: "Get $50 advance on your next gig earnings", xpCost: 15000, icon: Gift, category: "cash", comingSoon: true },
  { id: "advance-100", rewardKey: "cash_advance_100", name: "$100 Cash Advance", description: "Get $100 advance on your next gig earnings", xpCost: 30000, icon: Gift, category: "cash", comingSoon: true },
];

const TABS = ["All", "Badges", "Boosts", "Features", "Cash"];

export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [levelTitle, setLevelTitle] = useState("Task Starter");
  const [activeTab, setActiveTab] = useState("All");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);
  const [ownedBadges, setOwnedBadges] = useState<Set<string>>(new Set());
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load XP data
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

    // Load credit balance and owned badges
    const creditData = await getCreditBalance();
    setCreditBalance(creditData.balance);

    const owned = new Set<string>(
      creditData.history
        .filter((row: any) => row.type === "redeemed" && Number(row.amount) === 0)
        .map((row: any) => row.description as string)
    );
    setOwnedBadges(owned);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRewards = REWARDS.filter((r) => {
    if (activeTab === "All") return true;
    if (activeTab === "Badges") return r.category === "badge";
    if (activeTab === "Boosts") return r.category === "boost";
    if (activeTab === "Features") return r.category === "feature";
    if (activeTab === "Cash") return r.category === "cash";
    return true;
  });

  function handleRedeemClick(reward: Reward) {
    if (reward.comingSoon || userXp < reward.xpCost) return;
    setConfirmReward(reward);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleConfirmRedeem() {
    if (!confirmReward) return;
    setRedeeming(confirmReward.id);
    setConfirmReward(null);

    try {
      const result = await redeemReward(confirmReward.rewardKey);

      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.success) {
        setUserXp(result.newXp ?? 0);
        setSuccessMessage(`Successfully redeemed ${confirmReward.name}!`);

        // Refresh credit balance and owned badges
        const creditData = await getCreditBalance();
        setCreditBalance(creditData.balance);
        const owned = new Set<string>(
          creditData.history
            .filter((row: any) => row.type === "redeemed" && Number(row.amount) === 0)
            .map((row: any) => row.description as string)
        );
        setOwnedBadges(owned);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setRedeeming(null);
    }
  }

  // Auto-dismiss messages after 4 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

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

      {/* Credit Balance */}
      {creditBalance > 0 && (
        <div className="p-3 rounded-xl bg-green-900/20 border border-green-700/30 mb-3 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-green-400">
              ${creditBalance.toFixed(2)} NexGigs Credit
            </div>
            <div className="text-xs text-zinc-400">Available to spend on gigs</div>
          </div>
        </div>
      )}

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

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-green-900/20 border border-green-700/30 mb-4 flex items-center gap-2 text-sm text-green-400">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-900/20 border border-red-700/30 mb-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-white mb-2">Confirm Redemption</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Spend <span className="text-brand-orange font-bold">{confirmReward.xpCost.toLocaleString()} XP</span> on{" "}
              <span className="text-white font-medium">{confirmReward.name}</span>?
            </p>
            <p className="text-xs text-zinc-500 mb-6">
              Your remaining XP will be {(userXp - confirmReward.xpCost).toLocaleString()}.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmReward(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmRedeem}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

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
          const isOwned = ownedBadges.has(reward.name);
          const Icon = reward.icon;
          const isRedeeming = redeeming === reward.id;

          return (
            <div
              key={reward.id}
              className={cn(
                "p-4 rounded-xl border transition-colors",
                reward.comingSoon
                  ? "bg-card/50 border-zinc-800 opacity-60"
                  : isOwned
                  ? "bg-card/50 border-green-800/40"
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
                    {isOwned && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400">Owned</span>
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
                    ) : isOwned ? (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle className="w-3 h-3" /> Already Owned
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant={canAfford ? "primary" : "outline"}
                        disabled={!canAfford || isRedeeming}
                        onClick={() => handleRedeemClick(reward)}
                      >
                        {isRedeeming ? (
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
