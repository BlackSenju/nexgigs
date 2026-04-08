import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import {
  Home,
  ShoppingBag,
  Palette,
  PartyPopper,
  ChefHat,
  Monitor,
  Car,
  Scissors,
  Dumbbell,
  Truck,
  GraduationCap,
  Wrench,
  ArrowRight,
  MapPin,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Home & Yard": <Home className="w-6 h-6" />,
  "Personal Errands": <ShoppingBag className="w-6 h-6" />,
  "Creative & Digital": <Palette className="w-6 h-6" />,
  Events: <PartyPopper className="w-6 h-6" />,
  "Food & Cooking": <ChefHat className="w-6 h-6" />,
  "Tech Help": <Monitor className="w-6 h-6" />,
  "Auto & Vehicle": <Car className="w-6 h-6" />,
  "Hair & Beauty": <Scissors className="w-6 h-6" />,
  "Fitness & Wellness": <Dumbbell className="w-6 h-6" />,
  Transportation: <Truck className="w-6 h-6" />,
  Tutoring: <GraduationCap className="w-6 h-6" />,
  "Trades (Licensed)": <Wrench className="w-6 h-6" />,
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Post or Find",
    description: "Post a job you need done, or browse gigs in your neighborhood.",
  },
  {
    step: "02",
    title: "Hire or Apply",
    description: "Review profiles, ratings, and portfolios. Choose the best fit.",
  },
  {
    step: "03",
    title: "Pay or Earn",
    description: "Secure escrow payments. Money released when the job is done right.",
  },
];

export default async function LandingPage() {
  // Redirect authenticated users to dashboard
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl sm:text-7xl font-black leading-tight">
            <span className="text-white">Your city.</span>{" "}
            <span className="text-gradient">Your skill.</span>{" "}
            <span className="text-white">Your money.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto">
            NexGigs is where everyday people earn money from their skills.
            Haircuts, coding, landscaping, beat making — if you can do it,
            someone nearby needs it.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Start Earning <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="text-base px-8">
                Post a Job
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <MapPin className="w-4 h-4" />
            <span>Launching in Milwaukee, WI</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 border-t border-zinc-800">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center">
            What do you need done?
          </h2>
          <p className="mt-3 text-zinc-400 text-center">
            Browse gigs across dozens of categories
          </p>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((name) => (
              <Link
                key={name}
                href="/signup"
                className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-card hover:border-brand-orange/50 hover:bg-zinc-800 transition-all group"
              >
                <div className="text-brand-orange group-hover:scale-110 transition-transform">
                  {CATEGORY_ICONS[name]}
                </div>
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                  {name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t border-zinc-800">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center">
            How NexGigs works
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-orange/10 text-brand-orange text-xl font-black">
                  {item.step}
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-20 px-4 border-t border-zinc-800">
        <div className="mx-auto max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="w-8 h-8 text-brand-orange mx-auto" />
              <h3 className="mt-3 text-lg font-bold text-white">Verified Profiles</h3>
              <p className="mt-1 text-sm text-zinc-400">
                ID verification and background checks for trusted pros
              </p>
            </div>
            <div className="text-center">
              <Zap className="w-8 h-8 text-brand-orange mx-auto" />
              <h3 className="mt-3 text-lg font-bold text-white">Instant Payments</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Secure escrow with Stripe. Get paid when the job is done.
              </p>
            </div>
            <div className="text-center">
              <MapPin className="w-8 h-8 text-brand-orange mx-auto" />
              <h3 className="mt-3 text-lg font-bold text-white">Hyperlocal</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Find gigs and talent within your city and neighborhood
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-zinc-800">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Ready to get started?
          </h2>
          <p className="mt-3 text-zinc-400">
            Join the community. Start earning or find the help you need today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-800">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} NexGigs. Your city. Your skill. Your money.
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/how-it-works" className="hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-xs text-zinc-600 mt-4 max-w-xl mx-auto text-center leading-relaxed sm:text-left">
            NexGigs is a marketplace that connects people seeking services with independent service providers. NexGigs does not employ, recommend, or endorse any service provider and is not responsible for any service provider&apos;s actions, conduct, or work product. Users hire service providers at their own risk. All payments processed securely through Stripe. Operated by TECHHIVE, Milwaukee, WI.
          </p>
        </div>
      </footer>
    </div>
  );
}
