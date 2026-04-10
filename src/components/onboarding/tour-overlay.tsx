"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  title: string;
  description: string;
  link?: string; // optional URL to navigate to when shown
  icon?: string; // emoji
}

const TOUR_STEPS: ReadonlyArray<TourStep> = [
  {
    title: "Welcome to your Dashboard 🏠",
    description:
      "This is your home base. See your stats, XP level, earnings goals, and quick actions all in one place.",
    icon: "🏠",
  },
  {
    title: "Browse Local Jobs 🔍",
    description:
      "Find gigs near you sorted by distance. Apply with a bid, message the poster, and get hired. Pro members see priority placement.",
    icon: "🔍",
    link: "/jobs",
  },
  {
    title: "Post a Job ➕",
    description:
      "Need help? Post a job in 60 seconds. Our AI helps write descriptions and suggests pricing. Get matched instantly with local workers.",
    icon: "➕",
    link: "/jobs/post",
  },
  {
    title: "The Shop 🛒",
    description:
      "Sell digital products, physical items, services, experiences, or subscriptions. Or browse what others are selling. Works like Etsy but hyperlocal.",
    icon: "🛒",
    link: "/shop",
  },
  {
    title: "Messages 💬",
    description:
      "Chat with clients and giggers. Elite members get AI conversation assist to draft professional replies.",
    icon: "💬",
    link: "/messages",
  },
  {
    title: "Your Profile 👤",
    description:
      "Your profile is your business card. Add a photo, bio, skills, and portfolio. The AI Profile Builder can write everything for you in 60 seconds.",
    icon: "👤",
    link: "/profile/me",
  },
  {
    title: "XP & Rewards 🎁",
    description:
      "Earn XP for completing gigs, getting 5-star ratings, and milestones. Redeem XP for badges, boosts, and NexGigs credits.",
    icon: "🎁",
    link: "/rewards",
  },
  {
    title: "Have a Business? 💼",
    description:
      "If you represent a company, you can set up a business profile with a company page, bulk hiring tools, analytics, and more. Optional — set it up anytime from Settings.",
    icon: "💼",
    link: "/business",
  },
  {
    title: "You're Ready! 🚀",
    description:
      "That's the tour! NexGigs is what you make of it — earn, hire, sell, or do all three. Welcome aboard!",
    icon: "🚀",
  },
] as const;

export function TourOverlay() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Listen for the start-tour event from the welcome modal or settings.
    const handler = () => {
      setStep(0);
      setActive(true);
    };
    window.addEventListener("nexgigs:start-tour", handler);
    return () => window.removeEventListener("nexgigs:start-tour", handler);
  }, []);

  // Close on Escape for accessibility + lock body scroll while active.
  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleClose = useCallback(async () => {
    setActive(false);
    // Mark tour as complete. Fire-and-forget — ignore errors so the user
    // isn't blocked by a transient network failure mid-tour.
    try {
      const { markTourComplete } = await import("@/lib/actions/onboarding");
      await markTourComplete();
    } catch {
      /* ignore */
    }
  }, []);

  const handleNext = useCallback(() => {
    setStep((prev) => {
      if (prev < TOUR_STEPS.length - 1) {
        return prev + 1;
      }
      // Last step — trigger close on next tick so state updates settle.
      handleClose();
      return prev;
    });
  }, [handleClose]);

  const handlePrev = useCallback(() => {
    setStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  if (!active) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="max-w-md w-full bg-card border border-brand-orange/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-zinc-800" aria-hidden="true">
          <div
            className="h-full bg-brand-orange transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <div className="relative">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close tour"
            className="absolute top-3 right-3 p-1 text-zinc-500 hover:text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pt-8">
          {/* Step indicator */}
          <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-2">
            Step {step + 1} of {TOUR_STEPS.length}
          </div>

          {/* Icon */}
          <div className="text-5xl mb-4" aria-hidden="true">
            {current.icon}
          </div>

          {/* Title */}
          <h2 id="tour-title" className="text-xl font-black text-white mb-2">
            {current.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            {current.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={step === 0}
              className="text-zinc-400"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="flex items-center gap-1" aria-hidden="true">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step
                      ? "bg-brand-orange"
                      : i < step
                        ? "bg-brand-orange/40"
                        : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>

            <Button size="sm" onClick={handleNext}>
              {isLast ? (
                <>
                  Done <Check className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip link */}
          {!isLast && (
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors w-full text-center"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
