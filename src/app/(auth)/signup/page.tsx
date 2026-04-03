"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signup } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateSelect } from "@/components/ui/state-select";
import { CityInput } from "@/components/ui/city-input";
import { Hammer, Briefcase, ArrowLeft } from "lucide-react";
import { GoogleButton } from "@/components/ui/google-button";
import Link from "next/link";

export default function SignupPage() {
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [accountType, setAccountType] = useState<"gigger" | "poster">("gigger");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { accountType },
  });

  function chooseType(type: "gigger" | "poster") {
    setAccountType(type);
    setStep("form");
  }

  async function onSubmit(data: SignupInput) {
    setLoading(true);
    setError(null);
    const result = await signup({ ...data, accountType });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  if (step === "choose") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="text-2xl font-black text-brand-orange">
              NexGigs
            </Link>
            <h1 className="mt-6 text-3xl font-black text-white">Join NexGigs</h1>
            <p className="mt-2 text-zinc-400">How do you want to get started?</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => chooseType("gigger")}
              className="w-full flex items-center gap-4 p-6 rounded-xl border border-zinc-700 bg-card hover:border-brand-orange transition-colors text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
                <Hammer className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">I want to earn</h3>
                <p className="text-sm text-zinc-400">
                  Find gigs in your city and get paid for your skills
                </p>
              </div>
            </button>

            <button
              onClick={() => chooseType("poster")}
              className="w-full flex items-center gap-4 p-6 rounded-xl border border-zinc-700 bg-card hover:border-brand-orange transition-colors text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">I need help</h3>
                <p className="text-sm text-zinc-400">
                  Post jobs and hire talented people in your area
                </p>
              </div>
            </button>
          </div>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-orange hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <button
            onClick={() => setStep("choose")}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="mt-4 text-center">
            <Link href="/" className="text-2xl font-black text-brand-orange">
              NexGigs
            </Link>
            <h1 className="mt-4 text-2xl font-black text-white">
              {accountType === "gigger" ? "Start Earning" : "Post Your First Job"}
            </h1>
            <p className="mt-1 text-zinc-400">Create your free account</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="First Name"
              placeholder="Jevaun"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              id="lastInitial"
              label="Last Initial"
              placeholder="C"
              maxLength={1}
              error={errors.lastInitial?.message}
              {...register("lastInitial")}
            />
          </div>

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="8+ characters, 1 uppercase, 1 number"
            error={errors.password?.message}
            {...register("password")}
          />

          <CityInput
            id="city"
            label="City"
            value={watch("city") ?? ""}
            onChange={(val) => setValue("city", val, { shouldValidate: true })}
            onSelect={(result) => {
              if (result.state) setValue("state", result.state, { shouldValidate: true });
              if (result.zipCode) setValue("zipCode", result.zipCode, { shouldValidate: true });
            }}
            state={watch("state")}
            error={errors.city?.message}
            placeholder="Start typing your city..."
          />

          <div className="grid grid-cols-2 gap-3">
            <StateSelect
              id="state"
              label="State"
              value={watch("state") ?? ""}
              onChange={(val) => setValue("state", val, { shouldValidate: true })}
              error={errors.state?.message}
            />
            <Input
              id="zipCode"
              label="Zip Code"
              placeholder="53202"
              maxLength={5}
              error={errors.zipCode?.message}
              {...register("zipCode")}
            />
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            By creating an account, you agree to NexGigs&apos; Terms of Service and Privacy Policy.
            You acknowledge that NexGigs is a marketplace and does not employ or endorse any user.
            All services are performed by independent contractors.
          </p>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-zinc-500">or</span>
            </div>
          </div>

          <GoogleButton accountType={accountType} label="Sign up with Google" />
        </form>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-orange hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
