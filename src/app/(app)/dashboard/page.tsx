import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Star, Zap, ShoppingBag, Award } from "lucide-react";

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
        <Link href="/rewards">
          <div className="p-4 rounded-xl bg-card border border-zinc-800 hover:border-brand-orange/30 transition-colors">
            <Zap className="w-5 h-5 text-brand-orange" />
            <div className="mt-2 text-2xl font-black text-white">
              {xp?.total_xp || 0}
            </div>
            <div className="text-xs text-brand-orange">Total XP →</div>
          </div>
        </Link>
        <div className="p-4 rounded-xl bg-card border border-zinc-800">
          <div className="text-lg">$</div>
          <div className="mt-2 text-2xl font-black text-white">
            {Number(xp?.total_earned || 0).toFixed(0)}
          </div>
          <div className="text-xs text-zinc-400">Earned</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/jobs">
          <div className="p-4 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors cursor-pointer">
            <Briefcase className="w-5 h-5 text-brand-orange mb-2" />
            <h3 className="text-sm font-bold text-white">Browse Jobs</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Find gigs near you</p>
          </div>
        </Link>
        <Link href="/jobs/post">
          <div className="p-4 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors cursor-pointer">
            <MapPin className="w-5 h-5 text-brand-orange mb-2" />
            <h3 className="text-sm font-bold text-white">Post a Job</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Find help fast</p>
          </div>
        </Link>
        <Link href="/shop">
          <div className="p-4 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors cursor-pointer">
            <ShoppingBag className="w-5 h-5 text-brand-orange mb-2" />
            <h3 className="text-sm font-bold text-white">Shop</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Buy and sell products & services</p>
          </div>
        </Link>
        <Link href="/rewards">
          <div className="p-4 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors cursor-pointer">
            <Award className="w-5 h-5 text-brand-orange mb-2" />
            <h3 className="text-sm font-bold text-white">XP Rewards</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Spend your XP on badges & perks</p>
          </div>
        </Link>
      </div>

      {/* How to Earn XP */}
      <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-brand-orange" /> How to Earn XP
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
            <span className="text-zinc-400">Complete a gig</span>
            <span className="text-brand-orange font-bold">+100 XP</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
            <span className="text-zinc-400">Get 5-star rating</span>
            <span className="text-brand-orange font-bold">+75 XP</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
            <span className="text-zinc-400">Leave a review</span>
            <span className="text-brand-orange font-bold">+50 XP</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
            <span className="text-zinc-400">First gig ever</span>
            <span className="text-brand-orange font-bold">+500 XP</span>
          </div>
        </div>
        <Link href="/rewards" className="block mt-2 text-center text-xs text-brand-orange hover:underline">
          View all rewards & spend XP →
        </Link>
      </div>
    </div>
  );
}
