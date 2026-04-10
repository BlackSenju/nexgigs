"use client";

import { Users, ArrowRight } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GuildsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />

      <div className="flex flex-col items-center text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-brand-orange" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2">
          Guilds — Coming Soon
        </h1>

        <p className="text-sm text-zinc-400 max-w-md mb-4">
          Form teams with other giggers. Take on bigger jobs together. Minimum
          15% pay floor per team member.
        </p>

        <p className="text-sm text-zinc-500 mb-8">
          We&apos;re building Guilds right now. Check back soon!
        </p>

        <Link href="/dashboard">
          <Button variant="outline">
            Back to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
