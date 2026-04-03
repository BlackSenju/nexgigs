export const BRAND = {
  orange: "#FF4D00",
  black: "#0a0a0a",
  steel: "#2D2D2D",
  white: "#FFFFFF",
  red: "#FF1A1A",
} as const;

export const SERVICE_CATEGORIES = [
  { name: "Home & Yard", slug: "home-yard", icon: "Home" },
  { name: "Personal Errands", slug: "personal-errands", icon: "ShoppingBag" },
  { name: "Creative & Digital", slug: "creative-digital", icon: "Palette" },
  { name: "Events", slug: "events", icon: "PartyPopper" },
  { name: "Food & Cooking", slug: "food-cooking", icon: "ChefHat" },
  { name: "Tech Help", slug: "tech-help", icon: "Monitor" },
  { name: "Auto & Vehicle", slug: "auto-vehicle", icon: "Car" },
  { name: "Hair & Beauty", slug: "hair-beauty", icon: "Scissors" },
  { name: "Fitness & Wellness", slug: "fitness-wellness", icon: "Dumbbell" },
  { name: "Transportation", slug: "transportation", icon: "Truck" },
  { name: "Tutoring", slug: "tutoring", icon: "GraduationCap" },
  { name: "Trades (Licensed)", slug: "trades-licensed", icon: "Wrench" },
] as const;

export const XP_ACTIONS = {
  first_gig_ever: 500,
  gig_complete: 100,
  five_star_rating: 75,
  five_gigs_milestone: 200,
  ten_gigs_milestone: 500,
  twentyfive_gigs_milestone: 1500,
  fifty_gigs_milestone: 3000,
  repeat_customer: 150,
  zero_cancellations_month: 300,
  first_job_posted: 100,
  detailed_review_left: 50,
} as const;

export const LEVELS = [
  { level: 1, title: "Task Starter", xp_required: 0 },
  { level: 2, title: "Side Hustler", xp_required: 500 },
  { level: 3, title: "Community Helper", xp_required: 1500 },
  { level: 4, title: "Trusted Tasker", xp_required: 3500 },
  { level: 5, title: "Pro Gigger", xp_required: 7500 },
  { level: 6, title: "Gig Master", xp_required: 15000 },
  { level: 7, title: "Community Pillar", xp_required: 30000 },
  { level: 8, title: "NexGigs Elite", xp_required: 50000 },
] as const;

export const PRICING_TIERS = {
  gigger: {
    free: { name: "Free Gigger", price: 0, commission: 0.03 },
    pro: { name: "Pro Gigger", price: 7.99, commission: 0.02 },
    elite: { name: "Elite Gigger", price: 14.99, commission: 0 },
  },
  poster: {
    free: { name: "Free", fee: 0.07 },
    premium: { name: "Premium", fee: 0.05 },
    enterprise: { name: "Enterprise", fee: 0.03 },
  },
} as const;

export function calculateFees(
  amount: number,
  giggerTier: "free" | "pro" | "elite",
  posterTier: "free" | "premium" | "enterprise"
) {
  const giggerCommission = PRICING_TIERS.gigger[giggerTier].commission;
  const posterServiceFee = PRICING_TIERS.poster[posterTier].fee;
  const posterPays = amount * (1 + posterServiceFee);
  const giggerReceives = amount * (1 - giggerCommission);
  const platformEarns = amount * posterServiceFee + amount * giggerCommission;
  return { posterPays, giggerReceives, platformEarns };
}

export const SKILL_SUGGESTIONS: Record<string, string[]> = {
  "Home & Yard": ["Lawn mowing", "Snow shoveling", "Pressure washing", "Painting", "Hauling", "Furniture assembly", "TV mounting", "Moving help", "Cleaning", "Handyman"],
  "Personal Errands": ["Grocery shopping", "Package pickup", "Line waiting", "Personal shopping", "Pet sitting", "Dog walking", "Babysitting", "Childcare"],
  "Creative & Digital": ["Photography", "Videography", "Graphic design", "Beat making", "Music production", "Mural art", "Face painting", "Video editing", "Social media management", "Content creation", "Logo design", "Web design"],
  "Events": ["DJ", "MC", "Event setup", "Catering assist", "Decoration", "Valet coordination"],
  "Food & Cooking": ["Personal chef", "Meal prep", "Baking", "Cooking lessons", "Catering"],
  "Tech Help": ["Computer setup", "Smart home install", "WiFi setup", "Virus removal", "Website help", "Phone repair"],
  "Auto & Vehicle": ["Detailing", "Oil change", "Tire change", "Battery replacement", "Basic diagnostics"],
  "Hair & Beauty": ["Haircuts", "Styling", "Nails", "Lash extensions", "Waxing", "Braiding"],
  "Fitness & Wellness": ["Personal training", "Yoga", "Dance lessons", "Martial arts", "Sports coaching"],
  "Transportation": ["Carpooling", "Airport rides", "Medical transport", "Designated driver"],
  "Tutoring": ["Technology & IT", "Academic tutoring", "Creative arts", "Business skills", "Music lessons", "Language tutoring"],
  "Trades (Licensed)": ["Electrical", "Plumbing", "HVAC", "General contracting"],
};
