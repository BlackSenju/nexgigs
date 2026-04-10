"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Search,
  ClipboardList,
  Handshake,
  BarChart3,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Building2,
    title: "Set Up Your Profile",
    description: "Create your company profile so giggers know who you are and what you hire for.",
  },
  {
    step: 2,
    icon: ClipboardList,
    title: "Post Jobs",
    description: "Describe the work you need done, set your budget, and post to the NexGigs marketplace.",
  },
  {
    step: 3,
    icon: Search,
    title: "Review Applicants",
    description: "Browse applications, check ratings and portfolios, and pick the best gigger for the job.",
  },
  {
    step: 4,
    icon: Handshake,
    title: "Hire & Pay",
    description: "Hire your chosen gigger, track progress with milestones, and pay securely through NexGigs.",
  },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: 29.99,
    tier: "business_starter",
    features: [
      "Company profile page",
      "Unlimited job posting",
      "AI-powered job descriptions",
      "Full gigger messaging",
      "7% service fee",
    ],
  },
  {
    name: "Growth",
    price: 79.99,
    tier: "business_growth",
    popular: true,
    features: [
      "Everything in Starter",
      "5% service fee (save 29%)",
      "Unlimited AI features",
      "Talent pool (coming soon)",
      "Analytics dashboard (coming soon)",
    ],
  },
  {
    name: "Enterprise",
    price: 199.99,
    tier: "enterprise",
    features: [
      "Everything in Growth",
      "3% service fee (save 57%)",
      "Dedicated support (coming soon)",
      "ATS integration (coming soon)",
      "Custom branding (coming soon)",
    ],
  },
];


export default function BusinessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <BackButton fallbackHref="/dashboard" />

      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-brand-orange" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">
          Hire Local Talent for Your Business
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Post jobs, manage applicants, and hire skilled giggers in your area.
          From one-off tasks to ongoing contracts.
        </p>
        <div className="flex gap-3 justify-center mt-5">
          <Link href="/business/setup">
            <Button variant="primary" size="lg">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link href="/subscription?tab=business">
            <Button variant="outline" size="lg">
              View Pricing
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Active Giggers", value: "10K+" },
          { label: "Avg. Hire Time", value: "< 24h" },
          { label: "Satisfaction", value: "4.9/5" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-xl bg-card border border-zinc-800 text-center"
          >
            <p className="text-lg font-black text-brand-orange">{stat.value}</p>
            <p className="text-[11px] text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">How It Works</h2>
        <div className="space-y-3">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-3 p-4 rounded-xl bg-card border border-zinc-800"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4.5 h-4.5 text-brand-orange" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded">
                    Step {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-zinc-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Built for Businesses</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: "Team Hiring", desc: "Add team members to help manage" },
            { icon: FileText, label: "Invoicing", desc: "Auto-generated invoices" },
            { icon: CreditCard, label: "Secure Payments", desc: "Escrow-protected transactions" },
            { icon: TrendingUp, label: "Analytics", desc: "Track hiring performance" },
            { icon: BarChart3, label: "Talent Pool", desc: "Save your favorite giggers" },
            { icon: Search, label: "Smart Matching", desc: "Find the right skills fast" },
          ].map((f) => (
            <div
              key={f.label}
              className="p-3 rounded-xl bg-card border border-zinc-800"
            >
              <f.icon className="w-5 h-5 text-brand-orange mb-1.5" />
              <p className="text-sm font-semibold text-white">{f.label}</p>
              <p className="text-[11px] text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Business Plans</h2>
        <div className="space-y-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "p-4 rounded-xl border",
                tier.popular
                  ? "border-brand-orange bg-brand-orange/5"
                  : "border-zinc-800 bg-card"
              )}
            >
              {tier.popular && (
                <span className="text-xs font-medium text-brand-orange mb-2 block">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <div>
                  <span className="text-2xl font-black text-white">
                    ${tier.price}
                  </span>
                  <span className="text-xs text-zinc-500">/mo</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {tier.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-sm text-zinc-300"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href={`/subscription?tab=business`}>
                <Button
                  className="w-full mt-4"
                  variant={tier.popular ? "primary" : "outline"}
                >
                  Subscribe Now
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* What Businesses Say */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">
          What Businesses Say
        </h2>
        <div className="p-6 rounded-xl bg-card border border-zinc-800 text-center">
          <Star className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">
            Testimonials coming soon — be one of our first business customers!
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 rounded-xl border border-brand-orange/30 bg-brand-orange/5 text-center">
        <h3 className="text-lg font-bold text-white mb-1">
          Ready to start hiring?
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Set up your business profile in under 2 minutes.
        </p>
        <Link href="/business/setup">
          <Button variant="primary" size="lg">
            Create Company Profile <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
