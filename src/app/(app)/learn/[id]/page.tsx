"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, User, Video } from "lucide-react";
import Link from "next/link";

export default function TutorProfilePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <Link
        href="/learn"
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to tutors
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-zinc-700 flex items-center justify-center">
          <User className="w-10 h-10 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Aisha T.</h1>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className="flex items-center gap-0.5 text-brand-orange">
              <Star className="w-4 h-4 fill-current" /> 4.9
            </span>
            <span className="text-zinc-500">52 sessions</span>
          </div>
          <span className="text-sm text-brand-orange font-bold">$40/hr</span>
        </div>
      </div>

      {/* Video intro placeholder */}
      <div className="mt-4 aspect-video rounded-xl bg-zinc-800 flex items-center justify-center">
        <Video className="w-10 h-10 text-zinc-600" />
        <span className="ml-2 text-sm text-zinc-500">Intro video</span>
      </div>

      {/* About */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-2">About</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          I&apos;m a software engineer with 6 years of experience. I teach Python,
          web development (HTML/CSS/JS/React), and data science. My approach is
          hands-on — we build real projects together so you leave each session with
          something tangible in your portfolio.
        </p>
      </div>

      {/* Subjects */}
      <div className="mt-4">
        <h2 className="text-lg font-bold text-white mb-2">Subjects</h2>
        <div className="flex flex-wrap gap-2">
          {["Python", "Web Development", "Data Science", "JavaScript", "React", "SQL"].map(
            (s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-lg bg-card border border-zinc-800 text-sm text-zinc-300"
              >
                {s}
              </span>
            )
          )}
        </div>
      </div>

      {/* Session types */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-3">Session Options</h2>
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-card border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <User className="w-4 h-4 text-zinc-500" /> 1-on-1 Session
            </div>
            <span className="font-bold text-white">$40/hr</span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Video className="w-4 h-4 text-zinc-500" /> Group Session (up to 8)
            </div>
            <span className="font-bold text-white">$20/person</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-2">
        <Button size="lg" className="w-full">
          Book a Session
        </Button>
        <Button variant="outline" className="w-full">
          Message Tutor
        </Button>
      </div>
    </div>
  );
}
