import Link from "next/link";
import { Phone, Mail, MapPin, MessageSquare, Clock, Shield } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-xl font-black">
            <span className="text-brand-orange">Nex</span>
            <span className="text-white">Gigs</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Contact Us</h1>
        <p className="mt-3 text-zinc-400">
          Need help, have a question, or want to partner with NexGigs? Reach out — we&apos;d love to hear from you.
        </p>

        {/* Contact Methods Grid */}
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {/* Phone */}
          <a href="tel:+14144360807" className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors">
            <Phone className="w-5 h-5 text-brand-orange" />
            <h3 className="mt-3 text-sm font-bold text-white">Phone</h3>
            <p className="mt-1 text-lg font-black text-white">(414) 436-0807</p>
            <p className="mt-1 text-xs text-zinc-500">Milwaukee-based support</p>
          </a>

          {/* Email */}
          <a href="mailto:support@nexgigs.com" className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors">
            <Mail className="w-5 h-5 text-brand-orange" />
            <h3 className="mt-3 text-sm font-bold text-white">Email</h3>
            <p className="mt-1 text-sm font-bold text-brand-orange">support@nexgigs.com</p>
            <p className="mt-1 text-xs text-zinc-500">General inquiries</p>
          </a>

          {/* Careers */}
          <a href="mailto:careers@nexgigs.com" className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors">
            <Mail className="w-5 h-5 text-brand-orange" />
            <h3 className="mt-3 text-sm font-bold text-white">Careers</h3>
            <p className="mt-1 text-sm font-bold text-brand-orange">careers@nexgigs.com</p>
            <p className="mt-1 text-xs text-zinc-500">Join the team</p>
          </a>

          {/* In-App Support */}
          <Link href="/support" className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 transition-colors">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            <h3 className="mt-3 text-sm font-bold text-white">In-App Support</h3>
            <p className="mt-1 text-sm text-zinc-300">Submit a ticket</p>
            <p className="mt-1 text-xs text-zinc-500">Sign in required</p>
          </Link>
        </div>

        {/* Response Times */}
        <div className="mt-8 p-6 rounded-xl border border-zinc-800 bg-card">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-orange" /> Response Times
          </h3>
          <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Free users</span>
              <span className="text-white">48 hours</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Pro Gigger</span>
              <span className="text-white">24 hours</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Elite Gigger</span>
              <span className="text-white">12 hours</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Business tier</span>
              <span className="text-white">6 hours</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mt-8 p-6 rounded-xl border border-zinc-800 bg-card">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-orange" /> Based In
          </h3>
          <p className="mt-2 text-zinc-300">Milwaukee, Wisconsin</p>
          <p className="mt-1 text-xs text-zinc-500">
            NexGigs is a hyperlocal platform serving the Milwaukee metro area. Expanding nationwide soon.
          </p>
        </div>

        {/* Security */}
        <div className="mt-8 p-6 rounded-xl border border-brand-orange/20 bg-brand-orange/5">
          <h3 className="text-sm font-bold text-brand-orange flex items-center gap-2">
            <Shield className="w-4 h-4" /> Report a Security Issue
          </h3>
          <p className="mt-2 text-sm text-zinc-300">
            Found a security vulnerability? Please report it responsibly to{" "}
            <a href="mailto:security@nexgigs.com" className="text-brand-orange hover:underline">
              security@nexgigs.com
            </a>
            . We take security seriously and will respond within 24 hours.
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-brand-orange hover:underline">
            ← Back to NexGigs
          </Link>
        </div>
      </div>
    </div>
  );
}
