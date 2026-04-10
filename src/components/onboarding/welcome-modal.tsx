"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Briefcase,
  Hammer,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { markWelcomeSeen } from "@/lib/actions/onboarding";

type WelcomeModalProps = {
  firstName: string;
};

/**
 * Full-screen onboarding modal shown once to new members.
 *
 * Offers three next steps: build profile with AI, take a tour,
 * or skip. Any interaction calls `markWelcomeSeen()` so the
 * modal never re-appears for this user.
 */
export function WelcomeModal({ firstName }: WelcomeModalProps) {
  const [open, setOpen] = useState(true);
  const [, startTransition] = useTransition();

  if (!open) return null;

  const markSeen = () => {
    startTransition(() => {
      void markWelcomeSeen();
    });
  };

  const handleClose = () => {
    markSeen();
    setOpen(false);
  };

  const handleAiProfile = () => {
    markSeen();
    // Link handles navigation; modal will unmount on route change.
  };

  const handleTour = () => {
    markSeen();
    setOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexgigs:start-tour"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-brand-orange/30 shadow-2xl overflow-hidden">
        {/* Decorative gradient glow */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand-orange/10 via-transparent to-transparent" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Close welcome modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-orange" />
            <span className="text-[11px] uppercase tracking-wider text-brand-orange font-bold">
              Welcome aboard
            </span>
          </div>
          <h2
            id="welcome-modal-title"
            className="text-2xl font-black text-white leading-tight"
          >
            Welcome to NexGigs, {firstName}! <span aria-hidden="true">👋</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            You can earn money, hire local help, sell in the shop, and more —
            all in one place.
          </p>

          {/* Feature highlights */}
          <div className="mt-5 space-y-2">
            <FeatureRow
              icon={<Briefcase className="w-4 h-4 text-brand-orange" />}
              emoji="💼"
              title="Earn from your skills"
              description="Get hired for gigs near you"
            />
            <FeatureRow
              icon={<Hammer className="w-4 h-4 text-brand-orange" />}
              emoji="🔨"
              title="Hire trusted locals"
              description="Post a job and find help fast"
            />
            <FeatureRow
              icon={<ShoppingBag className="w-4 h-4 text-brand-orange" />}
              emoji="🛒"
              title="Buy & sell in the shop"
              description="Products and services in your area"
            />
          </div>

          {/* Business note */}
          <div className="mt-5 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <span className="text-green-400 font-semibold">
                Representing a business?
              </span>{" "}
              You can set up your company profile anytime from Settings.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-2">
            <Link
              href="/settings/ai-profile"
              onClick={handleAiProfile}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white text-sm font-bold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Build My Profile with AI
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={handleTour}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-semibold transition-colors"
            >
              Take a Tour
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type FeatureRowProps = {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
};

function FeatureRow({ icon, emoji, title, description }: FeatureRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
      <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
        <span className="text-base" aria-hidden="true">
          {emoji}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {icon}
          <h3 className="text-sm font-bold text-white truncate">{title}</h3>
        </div>
        <p className="text-[11px] text-zinc-400 truncate">{description}</p>
      </div>
    </div>
  );
}
