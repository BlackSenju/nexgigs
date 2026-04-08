"use client";

import { Suspense } from "react";

import { CheckCircle, Zap, Crown, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

const TIERS = [
  {
    key: "free",
    name: "Free Gigger",
    price: 0,
    icon: Zap,
    features: [
      "Unlimited job applications",
      "8 portfolio photos",
      "Standard placement",
      "3% commission on earnings",
      "10 shop listings",
    ],
  },
  {
    key: "pro",
    name: "Pro Gigger",
    price: 7.99,
    icon: Crown,
    popular: true,
    features: [
      "Priority placement in search",
      "Instant job alerts",
      "Unlimited portfolio",
      "2% commission (save 33%)",
      "1 boost per month",
    ],
  },
  {
    key: "elite",
    name: "Elite Gigger",
    price: 14.99,
    icon: Rocket,
    features: [
      "Top placement in all searches",
      "0% commission (keep everything)",
      "Elite badge on profile",
      "3 boosts per month",
      "Shop Pro features free",
      "Priority customer support",
    ],
  },
];

function SubscriptionPageInner() {
  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccess(true);
      const tier = searchParams.get("tier");
      if (tier) setCurrentTier(tier);
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
          if (subs && subs.length > 0) setCurrentTier(subs[0].tier);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/settings" />
      <h1 className="text-xl font-black text-white mb-1">Upgrade Your Plan</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Earn more, get seen first, and keep more of what you make.
      </p>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-green-900/30 border border-green-700/50 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
          <p className="mt-1 text-sm text-green-300">Subscription activated! Your plan is now active.</p>
        </div>
      )}

      <div className="space-y-4">
        {TIERS.map((tier) => {
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
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
                    {f}
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
