"use client";

import { Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Basic Shield",
    price: 5,
    coverage: 10000,
    description: "Covers property damage during a gig. Perfect for home and yard work.",
    features: ["$10,000 coverage", "Property damage", "Per-gig activation"],
  },
  {
    name: "Pro Shield",
    price: 15,
    coverage: 50000,
    description: "Extended coverage including liability and tools. For verified professionals.",
    features: ["$50,000 coverage", "General liability", "Tool/equipment coverage", "Medical payments"],
    popular: true,
  },
  {
    name: "Team Shield",
    price: 25,
    coverage: 100000,
    description: "Full coverage for guild and team jobs. Covers all team members.",
    features: ["$100,000 coverage", "All team members", "Workers comp", "Project-based"],
  },
];

export default function InsurancePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-brand-orange" />
        <h1 className="text-xl font-black text-white">NexGigs Shield</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Affordable insurance for gig workers. Activate per-job or get a monthly plan.
      </p>

      {/* Plans */}
      <div className="space-y-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`p-4 rounded-xl border ${
              plan.popular
                ? "border-brand-orange bg-brand-orange/5"
                : "border-zinc-800 bg-card"
            }`}
          >
            {plan.popular && (
              <span className="text-xs font-medium text-brand-orange mb-2 block">
                Most Popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="text-right">
                <span className="text-2xl font-black text-white">${plan.price}</span>
                <span className="text-xs text-zinc-500">/month</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
            <div className="mt-3 space-y-1">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-orange" />
                  {f}
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              variant={plan.popular ? "primary" : "outline"}
            >
              Get {plan.name}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
