"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, uploadPortfolioItem, deletePortfolioItem } from "@/lib/actions/uploads";
import {
  MapPin,
  Shield,
  Award,
  Settings,
  Camera,
  Plus,
  Edit3,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [skills, setSkills] = useState<Array<Record<string, unknown>>>([]);
  const [portfolio, setPortfolio] = useState<Array<Record<string, unknown>>>([]);
  const [xp, setXp] = useState<Record<string, unknown> | null>(null);
  const [rating, setRating] = useState<Record<string, unknown> | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Portfolio form state
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, skillsRes, portfolioRes, xpRes, ratingRes] = await Promise.all([
        supabase.from("nexgigs_profiles").select("*").eq("id", user.id).single(),
        supabase.from("nexgigs_skills").select("*").eq("user_id", user.id),
        supabase.from("nexgigs_portfolio").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("nexgigs_user_xp").select("*").eq("user_id", user.id).single(),
        supabase.from("nexgigs_user_ratings").select("*").eq("user_id", user.id).single(),
      ]);

      setProfile(profileRes.data);
      setSkills(skillsRes.data ?? []);
      setPortfolio(portfolioRes.data ?? []);
      setXp(xpRes.data);
      setRating(ratingRes.data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatar(formData);
    if (result.avatarUrl) {
      setProfile({ ...profile, avatar_url: result.avatarUrl });
    }
    setUploading(false);
  }

  async function handlePortfolioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPortfolio(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", portfolioTitle || file.name);
    formData.append("description", portfolioDescription);
    formData.append("category", portfolioCategory);

    const result = await uploadPortfolioItem(formData);
    if (result.item) {
      setPortfolio([result.item, ...portfolio]);
      setShowPortfolioForm(false);
      setPortfolioTitle("");
      setPortfolioDescription("");
      setPortfolioCategory("");
    }
    setUploadingPortfolio(false);
  }

  async function handleDeletePortfolio(itemId: string) {
    const result = await deletePortfolioItem(itemId);
    if (result.success) {
      setPortfolio(portfolio.filter((p) => p.id !== itemId));
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("nexgigs_profiles")
      .update({
        bio: profile.bio,
        city: profile.city,
        state: profile.state,
        neighborhood: profile.neighborhood,
      })
      .eq("id", user.id);

    setEditing(false);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-white">My Profile</h1>
        <Button variant="ghost" size="sm" onClick={() => editing ? handleSaveProfile() : setEditing(true)}>
          {editing ? "Save" : <><Edit3 className="w-4 h-4 mr-1" /> Edit</>}
        </Button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <Avatar
            src={profile.avatar_url as string}
            firstName={profile.first_name as string}
            lastInitial={profile.last_initial as string}
            size="xl"
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center hover:bg-orange-600 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <h2 className="mt-3 text-lg font-bold text-white">
          {profile.first_name as string} {profile.last_initial as string}.
        </h2>
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <MapPin className="w-3.5 h-3.5" />
          {profile.neighborhood ? `${profile.neighborhood as string}, ` : ""}
          {profile.city as string}, {profile.state as string}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">{Number(xp?.gigs_completed ?? 0)}</div>
          <div className="text-xs text-zinc-500">Gigs</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-white">
            {Number(rating?.average_rating) > 0 ? Number(rating?.average_rating).toFixed(1) : "--"}
          </div>
          <div className="text-xs text-zinc-500">Rating</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <div className="text-lg font-black text-brand-orange">{Number(xp?.total_xp ?? 0)}</div>
          <div className="text-xs text-zinc-500">XP</div>
        </div>
      </div>

      {/* Profile sections */}
      {editing ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">Bio</label>
            <textarea
              value={String(profile.bio ?? "")}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-card text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
              placeholder="Tell people about your skills and experience..."
            />
          </div>
          <Input
            id="city"
            label="City"
            value={String(profile.city ?? "")}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="state"
              label="State"
              value={String(profile.state ?? "")}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            />
            <Input
              id="neighborhood"
              label="Neighborhood"
              value={String(profile.neighborhood ?? "")}
              onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSaveProfile}>Save Changes</Button>
            <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bio */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-1">About</h3>
            <p className="text-sm text-zinc-400">
              {(profile.bio as string) || "No bio yet. Tap Edit to add one."}
            </p>
          </div>

          {/* Skills */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Skills</h3>
              <button className="text-xs text-brand-orange hover:underline">
                <Plus className="w-3 h-3 inline mr-0.5" /> Add
              </button>
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill.id as string} className="px-2 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300">
                    {skill.skill_name as string}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                No skills added yet. Add your skills to get matched with jobs.
              </p>
            )}
          </div>

          {/* Portfolio */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Portfolio ({portfolio.length})</h3>
              <button
                className="text-xs text-brand-orange hover:underline"
                onClick={() => setShowPortfolioForm(true)}
              >
                <Plus className="w-3 h-3 inline mr-0.5" /> Add
              </button>
            </div>

            {/* Upload form */}
            {showPortfolioForm && (
              <div className="mb-3 p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Add portfolio item</span>
                  <button onClick={() => setShowPortfolioForm(false)}>
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Title"
                  value={portfolioTitle}
                  onChange={(e) => setPortfolioTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-card border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Logo Design)"
                  value={portfolioCategory}
                  onChange={(e) => setPortfolioCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-card border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={portfolioDescription}
                  onChange={(e) => setPortfolioDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg bg-card border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange resize-none"
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => portfolioInputRef.current?.click()}
                  disabled={uploadingPortfolio}
                >
                  {uploadingPortfolio ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
                  ) : (
                    <><Plus className="w-3 h-3 mr-1" /> Choose File & Upload</>
                  )}
                </Button>
                <input
                  ref={portfolioInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
                  className="hidden"
                  onChange={handlePortfolioUpload}
                />
              </div>
            )}

            {/* Portfolio grid */}
            {portfolio.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {portfolio.map((item) => (
                  <div key={item.id as string} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-800">
                    {(item.media_type as string) === "video" ? (
                      <video
                        src={item.media_url as string}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.media_url as string}
                        alt={item.title as string}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleDeletePortfolio(item.id as string)}
                        className="p-1.5 rounded-full bg-brand-red/80 text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80">
                      <span className="text-xs text-white leading-tight line-clamp-1">
                        {item.title as string}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Show off your work. Upload photos and videos of past projects.
              </p>
            )}
          </div>

          {/* Verification */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-2">Verification</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-zinc-400">
                  <Shield className="w-4 h-4" /> ID Verification
                </span>
                {Boolean(profile.identity_verified) ? (
                  <span className="text-xs text-green-400">Verified</span>
                ) : (
                  <Button variant="outline" size="sm">Verify</Button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-zinc-400">
                  <Shield className="w-4 h-4" /> Background Check
                </span>
                {Boolean(profile.background_checked) ? (
                  <span className="text-xs text-green-400">Checked</span>
                ) : (
                  <Button variant="outline" size="sm">Start</Button>
                )}
              </div>
            </div>
          </div>

          {/* Account links */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-2">Account</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <Settings className="w-4 h-4" /> Account Settings
              </button>
              <button className="w-full flex items-center gap-2 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <Award className="w-4 h-4" /> Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
