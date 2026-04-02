"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  DollarSign,
  Zap,
  Users,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = ["Category", "Details", "Location", "Pricing", "Review"];

export default function PostJobPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    jobType: "task",
    durationType: "One-time",
    city: "Milwaukee",
    state: "WI",
    zipCode: "",
    neighborhood: "",
    pricingType: "fixed",
    price: "",
    priceMin: "",
    priceMax: "",
    hourlyRate: "",
    isUrgent: false,
    isRemote: false,
    requiresLicense: false,
    teamSizeNeeded: "1",
    startDate: "",
  });

  function updateForm(updates: Partial<typeof form>) {
    setForm({ ...form, ...updates });
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/50 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-white">Job Posted!</h1>
        <p className="mt-2 text-zinc-400">
          Your job is live. Giggers in your area can now see it and apply.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/jobs">
            <Button className="w-full">View Job Feed</Button>
          </Link>
          <Link href="/gigs">
            <Button variant="outline" className="w-full">
              Manage My Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step > 0 ? (
          <button
            onClick={prevStep}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link
            href="/jobs"
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-black text-white">Post a Job</h1>
          <p className="text-xs text-zinc-500">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= step ? "bg-brand-orange" : "bg-zinc-800"
            )}
          />
        ))}
      </div>

      {/* Step 0: Category */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">What kind of help do you need?</h2>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  updateForm({ category: cat.name });
                  nextStep();
                }}
                className={cn(
                  "p-3 rounded-xl border text-left text-sm font-medium transition-all",
                  form.category === cat.name
                    ? "border-brand-orange bg-brand-orange/10 text-white"
                    : "border-zinc-800 bg-card text-zinc-300 hover:border-zinc-600"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Describe the job</h2>
          <Input
            id="title"
            label="Job Title"
            placeholder="e.g. Need lawn mowed this weekend"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">
              Description
            </label>
            <textarea
              placeholder="What needs to be done? Include details about the work, tools needed, timeline, etc."
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              rows={5}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-card text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Job Type
            </label>
            <div className="flex gap-2">
              {["One-time", "Project", "Recurring"].map((type) => (
                <button
                  key={type}
                  onClick={() => updateForm({ durationType: type })}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    form.durationType === type
                      ? "border-brand-orange bg-brand-orange/10 text-white"
                      : "border-zinc-700 text-zinc-400 hover:text-white"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isUrgent}
                onChange={(e) => updateForm({ isUrgent: e.target.checked })}
                className="rounded border-zinc-600 text-brand-orange focus:ring-brand-orange"
              />
              <Zap className="w-4 h-4 text-brand-red" /> Mark as urgent
            </label>
          </div>
          <Button className="w-full" onClick={nextStep} disabled={!form.title}>
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Where is this job?</h2>
          <Input
            id="city"
            label="City"
            value={form.city}
            onChange={(e) => updateForm({ city: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="state"
              label="State"
              value={form.state}
              maxLength={2}
              onChange={(e) => updateForm({ state: e.target.value })}
            />
            <Input
              id="zipCode"
              label="Zip Code"
              placeholder="53202"
              maxLength={5}
              value={form.zipCode}
              onChange={(e) => updateForm({ zipCode: e.target.value })}
            />
          </div>
          <Input
            id="neighborhood"
            label="Neighborhood (optional)"
            placeholder="e.g. Bay View, Third Ward"
            value={form.neighborhood}
            onChange={(e) => updateForm({ neighborhood: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => updateForm({ isRemote: e.target.checked })}
              className="rounded border-zinc-600 text-brand-orange focus:ring-brand-orange"
            />
            This job can be done remotely
          </label>
          <Button className="w-full" onClick={nextStep}>
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Set your budget</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "fixed", label: "Fixed Price" },
              { key: "range", label: "Price Range" },
              { key: "hourly", label: "Hourly Rate" },
              { key: "open", label: "Open to Bids" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => updateForm({ pricingType: opt.key })}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-colors",
                  form.pricingType === opt.key
                    ? "border-brand-orange bg-brand-orange/10 text-white"
                    : "border-zinc-700 text-zinc-400 hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {form.pricingType === "fixed" && (
            <Input
              id="price"
              label="Price ($)"
              type="number"
              placeholder="75"
              value={form.price}
              onChange={(e) => updateForm({ price: e.target.value })}
            />
          )}
          {form.pricingType === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="priceMin"
                label="Min ($)"
                type="number"
                placeholder="50"
                value={form.priceMin}
                onChange={(e) => updateForm({ priceMin: e.target.value })}
              />
              <Input
                id="priceMax"
                label="Max ($)"
                type="number"
                placeholder="150"
                value={form.priceMax}
                onChange={(e) => updateForm({ priceMax: e.target.value })}
              />
            </div>
          )}
          {form.pricingType === "hourly" && (
            <Input
              id="hourlyRate"
              label="Hourly Rate ($)"
              type="number"
              placeholder="25"
              value={form.hourlyRate}
              onChange={(e) => updateForm({ hourlyRate: e.target.value })}
            />
          )}
          {form.pricingType === "open" && (
            <p className="text-sm text-zinc-400">
              Giggers will submit their own bids. You choose the best offer.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="teamSize"
              label="People needed"
              type="number"
              min={1}
              value={form.teamSizeNeeded}
              onChange={(e) => updateForm({ teamSizeNeeded: e.target.value })}
            />
            <Input
              id="startDate"
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => updateForm({ startDate: e.target.value })}
            />
          </div>

          <Button className="w-full" onClick={nextStep}>
            Review Job <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Review your job</h2>

          <div className="p-4 rounded-xl bg-card border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                {form.category}
              </span>
              {form.isUrgent && (
                <span className="flex items-center gap-1 text-xs text-brand-red">
                  <Zap className="w-3 h-3" /> Urgent
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white">
              {form.title || "Untitled Job"}
            </h3>

            <p className="text-sm text-zinc-400 whitespace-pre-line">
              {form.description || "No description"}
            </p>

            <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {form.neighborhood ? `${form.neighborhood}, ` : ""}
                {form.city}, {form.state} {form.zipCode}
              </span>
              <span>{form.durationType}</span>
              {form.isRemote && <span className="text-green-400">Remote OK</span>}
            </div>

            <div className="flex items-center gap-2 text-lg font-black text-white">
              <DollarSign className="w-5 h-5 text-brand-orange" />
              {form.pricingType === "fixed" && `$${form.price || "0"}`}
              {form.pricingType === "range" &&
                `$${form.priceMin || "0"} – $${form.priceMax || "0"}`}
              {form.pricingType === "hourly" &&
                `$${form.hourlyRate || "0"}/hr`}
              {form.pricingType === "open" && "Open to bids"}
            </div>

            {Number(form.teamSizeNeeded) > 1 && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Users className="w-3.5 h-3.5" />
                {form.teamSizeNeeded} people needed
              </div>
            )}
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            Post Job
          </Button>
          <Button variant="ghost" className="w-full" onClick={prevStep}>
            Go back and edit
          </Button>
        </div>
      )}
    </div>
  );
}
