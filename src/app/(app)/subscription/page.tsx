"use client";

import { Suspense } from "react";

import {
  CheckCircle,
  Zap,
  Crown,
  Rocket,
  Building2,
  TrendingUp,
  Gem,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

// Features marked with ⚡ are coming soon
const GIGGER_TIERS = [
  {
    key: "free",
    name: "Free Gigger",
    price: 0,
    icon: Zap,
    features: [
      { text: "Unlimited job applications", built: true },
      { text: "Unlimited job posting", built: true },
      { text: "Portfolio uploads", built: true },
      { text: "Full messaging", built: true },
      { text: "3% commission on earnings", built: true },
      { text: "Shop listings", built: true },
      { text: "Basic shop listings", built: true },
      { text: "3 AI assists per day", built: true },
    ],
  },
  {
    key: "pro",
    name: "Pro Gigger",
    price: 7.99,
    icon: Crown,
    popular: true,
    features: [
      { text: "Everything in Free", built: true },
      { text: "2% commission (save 33%)", built: true },
      { text: "10 AI assists per day", built: true },
      { text: "Unlimited AI rewrites", built: true },
      { text: "Bundle deals & package tiers", built: true },
      { text: "AI pricing suggestions (3/day)", built: true },
      { text: "All sizes & colors on products", built: true },
      { text: "Pro badge on profile", built: true },
      { text: "Priority search placement", built: true },
      { text: "Instant job alerts", built: true },
    ],
  },
  {
    key: "elite",
    name: "Elite Gigger",
    price: 14.99,
    icon: Rocket,
    features: [
      { text: "Everything in Pro", built: true },
      { text: "0% commission (keep everything)", built: true },
      { text: "Unlimited AI features", built: true },
      { text: "Unlimited AI pricing", built: true },
      { text: "AI conversation assist", built: true },
      { text: "Elite badge on profile", built: true },
      { text: "Top search placement", built: true },
      { text: "AI job matching (weekly picks)", built: false },
      { text: "Priority customer support", built: false },
    ],
  },
];

const BUSINESS_TIERS = [
  {
    key: "business_starter",
    name: "Business Starter",
    price: 29.99,
    icon: Building2,
    features: [
      { text: "Company profile page", built: true },
      { text: "Unlimited job posting", built: true },
      { text: "Full messaging with giggers", built: true },
      { text: "7% service fee on hires", built: true },
      { text: "AI-powered job descriptions", built: true },
      { text: "Business badge on listings", built: true },
      { text: "Applicant management dashboard", built: false },
    ],
  },
  {
    key: "business_growth",
    name: "Business Growth",
    price: 79.99,
    icon: TrendingUp,
    popular: true,
    features: [
      { text: "Everything in Starter", built: true },
      { text: "5% service fee (save 29%)", built: true },
      { text: "Unlimited AI features", built: true },
      { text: "Talent pool (save giggers)", built: true },
      { text: "Invoice generation", built: true },
      { text: "Analytics dashboard", built: true },
      { text: "Priority support", built: false },
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 199.99,
    icon: Gem,
    features: [
      { text: "Everything in Growth", built: true },
      { text: "3% service fee (save 57%)", built: true },
      { text: "Dedicated account manager", built: false },
      { text: "ATS webhook integration", built: false },
      { text: "Private talent pool", built: true },
      { text: "Custom branding", built: false },
      { text: "Bulk hiring tools", built: false },
    ],
  },
];

function SubscriptionPageInner() {
  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<"gigger" | "business">("gigger");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccess(true);
      const tier = searchParams.get("tier");
      if (tier) setCurrentTier(tier);
    }

    if (searchParams.get("tab") === "business") {
      setTab("business");
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("nexgigs_subscriptions")
        .select("tier, status")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data: subs }) => {
          if (subs && subs.length > 0) {
            setCurrentTier(subs[0].tier);
            // Auto-select the right tab based on current tier
            const businessTierKeys = ["business_starter", "business_growth", "enterprise"];
            if (businessTierKeys.includes(subs[0].tier)) {
              setTab("business");
            }
          }
        });
    });
  }, [searchParams]);

  async function handleSubscribe(tier: string) {
    if (tier === "free" || tier === currentTier) return;
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
        setLoading(null);
      }
    } catch {
      alert("Failed to start checkout. Try again.");
      setLoading(null);
    }
  }

  const tiers = tab === "gigger" ? GIGGER_TIERS : BUSINESS_TIERS;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/settings" />
      <h1 className="text-xl font-black text-white mb-1">Upgrade Your Plan</h1>
      <p className="text-sm text-zinc-400 mb-4">
        {tab === "gigger"
          ? "Earn more, get seen first, and keep more of what you make."
          : "Hire local talent at scale with powerful business tools."}
      </p>

      {/* Tab Toggle */}
      <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-1 mb-6">
        <button
          onClick={() => setTab("gigger")}
          className={cn(
            "flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors",
            tab === "gigger"
              ? "bg-brand-orange text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          For Giggers
        </button>
        <button
          onClick={() => setTab("business")}
          className={cn(
            "flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors",
            tab === "business"
              ? "bg-brand-orange text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          For Businesses
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-green-900/30 border border-green-700/50 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
          <p className="mt-1 text-sm text-green-300">Subscription activated! Your plan is now active.</p>
        </div>
      )}

      <div className="space-y-4">
        {tiers.map((tier) => {
          const isCurrent = tier.key === currentTier;
          return (
            <div
              key={tier.key}
              className={cn(
                "p-4 rounded-xl border",
                tier.popular ? "border-brand-orange bg-brand-orange/5" : isCurrent ? "border-zinc-600 bg-card" : "border-zinc-800 bg-card"
              )}
            >
              {tier.popular && <span className="text-xs font-medium text-brand-orange mb-2 block">Recommended</span>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <tier.icon className={cn("w-5 h-5", tier.popular ? "text-brand-orange" : "text-zinc-400")} />
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                </div>
                <div className="text-right">
                  {tier.price === 0 ? (
                    <span className="text-lg font-black text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-white">${tier.price}</span>
                      <span className="text-xs text-zinc-500">/mo</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {tier.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={cn("w-3.5 h-3.5 flex-shrink-0", f.built ? "text-brand-orange" : "text-zinc-600")} />
                    <span className={f.built ? "text-zinc-300" : "text-zinc-500"}>{f.text}</span>
                    {!f.built && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-medium">Soon</span>}
                  </div>
                ))}
              </div>
              <Button
                className="w-full mt-4"
                variant={isCurrent ? "secondary" : tier.popular ? "primary" : "outline"}
                disabled={isCurrent || loading === tier.key}
                onClick={() => handleSubscribe(tier.key)}
              >
                {loading === tier.key ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : isCurrent ? (
                  "Current Plan"
                ) : tier.price === 0 ? (
                  "Free"
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-20 flex justify-center"><div className="w-6 h-6 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>}>
      <SubscriptionPageInner />
    </Suspense>
  );
}
