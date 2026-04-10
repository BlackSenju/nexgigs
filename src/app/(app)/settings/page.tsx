"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import { StateSelect } from "@/components/ui/state-select";
import { CityInput } from "@/components/ui/city-input";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/actions/uploads";
import { addSkill, removeSkill, updateProfile } from "@/lib/actions/profile";
import { SERVICE_CATEGORIES, SKILL_SUGGESTIONS } from "@/lib/constants";
import {
  Shield, Camera, Plus, Loader2, X, ChevronRight,
  CheckCircle, CreditCard, DollarSign, Award, LogOut,
  User, Globe, Bell, Lock, Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [skills, setSkills] = useState<Array<Record<string, unknown>>>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [newSkillYears, setNewSkillYears] = useState("");

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
      const [profileRes, skillsRes] = await Promise.all([
        supabase.from("nexgigs_profiles").select("*").eq("id", user.id).single(),
        supabase.from("nexgigs_skills").select("*").eq("user_id", user.id),
      ]);
      setProfile(profileRes.data);
      setSkills(skillsRes.data ?? []);
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

  async function handleSaveProfile() {
    setSaving(true);
    await updateProfile({ bio: editBio, city: editCity, state: editState, neighborhood: editNeighborhood });
    if (profile) setProfile({ ...profile, bio: editBio, city: editCity, state: editState, neighborhood: editNeighborhood });
    setSaving(false);
  }

  async function handleAddSkill() {
    if (!newSkillName || !newSkillCategory) return;
    const result = await addSkill({ skillName: newSkillName, category: newSkillCategory, experienceYears: newSkillYears ? Number(newSkillYears) : 0 });
    if (result.skill) {
      setSkills([...skills, result.skill]);
      setNewSkillName(""); setNewSkillCategory(""); setNewSkillYears(""); setShowSkillForm(false);
    }
  }

  async function handleRemoveSkill(skillId: string) {
    await removeSkill(skillId);
    setSkills(skills.filter((s) => s.id !== skillId));
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>;
  if (!profile) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/profile/me" />
      <h1 className="text-xl font-black text-white mb-6">Settings</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-card border border-zinc-800">
        <div className="relative">
          <Avatar src={profile.avatar_url as string} firstName={profile.first_name as string} lastInitial={profile.last_initial as string} size="lg" />
          <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-orange flex items-center justify-center">
            {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{profile.first_name as string} {profile.last_initial as string}.</h2>
          <p className="text-xs text-zinc-400">{profile.city as string}, {profile.state as string}</p>
        </div>
      </div>

      {/* AI Profile Builder */}
      <div className="p-3 rounded-xl bg-brand-orange/5 border border-brand-orange/20 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-brand-orange" /> AI Profile Builder</h3>
          <p className="text-[11px] text-zinc-400">Let AI write your bio and set up your profile in 60 seconds</p>
        </div>
        <Link href="/settings/ai-profile"><Button size="sm">Build</Button></Link>
      </div>

      {/* Bio & Location */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><User className="w-4 h-4 text-brand-orange" /> Profile Info</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">Bio</label>
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-background text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
              placeholder="Tell people about your skills..." />
          </div>
          <CityInput label="City" value={editCity} onChange={setEditCity}
            onSelect={(r) => { if (r.state) setEditState(r.state); }} state={editState} />
          <div className="grid grid-cols-2 gap-3">
            <StateSelect label="State" value={editState} onChange={setEditState} />
            <Input label="Neighborhood" value={editNeighborhood} onChange={(e) => setEditNeighborhood(e.target.value)} placeholder="e.g. Bay View" />
          </div>
          <Button className="w-full" size="sm" onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>

      {/* Skills */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-brand-orange" /> Skills ({skills.length})</h3>
          <button onClick={() => setShowSkillForm(!showSkillForm)} className="text-xs text-brand-orange hover:underline">
            {showSkillForm ? "Cancel" : <><Plus className="w-3 h-3 inline mr-0.5" /> Add</>}
          </button>
        </div>
        {showSkillForm && (
          <div className="mb-3 p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2">
            <Combobox options={SERVICE_CATEGORIES.map((c) => ({ value: c.name, label: c.name }))} value={newSkillCategory}
              onChange={(val) => { setNewSkillCategory(val); setNewSkillName(""); }} placeholder="Select category..." />
            {newSkillCategory && <Combobox options={currentCategorySkills} value={newSkillName} onChange={setNewSkillName} placeholder="Select skill..." />}
            {newSkillName && <Input label="Years" type="number" min={0} max={50} value={newSkillYears} onChange={(e) => setNewSkillYears(e.target.value)} placeholder="0" />}
            <Button size="sm" className="w-full" onClick={handleAddSkill} disabled={!newSkillName || !newSkillCategory}>Add Skill</Button>
          </div>
        )}
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.id as string} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 group">
                <span className="text-xs text-zinc-300">{skill.skill_name as string}</span>
                {Number(skill.experience_years) > 0 && <span className="text-[10px] text-zinc-500">{skill.experience_years as number}y</span>}
                <button onClick={() => handleRemoveSkill(skill.id as string)} className="ml-0.5 text-zinc-600 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-zinc-500">No skills added yet.</p>}
      </div>

      {/* Verification */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-orange" /> Verification</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><span className="text-sm text-zinc-300">ID Verification</span><p className="text-xs text-zinc-500">Government ID + selfie</p></div>
            {Boolean(profile.identity_verified) ? (
              <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
            ) : (
              <Button variant="outline" size="sm" onClick={async () => {
                const res = await fetch("/api/verify/persona", { method: "POST" });
                const data = await res.json();
                if (data.sessionUrl) window.open(data.sessionUrl, "_blank");
              }}>Verify ID</Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div><span className="text-sm text-zinc-300">Background Check</span><p className="text-xs text-zinc-500">Criminal + identity via Checkr</p></div>
            {Boolean(profile.background_checked) ? (
              <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Checked</span>
            ) : <span className="text-xs text-zinc-500 px-2 py-1 rounded bg-zinc-800">Coming Soon</span>}
          </div>
        </div>
      </div>

      {/* Payment Setup */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-orange" /> Get Paid</h3>
        <p className="text-xs text-zinc-500 mb-3">Connect your bank account or debit card to receive payments from gigs and shop sales.</p>
        {profile.stripe_connect_account_id ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payments connected</span>
            <Button variant="ghost" size="sm" className="text-xs" onClick={async () => {
              const res = await fetch("/api/stripe/dashboard");
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}>Manage</Button>
          </div>
        ) : (
          <>
            <Button size="sm" className="w-full" id="setup-payments-btn" onClick={async () => {
              const btn = document.getElementById("setup-payments-btn");
              if (btn) btn.textContent = "Setting up...";
              try {
                const res = await fetch("/api/stripe/connect", { method: "POST" });
                const data = await res.json();
                if (data.onboardingUrl) {
                  window.location.href = data.onboardingUrl;
                } else if (data.status === "active") {
                  alert("Your payments are already set up!");
                  window.location.reload();
                } else {
                  alert(data.error || "Failed to start payment setup. Make sure STRIPE_SECRET_KEY is configured.");
                  if (btn) btn.textContent = "Set Up Payments";
                }
              } catch {
                alert("Payment setup failed. Check your internet connection and try again.");
                if (btn) btn.textContent = "Set Up Payments";
              }
            }}><CreditCard className="w-3 h-3 mr-1" /> Set Up Payments</Button>
          </>
        )}
        <p className="text-[10px] text-zinc-600 mt-2">Supports bank accounts, debit cards (Cash App, Chime, etc.). Powered by Stripe.</p>
      </div>

      {/* Account Links */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-brand-orange" /> Account</h3>
        <div className="space-y-1">
          <Link href="/earnings" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Earnings & Taxes</span><ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/subscription" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><Award className="w-4 h-4" /> Subscription</span><ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/insurance" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> NexGigs Shield</span><ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/safety" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Safety & Notifications</span><ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/privacy" className="flex items-center justify-between py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Privacy Policy</span><ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Admin Panel — only visible to admins */}
      {Boolean(profile.is_admin) && (
        <div className="p-4 rounded-xl bg-brand-orange/5 border border-brand-orange/20 mb-4">
          <h3 className="text-sm font-bold text-brand-orange mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Admin</h3>
          <Link href="/admin" className="flex items-center justify-between py-2.5 text-sm text-zinc-300 hover:text-white transition-colors">
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> Admin Dashboard</span><ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Logout */}
      <Button variant="danger" className="w-full mb-8" onClick={handleLogout}>
        <LogOut className="w-4 h-4 mr-2" /> Log Out
      </Button>
    </div>
  );
}
