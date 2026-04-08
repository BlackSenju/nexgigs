"use client";

import { Shield, Clock } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export default function InsurancePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/settings" />
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-brand-orange" />
        <h1 className="text-xl font-black text-white">NexGigs Shield</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Affordable insurance for gig workers.
      </p>

      <div className="py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-brand-orange" />
        </div>
        <h2 className="mt-4 text-xl font-black text-white">Coming Soon</h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
          We are partnering with insurance providers to bring you affordable
          coverage for every gig. Stay tuned.
        </p>
        <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800 max-w-sm mx-auto text-left">
          <h3 className="text-sm font-bold text-white mb-2">What to expect:</h3>
          <ul className="text-xs text-zinc-400 space-y-1.5">
            <li>Per-gig liability coverage</li>
            <li>Monthly plans starting at $5/month</li>
            <li>Property damage protection</li>
            <li>Tool and equipment coverage</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
