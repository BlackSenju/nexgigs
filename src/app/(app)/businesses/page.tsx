import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses, type Business } from "@/lib/actions/businesses";
import {
  Building2,
  Plus,
  Clock,
  Check,
  XCircle,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/businesses");

  const { businesses } = await getMyBusinesses();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">My businesses</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Switch identities anytime via the dropdown in the top bar.
          </p>
        </div>
        <Link
          href="/businesses/new"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold bg-brand-orange hover:bg-brand-orange/90 text-white"
        >
          <Plus className="w-4 h-4" />
          New business
        </Link>
      </div>

      {businesses.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {businesses.map((biz) => (
            <BusinessRow key={biz.id} biz={biz} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BusinessRow({ biz }: { biz: Business }) {
  return (
    <li className="rounded-xl border border-zinc-800 bg-card hover:border-zinc-700 transition-colors">
      <div className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 ring-1 ring-zinc-800 flex items-center justify-center shrink-0">
          {biz.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={biz.logo_url}
              alt={biz.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-zinc-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white truncate">
              {biz.name}
            </h2>
            <StatusBadge status={biz.status} />
          </div>
          <div className="text-xs text-zinc-500 mt-0.5 truncate">
            /store/{biz.slug}
            {biz.city && biz.state && (
              <>
                {" · "}
                {biz.city}, {biz.state}
              </>
            )}
          </div>
        </div>
        {biz.status === "approved" && (
          <Link
            href={`/store/${biz.slug}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            View
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: Business["status"] }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/30 rounded-full px-2 py-0.5">
        <Check className="w-3 h-3" />
        Approved
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30 rounded-full px-2 py-0.5">
        <Clock className="w-3 h-3" />
        Pending review
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 ring-1 ring-red-400/30 rounded-full px-2 py-0.5">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-500/10 ring-1 ring-zinc-500/30 rounded-full px-2 py-0.5">
      Suspended
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
      <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-white mb-1">No businesses yet</h2>
      <p className="text-sm text-zinc-400 max-w-md mx-auto mb-5">
        A business gets you a branded storefront, separate from your personal
        profile. Create one for your clothing line, service, food cart, or
        anything you want to sell.
      </p>
      <Link
        href="/businesses/new"
        className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold bg-brand-orange hover:bg-brand-orange/90 text-white"
      >
        <Plus className="w-4 h-4" />
        Create your first business
      </Link>
    </div>
  );
}
