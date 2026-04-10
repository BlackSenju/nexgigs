"use client";

import Link from "next/link";
import { MapPin, Clock, User, Star, Zap, Crown, Rocket, Building2, Navigation } from "lucide-react";
import { calculateDistance, formatDistance } from "@/lib/distance";

export interface JobCardData {
  id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  neighborhood?: string;
  price?: number;
  price_min?: number;
  price_max?: number;
  hourly_rate?: number;
  duration_type: string;
  is_urgent?: boolean;
  is_remote?: boolean;
  latitude?: number;
  longitude?: number;
  poster_name: string;
  poster_rating?: number;
  poster_tier?: string;
  created_at: string;
  applications_count: number;
}

function formatTimeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

function formatPrice(job: JobCardData) {
  if (job.hourly_rate) return `$${job.hourly_rate}/hr`;
  if (job.price) return `$${job.price}`;
  if (job.price_min && job.price_max) return `$${job.price_min}–$${job.price_max}`;
  return "Open bid";
}

interface JobCardProps {
  job: JobCardData;
  userLat?: number;
  userLon?: number;
}

export function JobCard({ job, userLat, userLon }: JobCardProps) {
  const distance =
    userLat != null && userLon != null && job.latitude != null && job.longitude != null
      ? calculateDistance(userLat, userLon, job.latitude, job.longitude)
      : null;
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="p-4 rounded-xl border border-zinc-800 bg-card hover:border-zinc-600 transition-all active:scale-[0.98]">
        {/* Top row: category + time */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
            {job.category}
          </span>
          <div className="flex items-center gap-2">
            {job.is_urgent && (
              <span className="flex items-center gap-1 text-xs font-medium text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3" /> Urgent
              </span>
            )}
            <span className="text-xs text-zinc-500">{formatTimeAgo(job.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-base font-bold text-white leading-tight">{job.title}</h3>

        {/* Description preview */}
        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{job.description}</p>

        {/* Details row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {job.neighborhood ? `${job.neighborhood}, ${job.city}` : job.city}
          </span>
          {distance != null && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
              <Navigation className="w-2.5 h-2.5" />
              {formatDistance(distance)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {job.duration_type}
          </span>
          {job.is_remote && (
            <span className="text-green-400">Remote OK</span>
          )}
        </div>

        {/* Bottom row: price + poster */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-black text-white">
            {formatPrice(job)}
          </span>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <span>{job.poster_name}</span>
            {job.poster_tier === "pro" && <span title="Pro Gigger"><Crown className="w-3 h-3 text-blue-400" /></span>}
            {job.poster_tier === "elite" && <span title="Elite Gigger"><Rocket className="w-3 h-3 text-purple-400" /></span>}
            {(job.poster_tier === "business_starter" || job.poster_tier === "business_growth" || job.poster_tier === "enterprise") && (
              <span className="flex items-center gap-0.5 text-green-400 text-[10px] font-medium" title="Business">
                <Building2 className="w-3 h-3" /> Biz
              </span>
            )}
            {job.poster_rating && (
              <span className="flex items-center gap-0.5 text-brand-orange">
                <Star className="w-3 h-3 fill-current" />
                {job.poster_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Applications count */}
        {job.applications_count > 0 && (
          <div className="mt-2 text-xs text-zinc-500">
            {job.applications_count} {job.applications_count === 1 ? "applicant" : "applicants"}
          </div>
        )}
      </div>
    </Link>
  );
}
