"use client";

import { Button } from "@/components/ui/button";
import { Users, Star, MapPin, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SAMPLE_GUILD = {
  id: "g1",
  name: "MKE Creatives",
  description:
    "We're a collective of graphic designers, photographers, videographers, and digital artists based in Milwaukee. We take on individual gigs and team projects — from brand packages to event coverage.",
  city: "Milwaukee",
  state: "WI",
  categories: ["Creative & Digital"],
  rating: 4.9,
  total_members: 12,
  gigs_completed: 47,
  leader: { id: "u1", name: "Marcus J.", rating: 4.8, title: "Pro Gigger" },
  members: [
    { id: "u1", name: "Marcus J.", role: "Leader", rating: 4.8, gigs: 31 },
    { id: "u2", name: "Aisha T.", role: "Member", rating: 4.9, gigs: 18 },
    { id: "u3", name: "Devon P.", role: "Member", rating: 4.7, gigs: 12 },
    { id: "u4", name: "Kim L.", role: "Member", rating: 5.0, gigs: 8 },
  ],
};

export default function GuildDetailPage() {
  const guild = SAMPLE_GUILD;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Link
        href="/guilds"
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to guilds
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-8 h-8 text-brand-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{guild.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
            <span className="flex items-center gap-0.5 text-brand-orange">
              <Star className="w-4 h-4 fill-current" /> {guild.rating}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {guild.city}, {guild.state}
            </span>
          </div>
        </div>
      </div>

      <Button className="w-full mt-4">Join Guild</Button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{guild.total_members}</div>
          <div className="text-xs text-zinc-500">Members</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{guild.gigs_completed}</div>
          <div className="text-xs text-zinc-500">Gigs Done</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-brand-orange">{guild.rating}</div>
          <div className="text-xs text-zinc-500">Avg Rating</div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-2">About</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">{guild.description}</p>
      </div>

      {/* Members */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">Members</h2>
        <div className="space-y-2">
          {guild.members.map((member) => (
            <Link key={member.id} href={`/profile/${member.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {member.name}
                    </span>
                    {member.role === "Leader" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange">
                        Leader
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {member.gigs} gigs &middot;{" "}
                    <span className="text-brand-orange">{member.rating}</span> rating
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
