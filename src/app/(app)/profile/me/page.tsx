"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import { StateSelect } from "@/components/ui/state-select";
import { CityInput } from "@/components/ui/city-input";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, uploadPortfolioItem, deletePortfolioItem } from "@/lib/actions/uploads";
import { addSkill, removeSkill, updateProfile } from "@/lib/actions/profile";
import { SERVICE_CATEGORIES, SKILL_SUGGESTIONS } from "@/lib/constants";
import {
  MapPin, Shield, Award, Settings, Camera, Plus, Edit3,
  Loader2, Trash2, X, Star, Briefcase, Zap, ChevronRight,
  CheckCircle, CreditCard,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [skills, setSkills] = useState<Array<Record<string, unknown>>>([]);
  const [portfolio, setPortfolio] = useState<Array<Record<string, unknown>>>([]);
  const [xp, setXp] = useState<Record<string, unknown> | null>(null);
  const [rating, setRating] = useState<Record<string, unknown> | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Skill form state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [newSkillYears, setNewSkillYears] = useState("");

  // Portfolio form state
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("");

  // Edit form state
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");

  const currentCategorySkills = newSkillCategory
    ? (SKILL_SUGGESTIONS[newSkillCategory] ?? []).map((s) => ({ value: s, label: s }))
    : [];

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

      if (profileRes.data) {
        setEditBio(String(profileRes.data.bio ?? ""));
        setEditCity(String(profileRes.data.city ?? ""));
        setEditState(String(profileRes.data.state ?? ""));
        setEditNeighborhood(String(profileRes.data.neighborhood ?? ""));
      }
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
    if (result.avatarUrl) setProfile({ ...profile, avatar_url: result.avatarUrl });
    setUploading(false);
  }

  async function handleAddSkill() {
    if (!newSkillName || !newSkillCategory) return;
    const result = await addSkill({
      skillName: newSkillName,
      category: newSkillCategory,
      experienceYears: newSkillYears ? Number(newSkillYears) : 0,
    });
    if (result.skill) {
      setSkills([...skills, result.skill]);
      setNewSkillName("");
      setNewSkillCategory("");
      setNewSkillYears("");
      setShowSkillForm(false);
    }
  }

  async function handleRemoveSkill(skillId: string) {
    await removeSkill(skillId);
    setSkills(skills.filter((s) => s.id !== skillId));
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
    await deletePortfolioItem(itemId);
    setPortfolio(portfolio.filter((p) => p.id !== itemId));
  }

  async function handleSaveProfile() {
    await updateProfile({
      bio: editBio,
      city: editCity,
      state: editState,
      neighborhood: editNeighborhood,
    });
    if (profile) {
      setProfile({ ...profile, bio: editBio, city: editCity, state: editState, neighborhood: editNeighborhood });
    }
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

  const avgRating = Number(rating?.average_rating ?? 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-white">My Profile</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveProfile}>Save</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Avatar + Identity */}
      <div className="flex items-start gap-4 mb-6">
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
            {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">
            {profile.first_name as string} {profile.last_initial as string}.
          </h2>
          <div className="flex items-center gap-1 text-sm text-zinc-400 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {profile.neighborhood ? `${profile.neighborhood as string}, ` : ""}
            {profile.city as string}, {profile.state as string}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className="text-brand-orange font-semibold">
              Lvl {Number(xp?.current_level ?? 1)} — {String(xp?.level_title ?? "Task Starter")}
            </span>
          </div>
          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {Boolean(profile.identity_verified) && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-orange/10 text-[10px] text-brand-orange">
                <Shield className="w-2.5 h-2.5" /> ID Verified
              </span>
            )}
            {Boolean(profile.background_checked) && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-900/30 text-[10px] text-green-400">
                <CheckCircle className="w-2.5 h-2.5" /> BG Checked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <Briefcase className="w-4 h-4 text-brand-orange mx-auto" />
          <div className="text-lg font-black text-white mt-1">{Number(xp?.gigs_completed ?? 0)}</div>
          <div className="text-[10px] text-zinc-500">Gigs</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <Star className="w-4 h-4 text-brand-orange mx-auto" />
          <div className="text-lg font-black text-white mt-1">{avgRating > 0 ? avgRating.toFixed(1) : "--"}</div>
          <div className="text-[10px] text-zinc-500">Rating</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <Zap className="w-4 h-4 text-brand-orange mx-auto" />
          <div className="text-lg font-black text-brand-orange mt-1">{Number(xp?.total_xp ?? 0)}</div>
          <div className="text-[10px] text-zinc-500">XP</div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
          <span className="text-brand-orange text-sm">$</span>
          <div className="text-lg font-black text-white mt-1">{Number(xp?.total_earned ?? 0).toFixed(0)}</div>
          <div className="text-[10px] text-zinc-500">Earned</div>
        </div>
      </div>

      {/* Editing mode */}
      {editing ? (
        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-card text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
              placeholder="Tell people about your skills and experience..."
            />
          </div>
          <CityInput
            label="City"
            value={editCity}
            onChange={setEditCity}
            onSelect={(r) => { if (r.state) setEditState(r.state); }}
            state={editState}
          />
          <div className="grid grid-cols-2 gap-3">
            <StateSelect label="State" value={editState} onChange={setEditState} />
            <Input
              label="Neighborhood"
              value={editNeighborhood}
              onChange={(e) => setEditNeighborhood(e.target.value)}
              placeholder="e.g. Bay View"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Bio */}
          {(profile.bio as string) ? (
            <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
              <h3 className="text-sm font-bold text-white mb-1">About</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{profile.bio as string}</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-card border border-dashed border-zinc-700 mb-4 text-center">
              <p className="text-sm text-zinc-500">No bio yet.</p>
              <button onClick={() => setEditing(true)} className="text-xs text-brand-orange hover:underline mt-1">Add a bio</button>
            </div>
          )}
        </>
      )}

      {/* Skills */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Skills ({skills.length})</h3>
          <button onClick={() => setShowSkillForm(!showSkillForm)} className="text-xs text-brand-orange hover:underline">
            {showSkillForm ? "Cancel" : <><Plus className="w-3 h-3 inline mr-0.5" /> Add Skill</>}
          </button>
        </div>

        {/* Add skill form */}
        {showSkillForm && (
          <div className="mb-3 p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2">
            <Combobox
              options={SERVICE_CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
              value={newSkillCategory}
              onChange={(val) => {
                setNewSkillCategory(val);
                setNewSkillName("");
              }}
              placeholder="Select category..."
              searchPlaceholder="Search categories..."
            />
            {newSkillCategory && (
              <Combobox
                options={currentCategorySkills}
                value={newSkillName}
                onChange={setNewSkillName}
                placeholder="Select or type a skill..."
                searchPlaceholder="Search skills..."
              />
            )}
            {newSkillName && (
              <Input
                label="Years of experience"
                type="number"
                min={0}
                max={50}
                value={newSkillYears}
                onChange={(e) => setNewSkillYears(e.target.value)}
                placeholder="0"
              />
            )}
            <Button size="sm" className="w-full" onClick={handleAddSkill} disabled={!newSkillName || !newSkillCategory}>
              Add Skill
            </Button>
          </div>
        )}

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.id as string}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 group"
              >
                <span className="text-xs text-zinc-300">{skill.skill_name as string}</span>
                {Number(skill.experience_years) > 0 && (
                  <span className="text-[10px] text-zinc-500">{skill.experience_years as number}y</span>
                )}
                <button
                  onClick={() => handleRemoveSkill(skill.id as string)}
                  className="ml-0.5 text-zinc-600 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : !showSkillForm ? (
          <p className="text-sm text-zinc-500">Add skills to get matched with relevant jobs.</p>
        ) : null}
      </div>

      {/* Portfolio */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Portfolio ({portfolio.length})</h3>
          <button onClick={() => setShowPortfolioForm(!showPortfolioForm)} className="text-xs text-brand-orange hover:underline">
            {showPortfolioForm ? "Cancel" : <><Plus className="w-3 h-3 inline mr-0.5" /> Add Work</>}
          </button>
        </div>

        {showPortfolioForm && (
          <div className="mb-3 p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2">
            <Input
              label="Title"
              value={portfolioTitle}
              onChange={(e) => setPortfolioTitle(e.target.value)}
              placeholder="What did you create?"
            />
            <Input
              label="Category"
              value={portfolioCategory}
              onChange={(e) => setPortfolioCategory(e.target.value)}
              placeholder="e.g. Logo Design, Lawn Care"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-300">Description (optional)</label>
              <textarea
                value={portfolioDescription}
                onChange={(e) => setPortfolioDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 rounded-lg bg-card border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange resize-none"
                placeholder="Brief description of the work..."
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => portfolioInputRef.current?.click()}
              disabled={uploadingPortfolio}
            >
              {uploadingPortfolio ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
              ) : (
                <><Plus className="w-3 h-3 mr-1" /> Choose Photo/Video</>
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

        {portfolio.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {portfolio.map((item) => (
              <div key={item.id as string} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-800">
                {(item.media_type as string) === "video" ? (
                  <video src={item.media_url as string} className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.media_url as string} alt={item.title as string} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDeletePortfolio(item.id as string)} className="p-1.5 rounded-full bg-brand-red/80 text-white">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80">
                  <span className="text-[10px] text-white leading-tight line-clamp-1">{item.title as string}</span>
                </div>
              </div>
            ))}
          </div>
        ) : !showPortfolioForm ? (
          <p className="text-sm text-zinc-500">Upload photos and videos of your work to attract clients.</p>
        ) : null}
      </div>

      {/* Verification */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white mb-3">Verification</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={cn("w-5 h-5", Boolean(profile.identity_verified) ? "text-green-400" : "text-zinc-500")} />
              <div>
                <span className="text-sm text-zinc-300">ID Verification</span>
                <p className="text-xs text-zinc-500">Government ID + selfie match</p>
              </div>
            </div>
            {Boolean(profile.identity_verified) ? (
              <span className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/verify/persona", { method: "POST" });
                    const data = await res.json();
                    if (data.sessionUrl) {
                      window.open(data.sessionUrl, "_blank");
                    } else if (data.status === "already_verified") {
                      setProfile({ ...profile!, identity_verified: true });
                    } else if (data.error) {
                      alert(data.error);
                    }
                  } catch {
                    alert("Failed to start verification. Try again later.");
                  }
                }}
              >
                Verify ID
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={cn("w-5 h-5", Boolean(profile.background_checked) ? "text-green-400" : "text-zinc-500")} />
              <div>
                <span className="text-sm text-zinc-300">Background Check</span>
                <p className="text-xs text-zinc-500">Criminal + identity via Checkr</p>
              </div>
            </div>
            {Boolean(profile.background_checked) ? (
              <span className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Checked</span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={!Boolean(profile.identity_verified)}
                onClick={async () => {
                  if (!Boolean(profile.identity_verified)) {
                    alert("Complete ID verification first.");
                    return;
                  }
                  try {
                    const res = await fetch("/api/verify/checkr", { method: "POST" });
                    const data = await res.json();
                    if (data.invitationUrl) {
                      window.open(data.invitationUrl, "_blank");
                    } else if (data.status === "already_checked") {
                      setProfile({ ...profile!, background_checked: true });
                    } else if (data.error) {
                      alert(data.error);
                    }
                  } catch {
                    alert("Failed to start background check. Try again later.");
                  }
                }}
              >
                {Boolean(profile.identity_verified) ? "Start Check" : "Verify ID First"}
              </Button>
            )}
          </div>
          {String(profile.checkr_status ?? "") === "processing" && (
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Background check in progress...
            </p>
          )}
        </div>
      </div>

      {/* Account links */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white mb-2">Account</h3>
        <div className="space-y-1">
          <Link href="/subscription" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><Award className="w-4 h-4" /> Subscription</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/insurance" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> NexGigs Shield</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/safety" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Safety Settings</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button className="w-full flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment Settings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
