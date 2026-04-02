"use client";

import { Button } from "@/components/ui/button";
import { Users, Star, MapPin, Briefcase, Plus, Search } from "lucide-react";
import Link from "next/link";

const SAMPLE_GUILDS = [
  {
    id: "g1",
    name: "MKE Creatives",
    description: "Graphic designers, photographers, and videographers in Milwaukee.",
    city: "Milwaukee",
    categories: ["Creative & Digital"],
    members: 12,
    gigs_completed: 47,
    rating: 4.9,
  },
  {
    id: "g2",
    name: "Bay View Handymen",
    description: "Your neighborhood go-to for home repairs, painting, and yard work.",
    city: "Milwaukee",
    categories: ["Home & Yard"],
    members: 8,
    gigs_completed: 83,
    rating: 4.7,
  },
  {
    id: "g3",
    name: "TechSquad MKE",
    description: "Smart home installs, WiFi setup, computer repair, and IT help.",
    city: "Milwaukee",
    categories: ["Tech Help"],
    members: 6,
    gigs_completed: 29,
    rating: 4.8,
  },
  {
    id: "g4",
    name: "Flavor Crew",
    description: "Personal chefs, meal prep, and catering for events big and small.",
    city: "Milwaukee",
    categories: ["Food & Cooking"],
    members: 5,
    gigs_completed: 22,
    rating: 5.0,
  },
];

export default function GuildsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white">Guilds</h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Create Guild
        </Button>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        Guilds are teams of giggers who work together. Join one or start your own.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search guilds..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
        />
      </div>

      {/* Guild list */}
      <div className="space-y-3">
        {SAMPLE_GUILDS.map((guild) => (
          <Link key={guild.id} href={`/guilds/${guild.id}`}>
            <div className="p-4 rounded-xl bg-card border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-brand-orange" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{guild.name}</h3>
                    <span className="flex items-center gap-0.5 text-sm text-brand-orange">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {guild.rating}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-400">{guild.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {guild.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {guild.gigs_completed} gigs
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {guild.city}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {guild.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
