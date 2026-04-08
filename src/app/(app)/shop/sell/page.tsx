"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Combobox } from "@/components/ui/combobox";
import { BackButton } from "@/components/ui/back-button";
import { AIJobAssist } from "@/components/ui/ai-assist";
import { createShopListing } from "@/lib/actions/shop";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2,
  Package, FileText, BookOpen, Calendar, Repeat,
  Clock, Video, MapPin, Users, BookmarkCheck,
  Sparkles, DollarSign, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const LISTING_TYPES = [
  {
    key: "digital",
    label: "Digital Product",
    desc: "Files, templates, guides, ebooks, beat packs, presets",
    icon: FileText,
    hint: "Upload once, sell forever. No shipping needed.",
    titlePlaceholder: "e.g. Logo Template Pack, Beat Pack Vol. 1, Photography Presets",
    descPlaceholder: "What's included? How many files? What format (PDF, MP3, PSD, etc.)? What will the buyer be able to do with it?",
  },
  {
    key: "product",
    label: "Physical Product",
    desc: "Handmade items, custom goods, art, crafts, clothing",
    icon: Package,
    hint: "Sell physical items with shipping or local meetup.",
    titlePlaceholder: "e.g. Custom Resin Art, Handmade Candles, Printed T-Shirt",
    descPlaceholder: "Describe the item: size, materials, colors available. Is it made to order or ready to ship? How long does it take to make?",
  },
  {
    key: "service",
    label: "Service",
    desc: "Tutoring, training, consulting, coaching, lessons",
    icon: BookOpen,
    hint: "Sell your expertise by the session or package.",
    titlePlaceholder: "e.g. Python Tutoring, Personal Training, Tax Consulting",
    descPlaceholder: "What will the client learn or gain? What's your experience/qualifications? What should they bring or prepare?",
  },
  {
    key: "experience",
    label: "Experience",
    desc: "Workshops, group classes, events, bootcamps",
    icon: Calendar,
    hint: "Host group sessions that multiple people can join.",
    titlePlaceholder: "e.g. Beginner Pottery Workshop, Fitness Bootcamp, Cooking Class",
    descPlaceholder: "What will attendees do? What skill level is required? What's provided (materials, equipment)? Where does it take place?",
  },
  {
    key: "subscription",
    label: "Subscription",
    desc: "Weekly/monthly recurring service or content",
    icon: Repeat,
    hint: "Recurring income — clients pay weekly, biweekly, or monthly.",
    titlePlaceholder: "e.g. Weekly Meal Prep, Monthly Lawn Care, Biweekly Coaching Sessions",
    descPlaceholder: "What does the client get each billing cycle? How often do you deliver? What's included vs. extra? Can they pause or cancel anytime?",
  },
];

const REFUND_OPTIONS = [
  { value: "no_refunds", label: "No refunds" },
  { value: "24_hours", label: "24-hour refund window" },
  { value: "7_days", label: "7-day refund window" },
  { value: "30_days", label: "30-day refund window" },
];

const SESSION_FORMATS = [
  { value: "in_person", label: "In-person only" },
  { value: "video", label: "Video call only" },
  { value: "both", label: "Both (in-person & video)" },
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4+ hours" },
];

export default function SellPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSuggestion, setPricingSuggestion] = useState<{
    suggestedPrice: number;
    priceRange: { low: number; high: number };
    reasoning: string;
    packages?: { basic: { price: number; description: string }; standard: { price: number; description: string }; premium: { price: number; description: string } };
    tips: string[];
    subscriptionSuggestion?: string;
  } | null>(null);

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

  const typeConfig = LISTING_TYPES.find((t) => t.key === form.listingType);

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
          <Link href="/shop/sell"><Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setStep(0); setForm({ ...form, title: "", description: "", price: "" }); }}>List Another</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/profile/me" />
      <h1 className="text-xl font-black text-white mb-1">Sell Something</h1>
      <p className="text-sm text-zinc-400 mb-6">List a product, service, or experience for sale.</p>

      {/* Progress bar */}
      {step > 0 && (
        <div className="flex gap-1 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("flex-1 h-1 rounded-full", step >= s ? "bg-brand-orange" : "bg-zinc-800")} />
          ))}
        </div>
      )}

      {/* ─── Step 0: Choose listing type ─── */}
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

      {/* ─── Step 1: Details (tailored per type) ─── */}
      {step === 1 && typeConfig && (
        <div className="space-y-4">
          <button onClick={() => setStep(0)} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Change listing type
          </button>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-orange/5 border border-brand-orange/20">
            <typeConfig.icon className="w-4 h-4 text-brand-orange flex-shrink-0" />
            <p className="text-xs text-brand-orange">{typeConfig.hint}</p>
          </div>

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
            placeholder={typeConfig.titlePlaceholder}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              rows={5}
              placeholder={typeConfig.descPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-card text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>

          {/* ── Service / Experience / Subscription: session details on step 1 ── */}
          {(form.listingType === "service" || form.listingType === "experience" || form.listingType === "subscription") && (
            <div className="p-3 rounded-xl bg-card border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-orange" />
                {form.listingType === "subscription" ? "Service Details" : "Session Details"}
              </h3>

              {/* Session format */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                  <Video className="w-3 h-3" /> How will you deliver this?
                </label>
                <div className="flex gap-1.5">
                  {SESSION_FORMATS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateForm({ sessionFormat: opt.value })}
                      className={cn(
                        "flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                        form.sessionFormat === opt.value
                          ? "border-brand-orange bg-brand-orange/10 text-white"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Session Duration
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateForm({ sessionDuration: opt.value })}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                        form.sessionDuration === opt.value
                          ? "border-brand-orange bg-brand-orange/10 text-white"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location for in-person */}
              {(form.sessionFormat === "in_person" || form.sessionFormat === "both") && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <p className="text-[11px] text-zinc-400">For in-person sessions, your city from your profile will be shown. Exact location is shared after booking.</p>
                </div>
              )}

              {/* Group size for experiences */}
              {form.listingType === "experience" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Max Group Size
                  </label>
                  <div className="flex gap-1.5">
                    {["2", "5", "10", "15", "20", "30"].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateForm({ groupMaxSize: size })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                          form.groupMaxSize === size
                            ? "border-brand-orange bg-brand-orange/10 text-white"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing frequency for subscriptions */}
              {form.listingType === "subscription" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> Billing Frequency
                  </label>
                  <div className="flex gap-1.5">
                    {[
                      { value: "weekly", label: "Weekly" },
                      { value: "biweekly", label: "Every 2 Weeks" },
                      { value: "monthly", label: "Monthly" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateForm({ recurringInterval: opt.value })}
                        className={cn(
                          "flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                          form.recurringInterval === opt.value
                            ? "border-brand-orange bg-brand-orange/10 text-white"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Physical product: condition + delivery on step 1 ── */}
          {form.listingType === "product" && (
            <div className="p-3 rounded-xl bg-card border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-brand-orange" /> Product Details
              </h3>
              <Combobox options={CONDITIONS} value={form.condition} onChange={(val) => updateForm({ condition: val })} label="Condition" />
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">How will the buyer get this?</label>
                <div className="flex gap-1.5">
                  {[
                    { value: "none", label: "Local Pickup" },
                    { value: "shipping", label: "Shipping" },
                    { value: "meetup", label: "Meetup" },
                    { value: "both", label: "Ship or Meetup" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateForm({ shippingType: opt.value })}
                      className={cn(
                        "flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                        form.shippingType === opt.value
                          ? "border-brand-orange bg-brand-orange/10 text-white"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {(form.shippingType === "shipping" || form.shippingType === "both") && (
                <Input label="Shipping Cost ($)" value={form.shippingPrice} onChange={(e) => updateForm({ shippingPrice: e.target.value })} placeholder="5.00" />
              )}
            </div>
          )}

          {/* ── Digital product: format hint ── */}
          {form.listingType === "digital" && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-zinc-800">
              <BookmarkCheck className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <p className="text-[11px] text-zinc-400">Digital products are delivered instantly after purchase. Make sure your description includes the file format and what the buyer gets.</p>
            </div>
          )}

          <AIJobAssist
            title={form.title}
            description={form.description}
            category={form.category}
            onApplySuggestion={(text) => updateForm({ description: text })}
          />

          <Button className="w-full" onClick={() => setStep(2)} disabled={!form.title || !form.category}>
            Continue to Pricing <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ─── Step 2: Pricing & Review ─── */}
      {step === 2 && typeConfig && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to details
          </button>
          <h2 className="text-base font-bold text-white">Set Your Price</h2>

          {/* AI Pricing Assistant */}
          <button
            onClick={async () => {
              setPricingLoading(true);
              try {
                const res = await fetch("/api/ai/suggest", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "pricing",
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    listingType: form.listingType,
                    sessionDuration: form.sessionDuration,
                    sessionFormat: form.sessionFormat,
                    recurringInterval: form.recurringInterval,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setPricingSuggestion(data);
                }
              } catch { /* ignore */ }
              setPricingLoading(false);
            }}
            disabled={pricingLoading || !form.title}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-brand-orange/30 bg-brand-orange/5 text-brand-orange hover:bg-brand-orange/10 transition-colors disabled:opacity-50"
          >
            {pricingLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing prices...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Help me price this</>
            )}
          </button>

          {/* AI Pricing Results */}
          {pricingSuggestion && (
            <div className="p-3 rounded-xl border border-brand-orange/20 bg-zinc-900 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-brand-orange">
                <DollarSign className="w-3.5 h-3.5" /> AI Pricing Suggestion
              </div>

              {/* Suggested price + range */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">${pricingSuggestion.suggestedPrice}</div>
                  <div className="text-[10px] text-zinc-500">Suggested</div>
                </div>
                <div className="text-[10px] text-zinc-500">
                  Range: ${pricingSuggestion.priceRange.low} – ${pricingSuggestion.priceRange.high}
                </div>
                <button
                  onClick={() => updateForm({ price: String(pricingSuggestion.suggestedPrice) })}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-brand-orange text-white text-xs font-medium hover:bg-orange-600 transition-colors"
                >
                  Use this price
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">{pricingSuggestion.reasoning}</p>

              {/* Package suggestions */}
              {pricingSuggestion.packages && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Suggested Packages</span>
                    <button
                      onClick={() => {
                        const pkg = pricingSuggestion.packages!;
                        updateForm({
                          priceBasic: String(pkg.basic.price),
                          priceStandard: String(pkg.standard.price),
                          pricePremium: String(pkg.premium.price),
                          basicDescription: pkg.basic.description,
                          standardDescription: pkg.standard.description,
                          premiumDescription: pkg.premium.description,
                        });
                      }}
                      className="text-[10px] text-brand-orange hover:underline"
                    >
                      Apply all packages
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["basic", "standard", "premium"] as const).map((tier) => {
                      const pkg = pricingSuggestion.packages![tier];
                      return (
                        <div key={tier} className="p-2 rounded-lg bg-zinc-800 text-center">
                          <div className="text-[10px] text-zinc-500 capitalize">{tier}</div>
                          <div className="text-sm font-bold text-white">${pkg.price}</div>
                          <div className="text-[10px] text-zinc-400 line-clamp-2">{pkg.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tips */}
              {pricingSuggestion.tips.length > 0 && (
                <div className="space-y-1">
                  {pricingSuggestion.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                      <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subscription suggestion for services */}
              {pricingSuggestion.subscriptionSuggestion && form.listingType === "service" && !form.recurringInterval && (
                <div className="p-2 rounded-lg bg-green-900/20 border border-green-700/30">
                  <div className="flex items-center gap-1.5 text-[11px] text-green-300">
                    <Repeat className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium">Subscription idea:</span>
                  </div>
                  <p className="text-[11px] text-green-200/70 mt-0.5">{pricingSuggestion.subscriptionSuggestion}</p>
                  <button
                    onClick={() => { updateForm({ recurringInterval: "monthly" }); }}
                    className="mt-1.5 text-[10px] text-green-400 hover:underline"
                  >
                    Make this a monthly subscription →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main price */}
          <CurrencyInput
            label={form.listingType === "subscription" || form.recurringInterval ? `Price per ${form.recurringInterval || "month"}` : "Price"}
            value={form.price}
            onChange={(val) => updateForm({ price: val })}
            min={1}
            placeholder="0.00"
          />

          {/* Service → Subscription upsell */}
          {form.listingType === "service" && !form.recurringInterval && !pricingSuggestion?.subscriptionSuggestion && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-zinc-800">
              <Repeat className="w-4 h-4 text-brand-orange flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] text-zinc-300">Want recurring income? Offer this as a subscription too.</p>
              </div>
              <button
                onClick={() => updateForm({ recurringInterval: "monthly" })}
                className="text-[10px] text-brand-orange hover:underline whitespace-nowrap"
              >
                Add subscription
              </button>
            </div>
          )}

          {/* Recurring interval selector (shows if service opted into subscription) */}
          {form.listingType === "service" && form.recurringInterval && (
            <div className="p-3 rounded-xl bg-card border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                  <Repeat className="w-3 h-3" /> Billing Frequency
                </label>
                <button onClick={() => updateForm({ recurringInterval: "" })} className="text-[10px] text-zinc-500 hover:text-white">Remove subscription</button>
              </div>
              <div className="flex gap-1.5">
                {[
                  { value: "weekly", label: "Weekly" },
                  { value: "biweekly", label: "Every 2 Weeks" },
                  { value: "monthly", label: "Monthly" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateForm({ recurringInterval: opt.value })}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                      form.recurringInterval === opt.value
                        ? "border-brand-orange bg-brand-orange/10 text-white"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Package tiers */}
          {(form.listingType === "service" || form.listingType === "experience" || form.listingType === "digital" || form.listingType === "subscription") && (
            <div className="p-3 rounded-xl bg-card border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-white">Package Tiers (Optional — increases sales by 40%)</h3>
              <p className="text-[10px] text-zinc-500">
                {form.listingType === "service" || form.listingType === "subscription"
                  ? "Example: Basic = 30 min session, Standard = 1 hour, Premium = 1 hour + follow-up materials"
                  : form.listingType === "experience"
                    ? "Example: Basic = group spot, Standard = front row, Premium = VIP + 1-on-1 time after"
                    : "Example: Basic = template only, Standard = template + tutorial video, Premium = full bundle + email support"}
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Basic $" value={form.priceBasic} onChange={(e) => updateForm({ priceBasic: e.target.value })} placeholder="25" />
                  <Input label="Standard $" value={form.priceStandard} onChange={(e) => updateForm({ priceStandard: e.target.value })} placeholder="50" />
                  <Input label="Premium $" value={form.pricePremium} onChange={(e) => updateForm({ pricePremium: e.target.value })} placeholder="100" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Basic includes" value={form.basicDescription} onChange={(e) => updateForm({ basicDescription: e.target.value })} placeholder="What's in Basic?" />
                  <Input label="Standard includes" value={form.standardDescription} onChange={(e) => updateForm({ standardDescription: e.target.value })} placeholder="What's in Standard?" />
                  <Input label="Premium includes" value={form.premiumDescription} onChange={(e) => updateForm({ premiumDescription: e.target.value })} placeholder="What's in Premium?" />
                </div>
              </div>
            </div>
          )}

          {/* Refund policy */}
          <Combobox options={REFUND_OPTIONS} value={form.refundPolicy} onChange={(val) => updateForm({ refundPolicy: val })} label="Refund Policy" />

          {/* Review summary */}
          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 space-y-1.5">
            <h3 className="text-xs font-bold text-white">Review</h3>
            <div className="text-[11px] text-zinc-400 space-y-1">
              <p><span className="text-zinc-500">Type:</span> <span className="text-white">{typeConfig.label}</span></p>
              <p><span className="text-zinc-500">Title:</span> <span className="text-white">{form.title}</span></p>
              <p><span className="text-zinc-500">Category:</span> <span className="text-white">{form.category}</span></p>
              <p><span className="text-zinc-500">Price:</span> <span className="text-white font-bold">${form.price || "0"}{form.recurringInterval ? `/${form.recurringInterval}` : ""}</span></p>
              {form.sessionDuration && <p><span className="text-zinc-500">Duration:</span> <span className="text-white">{form.sessionDuration} min</span></p>}
              {form.sessionFormat && (form.listingType === "service" || form.listingType === "experience" || form.listingType === "subscription") && (
                <p><span className="text-zinc-500">Format:</span> <span className="text-white capitalize">{form.sessionFormat.replace("_", " ")}</span></p>
              )}
              {form.groupMaxSize && <p><span className="text-zinc-500">Max group:</span> <span className="text-white">{form.groupMaxSize}</span></p>}
              {form.listingType === "product" && <p><span className="text-zinc-500">Condition:</span> <span className="text-white capitalize">{form.condition}</span></p>}
              <p><span className="text-zinc-500">Refund:</span> <span className="text-white">{REFUND_OPTIONS.find((r) => r.value === form.refundPolicy)?.label}</span></p>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500">NexGigs takes a 10% commission on all shop sales. You keep ${form.price ? (Number(form.price) * 0.9).toFixed(2) : "0.00"} per sale.</p>
          <p className="text-[10px] text-zinc-500">NexGigs reserves the right to mediate disputes and override refund policies to protect buyers.</p>

          {error && <div className="p-2 rounded-lg bg-brand-red/10 text-brand-red text-sm">{error}</div>}

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !form.price}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Listing...</> : `List for $${form.price || "0"}${form.recurringInterval ? `/${form.recurringInterval}` : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
