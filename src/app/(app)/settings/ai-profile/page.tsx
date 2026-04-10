"use client";

import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { updateProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, CheckCircle, Zap, Edit3, User } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface ProfileResult {
  bio: string;
  serviceDescription: string;
  suggestedHourlyRate: number;
  suggestedCategories: string[];
  profileTips: string[];
}

type Step = "input" | "generating" | "review" | "applied";

export default function AIProfileBuilderPage() {
  const [step, setStep] = useState<Step>("input");
  const [experience, setExperience] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [isGigger, setIsGigger] = useState(true);
  const [isPoster, setIsPoster] = useState(false);
  const [result, setResult] = useState<ProfileResult | null>(null);
  const [editedBio, setEditedBio] = useState("");
  const [editedService, setEditedService] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, skillsRes] = await Promise.all([
        supabase.from("nexgigs_profiles").select("*").eq("id", user.id).single(),
        supabase.from("nexgigs_skills").select("skill_name").eq("user_id", user.id),
      ]);

      const profile = profileRes.data;
      if (profile) {
        setName(`${profile.first_name ?? ""} ${profile.last_initial ?? ""}`.trim());
        setCity(String(profile.city ?? ""));
        setIsGigger(Boolean(profile.is_gigger));
        setIsPoster(Boolean(profile.is_poster));
      }

      const loadedSkills = (skillsRes.data ?? []).map(
        (s: Record<string, unknown>) => String(s.skill_name)
      );
      setSkills(loadedSkills);
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleGenerate() {
    if (!experience.trim()) {
      setError("Tell us a bit about what you do so AI can write your profile.");
      return;
    }

    setError("");
    setStep("generating");

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile_builder",
          name,
          skills,
          experience: experience.trim(),
          city,
          isGigger,
          isPoster,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setStep("input");
        return;
      }

      const data: ProfileResult = await res.json();
      setResult(data);
      setEditedBio(data.bio);
      setEditedService(data.serviceDescription);
      setStep("review");
    } catch {
      setError("Failed to connect. Check your internet and try again.");
      setStep("input");
    }
  }

  async function handleApply() {
    setApplying(true);
    try {
      await updateProfile({ bio: editedBio });
      setStep("applied");
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/settings" />

      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-brand-orange" />
        <h1 className="text-xl font-black text-white">AI Profile Builder</h1>
      </div>

      {/* Step 1: Quick Info */}
      {step === "input" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-orange" /> Tell us about yourself
            </h2>
            <p className="text-xs text-zinc-400 mb-3">
              A few words is all AI needs to write your full profile.
            </p>

            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-background text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
              placeholder="e.g. I'm a personal trainer with 5 years experience, also do meal prep and nutrition coaching"
            />

            {skills.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-zinc-500 mb-1.5">Your skills (auto-loaded):</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-zinc-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {city && (
              <p className="mt-2 text-xs text-zinc-500">
                Location: <span className="text-zinc-400">{city}</span>
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}

          <Button className="w-full" onClick={handleGenerate}>
            <Sparkles className="w-4 h-4 mr-1.5" /> Generate My Profile
          </Button>
        </div>
      )}

      {/* Step 2: Generating */}
      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <Sparkles className="w-10 h-10 text-brand-orange animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">AI is writing your profile...</p>
            <p className="text-xs text-zinc-500 mt-1">This takes about 10 seconds</p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-brand-orange" />
        </div>
      )}

      {/* Step 3: Review & Edit */}
      {step === "review" && result && (
        <div className="space-y-4">
          {/* Bio */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-brand-orange" /> Your Bio
              </h3>
              <span className="text-[10px] text-zinc-500">Editable</span>
            </div>
            <textarea
              value={editedBio}
              onChange={(e) => setEditedBio(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-background text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>

          {/* Service Description */}
          <div className="p-4 rounded-xl bg-card border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-orange" /> Service Description
              </h3>
              <span className="text-[10px] text-zinc-500">Editable</span>
            </div>
            <textarea
              value={editedService}
              onChange={(e) => setEditedService(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-background text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>

          {/* Suggested Rate */}
          <div className="p-3 rounded-xl bg-card border border-zinc-800 flex items-center justify-between">
            <span className="text-sm text-zinc-300">Suggested Hourly Rate</span>
            <span className="text-lg font-black text-brand-orange">
              ${result.suggestedHourlyRate}/hr
            </span>
          </div>

          {/* Suggested Categories */}
          {result.suggestedCategories.length > 0 && (
            <div className="p-3 rounded-xl bg-card border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1.5">Suggested Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-md bg-brand-orange/10 border border-brand-orange/20 text-xs text-brand-orange"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile Tips */}
          {result.profileTips.length > 0 && (
            <div className="p-3 rounded-xl bg-card border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1.5">Profile Tips</p>
              <div className="flex flex-wrap gap-1.5">
                {result.profileTips.map((tip) => (
                  <span
                    key={tip}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300"
                  >
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}

          <div className="space-y-2">
            <Button className="w-full" onClick={handleApply} disabled={applying}>
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Apply to My Profile
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("input");
                setResult(null);
              }}
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Regenerate
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === "applied" && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <div className="text-center">
            <p className="text-lg font-black text-white">Profile Updated!</p>
            <p className="text-sm text-zinc-400 mt-1">You&apos;re ready to get hired.</p>
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit More in Settings
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
