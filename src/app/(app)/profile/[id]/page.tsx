"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Shield,
  Award,
  MessageSquare,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
// Sample data
const SAMPLE_PROFILE = {
  id: "gigger-1",
  first_name: "Marcus",
  last_initial: "J",
  city: "Milwaukee",
  state: "WI",
  neighborhood: "Third Ward",
  bio: "Graphic designer and digital artist with 5+ years of experience. Specializing in logos, brand identity, and social media content. I also do murals and live event art.",
  verification_tier: "verified",
  identity_verified: true,
  background_checked: true,
  languages: ["English", "Spanish"],
  rating: 4.8,
  total_ratings: 24,
  five_star_count: 19,
  would_hire_again: 96,
  level: 5,
  level_title: "Pro Gigger",
  total_xp: 8200,
  gigs_completed: 31,
  total_earned: 4850,
  member_since: "2025-06",
  skills: [
    { name: "Logo Design", category: "Creative & Digital", years: 5 },
    { name: "Brand Identity", category: "Creative & Digital", years: 4 },
    { name: "Social Media Graphics", category: "Creative & Digital", years: 3 },
    { name: "Mural Art", category: "Creative & Digital", years: 2 },
  ],
  portfolio: [
    { id: "1", title: "MKE Eats Logo", category: "Logo Design" },
    { id: "2", title: "Bay View Mural", category: "Mural Art" },
    { id: "3", title: "Fitness Brand Package", category: "Brand Identity" },
    { id: "4", title: "Restaurant Menu Design", category: "Graphic Design" },
    { id: "5", title: "Event Flyer Series", category: "Social Media" },
    { id: "6", title: "Podcast Cover Art", category: "Logo Design" },
  ],
  reviews: [
    {
      id: "1",
      rater_name: "Sarah M.",
      rating: 5,
      text: "Marcus absolutely killed the logo design. Quick turnaround and nailed the vibe on the first try. Highly recommend.",
      date: "2026-03-15",
    },
    {
      id: "2",
      rater_name: "Tanya R.",
      rating: 5,
      text: "Did an amazing mural for our community center. Kids love it. Professional and showed up on time every day.",
      date: "2026-02-20",
    },
    {
      id: "3",
      rater_name: "Andre W.",
      rating: 4,
      text: "Good work on the event flyers. Took a couple revisions but end result was solid.",
      date: "2026-01-10",
    },
  ],
};

export default function PublicProfilePage() {
  useParams();
  const profile = SAMPLE_PROFILE;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-black text-zinc-400">
            {profile.first_name[0]}
            {profile.last_initial}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">
              {profile.first_name} {profile.last_initial}.
            </h1>
            {profile.identity_verified && (
              <Shield className="w-4 h-4 text-brand-orange" />
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-zinc-400 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {profile.neighborhood}, {profile.city}, {profile.state}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm text-brand-orange font-semibold">
              <Star className="w-4 h-4 fill-current" />
              {profile.rating}
              <span className="text-zinc-500 font-normal">
                ({profile.total_ratings})
              </span>
            </span>
            <span className="text-xs text-zinc-500">
              Lvl {profile.level} &middot; {profile.level_title}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <Button className="flex-1">
          <MessageSquare className="w-4 h-4 mr-1" /> Message
        </Button>
        <Button variant="outline" className="flex-1">
          Hire Directly
        </Button>
      </div>

      {/* Bio */}
      <div className="mt-6">
        <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio}</p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{profile.gigs_completed}</div>
          <div className="text-xs text-zinc-500">Gigs</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{profile.five_star_count}</div>
          <div className="text-xs text-zinc-500">5-Star</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{profile.would_hire_again}%</div>
          <div className="text-xs text-zinc-500">Rehire</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-brand-orange">{profile.total_xp}</div>
          <div className="text-xs text-zinc-500">XP</div>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.identity_verified && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-orange/10 text-xs text-brand-orange">
            <Shield className="w-3 h-3" /> ID Verified
          </span>
        )}
        {profile.background_checked && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 text-xs text-green-400">
            <CheckCircle className="w-3 h-3" /> Background Checked
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-900/30 text-xs text-purple-400">
          <Award className="w-3 h-3" /> {profile.level_title}
        </span>
      </div>

      {/* Skills */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <div
              key={skill.name}
              className="px-3 py-1.5 rounded-lg bg-card border border-zinc-800 text-sm text-zinc-300"
            >
              {skill.name}
              <span className="text-xs text-zinc-500 ml-1">
                {skill.years}y
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">Portfolio</h2>
        <div className="grid grid-cols-3 gap-2">
          {profile.portfolio.map((item) => (
            <div
              key={item.id}
              className="aspect-square rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center p-2 hover:border-zinc-500 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-6 h-6 text-zinc-600" />
              <span className="text-xs text-zinc-500 mt-1 text-center leading-tight">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">
          Reviews ({profile.total_ratings})
        </h2>
        <div className="space-y-3">
          {profile.reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl bg-card border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {review.rater_name}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 text-brand-orange fill-current"
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{review.text}</p>
              <span className="block mt-2 text-xs text-zinc-600">
                {new Date(review.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Member info */}
      <div className="mt-6 mb-4 text-center text-xs text-zinc-600">
        <Calendar className="w-3.5 h-3.5 inline mr-1" />
        Member since{" "}
        {new Date(profile.member_since).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
        {" "}&middot; Languages: {profile.languages.join(", ")}
      </div>
    </div>
  );
}
