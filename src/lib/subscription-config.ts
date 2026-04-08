/**
 * Stripe subscription configuration for NexGigs.
 * Maps tier names to Stripe price IDs for checkout.
 */

export const SUBSCRIPTION_TIERS = {
  pro: {
    name: "Pro Gigger",
    price: 7.99,
    stripePriceId: "price_1TJncrHhY6fMamO1v36LOYKm",
    stripeProductId: "prod_UIOPUs8xvxjtEo",
    commission: 0.02,
    features: [
      "Priority placement in search",
      "Instant job alerts",
      "Unlimited portfolio",
      "2% commission (save 33%)",
      "1 boost per month",
    ],
  },
  elite: {
    name: "Elite Gigger",
    price: 14.99,
    stripePriceId: "price_1TJncrHhY6fMamO1EpK47RBC",
    stripeProductId: "prod_UIOPq82kZM3aiX",
    commission: 0,
    features: [
      "Top placement in all searches",
      "0% commission (keep everything)",
      "Elite badge on profile",
      "3 boosts per month",
      "Shop Pro features free",
      "Priority customer support",
    ],
  },
  business_starter: {
    name: "Business Starter",
    price: 29.99,
    stripePriceId: "price_1TJncsHhY6fMamO1E1Q4wSmj",
    stripeProductId: "prod_UIOPOUAkwOFd7j",
    posterFee: 0.07,
    features: [
      "10 job posts per month",
      "Applicant management",
      "Team hiring (up to 5)",
      "7% service fee",
    ],
  },
  business_growth: {
    name: "Business Growth",
    price: 79.99,
    stripePriceId: "price_1TJncsHhY6fMamO1xhaEOkn4",
    stripeProductId: "prod_UIOPyM0iZfMWca",
    posterFee: 0.05,
    features: [
      "Unlimited job postings",
      "Talent pool access",
      "Invoice generation",
      "5% service fee",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 199.99,
    stripePriceId: "price_1TJnctHhY6fMamO1N6cvDKsy",
    stripeProductId: "prod_UIOPwkmTnCPZjl",
    posterFee: 0.03,
    features: [
      "Everything in Growth",
      "Dedicated account manager",
      "ATS webhook integration",
      "3% service fee",
      "Private talent pool",
      "Custom branding",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
