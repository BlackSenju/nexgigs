"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Share2, Check, Eye } from "lucide-react";

export interface OwnerToolbarProps {
  storeUrl: string; // public-facing URL like https://nexgigs.com/store/pure-grounds
  status: "draft" | "published" | "suspended";
}

/**
 * Sticky banner shown at the top of the public storefront page when the
 * viewer is the business owner. Gives them one-click access to the editor
 * and a copy-link share button without leaving the page they're looking at.
 *
 * Hidden for any non-owner viewer.
 */
export function OwnerToolbar({ storeUrl, status }: OwnerToolbarProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — older browsers / privacy mode
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-brand-orange shrink-0" />
          <span className="text-zinc-300 truncate">
            You&apos;re viewing your storefront
          </span>
          <StatusPill status={status} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white ring-1 ring-zinc-800 hover:ring-zinc-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Link copied
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Share
              </>
            )}
          </button>
          <Link
            href="/dashboard/storefront"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: OwnerToolbarProps["status"] }) {
  if (status === "published") {
    return (
      <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/30">
        Live
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30">
        Draft
      </span>
    );
  }
  return (
    <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-500/10 ring-1 ring-zinc-500/30">
      Suspended
    </span>
  );
}
