"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Globe,
  Users,
  BadgeCheck,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Star,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getBusinessProfile, getBusinessListings } from "@/lib/actions/business";

interface BusinessProfile {
  id: string;
  first_name: string | null;
  last_initial: string | null;
  business_name: string | null;
  business_type: string | null;
  business_description: string | null;
  business_website: string | null;
  business_logo_url: string | null;
  business_verified: boolean;
  hiring_categories: string[];
  team_size: string | null;
  is_poster: boolean;
  created_at: string;
}

interface JobListing {
  id: string;
  title: string;
  category: string;
  city: string;
  state: string;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  hourly_rate: number | null;
  is_urgent: boolean;
  created_at: string;
  applications: { count: number }[];
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  sole_proprietor: "Sole Proprietor",
  llc: "LLC",
  corporation: "Corporation",
  nonprofit: "Nonprofit",
  franchise: "Franchise",
};

const TEAM_SIZE_LABELS: Record<string, string> = {
  "1": "1 person",
  "2-5": "2-5 people",
  "6-10": "6-10 people",
  "11-25": "11-25 people",
  "26-50": "26-50 people",
  "50+": "50+ people",
};

function formatPrice(job: JobListing): string {
  if (job.hourly_rate) return `$${job.hourly_rate}/hr`;
  if (job.price) return `$${job.price}`;
  if (job.price_min && job.price_max) return `$${job.price_min}-$${job.price_max}`;
  return "Open";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function BusinessProfilePage() {
  const params = useParams();
  const businessId = params.id as string;

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [profileRes, jobsRes] = await Promise.all([
        getBusinessProfile(businessId),
        getBusinessListings(businessId),
      ]);

      if (profileRes.error || !profileRes.profile) {
        setError("Business not found");
        setLoading(false);
        return;
      }

      setProfile(profileRes.profile as BusinessProfile);
      setJobs((jobsRes.jobs ?? []) as JobListing[]);
      setLoading(false);
    }

    load();
  }, [businessId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <BackButton fallbackHref="/jobs" />
        <div className="text-center py-12">
          <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">{error ?? "Business not found"}</p>
        </div>
      </div>
    );
  }

  const categoryNames = (profile.hiring_categories ?? [])
    .map((slug) => SERVICE_CATEGORIES.find((c) => c.slug === slug)?.name)
    .filter(Boolean);

  const displayName = profile.business_name || `${profile.first_name ?? ""} ${profile.last_initial ?? ""}`.trim();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <BackButton fallbackHref="/jobs" />

      {/* Header */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-card mb-4">
        <div className="flex items-start gap-4">
          {/* Logo placeholder */}
          <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
            {profile.business_logo_url ? (
              <img
                src={profile.business_logo_url}
                alt={displayName}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-zinc-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white truncate">
                {displayName}
              </h1>
              {profile.business_verified && (
                <BadgeCheck className="w-5 h-5 text-brand-orange flex-shrink-0" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-zinc-400">
              {profile.business_type && (
                <span>{BUSINESS_TYPE_LABELS[profile.business_type] ?? profile.business_type}</span>
              )}
              {profile.team_size && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {TEAM_SIZE_LABELS[profile.team_size] ?? profile.team_size}
                </span>
              )}
            </div>

            {profile.business_website && (
              <a
                href={profile.business_website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand-orange hover:underline mt-1"
              >
                <Globe className="w-3.5 h-3.5" />
                Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {profile.business_description && (
          <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
            {profile.business_description}
          </p>
        )}
      </div>

      {/* Hiring Categories */}
      {categoryNames.length > 0 && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-card mb-4">
          <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-orange" />
            Hiring For
          </h2>
          <div className="flex flex-wrap gap-2">
            {categoryNames.map((name) => (
              <span
                key={name}
                className="px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-xs font-medium text-brand-orange"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Job Listings */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-brand-orange" />
          Active Listings ({jobs.length})
        </h2>

        {jobs.length === 0 ? (
          <div className="p-6 rounded-xl border border-zinc-800 bg-card text-center">
            <p className="text-sm text-zinc-500">No active listings right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block p-4 rounded-xl border border-zinc-800 bg-card hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">
                        {job.title}
                      </h3>
                      {job.is_urgent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-800/50">
                          URGENT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>{job.category}</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {job.city}, {job.state}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(job.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand-orange whitespace-nowrap flex items-center gap-0.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatPrice(job).replace("$", "")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-5 rounded-xl border border-brand-orange/30 bg-brand-orange/5 text-center">
        <h3 className="text-lg font-bold text-white mb-1">
          Want to work with {displayName}?
        </h3>
        <p className="text-sm text-zinc-400 mb-3">
          Browse their listings above and apply to get hired.
        </p>
        <Link href="/jobs">
          <Button variant="primary">Browse All Jobs</Button>
        </Link>
      </div>

      {/* Reviews Placeholder */}
      <div className="mt-4 p-5 rounded-xl border border-zinc-800 bg-card">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-brand-orange" />
          Reviews
        </h2>
        <div className="text-center py-4">
          <Star className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No reviews yet</p>
        </div>
      </div>
    </div>
  );
}
