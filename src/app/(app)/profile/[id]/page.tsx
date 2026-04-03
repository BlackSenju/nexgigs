"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Star,
  MapPin,
  Shield,
  Award,
  MessageSquare,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [skills, setSkills] = useState<Array<Record<string, unknown>>>([]);
  const [portfolio, setPortfolio] = useState<Array<Record<string, unknown>>>([]);
  const [ratings, setRatings] = useState<Array<Record<string, unknown>>>([]);
  const [userRating, setUserRating] = useState<Record<string, unknown> | null>(null);
  const [userXp, setUserXp] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();

      const [
        { data: profileData },
        { data: skillsData },
        { data: portfolioData },
        { data: ratingData },
        { data: xpData },
        { data: reviewsData },
      ] = await Promise.all([
        supabase.from("nexgigs_profiles").select("*").eq("id", id).single(),
        supabase.from("nexgigs_skills").select("*").eq("user_id", id),
        supabase.from("nexgigs_portfolio").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("nexgigs_user_ratings").select("*").eq("user_id", id).single(),
        supabase.from("nexgigs_user_xp").select("*").eq("user_id", id).single(),
        supabase.from("nexgigs_ratings").select(`
          *, rater:nexgigs_profiles!rater_id(first_name, last_initial)
        `).eq("ratee_id", id).order("created_at", { ascending: false }).limit(10),
      ]);

      setProfile(profileData);
      setSkills(skillsData ?? []);
      setPortfolio(portfolioData ?? []);
      setUserRating(ratingData);
      setUserXp(xpData);
      setRatings(reviewsData ?? []);
      setLoading(false);
    }
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-500">Profile not found.</p>
      </div>
    );
  }

  const avgRating = Number(userRating?.average_rating ?? 0);
  const totalRatings = Number(userRating?.total_ratings ?? 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-black text-zinc-400">
            {(profile.first_name as string)[0]}{profile.last_initial as string}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">
              {profile.first_name as string} {profile.last_initial as string}.
            </h1>
            {Boolean(profile.identity_verified) && <Shield className="w-4 h-4 text-brand-orange" />}
          </div>
          <div className="flex items-center gap-1 text-sm text-zinc-400 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {profile.neighborhood ? `${profile.neighborhood as string}, ` : ""}{profile.city as string}, {profile.state as string}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {avgRating > 0 && (
              <span className="flex items-center gap-1 text-sm text-brand-orange font-semibold">
                <Star className="w-4 h-4 fill-current" /> {avgRating.toFixed(1)}
                <span className="text-zinc-500 font-normal">({totalRatings})</span>
              </span>
            )}
            <span className="text-xs text-zinc-500">
              Lvl {Number(userXp?.current_level ?? 1)} &middot; {String(userXp?.level_title ?? "Task Starter")}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <Button className="flex-1"><MessageSquare className="w-4 h-4 mr-1" /> Message</Button>
        <Button variant="outline" className="flex-1">Hire Directly</Button>
      </div>

      {/* Bio */}
      {Boolean(profile.bio) && (
        <div className="mt-6">
          <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio as string}</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{Number(userXp?.gigs_completed ?? 0)}</div>
          <div className="text-xs text-zinc-500">Gigs</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{Number(userRating?.five_star_count ?? 0)}</div>
          <div className="text-xs text-zinc-500">5-Star</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{Number(userRating?.would_hire_again_percentage ?? 0)}%</div>
          <div className="text-xs text-zinc-500">Rehire</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-brand-orange">{Number(userXp?.total_xp ?? 0)}</div>
          <div className="text-xs text-zinc-500">XP</div>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Boolean(profile.identity_verified) && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-orange/10 text-xs text-brand-orange">
            <Shield className="w-3 h-3" /> ID Verified
          </span>
        )}
        {Boolean(profile.background_checked) && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 text-xs text-green-400">
            <CheckCircle className="w-3 h-3" /> Background Checked
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-900/30 text-xs text-purple-400">
          <Award className="w-3 h-3" /> {String(userXp?.level_title ?? "Task Starter")}
        </span>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.id as string} className="px-3 py-1.5 rounded-lg bg-card border border-zinc-800 text-sm text-zinc-300">
                {skill.skill_name as string}
                {Number(skill.experience_years) > 0 && (
                  <span className="text-xs text-zinc-500 ml-1">{skill.experience_years as number}y</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-3">Portfolio</h2>
          <div className="grid grid-cols-3 gap-2">
            {portfolio.map((item) => (
              <div key={item.id as string} className="aspect-square rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center p-2">
                <ImageIcon className="w-6 h-6 text-zinc-600" />
                <span className="text-xs text-zinc-500 mt-1 text-center leading-tight">{item.title as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {ratings.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-3">Reviews ({totalRatings})</h2>
          <div className="space-y-3">
            {ratings.map((review) => {
              const rater = review.rater as Record<string, string> | null;
              return (
                <div key={review.id as string} className="p-4 rounded-xl bg-card border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {rater ? `${rater.first_name} ${rater.last_initial}.` : "Anonymous"}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Number(review.overall_score ?? 0) }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-brand-orange fill-current" />
                      ))}
                    </div>
                  </div>
                  {Boolean(review.review_text) && (
                    <p className="mt-2 text-sm text-zinc-400">{review.review_text as string}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Member info */}
      <div className="mt-6 mb-4 text-center text-xs text-zinc-600">
        <Calendar className="w-3.5 h-3.5 inline mr-1" />
        Member since {new Date(profile.created_at as string).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        {(profile.languages as string[])?.length > 0 && ` · Languages: ${(profile.languages as string[]).join(", ")}`}
      </div>
    </div>
  );
}
