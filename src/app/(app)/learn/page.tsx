"use client";

import { Search, Star, User, Video } from "lucide-react";
import Link from "next/link";

const SAMPLE_TUTORS = [
  {
    id: "t1",
    name: "Aisha T.",
    subjects: ["Python", "Web Development", "Data Science"],
    hourly_rate: 40,
    rating: 4.9,
    total_sessions: 52,
    teaching_style: "Hands-on projects. We build real things together.",
    formats: ["1-on-1", "Group"],
  },
  {
    id: "t2",
    name: "Carlos R.",
    subjects: ["CompTIA A+", "Network+", "AWS Cloud"],
    hourly_rate: 35,
    rating: 4.7,
    total_sessions: 28,
    teaching_style: "Exam prep focused with practice labs and quizzes.",
    formats: ["1-on-1", "Group"],
  },
  {
    id: "t3",
    name: "Destiny K.",
    subjects: ["Guitar", "Music Theory", "Songwriting"],
    hourly_rate: 30,
    rating: 5.0,
    total_sessions: 41,
    teaching_style: "Patient and encouraging. All skill levels welcome.",
    formats: ["1-on-1", "Video"],
  },
  {
    id: "t4",
    name: "Marcus J.",
    subjects: ["Graphic Design", "Adobe Suite", "Brand Identity"],
    hourly_rate: 45,
    rating: 4.8,
    total_sessions: 19,
    teaching_style: "Portfolio-building approach. You leave with real work.",
    formats: ["1-on-1"],
  },
];

export default function LearnPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-black text-white mb-1">Learn</h1>
      <p className="text-sm text-zinc-400 mb-4">
        Find tutors and learn new skills from people in your community.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search subjects, skills, or tutors..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
        />
      </div>

      {/* Tutor list */}
      <div className="space-y-3">
        {SAMPLE_TUTORS.map((tutor) => (
          <Link key={tutor.id} href={`/learn/${tutor.id}`}>
            <div className="p-4 rounded-xl bg-card border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white">
                      {tutor.name}
                    </span>
                    <span className="text-lg font-black text-white">
                      ${tutor.hourly_rate}/hr
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-sm">
                    <span className="flex items-center gap-0.5 text-brand-orange">
                      <Star className="w-3.5 h-3.5 fill-current" /> {tutor.rating}
                    </span>
                    <span className="text-zinc-500">
                      {tutor.total_sessions} sessions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tutor.subjects.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 italic">
                    &ldquo;{tutor.teaching_style}&rdquo;
                  </p>
                  <div className="mt-2 flex gap-1">
                    {tutor.formats.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-0.5 text-xs text-zinc-500"
                      >
                        {f === "Video" ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
