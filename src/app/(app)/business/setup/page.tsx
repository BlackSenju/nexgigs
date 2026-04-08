"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  Save,
  Loader2,
  CheckCircle,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { updateBusinessProfile, getBusinessProfile } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_TYPES = [
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "franchise", label: "Franchise" },
] as const;

const TEAM_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-5", label: "2-5 people" },
  { value: "6-10", label: "6-10 people" },
  { value: "11-25", label: "11-25 people" },
  { value: "26-50", label: "26-50 people" },
  { value: "50+", label: "50+ people" },
] as const;

export default function BusinessSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [hiringCategories, setHiringCategories] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      getBusinessProfile(data.user.id).then(({ profile }) => {
        if (profile) {
          setBusinessName(profile.business_name ?? "");
          setBusinessType(profile.business_type ?? "");
          setDescription(profile.business_description ?? "");
          setWebsite(profile.business_website ?? "");
          setTeamSize(profile.team_size ?? "");
          setHiringCategories(profile.hiring_categories ?? []);
        }
        setLoading(false);
      });
    });
  }, [router]);

  function toggleCategory(slug: string) {
    setHiringCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((c) => c !== slug)
        : [...prev, slug]
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const result = await updateBusinessProfile({
      businessName,
      businessType,
      businessDescription: description,
      businessWebsite: website || undefined,
      hiringCategories,
      teamSize: teamSize || undefined,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/business");
    }, 1500);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <BackButton fallbackHref="/business" />

      <div className="flex items-center gap-3 mb-1">
        <Building2 className="w-6 h-6 text-brand-orange" />
        <h1 className="text-xl font-black text-white">Company Profile Setup</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Set up your business profile so giggers know who they are working with.
      </p>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-green-900/30 border border-green-700/50 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
          <p className="mt-1 text-sm text-green-300">Profile saved! Redirecting...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/50 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Business Name <span className="text-brand-orange">*</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your company name"
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Business Type <span className="text-brand-orange">*</span>
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-zinc-700 text-white focus:outline-none focus:border-brand-orange transition-colors"
          >
            <option value="" disabled>
              Select business type
            </option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell giggers about your business..."
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">{description.length}/500</p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <Globe className="w-3.5 h-3.5 inline mr-1" />
            Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourcompany.com"
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>

        {/* Team Size */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Team Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TEAM_SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setTeamSize(s.value)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                  teamSize === s.value
                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                    : "border-zinc-700 bg-card text-zinc-400 hover:border-zinc-600"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hiring Categories */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <Briefcase className="w-3.5 h-3.5 inline mr-1" />
            Hiring Categories
          </label>
          <p className="text-xs text-zinc-500 mb-2">
            Select the categories you hire for
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => toggleCategory(cat.slug)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                  hiringCategories.includes(cat.slug)
                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                    : "border-zinc-700 bg-card text-zinc-400 hover:border-zinc-600"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload Placeholder */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Company Logo
          </label>
          <button
            type="button"
            disabled
            className="w-full p-6 rounded-lg border border-dashed border-zinc-700 bg-card flex flex-col items-center gap-2 opacity-60 cursor-not-allowed"
          >
            <ImagePlus className="w-8 h-8 text-zinc-500" />
            <span className="text-sm text-zinc-500">Coming Soon</span>
          </button>
        </div>

        {/* Save Button */}
        <Button
          className="w-full"
          variant="primary"
          size="lg"
          disabled={saving || !businessName.trim() || !businessType}
          onClick={handleSave}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Company Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
