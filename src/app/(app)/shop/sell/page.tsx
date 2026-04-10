"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Combobox } from "@/components/ui/combobox";
import { BackButton } from "@/components/ui/back-button";
import { AIJobAssist } from "@/components/ui/ai-assist";
import { createShopListing } from "@/lib/actions/shop";
import { uploadShopImage } from "@/lib/actions/uploads";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2,
  Package, FileText, BookOpen, Calendar, Repeat,
  Clock, Video, MapPin, Users, BookmarkCheck,
  Sparkles, DollarSign, TrendingUp, Lock, Share2, ExternalLink,
  Camera, X, Image as ImageIcon, CreditCard, AlertTriangle,
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
  const [userId, setUserId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pricingSuggestion, setPricingSuggestion] = useState<{
    suggestedPrice: number;
    priceRange: { low: number; high: number };
    reasoning: string;
    packages?: { basic: { price: number; description: string }; standard: { price: number; description: string }; premium: { price: number; description: string } };
    tips: string[];
    subscriptionSuggestion?: string;
  } | null>(null);

  const [userTier, setUserTier] = useState("free");
  const [stripeStatus, setStripeStatus] = useState<"loading" | "not_connected" | "incomplete" | "active">("loading");
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load tier
      const { data } = await supabase
        .from("nexgigs_subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();
      if (data?.tier) setUserTier(data.tier);

      // Check Stripe Connect status
      try {
        const res = await fetch("/api/stripe/connect");
        const connectData = await res.json();
        setStripeStatus(connectData.status ?? "not_connected");
      } catch {
        setStripeStatus("not_connected");
      }
    }
    loadData();
  }, []);

  const isPro = ["pro", "elite", "business_starter", "business_growth", "enterprise"].includes(userTier);

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
    sizes: "" as string, // comma-separated: "S,M,L,XL"
    colors: "" as string, // comma-separated: "Black,White,Red"
    customOptions: "" as string, // comma-separated custom variants
    sessionDuration: "",
    sessionFormat: "both",
    groupMaxSize: "",
    recurringInterval: "",
    refundPolicy: "no_refunds",
    // Pricing model
    pricingModel: "flat" as string, // "flat", "hourly", "per_session", "per_person"
    hourlyRate: "",
    // Digital
    fileFormat: "",
    deliveryMethod: "instant" as string, // "instant", "email", "link"
    // Physical
    quantityAvailable: "",
    madeToOrder: false,
    // Service
    sessionsIncluded: "", // number of sessions in package
    availableDays: "" as string, // comma-separated: "Mon,Tue,Wed"
    availableHours: "", // e.g. "9am-5pm"
    cancellationPolicy: "flexible" as string, // "flexible", "moderate", "strict"
    // Experience
    eventDate: "",
    eventTime: "",
    isRecurringEvent: false,
    locationDetails: "",
    materialsIncluded: "",
    minAttendees: "",
    // Subscription
    sessionsPerCycle: "",
    trialSession: false,
  });

  const typeConfig = LISTING_TYPES.find((t) => t.key === form.listingType);

  function updateForm(updates: Partial<typeof form>) {
    setForm({ ...form, ...updates });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    // Upload images first
    const imageUrls: string[] = [];
    if (images.length > 0) {
      setUploadingImages(true);
      for (const img of images) {
        const formData = new FormData();
        formData.append("file", img.file);
        const uploadResult = await uploadShopImage(formData);
        if (uploadResult.imageUrl) {
          imageUrls.push(uploadResult.imageUrl);
        }
      }
      setUploadingImages(false);
    }

    const result = await createShopListing({
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
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

    if (result.item?.id) setCreatedItemId(result.item.id as string);
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
          {userId && (
            <Link href={`/shop/seller/${userId}`}>
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" /> View your shop
              </Button>
            </Link>
          )}
          {createdItemId && (
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/shop/${createdItemId}`);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                } catch { /* fallback */ }
              }}
            >
              <Share2 className="w-4 h-4 mr-2" /> {shareCopied ? "Link Copied!" : "Share your listing"}
            </Button>
          )}
          <Link href="/shop/sell"><Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setStep(0); setCreatedItemId(null); setForm({ ...form, title: "", description: "", price: "" }); }}>List Another</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/profile/me" />
      <h1 className="text-xl font-black text-white mb-1">Sell Something</h1>
      <p className="text-sm text-zinc-400 mb-4">List a product, service, or experience for sale.</p>

      {/* Payment setup banner */}
      {stripeStatus === "loading" ? null : stripeStatus === "active" ? (
        <div className="mb-4 p-3 rounded-xl bg-green-900/20 border border-green-700/30 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-300">Payments set up — you&apos;ll get paid directly to your bank or debit card.</p>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-xl bg-brand-orange/5 border border-brand-orange/20 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-orange flex-shrink-0" />
            <p className="text-xs text-brand-orange font-medium">Set up payments to get paid</p>
          </div>
          <p className="text-[11px] text-zinc-400">
            Connect your bank account or debit card (Cash App card, Chime, etc.) to receive money when someone buys from you. Takes 2 minutes.
          </p>
          <Button
            size="sm"
            className="w-full"
            disabled={connectLoading}
            onClick={async () => {
              setConnectLoading(true);
              try {
                const res = await fetch("/api/stripe/connect", { method: "POST" });
                const data = await res.json();
                if (data.onboardingUrl) {
                  window.location.href = data.onboardingUrl;
                } else if (data.status === "active") {
                  setStripeStatus("active");
                } else {
                  setError(data.error || "Failed to start payment setup");
                }
              } catch {
                setError("Payment setup failed. Try again.");
              }
              setConnectLoading(false);
            }}
          >
            {connectLoading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Setting up...</> : <><CreditCard className="w-3 h-3 mr-1" /> Set Up Payments</>}
          </Button>
          <p className="text-[10px] text-zinc-600">You can still list items now and set up payments later.</p>
        </div>
      )}

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

              {/* Sessions per package/cycle */}
              {(form.listingType === "service" || form.listingType === "subscription") && (
                <Input label="Sessions Included" type="number" value={form.sessionsIncluded} onChange={(e) => updateForm({ sessionsIncluded: e.target.value })} placeholder="e.g. 4 sessions per month" />
              )}

              {/* Availability */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Your Availability</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                    const selected = form.availableDays.split(",").filter(Boolean).includes(day);
                    return (
                      <button key={day} onClick={() => {
                        const current = form.availableDays.split(",").filter(Boolean);
                        const updated = selected ? current.filter((d) => d !== day) : [...current, day];
                        updateForm({ availableDays: updated.join(",") });
                      }} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                        selected ? "border-brand-orange bg-brand-orange/10 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      )}>
                        {day}
                      </button>
                    );
                  })}
                </div>
                <Input label="Hours" value={form.availableHours} onChange={(e) => updateForm({ availableHours: e.target.value })} placeholder="e.g. 9am - 5pm" />
              </div>

              {/* Cancellation policy */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cancellation Policy</label>
                <div className="flex gap-1.5">
                  {[
                    { value: "flexible", label: "Flexible", desc: "Free cancel up to 24hrs before" },
                    { value: "moderate", label: "Moderate", desc: "Free cancel up to 48hrs before" },
                    { value: "strict", label: "Strict", desc: "No refunds for cancellations" },
                  ].map((opt) => (
                    <button key={opt.value} onClick={() => updateForm({ cancellationPolicy: opt.value })}
                      className={cn("flex-1 p-2 rounded-lg text-center border transition-colors",
                        form.cancellationPolicy === opt.value ? "border-brand-orange bg-brand-orange/10" : "border-zinc-700 hover:border-zinc-500"
                      )}>
                      <div className="text-[11px] font-medium text-white">{opt.label}</div>
                      <div className="text-[9px] text-zinc-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription-specific: sessions per cycle & trial */}
              {form.listingType === "subscription" && (
                <>
                  <Input label="Sessions per Billing Cycle" type="number" value={form.sessionsPerCycle} onChange={(e) => updateForm({ sessionsPerCycle: e.target.value })} placeholder="e.g. 4 sessions per month" />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.trialSession} onChange={(e) => updateForm({ trialSession: e.target.checked })} className="rounded border-zinc-700" />
                    <label className="text-xs text-zinc-400">Offer a free trial session</label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Experience-specific: event details ── */}
          {form.listingType === "experience" && (
            <div className="p-3 rounded-xl bg-card border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-orange" /> Event Details
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Event Date" type="date" value={form.eventDate} onChange={(e) => updateForm({ eventDate: e.target.value })} />
                <Input label="Event Time" type="time" value={form.eventTime} onChange={(e) => updateForm({ eventTime: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isRecurringEvent} onChange={(e) => updateForm({ isRecurringEvent: e.target.checked })} className="rounded border-zinc-700" />
                <label className="text-xs text-zinc-400">This is a recurring event (e.g. weekly class)</label>
              </div>
              <Input label="Location" value={form.locationDetails} onChange={(e) => updateForm({ locationDetails: e.target.value })} placeholder="Address or 'Provided after booking'" />
              <Input label="What's Included" value={form.materialsIncluded} onChange={(e) => updateForm({ materialsIncluded: e.target.value })} placeholder="e.g. All materials, snacks, equipment" />
              <Input label="Minimum Attendees" type="number" value={form.minAttendees} onChange={(e) => updateForm({ minAttendees: e.target.value })} placeholder="e.g. 3 (leave blank for no minimum)" />
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

              {/* Sizes */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Available Sizes (optional)</label>
                <div className="flex flex-wrap gap-1.5">
                  {["XS", "S", "M", "L", "XL", "2XL", "3XL", "One Size"].map((size) => {
                    const currentSizes = form.sizes.split(",").filter(Boolean);
                    const selected = currentSizes.includes(size);
                    const atFreeLimit = !isPro && currentSizes.length >= 1 && !selected;
                    return (
                      <button
                        key={size}
                        disabled={atFreeLimit}
                        onClick={() => {
                          const updated = selected
                            ? currentSizes.filter((s) => s !== size)
                            : [...currentSizes, size];
                          updateForm({ sizes: updated.join(",") });
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                          selected
                            ? "border-brand-orange bg-brand-orange/10 text-white"
                            : atFreeLimit
                              ? "border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {!isPro && (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    <Link href="/subscription" className="text-brand-orange hover:underline">Pro members</Link> can offer all sizes
                  </p>
                )}
              </div>

              {/* Colors */}
              <div>
                <Input
                  label="Available Colors (optional)"
                  value={form.colors}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!isPro) {
                      // Free users: allow only 1 color (no commas)
                      const stripped = val.replace(/,/g, "");
                      updateForm({ colors: stripped });
                    } else {
                      updateForm({ colors: val });
                    }
                  }}
                  placeholder={isPro ? "e.g. Black, White, Red, Navy" : "e.g. Black"}
                />
                {!isPro && (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    <Link href="/subscription" className="text-brand-orange hover:underline">Pro members</Link> can offer all colors
                  </p>
                )}
              </div>

              {/* Custom variants */}
              <Input
                label="Other Options (optional)"
                value={form.customOptions}
                onChange={(e) => updateForm({ customOptions: e.target.value })}
                placeholder="e.g. Gold, Silver, Rose Gold or 14in, 16in, 18in chain"
              />

              {/* Quantity & Made to order */}
              <div className="grid grid-cols-2 gap-2">
                <Input label="Quantity Available" type="number" value={form.quantityAvailable} onChange={(e) => updateForm({ quantityAvailable: e.target.value })} placeholder="e.g. 10" />
                <div className="flex items-center gap-2 p-2">
                  <input type="checkbox" checked={form.madeToOrder} onChange={(e) => updateForm({ madeToOrder: e.target.checked })} className="rounded border-zinc-700" />
                  <label className="text-xs text-zinc-400">Made to order</label>
                </div>
              </div>
            </div>
          )}

          {/* ── Digital product: format hint + details ── */}
          {form.listingType === "digital" && (
            <>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-zinc-800">
                <BookmarkCheck className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <p className="text-[11px] text-zinc-400">Digital products are delivered instantly after purchase. Make sure your description includes the file format and what the buyer gets.</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-orange" /> Digital Product Details
                </h3>
                <Input label="File Format" value={form.fileFormat} onChange={(e) => updateForm({ fileFormat: e.target.value })} placeholder="e.g. PDF, MP3, PSD, ZIP, MP4" />
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Delivery Method</label>
                  <div className="flex gap-1.5">
                    {[{ value: "instant", label: "Instant Download" }, { value: "email", label: "Sent via Email" }, { value: "link", label: "Download Link" }].map((opt) => (
                      <button key={opt.value} onClick={() => updateForm({ deliveryMethod: opt.value })}
                        className={cn("flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                          form.deliveryMethod === opt.value ? "border-brand-orange bg-brand-orange/10 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Photo upload ── */}
          <div className="p-3 rounded-xl bg-card border border-zinc-800 space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-brand-orange" /> Photos (up to 5)
            </h3>
            <p className="text-[10px] text-zinc-500">
              {form.listingType === "product"
                ? "Show your product from multiple angles. Good photos = more sales."
                : form.listingType === "digital"
                  ? "Show a preview or mockup of what the buyer gets."
                  : "Show your workspace, past results, or a professional headshot."}
            </p>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(img.preview);
                        setImages(images.filter((_, idx) => idx !== i));
                      }}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 5 && (
              <>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full p-3 rounded-lg border border-dashed border-zinc-700 text-center hover:border-brand-orange/50 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-zinc-500 mx-auto" />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    {images.length === 0 ? "Add photos" : `Add more (${images.length}/5)`}
                  </span>
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB"); return; }
                    const preview = URL.createObjectURL(file);
                    setImages([...images, { file, preview }]);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>

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
          {isPro ? (
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
          ) : (
            <Link
              href="/subscription"
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">Upgrade to Pro to get AI pricing suggestions</span>
            </Link>
          )}

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

          {/* Pricing model selector for service/experience/subscription */}
          {(form.listingType === "service" || form.listingType === "experience" || form.listingType === "subscription") && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">How do you charge?</label>
              <div className="flex gap-1.5">
                {[
                  { value: "flat", label: "Flat Rate" },
                  { value: "hourly", label: "Per Hour" },
                  { value: "per_session", label: "Per Session" },
                  ...(form.listingType === "experience" ? [{ value: "per_person", label: "Per Person" }] : []),
                ].map((opt) => (
                  <button key={opt.value} onClick={() => updateForm({ pricingModel: opt.value })}
                    className={cn("flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                      form.pricingModel === opt.value ? "border-brand-orange bg-brand-orange/10 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main price */}
          <CurrencyInput
            label={
              form.listingType === "subscription" || form.recurringInterval
                ? `Price per ${form.recurringInterval || "month"}`
                : form.pricingModel === "hourly" ? "Rate per hour"
                : form.pricingModel === "per_session" ? "Price per session"
                : form.pricingModel === "per_person" ? "Price per person"
                : "Price"
            }
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

          {/* Package tiers / Bundle deals — available for ALL listing types */}
          {isPro ? (
            <div className="p-3 rounded-xl bg-card border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-white">
                {form.listingType === "product" ? "Bundle Deals (Optional — sell more per order)" : "Package Tiers (Optional — increases sales by 40%)"}
              </h3>
              <p className="text-[10px] text-zinc-500">
                {form.listingType === "product"
                  ? "Example: Single item vs 2-piece set vs Full collection. Bundles increase average order value."
                  : form.listingType === "service" || form.listingType === "subscription"
                    ? "Example: Basic = 30 min session, Standard = 1 hour, Premium = 1 hour + follow-up materials"
                    : form.listingType === "experience"
                      ? "Example: Basic = group spot, Standard = front row, Premium = VIP + 1-on-1 time after"
                      : "Example: Basic = template only, Standard = template + tutorial video, Premium = full bundle + email support"}
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label={form.listingType === "product" ? "Single $" : "Basic $"}
                    value={form.priceBasic} onChange={(e) => updateForm({ priceBasic: e.target.value })}
                    placeholder={form.listingType === "product" ? "40" : "25"}
                  />
                  <Input
                    label={form.listingType === "product" ? "2-Piece $" : "Standard $"}
                    value={form.priceStandard} onChange={(e) => updateForm({ priceStandard: e.target.value })}
                    placeholder={form.listingType === "product" ? "70" : "50"}
                  />
                  <Input
                    label={form.listingType === "product" ? "Bundle $" : "Premium $"}
                    value={form.pricePremium} onChange={(e) => updateForm({ pricePremium: e.target.value })}
                    placeholder={form.listingType === "product" ? "95" : "100"}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label={form.listingType === "product" ? "Single item" : "Basic includes"}
                    value={form.basicDescription} onChange={(e) => updateForm({ basicDescription: e.target.value })}
                    placeholder={form.listingType === "product" ? "e.g. T-shirt only" : "What's in Basic?"}
                  />
                  <Input
                    label={form.listingType === "product" ? "2-Piece set" : "Standard includes"}
                    value={form.standardDescription} onChange={(e) => updateForm({ standardDescription: e.target.value })}
                    placeholder={form.listingType === "product" ? "e.g. Shirt + hat" : "What's in Standard?"}
                  />
                  <Input
                    label={form.listingType === "product" ? "Full bundle" : "Premium includes"}
                    value={form.premiumDescription} onChange={(e) => updateForm({ premiumDescription: e.target.value })}
                    placeholder={form.listingType === "product" ? "e.g. Shirt + hat + bag" : "What's in Premium?"}
                  />
                </div>
              </div>
              {form.listingType === "product" && (form.priceBasic || form.priceStandard || form.pricePremium) && (
                <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    {form.pricePremium && form.priceBasic
                      ? `Buyers save $${(Number(form.priceBasic) * 3 - Number(form.pricePremium)).toFixed(0)} on the bundle vs buying separately`
                      : "Bundle discounts encourage bigger orders"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <Link href="/subscription" className="block">
              <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex items-center gap-3 hover:border-zinc-600 transition-colors">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Unlock Bundle Deals</p>
                  <p className="text-xs text-zinc-400">Pro sellers earn 40% more per order</p>
                </div>
              </div>
            </Link>
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
              {form.sizes && <p><span className="text-zinc-500">Sizes:</span> <span className="text-white">{form.sizes}</span></p>}
              {form.colors && <p><span className="text-zinc-500">Colors:</span> <span className="text-white">{form.colors}</span></p>}
              {form.customOptions && <p><span className="text-zinc-500">Options:</span> <span className="text-white">{form.customOptions}</span></p>}
              {(form.priceBasic || form.priceStandard || form.pricePremium) && (
                <p><span className="text-zinc-500">{form.listingType === "product" ? "Bundles:" : "Packages:"}</span> <span className="text-white">
                  {[form.priceBasic && `$${form.priceBasic}`, form.priceStandard && `$${form.priceStandard}`, form.pricePremium && `$${form.pricePremium}`].filter(Boolean).join(" / ")}
                </span></p>
              )}
              {form.pricingModel !== "flat" && <p><span className="text-zinc-500">Pricing:</span> <span className="text-white capitalize">{form.pricingModel.replace("_", " ")}</span></p>}
              {form.fileFormat && <p><span className="text-zinc-500">Format:</span> <span className="text-white">{form.fileFormat}</span></p>}
              {form.quantityAvailable && <p><span className="text-zinc-500">Quantity:</span> <span className="text-white">{form.quantityAvailable}{form.madeToOrder ? " (made to order)" : ""}</span></p>}
              {form.sessionsIncluded && <p><span className="text-zinc-500">Sessions:</span> <span className="text-white">{form.sessionsIncluded} per {form.recurringInterval || "package"}</span></p>}
              {form.availableDays && <p><span className="text-zinc-500">Available:</span> <span className="text-white">{form.availableDays} {form.availableHours}</span></p>}
              {form.eventDate && <p><span className="text-zinc-500">Date:</span> <span className="text-white">{form.eventDate} {form.eventTime}</span></p>}
              {form.locationDetails && <p><span className="text-zinc-500">Location:</span> <span className="text-white">{form.locationDetails}</span></p>}
              {form.cancellationPolicy !== "flexible" && <p><span className="text-zinc-500">Cancellation:</span> <span className="text-white capitalize">{form.cancellationPolicy}</span></p>}
              {form.trialSession && <p><span className="text-zinc-500">Trial:</span> <span className="text-white">Free first session</span></p>}
              <p><span className="text-zinc-500">Refund:</span> <span className="text-white">{REFUND_OPTIONS.find((r) => r.value === form.refundPolicy)?.label}</span></p>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500">NexGigs takes a 10% commission on all shop sales. You keep ${form.price ? (Number(form.price) * 0.9).toFixed(2) : "0.00"} per sale.</p>
          <p className="text-[10px] text-zinc-500">NexGigs reserves the right to mediate disputes and override refund policies to protect buyers.</p>

          {error && <div className="p-2 rounded-lg bg-brand-red/10 text-brand-red text-sm">{error}</div>}

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !form.price}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploadingImages ? "Uploading photos..." : "Listing..."}</> : `List for $${form.price || "0"}${form.recurringInterval ? `/${form.recurringInterval}` : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
