"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  type Storefront,
  updateStorefront,
  publishStorefront,
  unpublishStorefront,
} from "@/lib/actions/storefronts";
import { STOREFRONT_ICON_OPTIONS } from "@/components/storefront/StorefrontLogo";
import { AIImproveButton } from "@/components/storefront/AIImproveButton";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PRESET_BRAND_COLORS = [
  "#FF4D00", "#1F3D2B", "#0EA5E9", "#7C3AED",
  "#DC2626", "#EA580C", "#16A34A", "#2563EB",
  "#DB2777", "#0F172A", "#C9A227", "#78350F",
];

const SAVE_DEBOUNCE_MS = 800;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

interface FormState {
  tagline: string;
  about_html: string;
  brand_color: string;
  accent_color: string;
  logo_kind: "icon" | "image";
  logo_value: string;
  hero_image_url: string;
  social_phone: string;
  social_email: string;
  social_website: string;
  social_instagram: string;
}

function fromStorefront(s: Storefront): FormState {
  return {
    tagline: s.tagline ?? "",
    about_html: s.about_html ?? "",
    brand_color: s.brand_color,
    accent_color: s.accent_color ?? "#0A0A0A",
    logo_kind: s.logo_kind,
    logo_value: s.logo_value ?? "",
    hero_image_url: s.hero_image_url ?? "",
    social_phone: s.social_links?.phone ?? "",
    social_email: s.social_links?.email ?? "",
    social_website: s.social_links?.website ?? "",
    social_instagram: s.social_links?.instagram ?? "",
  };
}

export interface StorefrontEditorProps {
  initialStorefront: Storefront;
}

export function StorefrontEditor({ initialStorefront }: StorefrontEditorProps) {
  const router = useRouter();
  const [storefront, setStorefront] = useState<Storefront>(initialStorefront);
  const [form, setForm] = useState<FormState>(() => fromStorefront(initialStorefront));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<string>(JSON.stringify(form));

  const isPublished = storefront.status === "published";

  // Debounced autosave: when `form` changes, schedule a save.
  useEffect(() => {
    const serialized = JSON.stringify(form);
    if (serialized === lastSentRef.current) return;
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void runSave();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const runSave = useCallback(async () => {
    setSaveState("saving");
    setSaveError(null);
    const payload = {
      tagline: form.tagline.trim() || null,
      about_html: form.about_html.trim() || null,
      brand_color: form.brand_color,
      accent_color: form.accent_color,
      logo_kind: form.logo_kind,
      logo_value: form.logo_value.trim() || null,
      hero_image_url: form.hero_image_url.trim() || null,
      social_links: {
        phone: form.social_phone.trim() || null,
        email: form.social_email.trim() || null,
        website: form.social_website.trim() || null,
        instagram: form.social_instagram.trim() || null,
      },
    };
    const result = await updateStorefront(payload);
    if (result.error || !result.storefront) {
      setSaveState("error");
      setSaveError(result.error ?? "Save failed");
      return;
    }
    lastSentRef.current = JSON.stringify(form);
    setStorefront(result.storefront);
    setSaveState("saved");
    // Bump preview iframe key to force reload — debounced after save
    setPreviewKey((k) => k + 1);
    // Drop the "saved" indicator after 2s back to idle
    setTimeout(() => {
      setSaveState((s) => (s === "saved" ? "idle" : s));
    }, 2000);
  }, [form]);

  const onPublish = useCallback(async () => {
    setPublishing(true);
    setPublishError(null);
    // Make sure latest edits are flushed first.
    if (saveState === "dirty" || saveState === "saving") {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await runSave();
    }
    const result = isPublished
      ? await unpublishStorefront()
      : await publishStorefront();
    if ("upgradeRequired" in result && result.upgradeRequired) {
      setPublishError(result.error ?? "Upgrade required to publish");
    } else if (result.error || !result.storefront) {
      setPublishError(result.error ?? "Failed to publish");
    } else {
      setStorefront(result.storefront);
      setPreviewKey((k) => k + 1);
      router.refresh();
    }
    setPublishing(false);
  }, [isPublished, runSave, saveState, router]);

  const previewSrc = useMemo(
    () => `/store/${storefront.slug}?_=${previewKey}`,
    [storefront.slug, previewKey],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/95 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-5 h-5 text-brand-orange shrink-0" />
            <h1 className="text-base font-bold truncate">Storefront editor</h1>
            <code className="hidden sm:inline-block text-xs text-zinc-400 bg-zinc-900 ring-1 ring-zinc-800 rounded px-2 py-1 truncate">
              /store/{storefront.slug}
            </code>
          </div>

          <div className="flex items-center gap-2">
            <SaveIndicator state={saveState} error={saveError} />
            <Link
              href="/dashboard/storefront/wizard"
              className="hidden sm:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/30 hover:bg-brand-orange/20"
              title="Run the AI Setup Wizard"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Wizard
            </Link>
            <Link
              href={`/store/${storefront.slug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white"
            >
              View live
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className={
                "rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 " +
                (isPublished
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  : "bg-brand-orange hover:bg-brand-orange/90 text-white")
              }
            >
              {publishing ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Working…
                </span>
              ) : isPublished ? (
                <span className="inline-flex items-center gap-1">
                  <EyeOff className="w-4 h-4" />
                  Unpublish
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  Publish
                </span>
              )}
            </button>
          </div>
        </div>
        {publishError && (
          <div className="max-w-screen-2xl mx-auto px-4 pb-2">
            <div className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {publishError}
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Form pane */}
        <div className="px-4 py-6 lg:py-8 space-y-8 lg:max-h-[calc(100vh-65px)] lg:overflow-y-auto">
          <Section title="Branding" subtitle="The visual identity of your storefront.">
            <Field label="Tagline" hint="One-line pitch shown under your business name in the hero.">
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value.slice(0, 200))}
                placeholder="e.g. We handle the dirty work."
                maxLength={200}
                className={inputCls}
              />
              <div className="mt-1.5">
                <AIImproveButton
                  field="tagline"
                  current={form.tagline}
                  onAccept={(v) => set("tagline", v.slice(0, 200))}
                />
              </div>
            </Field>

            <Field label="Brand color" hint="Used for buttons, accents, and your logo tile.">
              <ColorPicker
                value={form.brand_color}
                onChange={(v) => set("brand_color", v)}
              />
            </Field>

            <Field label="Logo">
              <div className="space-y-3">
                <div className="inline-flex rounded-lg ring-1 ring-zinc-800 bg-zinc-900 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => set("logo_kind", "icon")}
                    className={
                      "px-3 py-1 rounded-md transition-colors " +
                      (form.logo_kind === "icon"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white")
                    }
                  >
                    Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => set("logo_kind", "image")}
                    className={
                      "px-3 py-1 rounded-md transition-colors " +
                      (form.logo_kind === "image"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white")
                    }
                  >
                    Upload (paid)
                  </button>
                </div>

                {form.logo_kind === "icon" ? (
                  <IconPicker
                    selected={form.logo_value}
                    brandColor={form.brand_color}
                    onSelect={(name) => set("logo_value", name)}
                  />
                ) : (
                  <input
                    type="url"
                    value={form.logo_value}
                    onChange={(e) => set("logo_value", e.target.value)}
                    placeholder="https://… (image upload coming soon)"
                    className={inputCls}
                  />
                )}
              </div>
            </Field>

            <Field label="Hero image URL" hint="Optional. A wide background photo for your hero section.">
              <input
                type="url"
                value={form.hero_image_url}
                onChange={(e) => set("hero_image_url", e.target.value)}
                placeholder="https://…"
                className={inputCls}
              />
            </Field>
          </Section>

          <Section title="About" subtitle="Tell visitors who you are and what you do.">
            <Field label="About (rich text)" hint="Plain paragraphs work great. We support basic formatting.">
              <textarea
                value={form.about_html}
                onChange={(e) => set("about_html", e.target.value.slice(0, 5000))}
                rows={6}
                maxLength={5000}
                placeholder="<p>Tell your story…</p>"
                className={inputCls + " font-mono text-sm leading-relaxed resize-y"}
              />
              <div className="flex items-center justify-between mt-1.5">
                <AIImproveButton
                  field="about_html"
                  current={form.about_html}
                  onAccept={(v) => set("about_html", v.slice(0, 5000))}
                />
                <div className="text-xs text-zinc-500">
                  {form.about_html.length}/5000
                </div>
              </div>
            </Field>
          </Section>

          <Section title="Contact" subtitle="How customers reach you.">
            <Field label="Phone">
              <input
                type="tel"
                value={form.social_phone}
                onChange={(e) => set("social_phone", e.target.value)}
                placeholder="(414) 555-0142"
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.social_email}
                onChange={(e) => set("social_email", e.target.value)}
                placeholder="hello@yourbusiness.com"
                className={inputCls}
              />
            </Field>
            <Field label="Website">
              <input
                type="url"
                value={form.social_website}
                onChange={(e) => set("social_website", e.target.value)}
                placeholder="https://yourbusiness.com"
                className={inputCls}
              />
            </Field>
            <Field label="Instagram">
              <input
                type="url"
                value={form.social_instagram}
                onChange={(e) => set("social_instagram", e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className={inputCls}
              />
            </Field>
          </Section>
        </div>

        {/* Preview pane */}
        <div className="hidden lg:block border-l border-zinc-800 bg-zinc-950 lg:max-h-[calc(100vh-65px)] lg:sticky lg:top-[65px]">
          <div className="px-4 py-2 text-xs text-zinc-500 flex items-center justify-between border-b border-zinc-800/50">
            <span>Live preview</span>
            {!isPublished && (
              <span className="text-zinc-600">
                Draft · only you can see this
              </span>
            )}
          </div>
          <iframe
            key={previewKey}
            src={previewSrc}
            title="Storefront preview"
            className="w-full"
            style={{ height: "calc(100vh - 65px - 30px)" }}
          />
        </div>

        {/* Mobile: show a "view" link instead of iframe */}
        <div className="lg:hidden px-4 pb-12">
          <Link
            href={`/store/${storefront.slug}`}
            target="_blank"
            className="block w-full text-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-800"
          >
            Open live preview ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------- presentational helpers ----------

const inputCls =
  "w-full rounded-lg bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-brand-orange/60 focus:outline-none px-3 py-2 text-sm text-white placeholder-zinc-600";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        {hint && <span className="text-xs text-zinc-600 ml-2">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_BRAND_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c.toLowerCase())}
            className={
              "w-8 h-8 rounded-lg transition-transform hover:scale-110 " +
              (value.toLowerCase() === c.toLowerCase()
                ? "ring-2 ring-offset-2 ring-offset-black ring-white"
                : "ring-1 ring-zinc-800")
            }
            style={{ backgroundColor: c }}
            aria-label={`Set brand color to ${c}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          placeholder="#000000"
          className={inputCls + " font-mono"}
        />
      </div>
    </div>
  );
}

function IconPicker({
  selected,
  brandColor,
  onSelect,
}: {
  selected: string;
  brandColor: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {STOREFRONT_ICON_OPTIONS.map((name) => {
        const Icon =
          (Lucide as unknown as Record<string, LucideIcon>)[name] ??
          Lucide.Sparkles;
        const isSelected = selected === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            title={name}
            className={
              "aspect-square rounded-lg flex items-center justify-center transition-colors " +
              (isSelected
                ? "ring-2 ring-white"
                : "ring-1 ring-zinc-800 hover:ring-zinc-700")
            }
            style={{
              backgroundColor: isSelected ? brandColor : "rgb(24 24 27)",
              color: isSelected ? pickContrast(brandColor) : "rgb(161 161 170)",
            }}
            aria-label={`Select ${name} icon`}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}

function pickContrast(hex: string): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return "#000000";
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? "#000000" : "#ffffff";
}

function SaveIndicator({
  state,
  error,
}: {
  state: SaveState;
  error: string | null;
}) {
  if (state === "saving") {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="w-3.5 h-3.5" />
        Saved
      </span>
    );
  }
  if (state === "dirty") {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500">
        Unsaved changes
      </span>
    );
  }
  if (state === "error") {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1.5 text-xs text-red-400"
        title={error ?? ""}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        Save failed
      </span>
    );
  }
  return null;
}
