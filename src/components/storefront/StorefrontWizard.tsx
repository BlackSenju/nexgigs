"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  type Storefront,
  applyAiDraft,
} from "@/lib/actions/storefronts";

const VOICES = [
  { value: "friendly", label: "Friendly", hint: "Warm + first-person ('we')." },
  { value: "professional", label: "Professional", hint: "Polished + third-person." },
  { value: "playful", label: "Playful", hint: "Light wit. Never silly." },
  { value: "bold", label: "Bold", hint: "Direct. No hedging." },
] as const;

type Voice = (typeof VOICES)[number]["value"];

interface Draft {
  business_name: string;
  tagline: string;
  about_html: string;
  industry:
    | "service"
    | "clothing"
    | "food"
    | "coaching"
    | "maker"
    | "events"
    | "wellness"
    | "tech"
    | "other";
  brand_color: string;
  accent_color?: string | null;
  suggested_packages: Array<{
    title: string;
    price: number;
    description: string;
    listing_type: "product" | "digital" | "service" | "experience" | "subscription";
    recurring_interval?: string | null;
  }>;
  how_it_works: Array<{ step: number; title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
  service_areas: string[];
}

export interface StorefrontWizardProps {
  storefront: Storefront;
  defaultCity: string;
  defaultState: string;
}

export function StorefrontWizard({
  storefront,
  defaultCity,
  defaultState,
}: StorefrontWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [oneLine, setOneLine] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [state, setState] = useState(defaultState);
  const [voice, setVoice] = useState<Voice>("friendly");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const requestDraft = useCallback(async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/storefront/wizard/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oneLineDescription: oneLine,
          city,
          state,
          voice,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const json = await res.json();
      setDraft(json.draft as Draft);
      setStep(4);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setGenerating(false);
    }
  }, [oneLine, city, state, voice]);

  const onApply = useCallback(async () => {
    if (!draft) return;
    setApplying(true);
    setApplyError(null);
    const result = await applyAiDraft({ draft, createListings: true });
    if (result.error) {
      setApplyError(result.error);
      setApplying(false);
      return;
    }
    router.push("/dashboard/storefront");
    router.refresh();
  }, [draft, router]);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/dashboard/storefront"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to editor
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            AI Setup Wizard
          </div>
          <div className="text-xs text-zinc-500">Step {Math.min(step + 1, 5)} of 5</div>
        </div>
        <ProgressBar step={step} total={5} />
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {step === 0 && (
          <StepIntro
            oneLine={oneLine}
            setOneLine={setOneLine}
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <StepLocation
            city={city}
            state={state}
            setCity={setCity}
            setState={setState}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 2 && (
          <StepVoice
            voice={voice}
            setVoice={setVoice}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <StepGenerate
            oneLine={oneLine}
            city={city}
            state={state}
            voice={voice}
            generating={generating}
            error={genError}
            onGenerate={requestDraft}
            onBack={goBack}
          />
        )}
        {step === 4 && draft && (
          <StepReview
            draft={draft}
            setDraft={setDraft}
            slug={storefront.slug}
            applying={applying}
            applyError={applyError}
            onApply={onApply}
            onRegenerate={() => {
              setDraft(null);
              setStep(3);
            }}
          />
        )}
      </main>
    </div>
  );
}

// ---------- Steps ----------

function StepIntro({
  oneLine,
  setOneLine,
  onNext,
}: {
  oneLine: string;
  setOneLine: (v: string) => void;
  onNext: () => void;
}) {
  const valid = oneLine.trim().length >= 8;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
          Tell us what you do —
          <br />
          <span className="text-brand-orange">in one sentence.</span>
        </h1>
        <p className="text-zinc-400">
          We&apos;ll generate your full storefront in about 10 seconds. Don&apos;t
          worry — you&apos;ll review and edit everything before it goes live.
        </p>
      </div>
      <textarea
        value={oneLine}
        onChange={(e) => setOneLine(e.target.value.slice(0, 500))}
        rows={3}
        autoFocus
        placeholder="e.g. I do pet waste removal in Oak Creek — weekly, bi-weekly, or one-time."
        className="w-full rounded-xl bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-brand-orange/60 focus:outline-none px-4 py-3 text-base text-white placeholder-zinc-600"
        maxLength={500}
      />
      <div className="text-xs text-zinc-500 -mt-3">{oneLine.length}/500</div>
      <div className="flex justify-end">
        <NextButton disabled={!valid} onClick={onNext} />
      </div>
    </div>
  );
}

function StepLocation({
  city,
  state,
  setCity,
  setState,
  onNext,
  onBack,
}: {
  city: string;
  state: string;
  setCity: (v: string) => void;
  setState: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = city.trim().length > 0 && state.trim().length > 0;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">
          Where are you based?
        </h2>
        <p className="text-zinc-400">
          NexGigs is hyperlocal — your storefront highlights the
          neighborhoods you serve.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium text-zinc-300 mb-1 block">City</span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, 80))}
            placeholder="Oak Creek"
            className="w-full rounded-lg bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-brand-orange/60 focus:outline-none px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300 mb-1 block">State</span>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="WI"
            className="w-full rounded-lg bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-brand-orange/60 focus:outline-none px-3 py-2 text-sm uppercase"
          />
        </label>
      </div>
      <Footer onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </div>
  );
}

function StepVoice({
  voice,
  setVoice,
  onNext,
  onBack,
}: {
  voice: Voice;
  setVoice: (v: Voice) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">
          How do you talk to customers?
        </h2>
        <p className="text-zinc-400">
          We&apos;ll match this voice when we draft your copy.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VOICES.map((v) => {
          const selected = voice === v.value;
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => setVoice(v.value)}
              className={
                "rounded-xl px-4 py-4 text-left transition-colors " +
                (selected
                  ? "ring-2 ring-brand-orange bg-brand-orange/10"
                  : "ring-1 ring-zinc-800 bg-card hover:bg-zinc-900/60")
              }
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-white">{v.label}</h3>
                {selected && <Check className="w-4 h-4 text-brand-orange" />}
              </div>
              <p className="text-sm text-zinc-400 mt-1">{v.hint}</p>
            </button>
          );
        })}
      </div>
      <Footer onBack={onBack} onNext={onNext} />
    </div>
  );
}

function StepGenerate({
  oneLine,
  city,
  state,
  voice,
  generating,
  error,
  onGenerate,
  onBack,
}: {
  oneLine: string;
  city: string;
  state: string;
  voice: Voice;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">
          Ready to draft your storefront?
        </h2>
        <p className="text-zinc-400">
          Here&apos;s what we have so far. Hit Generate when you&apos;re ready.
        </p>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-zinc-800 p-5 space-y-3 text-sm">
        <Row label="What you do" value={oneLine} />
        <Row label="Location" value={`${city}, ${state}`} />
        <Row label="Voice" value={VOICES.find((v) => v.value === voice)?.label ?? voice} />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/30 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={generating}
          className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="rounded-full px-6 py-3 font-bold bg-brand-orange hover:bg-brand-orange/90 text-white disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Drafting your storefront…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </>
          )}
        </button>
      </div>
      {generating && (
        <p className="text-xs text-zinc-500 text-center">
          Usually takes 6–10 seconds. Hold tight — we&apos;re writing your
          tagline, packages, FAQs, and more.
        </p>
      )}
    </div>
  );
}

function StepReview({
  draft,
  setDraft,
  slug,
  applying,
  applyError,
  onApply,
  onRegenerate,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  slug: string;
  applying: boolean;
  applyError: string | null;
  onApply: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">
          Looks like this?
        </h2>
        <p className="text-zinc-400">
          Edit anything that doesn&apos;t feel right. We&apos;ll save it all to
          your storefront.
        </p>
      </div>

      <Card title="Business name">
        <input
          type="text"
          value={draft.business_name}
          onChange={(e) => setDraft({ ...draft, business_name: e.target.value.slice(0, 60) })}
          className={inputCls}
        />
      </Card>

      <Card title="Tagline">
        <input
          type="text"
          value={draft.tagline}
          onChange={(e) => setDraft({ ...draft, tagline: e.target.value.slice(0, 180) })}
          className={inputCls}
        />
      </Card>

      <Card title="About">
        <textarea
          value={draft.about_html}
          onChange={(e) => setDraft({ ...draft, about_html: e.target.value.slice(0, 5000) })}
          rows={5}
          className={inputCls + " font-mono text-sm"}
        />
      </Card>

      <Card title="Brand color">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg ring-1 ring-zinc-800"
            style={{ backgroundColor: draft.brand_color }}
          />
          <input
            type="color"
            value={draft.brand_color}
            onChange={(e) =>
              setDraft({ ...draft, brand_color: e.target.value.toLowerCase() })
            }
            className="w-12 h-10 cursor-pointer bg-transparent rounded"
          />
          <input
            type="text"
            value={draft.brand_color}
            onChange={(e) =>
              setDraft({ ...draft, brand_color: e.target.value.toLowerCase().slice(0, 7) })
            }
            className={inputCls + " font-mono max-w-[8rem]"}
          />
        </div>
      </Card>

      <Card title={`Suggested packages (${draft.suggested_packages.length})`}>
        <ul className="space-y-3">
          {draft.suggested_packages.map((pkg, i) => (
            <li
              key={i}
              className="rounded-lg bg-zinc-950 ring-1 ring-zinc-800 p-3 text-sm"
            >
              <div className="font-bold text-white">{pkg.title}</div>
              <div className="text-zinc-500">
                ${pkg.price}
                {pkg.recurring_interval ? ` / ${pkg.recurring_interval}` : ""} ·{" "}
                {pkg.listing_type}
              </div>
              <p className="text-zinc-400 mt-1 line-clamp-2">{pkg.description}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500 mt-2">
          We&apos;ll create these as shop listings on your storefront. You can edit
          or remove them anytime.
        </p>
      </Card>

      <Card title="Service areas">
        <div className="flex flex-wrap gap-2">
          {draft.service_areas.length > 0 ? (
            draft.service_areas.map((area) => (
              <span
                key={area}
                className="px-3 py-1 rounded-full text-sm bg-zinc-900 ring-1 ring-zinc-800"
              >
                {area}
              </span>
            ))
          ) : (
            <span className="text-sm text-zinc-500">None — online-only.</span>
          )}
        </div>
      </Card>

      <Card title={`How it works (${draft.how_it_works.length} steps)`}>
        <ol className="space-y-2">
          {draft.how_it_works.map((step) => (
            <li key={step.step} className="text-sm">
              <span className="text-brand-orange font-bold mr-1.5">
                {step.step}.
              </span>
              <span className="text-white font-semibold">{step.title}</span>
              <span className="text-zinc-400"> — {step.body}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title={`FAQs (${draft.faqs.length})`}>
        <ul className="space-y-2 text-sm">
          {draft.faqs.map((faq, i) => (
            <li key={i}>
              <div className="font-semibold text-white">{faq.q}</div>
              <div className="text-zinc-400">{faq.a}</div>
            </li>
          ))}
        </ul>
      </Card>

      {applyError && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/30 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{applyError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-12">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={applying}
          className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          className="rounded-full px-6 py-3 font-bold bg-brand-orange hover:bg-brand-orange/90 text-white disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {applying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save to my storefront
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-zinc-600 text-center pb-12">
        Your storefront URL: <span className="text-zinc-400">/store/{slug}</span>{" "}
        — still in draft, only you can see it.
      </p>
    </div>
  );
}

// ---------- helpers ----------

const inputCls =
  "w-full rounded-lg bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-brand-orange/60 focus:outline-none px-3 py-2 text-sm text-white placeholder-zinc-600";

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((Math.min(step + 1, total) - 1) / (total - 1)) * 100;
  return (
    <div className="h-1 bg-zinc-900">
      <div
        className="h-full bg-brand-orange transition-all"
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-zinc-500 shrink-0 w-24">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card ring-1 ring-zinc-800 p-4 space-y-2">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {children}
    </div>
  );
}

function NextButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-5 py-2.5 font-bold bg-brand-orange hover:bg-brand-orange/90 text-white disabled:opacity-60 inline-flex items-center gap-1.5"
    >
      Continue
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}

function Footer({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <NextButton disabled={nextDisabled} onClick={onNext} />
    </div>
  );
}
