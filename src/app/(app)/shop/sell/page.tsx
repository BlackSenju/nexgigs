"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Combobox } from "@/components/ui/combobox";
import { BackButton } from "@/components/ui/back-button";
import { AIJobAssist } from "@/components/ui/ai-assist";
import { createShopListing } from "@/lib/actions/shop";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2, Plus,
  Package, FileText, BookOpen, Calendar, Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const LISTING_TYPES = [
  { key: "digital", label: "Digital Product", desc: "Files, templates, guides, ebooks, beat packs", icon: FileText },
  { key: "product", label: "Physical Product", desc: "Handmade items, custom goods, art, crafts", icon: Package },
  { key: "service", label: "Service", desc: "Tutoring, training, consulting, coaching", icon: BookOpen },
  { key: "experience", label: "Experience", desc: "Workshops, group classes, events", icon: Calendar },
  { key: "subscription", label: "Subscription", desc: "Weekly/monthly recurring service", icon: Repeat },
];

const REFUND_OPTIONS = [
  { value: "no_refunds", label: "No refunds" },
  { value: "24_hours", label: "24-hour refund window" },
  { value: "7_days", label: "7-day refund window" },
  { value: "30_days", label: "30-day refund window" },
];

const SESSION_FORMATS = [
  { value: "in_person", label: "In-person" },
  { value: "video", label: "Video call" },
  { value: "both", label: "Both (in-person & video)" },
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function SellPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    listingType: "",
    title: "",
    description: "",
    category: "",
    price: "",
    priceBasic: "",
    priceStandard: "",
    pricePremium: "",
    basicDescription: "",
    standardDescription: "",
    premiumDescription: "",
    condition: "new",
    shippingType: "none",
    shippingPrice: "",
    meetupEnabled: false,
    sessionDuration: "",
    sessionFormat: "both",
    groupMaxSize: "",
    recurringInterval: "",
    refundPolicy: "no_refunds",
  });

  function updateForm(updates: Partial<typeof form>) {
    setForm({ ...form, ...updates });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const result = await createShopListing({
      title: form.title,
      description: form.description,
      category: form.category,
      listingType: form.listingType as "product" | "digital" | "service" | "experience" | "subscription",
      price: Number(form.price) || 0,
      priceBasic: form.priceBasic ? Number(form.priceBasic) : undefined,
      priceStandard: form.priceStandard ? Number(form.priceStandard) : undefined,
      pricePremium: form.pricePremium ? Number(form.pricePremium) : undefined,
      basicDescription: form.basicDescription || undefined,
      standardDescription: form.standardDescription || undefined,
      premiumDescription: form.premiumDescription || undefined,
      condition: form.condition,
      shippingType: form.shippingType,
      shippingPrice: form.shippingPrice ? Number(form.shippingPrice) : 0,
      meetupEnabled: form.meetupEnabled,
      sessionDuration: form.sessionDuration ? Number(form.sessionDuration) : undefined,
      sessionFormat: form.sessionFormat,
      groupMaxSize: form.groupMaxSize ? Number(form.groupMaxSize) : undefined,
      recurringInterval: form.recurringInterval || undefined,
      refundPolicy: form.refundPolicy,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
        <h1 className="mt-4 text-2xl font-black text-white">Listed!</h1>
        <p className="mt-2 text-zinc-400">Your listing is now live in the NexGigs Shop.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/shop"><Button className="w-full">View Shop</Button></Link>
          <Link href="/profile/me"><Button variant="outline" className="w-full">Back to Profile</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/profile/me" />
      <h1 className="text-xl font-black text-white mb-1">Sell Something</h1>
      <p className="text-sm text-zinc-400 mb-6">List a product, service, or experience for sale.</p>

      {/* Step 0: Choose listing type */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white">What are you selling?</h2>
          {LISTING_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => { updateForm({ listingType: type.key }); setStep(1); }}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                form.listingType === type.key
                  ? "border-brand-orange bg-brand-orange/5"
                  : "border-zinc-800 bg-card hover:border-zinc-600"
              )}
            >
              <type.icon className="w-6 h-6 text-brand-orange flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">{type.label}</h3>
                <p className="text-xs text-zinc-400">{type.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <button onClick={() => setStep(0)} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Change listing type
          </button>
          <h2 className="text-base font-bold text-white">Describe your listing</h2>

          <Combobox
            options={SERVICE_CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
            value={form.category}
            onChange={(val) => updateForm({ category: val })}
            label="Category"
            placeholder="Select a category..."
          />

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="What are you selling?"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              rows={4}
              placeholder="Describe what you are offering. Be specific about what the buyer gets."
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-card text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>

          <AIJobAssist
            title={form.title}
            description={form.description}
            category={form.category}
            onApplySuggestion={(text) => updateForm({ description: text })}
          />

          <Button className="w-full" onClick={() => setStep(2)} disabled={!form.title || !form.category}>
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 2: Pricing & Type-specific fields */}
      {step === 2 && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to details
          </button>
          <h2 className="text-base font-bold text-white">Pricing & Options</h2>

          <CurrencyInput label="Price" value={form.price} onChange={(val) => updateForm({ price: val })} min={1} placeholder="0.00" />

          {/* Package tiers (optional) */}
          <div className="p-3 rounded-xl bg-card border border-zinc-800">
            <h3 className="text-xs font-bold text-white mb-2">Package Tiers (Optional)</h3>
            <p className="text-[10px] text-zinc-500 mb-3">Offer Basic, Standard, and Premium options at different prices.</p>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Input label="Basic $" value={form.priceBasic} onChange={(e) => updateForm({ priceBasic: e.target.value })} placeholder="25" />
                <Input label="Standard $" value={form.priceStandard} onChange={(e) => updateForm({ priceStandard: e.target.value })} placeholder="50" />
                <Input label="Premium $" value={form.pricePremium} onChange={(e) => updateForm({ pricePremium: e.target.value })} placeholder="100" />
              </div>
            </div>
          </div>

          {/* Physical product fields */}
          {form.listingType === "product" && (
            <div className="space-y-3">
              <Combobox options={CONDITIONS} value={form.condition} onChange={(val) => updateForm({ condition: val })} label="Condition" />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Delivery Method</label>
                <div className="flex gap-2">
                  {["none", "shipping", "meetup", "both"].map((opt) => (
                    <button key={opt} onClick={() => updateForm({ shippingType: opt })}
                      className={cn("flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border", form.shippingType === opt ? "border-brand-orange bg-brand-orange/10 text-white" : "border-zinc-700 text-zinc-400")}
                    >{opt === "none" ? "Pickup" : opt === "both" ? "Ship or Meet" : opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
                  ))}
                </div>
              </div>
              {(form.shippingType === "shipping" || form.shippingType === "both") && (
                <Input label="Shipping Cost ($)" value={form.shippingPrice} onChange={(e) => updateForm({ shippingPrice: e.target.value })} placeholder="5.00" />
              )}
            </div>
          )}

          {/* Service fields */}
          {(form.listingType === "service" || form.listingType === "experience") && (
            <div className="space-y-3">
              <Combobox options={SESSION_FORMATS} value={form.sessionFormat} onChange={(val) => updateForm({ sessionFormat: val })} label="Session Format" />
              <Input label="Session Duration (minutes)" type="number" value={form.sessionDuration} onChange={(e) => updateForm({ sessionDuration: e.target.value })} placeholder="60" />
              {form.listingType === "experience" && (
                <Input label="Max Group Size" type="number" value={form.groupMaxSize} onChange={(e) => updateForm({ groupMaxSize: e.target.value })} placeholder="10" />
              )}
            </div>
          )}

          {/* Subscription fields */}
          {form.listingType === "subscription" && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Billing Frequency</label>
              <div className="flex gap-2">
                {["weekly", "biweekly", "monthly"].map((opt) => (
                  <button key={opt} onClick={() => updateForm({ recurringInterval: opt })}
                    className={cn("flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border", form.recurringInterval === opt ? "border-brand-orange bg-brand-orange/10 text-white" : "border-zinc-700 text-zinc-400")}
                  >{opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
                ))}
              </div>
            </div>
          )}

          {/* Refund policy */}
          <Combobox options={REFUND_OPTIONS} value={form.refundPolicy} onChange={(val) => updateForm({ refundPolicy: val })} label="Refund Policy" />

          <p className="text-[10px] text-zinc-500">Note: NexGigs reserves the right to mediate disputes and override refund policies to protect buyers from scams.</p>

          {error && <div className="p-2 rounded-lg bg-brand-red/10 text-brand-red text-sm">{error}</div>}

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !form.price}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Listing...</> : "List for Sale"}
          </Button>
        </div>
      )}
    </div>
  );
}
