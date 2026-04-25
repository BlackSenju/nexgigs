"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  User as UserIcon,
  Building2,
  Plus,
  Clock,
  XCircle,
} from "lucide-react";
import {
  type Business,
  type ActiveIdentity,
  setActiveIdentity,
  getMyBusinesses,
  getActiveIdentity,
} from "@/lib/actions/businesses";

export interface IdentitySwitcherProps {
  /** Display name for the personal identity (used as fallback label). */
  personalLabel: string;
}

/**
 * Top-bar identity switcher. Lets the seller toggle between their personal
 * profile and any business they own. Used in the authenticated navbar.
 *
 * Self-fetches its data on mount so it can drop into any client component
 * (the navbar is already client-side). Calling setActiveIdentity writes a
 * server cookie that validates ownership; we then router.refresh() so
 * server components re-read the cookie.
 */
export function IdentitySwitcher({ personalLabel }: IdentitySwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [active, setActive] = useState<ActiveIdentity>({ kind: "personal" });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        getActiveIdentity(),
        getMyBusinesses(),
      ]);
      setActive(a);
      setBusinesses(b.businesses);
    } catch (err) {
      // Don't let a transient server error make the switcher disappear —
      // we render with default (personal) state instead.
      console.error("[IdentitySwitcher] refresh failed:", err);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Always render the pill — never disappear silently. While loading,
  // show the personal label as a placeholder; once businesses load the
  // dropdown gets populated.

  const activeBusinessId =
    active.kind === "business" ? active.businessId : null;
  const activeLabel =
    active.kind === "business" ? active.business.name : personalLabel;

  async function pick(value: "personal" | { businessId: string }) {
    setBusy(true);
    try {
      const result = await setActiveIdentity(value);
      if (result.ok) {
        setOpen(false);
        await refresh();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        data-testid="identity-switcher"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-brand-orange/40 bg-brand-orange/10 hover:bg-brand-orange/20 hover:ring-brand-orange/60 text-white max-w-[200px] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch identity"
      >
        {active.kind === "business" ? (
          <Building2 className="w-3.5 h-3.5 text-brand-orange shrink-0" />
        ) : (
          <UserIcon className="w-3.5 h-3.5 text-brand-orange shrink-0" />
        )}
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-brand-orange shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl ring-1 ring-black/40 overflow-hidden z-50"
        >
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50">
            Acting as
          </div>

          {/* Personal */}
          <button
            type="button"
            onClick={() => pick("personal")}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900 text-left"
            role="menuitem"
          >
            <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4 text-zinc-300" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-white truncate">
                {personalLabel}
              </span>
              <span className="block text-xs text-zinc-500">Personal</span>
            </span>
            {active.kind === "personal" && (
              <Check className="w-4 h-4 text-brand-orange" />
            )}
          </button>

          {/* Businesses */}
          {businesses.length > 0 && (
            <>
              <div className="border-t border-zinc-800/50" />
              {businesses.map((biz) => {
                const selected = biz.id === activeBusinessId;
                return (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => pick({ businessId: biz.id })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900 text-left"
                    role="menuitem"
                  >
                    <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-brand-orange" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">
                        {biz.name}
                      </span>
                      <span className="block text-xs text-zinc-500 flex items-center gap-1">
                        <span className="truncate">/{biz.slug}</span>
                        <BusinessStatusPill status={biz.status} />
                      </span>
                    </span>
                    {selected && (
                      <Check className="w-4 h-4 text-brand-orange shrink-0" />
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Add new */}
          <div className="border-t border-zinc-800/50" />
          <Link
            href="/businesses/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900 text-brand-orange"
            role="menuitem"
          >
            <span className="w-8 h-8 rounded-full bg-brand-orange/10 ring-1 ring-brand-orange/30 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">
                Add a business
              </span>
              <span className="block text-xs text-zinc-500">
                Get your own branded storefront
              </span>
            </span>
          </Link>

          {businesses.length > 0 && (
            <Link
              href="/businesses"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs text-zinc-400 hover:text-white border-t border-zinc-800/50 text-center"
              role="menuitem"
            >
              Manage all businesses →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function BusinessStatusPill({ status }: { status: Business["status"] }) {
  if (status === "approved") return null;
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 font-bold ml-1">
        <Clock className="w-2.5 h-2.5" />
        Pending
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400 font-bold ml-1">
        <XCircle className="w-2.5 h-2.5" />
        Rejected
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-500 font-bold ml-1">
        Suspended
      </span>
    );
  }
  return null;
}
