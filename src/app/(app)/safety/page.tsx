"use client";

import { Shield, MapPin, Phone, AlertTriangle, MessageSquare, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

const SAFETY_FEATURES = [
  {
    icon: Shield,
    title: "ID Verification",
    description: "All verified pros have government ID on file via Persona. Accept US IDs, foreign passports, DACA docs, and ITIN.",
  },
  {
    icon: MapPin,
    title: "Live GPS Tracking",
    description: "During active jobs, gigger location is shared with the poster only. Updates every 30 seconds. Auto-stops on completion.",
  },
  {
    icon: Phone,
    title: "Panic Button",
    description: "One press contacts 911 with your GPS location and alerts your emergency contact instantly.",
  },
  {
    icon: MessageSquare,
    title: "In-App Messaging",
    description: "No phone number exchange until both parties agree. All communication stays on the platform.",
  },
  {
    icon: Eye,
    title: "Background Checks",
    description: "Verified professionals undergo Checkr background checks. Results are displayed on their profile.",
  },
  {
    icon: CheckCircle,
    title: "Mandatory Ratings",
    description: "Two-way ratings after every job. Build trust through transparency.",
  },
];

export default function SafetyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/profile/me" />
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-brand-orange" />
        <h1 className="text-xl font-black text-white">Safety Center</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Your safety is our priority. Here&apos;s how NexGigs protects you.
      </p>

      {/* Emergency */}
      <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 mb-6">
        <h2 className="text-base font-bold text-brand-red flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Emergency?
        </h2>
        <p className="mt-1 text-sm text-zinc-300">
          If you&apos;re in immediate danger, call 911. You can also use the panic
          button during any active job.
        </p>
        <Button variant="danger" className="mt-3">
          <Phone className="w-4 h-4 mr-1" /> Emergency — Call 911
        </Button>
      </div>

      {/* Safety features */}
      <div className="space-y-4">
        {SAFETY_FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="p-4 rounded-xl bg-card border border-zinc-800 flex gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{feature.title}</h3>
              <p className="mt-0.5 text-sm text-zinc-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency contact setup */}
      <div className="mt-8 p-4 rounded-xl bg-card border border-zinc-800">
        <h2 className="text-base font-bold text-white mb-2">Emergency Contact</h2>
        <p className="text-sm text-zinc-400 mb-3">
          Set up an emergency contact who will be notified if you use the panic button.
        </p>
        <Button variant="outline" className="w-full">
          Set Up Emergency Contact
        </Button>
      </div>
    </div>
  );
}
