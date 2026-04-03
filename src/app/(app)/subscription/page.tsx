"use client";

import { CheckCircle, Zap, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Free Gigger",
    price: 0,
    icon: Zap,
    current: true,
    features: [
      "Unlimited job applications",
      "8 portfolio photos",
      "Standard placement",
      "3% commission on earnings",
      "10 shop listings",
    ],
  },
  {
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
      "NFC wristband shipped",
    ],
  },
  {
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

export default function SubscriptionPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/profile/me" />
      <h1 className="text-xl font-black text-white mb-1">Upgrade Your Plan</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Earn more, get seen first, and keep more of what you make.
      </p>

      <div className="space-y-4">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "p-4 rounded-xl border",
              tier.popular
                ? "border-brand-orange bg-brand-orange/5"
                : tier.current
                ? "border-zinc-600 bg-card"
                : "border-zinc-800 bg-card"
            )}
          >
            {tier.popular && (
              <span className="text-xs font-medium text-brand-orange mb-2 block">
                Recommended
              </span>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <tier.icon
                  className={cn(
                    "w-5 h-5",
                    tier.popular ? "text-brand-orange" : "text-zinc-400"
                  )}
                />
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              </div>
              <div className="text-right">
                {tier.price === 0 ? (
                  <span className="text-lg font-black text-white">Free</span>
                ) : (
                  <>
                    <span className="text-2xl font-black text-white">
                      ${tier.price}
                    </span>
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
              variant={tier.current ? "secondary" : tier.popular ? "primary" : "outline"}
              disabled={tier.current}
            >
              {tier.current ? "Current Plan" : `Upgrade to ${tier.name}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
