"use client";

import { BookOpen, ArrowRight } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LearnPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />

      <div className="flex flex-col items-center text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8 text-brand-orange" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2">
          Learn &amp; Tutoring — Coming Soon
        </h1>

        <p className="text-sm text-zinc-400 max-w-md mb-4">
          Find tutors, take courses, and build new skills — all from people in
          your community.
        </p>

        <p className="text-sm text-zinc-500 mb-8">
          We&apos;re building Learn right now. Check back soon!
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
