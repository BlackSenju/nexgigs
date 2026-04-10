"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  X,
  ArrowRight,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  dismissChecklist,
  type OnboardingStatus,
} from "@/lib/actions/onboarding";

type GettingStartedChecklistProps = {
  initialStatus: OnboardingStatus;
};

type ChecklistItem = {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  optional?: boolean;
  icon?: React.ReactNode;
};

/**
 * Getting Started Checklist card shown on the dashboard.
 *
 * Displays 4 required onboarding steps plus an optional business
 * profile step. Users can dismiss it with the X button, which
 * persists via `dismissChecklist()`.
 */
export function GettingStartedChecklist({
  initialStatus,
}: GettingStartedChecklistProps) {
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();

  if (hidden) return null;

  const { steps } = initialStatus;

  const requiredItems: ChecklistItem[] = [
    {
      key: "account",
      label: "Create your account",
      description: "You're signed up and ready to go",
      href: "/dashboard",
      done: steps.accountCreated,
    },
    {
      key: "profile",
      label: "Complete your profile",
      description: "Use AI Profile Builder to write your bio in 60 seconds",
      href: "/settings/ai-profile",
      done: steps.profileComplete,
      icon: <Sparkles className="w-3 h-3 text-brand-orange" />,
    },
    {
      key: "skills",
      label: "Add your skills",
      description: "Tell us what you can do so we can match you with gigs",
      href: "/settings",
      done: steps.skillsAdded,
    },
    {
      key: "payments",
      label: "Set up payments",
      description: "Connect a bank account or debit card to get paid",
      href: "/settings?section=payments",
      done: steps.paymentsSetup,
    },
  ];

  const optionalItems: ChecklistItem[] = [
    {
      key: "business",
      label: "Set up business profile",
      description: "Unlock bulk hiring, analytics, and invoices",
      href: "/business/setup",
      done: steps.businessProfile,
      optional: true,
      icon: <Building2 className="w-3 h-3 text-green-400" />,
    },
  ];

  const completedCount = requiredItems.filter((i) => i.done).length;
  const totalRequired = requiredItems.length;
  const percentComplete = Math.round((completedCount / totalRequired) * 100);
  const allDone = completedCount === totalRequired;

  const handleDismiss = () => {
    setHidden(true);
    startTransition(() => {
      void dismissChecklist();
    });
  };

  return (
    <div className="relative p-5 rounded-xl bg-gradient-to-br from-brand-orange/5 via-zinc-900 to-zinc-900 border border-brand-orange/30 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-brand-orange/5 to-transparent" />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-10"
        aria-label="Dismiss checklist"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 pr-8">
          <Sparkles className="w-4 h-4 text-brand-orange" />
          <h3 className="text-sm font-bold text-white">Getting Started</h3>
        </div>
        <p className="text-[11px] text-zinc-400 mb-3">
          {allDone
            ? "You've completed all the basics!"
            : `Complete these ${totalRequired} steps to get the most out of NexGigs`}
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-[10px] font-bold text-brand-orange">
              {completedCount}/{totalRequired} · {percentComplete}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-orange to-orange-500 transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* All done celebration */}
        {allDone && (
          <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-xs font-bold text-green-400">
              <span aria-hidden="true">🎉</span> You&apos;re all set! Start
              exploring
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="mt-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              Dismiss checklist
            </button>
          </div>
        )}

        {/* Required items */}
        <ul className="space-y-1.5">
          {requiredItems.map((item) => (
            <ChecklistRow key={item.key} item={item} />
          ))}
        </ul>

        {/* Optional items */}
        {optionalItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Optional
            </p>
            <ul className="space-y-1.5">
              {optionalItems.map((item) => (
                <ChecklistRow key={item.key} item={item} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const content = (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
        item.done
          ? "bg-green-500/5 border-green-500/20"
          : "bg-zinc-800/40 border-zinc-800 hover:border-brand-orange/30"
      }`}
    >
      <div className="flex-shrink-0">
        {item.done ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <Circle className="w-5 h-5 text-zinc-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.icon}
          <h4
            className={`text-xs font-bold truncate ${
              item.done ? "text-zinc-400 line-through" : "text-white"
            }`}
          >
            {item.label}
          </h4>
          {item.optional && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-semibold border border-green-500/20">
              Optional
            </span>
          )}
        </div>
        <p className="text-[10px] text-zinc-500 truncate">{item.description}</p>
      </div>
      {!item.done && (
        <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
      )}
    </div>
  );

  if (item.done) {
    return <li>{content}</li>;
  }

  return (
    <li>
      <Link href={item.href} className="block">
        {content}
      </Link>
    </li>
  );
}
