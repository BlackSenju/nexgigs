"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { applyToJob } from "@/lib/actions/jobs";
import { trackJobView, trackViewDuration, toggleSaveJob, isJobSaved } from "@/lib/actions/analytics";
import { Disclaimer } from "@/components/ui/disclaimer";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DISCLAIMERS } from "@/lib/legal";
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
  Loader2,
} from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewStart] = useState(Date.now());

  // Track view on mount
  useEffect(() => {
    if (id) {
      trackJobView(id as string).catch(() => {});
      isJobSaved(id as string).then(setSaved).catch(() => {});
    }
    // Track duration on unmount
    return () => {
      if (id) {
        const seconds = Math.round((Date.now() - viewStart) / 1000);
        if (seconds > 2) {
          trackViewDuration(id as string, seconds).catch(() => {});
        }
      }
    };
  }, [id, viewStart]);

  async function handleToggleSave() {
    if (!id) return;
    const result = await toggleSaveJob(id as string);
    if (!result.error) setSaved(result.saved);
  }

  useEffect(() => {
    async function fetchJob() {
      const supabase = createClient();
      const { data } = await supabase
        .from("nexgigs_jobs")
        .select(`
          *,
          poster:nexgigs_profiles!poster_id(
            id, first_name, last_initial, city, state, neighborhood,
            verification_tier, identity_verified, created_at
          ),
          milestones:nexgigs_milestones(*)
        `)
        .eq("id", id)
        .single();

      if (data) {
        // Get poster rating + xp
        const [{ data: rating }, { data: xp }] = await Promise.all([
          supabase.from("nexgigs_user_ratings").select("*").eq("user_id", data.poster_id).single(),
          supabase.from("nexgigs_user_xp").select("*").eq("user_id", data.poster_id).single(),
        ]);
        setJob({ ...data, poster_rating: rating, poster_xp: xp });

        // Check if current user already applied
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existing } = await supabase
            .from("nexgigs_applications")
            .select("id")
            .eq("job_id", id)
            .eq("gigger_id", user.id)
            .maybeSingle();
          if (existing) setApplied(true);
        }
      }
      setLoading(false);
    }
    if (id) fetchJob();
  }, [id]);

  async function handleApply() {
    setSubmitting(true);
    setApplyError(null);
    const result = await applyToJob(
      id as string,
      bidAmount ? Number(bidAmount) : null,
      message
    );
    if (result.error) {
      setApplyError(result.error);
      setSubmitting(false);
      return;
    }
    setApplied(true);
    setShowApply(false);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-500">Job not found.</p>
        <Link href="/jobs"><Button variant="outline" size="sm" className="mt-4">Back to Jobs</Button></Link>
      </div>
    );
  }

  const poster = job.poster as Record<string, unknown> | null;
  const posterRating = job.poster_rating as Record<string, unknown> | null;
  const posterXp = job.poster_xp as Record<string, unknown> | null;
  const milestones = (job.milestones as Array<Record<string, unknown>>) ?? [];

  function formatPrice() {
    if (job!.hourly_rate) return `$${job!.hourly_rate}/hr`;
    if (job!.price) return `$${job!.price}`;
    if (job!.price_min && job!.price_max) return `$${job!.price_min}–$${job!.price_max}`;
    return "Open bid";
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/jobs" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-card transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleSave}
            className={`p-2 rounded-lg transition-colors ${saved ? "text-brand-orange bg-brand-orange/10" : "text-zinc-400 hover:text-white hover:bg-card"}`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
            {job.category as string}
          </span>
          {Boolean(job.is_urgent) && (
            <span className="flex items-center gap-1 text-xs font-medium text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> Urgent
            </span>
          )}
        </div>
        <h1 className="text-2xl font-black text-white">{job.title as string}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {job.neighborhood ? `${job.neighborhood as string}, ` : ""}{job.city as string}, {job.state as string}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {job.duration_type as string}
          </span>
          {Boolean(job.start_date) && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {job.start_date as string}
            </span>
          )}
        </div>
      </div>

      {/* Price card */}
      <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Budget</div>
            <div className="text-3xl font-black text-white">{formatPrice()}</div>
          </div>
          <div className="text-right text-sm text-zinc-400">
            <div>{job.views_count as number ?? 0} views</div>
            <div>{job.applications_count as number ?? 0} applicants</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-2">About this job</h2>
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
          {job.description as string}
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">Requirements</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Users className="w-4 h-4 text-zinc-500" />
            <span>{job.team_size_needed as number ?? 1} person needed</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Shield className="w-4 h-4 text-zinc-500" />
            <span>{job.requires_background_check ? "Background check required" : "No background check required"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <CheckCircle className="w-4 h-4 text-zinc-500" />
            <span>{job.requires_license ? "License required" : "No license required"}</span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-3">Milestones</h2>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.id as string} className="flex items-center justify-between p-3 rounded-lg bg-card border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold flex items-center justify-center">
                    {m.milestone_number as number}
                  </div>
                  <span className="text-sm text-zinc-300">{m.title as string}</span>
                </div>
                {Number(m.amount) > 0 && <span className="text-sm font-bold text-white">${Number(m.amount)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Poster info */}
      {poster && (
        <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800">
          <h2 className="text-lg font-bold text-white mb-3">Posted by</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
              <User className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {poster.first_name as string} {poster.last_initial as string}.
                </span>
                {posterRating && Number(posterRating.average_rating) > 0 && (
                  <span className="flex items-center gap-0.5 text-sm text-brand-orange">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {Number(posterRating.average_rating).toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400">
                {posterXp ? `${posterXp.level_title}` : "New member"} &middot;{" "}
                {posterXp ? `${posterXp.jobs_posted} jobs posted` : ""}
              </div>
            </div>
          </div>
          <Link href={`/profile/${poster.id}`}>
            <Button variant="ghost" size="sm" className="mt-3 w-full">View Profile</Button>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <Disclaimer text={DISCLAIMERS.hiringGeneral} className="mt-6" />

      {/* Apply section */}
      <div className="mt-6 sticky bottom-20 sm:bottom-4">
        {applied ? (
          <div className="p-4 rounded-xl bg-green-900/30 border border-green-700/50 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto" />
            <p className="mt-2 text-sm font-medium text-green-300">Application submitted!</p>
          </div>
        ) : showApply ? (
          <div className="p-4 rounded-xl bg-card border border-zinc-700 space-y-3">
            <h3 className="font-bold text-white">Apply for this gig</h3>
            {applyError && (
              <div className="p-2 rounded-lg bg-brand-red/10 text-brand-red text-sm">{applyError}</div>
            )}
            <CurrencyInput
              label="Your bid"
              value={bidAmount}
              onChange={setBidAmount}
              placeholder={job.price ? String(job.price) : "0.00"}
              min={10}
            />
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Message to poster</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Why you're the right person for this job..." rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-zinc-700 text-white text-sm focus:outline-none focus:border-brand-orange resize-none" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowApply(false)} disabled={submitting}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={handleApply} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button size="lg" className="flex-1" onClick={() => setShowApply(true)}>Apply Now</Button>
            <Button variant="outline" size="lg"><MessageSquare className="w-4 h-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
