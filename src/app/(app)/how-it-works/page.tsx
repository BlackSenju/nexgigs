"use client";

import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import {
  Search, PlusCircle, MessageSquare, CreditCard, Star, Shield,
  MapPin, User, Briefcase, ShoppingBag, Zap, Award, Ghost,
  ArrowRight, CheckCircle,
} from "lucide-react";
import Link from "next/link";

const FOR_GIGGERS = [
  { step: "1", title: "Create Your Profile", desc: "Sign up, add your skills, upload portfolio photos. The more complete your profile, the more jobs you get.", icon: User },
  { step: "2", title: "Browse Jobs Near You", desc: "Use the job feed to find gigs in your area. Filter by category, switch to map view, save jobs for later.", icon: Search },
  { step: "3", title: "Apply With a Bid", desc: "Found a job you want? Submit your bid amount. Your profile, portfolio, and ratings speak for you.", icon: PlusCircle },
  { step: "4", title: "Get Hired and Communicate", desc: "The poster reviews all applicants and picks you. Use in-app messaging to coordinate details.", icon: MessageSquare },
  { step: "5", title: "Complete the Job and Get Paid", desc: "Do the work. The poster confirms completion. Money is released from escrow to your Stripe account.", icon: CreditCard },
  { step: "6", title: "Get Rated and Earn XP", desc: "Both parties rate each other. Earn XP for completed gigs, 5-star ratings, and milestones. Level up!", icon: Star },
];

const FOR_POSTERS = [
  { step: "1", title: "Post a Job", desc: "Describe what you need done, set your budget, choose a category, and add your location.", icon: PlusCircle },
  { step: "2", title: "Review Applicants", desc: "Giggers will apply with bids. Compare their profiles, ratings, portfolios, and XP levels.", icon: User },
  { step: "3", title: "Hire the Best Fit", desc: "Choose who you want. Payment is held in escrow. The gigger is notified.", icon: CheckCircle },
  { step: "4", title: "Communicate and Track", desc: "Use in-app messaging. For in-person jobs, track the gigger on the map.", icon: MapPin },
  { step: "5", title: "Confirm and Release Payment", desc: "When the job is done right, confirm completion. Money is released to the gigger.", icon: CreditCard },
  { step: "6", title: "Rate Your Experience", desc: "Leave a rating and review. This helps the community know who to trust.", icon: Star },
];

const FEATURES_EXPLAINED = [
  { icon: MapPin, name: "Job Map", desc: "See all available gigs near you on an interactive map. Tap pins to view job details." },
  { icon: Shield, name: "ID Verification", desc: "Users can verify their identity with a government ID and selfie. Verified users get a badge on their profile." },
  { icon: MessageSquare, name: "In-App Messaging", desc: "Communicate safely without sharing your phone number. All messages stay on the platform." },
  { icon: CreditCard, name: "Secure Payments", desc: "All payments go through Stripe escrow. Money is held until the job is confirmed complete. No cash, no scams." },
  { icon: Star, name: "Rating System", desc: "Both parties rate each other after every job. Quality, punctuality, and communication on a 5-star scale." },
  { icon: Zap, name: "XP and Levels", desc: "Earn XP for completing gigs, getting 5-star ratings, and hitting milestones. Level up from Task Starter to NexGigs Elite." },
  { icon: Award, name: "XP Rewards Store", desc: "Spend your XP on badges, profile highlights, and more. Cash rewards coming soon." },
  { icon: Briefcase, name: "Your Gigs Tab", desc: "Track everything in one place: Active gigs you are working, Completed gigs, and Jobs you posted. Tap any card to manage it." },
  { icon: ShoppingBag, name: "Shop", desc: "Sell digital products, physical items, services, experiences, or subscriptions. Offer package tiers (Basic/Standard/Premium). 10% platform commission." },
  { icon: Ghost, name: "Ghost Wall", desc: "Users who no-show or abandon jobs 3+ times in 90 days appear on the public Ghost Wall of Shame." },
  { icon: Briefcase, name: "Guilds", desc: "Form teams with other giggers. Take on bigger jobs together. Minimum 15% pay floor per team member." },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />
      <h1 className="text-2xl font-black text-white mb-1">How NexGigs Works</h1>
      <p className="text-sm text-zinc-400 mb-6">Everything you need to know to get started.</p>

      {/* For Giggers */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-brand-orange mb-4">For Giggers (Earn Money)</h2>
        <div className="space-y-3">
          {FOR_GIGGERS.map((item) => (
            <div key={item.step} className="flex gap-3 p-3 rounded-xl bg-card border border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-brand-orange">{item.step}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/jobs"><Button className="w-full mt-3" size="sm">Browse Jobs <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
      </div>

      {/* For Posters */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-brand-orange mb-4">For Posters (Hire Help)</h2>
        <div className="space-y-3">
          {FOR_POSTERS.map((item) => (
            <div key={item.step} className="flex gap-3 p-3 rounded-xl bg-card border border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-brand-orange">{item.step}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/jobs/post"><Button className="w-full mt-3" size="sm">Post a Job <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
      </div>

      {/* Features Explained */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-white mb-4">Features Explained</h2>
        <div className="space-y-2">
          {FEATURES_EXPLAINED.map((f) => (
            <div key={f.name} className="flex gap-3 p-3 rounded-xl bg-card border border-zinc-800">
              <f.icon className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">{f.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety */}
      <div className="mb-8 p-4 rounded-xl bg-card border border-zinc-800">
        <h2 className="text-lg font-black text-white mb-3">Staying Safe on NexGigs</h2>
        <ul className="text-xs text-zinc-400 space-y-2 leading-relaxed">
          <li><strong className="text-white">Always use in-app messaging</strong> until you are comfortable sharing contact info.</li>
          <li><strong className="text-white">Never send money off-platform.</strong> All payments should go through NexGigs escrow.</li>
          <li><strong className="text-white">Meet in public places</strong> for physical item exchanges or in-person services when possible.</li>
          <li><strong className="text-white">Check ratings and reviews</strong> before hiring or accepting a gig.</li>
          <li><strong className="text-white">Report suspicious activity</strong> — we review all reports within 24 hours.</li>
          <li><strong className="text-white">Trust your instincts.</strong> If something feels off, it probably is. Leave and report.</li>
        </ul>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/privacy" className="p-3 rounded-xl bg-card border border-zinc-800 text-center hover:border-zinc-600 transition-colors">
          <span className="text-xs text-zinc-400">Privacy Policy</span>
        </Link>
        <Link href="/terms" className="p-3 rounded-xl bg-card border border-zinc-800 text-center hover:border-zinc-600 transition-colors">
          <span className="text-xs text-zinc-400">Terms of Service</span>
        </Link>
        <Link href="/safety" className="p-3 rounded-xl bg-card border border-zinc-800 text-center hover:border-zinc-600 transition-colors">
          <span className="text-xs text-zinc-400">Safety Center</span>
        </Link>
        <Link href="/ghost-wall" className="p-3 rounded-xl bg-card border border-zinc-800 text-center hover:border-zinc-600 transition-colors">
          <span className="text-xs text-zinc-400">Ghost Wall</span>
        </Link>
      </div>
    </div>
  );
}
