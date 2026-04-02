"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  User,
  Star,
  Zap,
  Calendar,
  Users,
  Shield,
  MessageSquare,
  ArrowLeft,
  Share2,
  Bookmark,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

// Sample job data — will be replaced with Supabase query
const SAMPLE_JOB = {
  id: "1",
  title: "Need lawn mowed + hedges trimmed",
  category: "Home & Yard",
  subcategory: "Lawn mowing",
  description: `Front and back yard needs mowing. Hedges along the driveway need trimming. I have all the equipment — just need someone to do the work.

The yard is about 1/4 acre total. Front has a standard grass lawn, back has some uneven areas near the fence.

Hedges are about 4 feet tall, run along the left side of the driveway (about 30 feet).

I'd prefer someone who can come this weekend. Morning works best.`,
  city: "Milwaukee",
  state: "WI",
  neighborhood: "Bay View",
  price: 75,
  duration_type: "One-time",
  job_type: "task",
  is_urgent: true,
  requires_license: false,
  requires_background_check: false,
  team_size_needed: 1,
  milestone_count: 1,
  start_date: "2026-04-05",
  views_count: 42,
  applications_count: 3,
  created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  poster: {
    id: "poster-1",
    first_name: "Sarah",
    last_initial: "M",
    city: "Milwaukee",
    neighborhood: "Bay View",
    rating: 4.8,
    total_ratings: 12,
    level_title: "Trusted Tasker",
    jobs_posted: 8,
    member_since: "2025-11",
  },
  milestones: [
    { number: 1, title: "Complete yard work", percentage: 100, amount: 75 },
  ],
};

export default function JobDetailPage() {
  useParams();
  const [showApply, setShowApply] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [applied, setApplied] = useState(false);

  const job = SAMPLE_JOB;

  function handleApply() {
    setApplied(true);
    setShowApply(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/jobs"
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-card transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-card transition-colors">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
            {job.category}
          </span>
          {job.is_urgent && (
            <span className="flex items-center gap-1 text-xs font-medium text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> Urgent
            </span>
          )}
        </div>
        <h1 className="text-2xl font-black text-white">{job.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {job.neighborhood}, {job.city}, {job.state}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {job.duration_type}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {job.start_date}
          </span>
        </div>
      </div>

      {/* Price card */}
      <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Budget</div>
            <div className="text-3xl font-black text-white">${job.price}</div>
          </div>
          <div className="text-right text-sm text-zinc-400">
            <div>{job.views_count} views</div>
            <div>{job.applications_count} applicants</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-2">About this job</h2>
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
          {job.description}
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">Requirements</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Users className="w-4 h-4 text-zinc-500" />
            <span>{job.team_size_needed} person needed</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Shield className="w-4 h-4 text-zinc-500" />
            <span>
              {job.requires_background_check
                ? "Background check required"
                : "No background check required"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <CheckCircle className="w-4 h-4 text-zinc-500" />
            <span>
              {job.requires_license
                ? "License required"
                : "No license required"}
            </span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      {job.milestones.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-3">Milestones</h2>
          <div className="space-y-2">
            {job.milestones.map((m) => (
              <div
                key={m.number}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold flex items-center justify-center">
                    {m.number}
                  </div>
                  <span className="text-sm text-zinc-300">{m.title}</span>
                </div>
                <span className="text-sm font-bold text-white">${m.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Poster info */}
      <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-3">Posted by</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
            <User className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {job.poster.first_name} {job.poster.last_initial}.
              </span>
              <span className="flex items-center gap-0.5 text-sm text-brand-orange">
                <Star className="w-3.5 h-3.5 fill-current" />
                {job.poster.rating}
              </span>
              <span className="text-xs text-zinc-500">
                ({job.poster.total_ratings} reviews)
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              {job.poster.level_title} &middot; {job.poster.jobs_posted} jobs
              posted &middot; Member since{" "}
              {new Date(job.poster.member_since).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        <Link href={`/profile/${job.poster.id}`}>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            View Profile
          </Button>
        </Link>
      </div>

      {/* Apply section */}
      <div className="mt-6 sticky bottom-20 sm:bottom-4">
        {applied ? (
          <div className="p-4 rounded-xl bg-green-900/30 border border-green-700/50 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto" />
            <p className="mt-2 text-sm font-medium text-green-300">
              Application submitted!
            </p>
          </div>
        ) : showApply ? (
          <div className="p-4 rounded-xl bg-card border border-zinc-700 space-y-3">
            <h3 className="font-bold text-white">Apply for this gig</h3>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Your bid ($)</label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={String(job.price)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-zinc-700 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Message to poster</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why you're the right person for this job..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-zinc-700 text-white text-sm focus:outline-none focus:border-brand-orange resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowApply(false)}
              >
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={handleApply}>
                Submit Application
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setShowApply(true)}
            >
              Apply Now
            </Button>
            <Button variant="outline" size="lg">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
