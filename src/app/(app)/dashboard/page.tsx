import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Star, Zap } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: xp } = await supabase
    .from("nexgigs_user_xp")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">
            Hey, {profile?.first_name || "there"}!
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span>
              {profile?.city}, {profile?.state}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-400">Level {xp?.current_level || 1}</div>
          <div className="text-sm font-bold text-brand-orange">
            {xp?.level_title || "Task Starter"}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <Briefcase className="w-5 h-5 text-brand-orange" />
          <div className="mt-2 text-2xl font-black text-white">
            {xp?.gigs_completed || 0}
          </div>
          <div className="text-xs text-zinc-400">Gigs Done</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <Star className="w-5 h-5 text-brand-orange" />
          <div className="mt-2 text-2xl font-black text-white">--</div>
          <div className="text-xs text-zinc-400">Avg Rating</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <Zap className="w-5 h-5 text-brand-orange" />
          <div className="mt-2 text-2xl font-black text-white">
            {xp?.total_xp || 0}
          </div>
          <div className="text-xs text-zinc-400">Total XP</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <div className="text-lg">$</div>
          <div className="mt-2 text-2xl font-black text-white">
            {Number(xp?.total_earned || 0).toFixed(0)}
          </div>
          <div className="text-xs text-zinc-400">Earned</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Link href="/jobs">
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors cursor-pointer">
            <h3 className="text-lg font-bold text-white">Browse Jobs</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Find gigs in your area and start earning
            </p>
          </div>
        </Link>
        <Link href="/jobs/post">
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors cursor-pointer">
            <h3 className="text-lg font-bold text-white">Post a Job</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Need something done? Post it and find help fast
            </p>
          </div>
        </Link>
      </div>

      {/* Coming Soon */}
      <div className="mt-6 p-6 rounded-xl border border-dashed border-zinc-700 text-center">
        <p className="text-zinc-500">
          Your job feed, active gigs, and alerts will appear here as you get started.
        </p>
        <Link href="/jobs" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Explore Jobs
          </Button>
        </Link>
      </div>
    </div>
  );
}
