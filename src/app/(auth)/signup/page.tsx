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
import { GoogleButton } from "@/components/ui/google-button";
import Link from "next/link";

export default function SignupPage() {
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
    // Default to "gigger" but auth action marks users as BOTH gigger + poster
    defaultValues: { accountType: "gigger" },
  });

  async function onSubmit(data: SignupInput) {
    setLoading(true);
    setError(null);
    // All new members get both gigger + poster access
    const result = await signup({ ...data, accountType: "gigger" });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-black text-brand-orange">
            NexGigs
          </Link>
          <h1 className="mt-4 text-2xl font-black text-white">Join NexGigs</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Earn money, hire local help, sell and shop — all in one place
          </p>
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
              placeholder="First name"
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
            Representing a business? You can set up your company profile after signing up.
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

          <GoogleButton accountType="gigger" label="Sign up with Google" />
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
