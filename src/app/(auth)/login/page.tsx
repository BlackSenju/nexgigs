"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { login } from "@/lib/actions/auth";
import { challengeMFA, verifyMFA } from "@/lib/actions/mfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { GoogleButton } from "@/components/ui/google-button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setError(null);
    const result = await login(data);

    if (result?.mfaRequired && result.factorId) {
      // User has MFA — start challenge
      setFactorId(result.factorId);
      const challenge = await challengeMFA(result.factorId);
      if (challenge.error) {
        setError(challenge.error);
        setLoading(false);
        return;
      }
      setChallengeId(challenge.challengeId ?? null);
      setMfaStep(true);
      setLoading(false);
      return;
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function onMFASubmit() {
    if (!factorId || !challengeId || !mfaCode) return;
    setLoading(true);
    setError(null);

    const result = await verifyMFA(factorId, challengeId, mfaCode);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  // MFA Challenge step
  if (mfaStep) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="mt-4 text-2xl font-black text-white">
              Two-Factor Authentication
            </h1>
            <p className="mt-2 text-zinc-400">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              id="mfaCode"
              label="Verification Code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            />
            <Button
              size="lg"
              className="w-full"
              onClick={onMFASubmit}
              disabled={loading || mfaCode.length !== 6}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>

          <button
            onClick={() => {
              setMfaStep(false);
              setMfaCode("");
              setError(null);
            }}
            className="block mx-auto text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Normal login form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-black text-brand-orange">
            NexGigs
          </Link>
          <h1 className="mt-6 text-3xl font-black text-white">Welcome Back</h1>
          <p className="mt-2 text-zinc-400">Log in to your account</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            placeholder="Your password"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-zinc-500">or</span>
            </div>
          </div>

          <GoogleButton label="Log in with Google" />
        </form>

        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-orange hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
