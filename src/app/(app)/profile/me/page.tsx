"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Shield,
  Award,
  Settings,
  Camera,
  Plus,
  Edit3,
} from "lucide-react";
import { useState } from "react";

export default function MyProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "Jevaun",
    last_initial: "C",
    city: "Milwaukee",
    state: "WI",
    neighborhood: "Bay View",
    bio: "Full-stack developer and tech enthusiast. Available for website builds, tech setup, and tutoring.",
    languages: ["English"],
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-white">My Profile</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Done" : <><Edit3 className="w-4 h-4 mr-1" /> Edit</>}
        </Button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-zinc-700 flex items-center justify-center">
            <span className="text-3xl font-black text-zinc-400">
              {profile.first_name[0]}
              {profile.last_initial}
            </span>
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <h2 className="mt-3 text-lg font-bold text-white">
          {profile.first_name} {profile.last_initial}.
        </h2>
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <MapPin className="w-3.5 h-3.5" />
          {profile.neighborhood}, {profile.city}, {profile.state}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">0</div>
          <div className="text-xs text-zinc-500">Gigs</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">--</div>
          <div className="text-xs text-zinc-500">Rating</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-brand-orange">0</div>
          <div className="text-xs text-zinc-500">XP</div>
        </div>
      </div>

      {/* Profile sections */}
      {editing ? (
        <div className="space-y-4">
          <Input
            id="bio"
            label="Bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
          <Input
            id="city"
            label="City"
            value={profile.city}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="state"
              label="State"
              value={profile.state}
              onChange={(e) =>
                setProfile({ ...profile, state: e.target.value })
              }
            />
            <Input
              id="neighborhood"
              label="Neighborhood"
              value={profile.neighborhood}
              onChange={(e) =>
                setProfile({ ...profile, neighborhood: e.target.value })
              }
            />
          </div>
          <Button className="w-full">Save Changes</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bio */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-1">About</h3>
            <p className="text-sm text-zinc-400">{profile.bio}</p>
          </div>

          {/* Skills */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Skills</h3>
              <button className="text-xs text-brand-orange hover:underline">
                <Plus className="w-3 h-3 inline mr-0.5" /> Add
              </button>
            </div>
            <p className="text-sm text-zinc-500">
              No skills added yet. Add your skills to get matched with jobs.
            </p>
          </div>

          {/* Portfolio */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Portfolio</h3>
              <button className="text-xs text-brand-orange hover:underline">
                <Plus className="w-3 h-3 inline mr-0.5" /> Add
              </button>
            </div>
            <p className="text-sm text-zinc-500">
              Show off your work. Upload photos and videos of past projects.
            </p>
          </div>

          {/* Verification */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-2">Verification</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-zinc-400">
                  <Shield className="w-4 h-4" /> ID Verification
                </span>
                <Button variant="outline" size="sm">
                  Verify
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-zinc-400">
                  <Shield className="w-4 h-4" /> Background Check
                </span>
                <Button variant="outline" size="sm">
                  Start
                </Button>
              </div>
            </div>
          </div>

          {/* Settings links */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-2">Account</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Account Settings
                </span>
              </button>
              <button className="w-full flex items-center justify-between py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4" /> Subscription
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
