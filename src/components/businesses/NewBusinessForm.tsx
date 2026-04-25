"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  createBusiness,
  setActiveIdentity,
  type BusinessType,
} from "@/lib/actions/businesses";

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "franchise", label: "Franchise" },
  { value: "other", label: "Other" },
];

export interface NewBusinessFormProps {
  defaultCity: string;
  defaultState: string;
}

export function NewBusinessForm({
  defaultCity,
  defaultState,
}: NewBusinessFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("sole_proprietor");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [state, setState] = useState(defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createBusiness({
        name: name.trim(),
        business_type: businessType,
        website: website.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
      });
      if (result.error || !result.business) {
        setError(result.error ?? "Couldn't create the business");
        setSubmitting(false);
        return;
      }
      // Auto-switch to the new business as the active identity so any
      // immediate next step (storefront editor, listing creation, etc.)
      // happens in its context.
      await setActiveIdentity({ businessId: result.business.id });
      router.push("/dashboard/storefront");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const valid = name.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/businesses"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to businesses
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-xl bg-brand-orange/10 ring-1 ring-brand-orange/30 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-brand-orange" />
        </span>
        <h1 className="text-2xl font-black text-white">Create a business</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        A business is a separate brand entity — it gets its own URL, storefront,
        and shop listings. New businesses are reviewed by admins before
        publishing (usually within 24 hours).
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Business name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 120))}
            placeholder="e.g. Pure Grounds"
            maxLength={120}
            autoFocus
            required
            className={inputCls}
          />
        </Field>

        <Field label="Business type">
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value as BusinessType)}
            className={inputCls}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Website" hint="Optional. We'll link it on your storefront.">
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourbusiness.com"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Field label="City">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value.slice(0, 80))}
                placeholder="Oak Creek"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="State">
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="WI"
              className={inputCls + " uppercase"}
            />
          </Field>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl bg-brand-orange/5 ring-1 ring-brand-orange/20 px-4 py-3 text-sm flex gap-2">
          <Sparkles className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
          <span className="text-zinc-300">
            Tip: after creating, run the AI Setup Wizard from your dashboard —
            it&apos;ll generate your storefront in about 10 seconds.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/businesses"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!valid || submitting}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold bg-brand-orange hover:bg-brand-orange/90 text-white disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>Create business</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg bg-zinc-900 ring-1 ring-zinc-800 focus:ring-2 focus:ring-brand-orange/60 focus:outline-none px-3 py-2 text-sm text-white placeholder-zinc-600";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-zinc-300">
          {label}
          {required && <span className="text-brand-orange ml-1">*</span>}
        </span>
        {hint && <span className="text-xs text-zinc-600 ml-2">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
