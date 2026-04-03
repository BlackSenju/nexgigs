"use client";

import { Building2, Users, FileText, CreditCard, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

const BUSINESS_TIERS = [
  {
    name: "Business Starter",
    price: 29.99,
    features: ["10 job posts/month", "Applicant management", "Team hiring (up to 5)", "7% service fee"],
  },
  {
    name: "Business Growth",
    price: 79.99,
    popular: true,
    features: ["Unlimited job posts", "Talent pool access", "Invoice generation", "5% service fee", "Priority support"],
  },
  {
    name: "Enterprise",
    price: 199.99,
    features: ["Everything in Growth", "Dedicated account manager", "ATS webhook integration", "3% service fee", "Private talent pool", "Custom branding"],
  },
];

export default function BusinessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-6 h-6 text-brand-orange" />
        <h1 className="text-xl font-black text-white">NexGigs for Business</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Hire local talent at scale. Manage teams, track invoices, and build your talent pool.
      </p>

      {/* Features overview */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: Users, label: "Team Hiring" },
          { icon: FileText, label: "Invoicing" },
          { icon: CreditCard, label: "Bulk Payments" },
          { icon: TrendingUp, label: "Analytics" },
        ].map((f) => (
          <div
            key={f.label}
            className="p-3 rounded-xl bg-card border border-zinc-800 flex items-center gap-2"
          >
            <f.icon className="w-5 h-5 text-brand-orange" />
            <span className="text-sm text-zinc-300">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {BUSINESS_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`p-4 rounded-xl border ${
              tier.popular
                ? "border-brand-orange bg-brand-orange/5"
                : "border-zinc-800 bg-card"
            }`}
          >
            {tier.popular && (
              <span className="text-xs font-medium text-brand-orange mb-2 block">
                Most Popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <div>
                <span className="text-2xl font-black text-white">${tier.price}</span>
                <span className="text-xs text-zinc-500">/mo</span>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {tier.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-orange" />
                  {f}
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              variant={tier.popular ? "primary" : "outline"}
            >
              Get Started
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
