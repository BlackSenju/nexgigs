"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

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
