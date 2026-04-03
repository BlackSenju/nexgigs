import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, {
      apiVersion: "2025-03-31.basil",
      typescript: true,
    });
  }
  return _stripe;
}

// Lazy getter — only initializes when first called at runtime, not at build time
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Create a Stripe Connect Express account for a gigger.
 * Express accounts let Stripe handle onboarding, KYC, and the dashboard.
 */
export async function createConnectAccount(
  userId: string,
  email: string,
  firstName: string,
  lastName: string
): Promise<{ accountId: string; onboardingUrl: string }> {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    metadata: { nexgigs_user_id: userId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      mcc: "7299", // Miscellaneous personal services
      url: "https://nexgigs.com",
    },
    individual: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "https://nexgigs.com/profile/me?stripe=refresh",
    return_url: "https://nexgigs.com/profile/me?stripe=success",
    type: "account_onboarding",
  });

  return { accountId: account.id, onboardingUrl: accountLink.url };
}

/**
 * Generate a new onboarding link for an existing Connect account
 * (if previous link expired or user needs to complete onboarding).
 */
export async function createOnboardingLink(
  accountId: string
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: "https://nexgigs.com/profile/me?stripe=refresh",
    return_url: "https://nexgigs.com/profile/me?stripe=success",
    type: "account_onboarding",
  });
  return link.url;
}

/**
 * Check if a Connect account has completed onboarding and can receive payments.
 */
export async function checkAccountStatus(
  accountId: string
): Promise<{ ready: boolean; detailsSubmitted: boolean; chargesEnabled: boolean }> {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    ready: account.charges_enabled && account.details_submitted,
    detailsSubmitted: account.details_submitted ?? false,
    chargesEnabled: account.charges_enabled ?? false,
  };
}

/**
 * Create a Connect login link so giggers can access their Stripe dashboard.
 */
export async function createDashboardLink(
  accountId: string
): Promise<string> {
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

/**
 * Create a Stripe Customer for a poster (to save payment methods).
 */
export async function createCustomer(
  email: string,
  userId: string,
  name: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { nexgigs_user_id: userId },
  });
  return customer.id;
}

/**
 * Authorize payment (hold funds) when a gig is booked.
 * Uses manual capture so money is held but not charged until job completion.
 */
export async function authorizePayment(input: {
  amount: number; // in dollars
  posterCustomerId: string;
  giggerConnectAccountId: string;
  applicationFee: number; // platform fee in dollars
  jobId: string;
  posterId: string;
  giggerId: string;
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  const amountCents = Math.round(input.amount * 100);
  const feeCents = Math.round(input.applicationFee * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: input.posterCustomerId,
    capture_method: "manual",
    application_fee_amount: feeCents,
    transfer_data: {
      destination: input.giggerConnectAccountId,
    },
    metadata: {
      nexgigs_job_id: input.jobId,
      nexgigs_poster_id: input.posterId,
      nexgigs_gigger_id: input.giggerId,
    },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
  };
}

/**
 * Capture a previously authorized payment (release funds to gigger).
 * Called when poster confirms job completion.
 */
export async function capturePayment(
  paymentIntentId: string
): Promise<void> {
  await stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Cancel a held payment (refund to poster).
 * Called when a job is cancelled before completion.
 */
export async function cancelPayment(
  paymentIntentId: string
): Promise<void> {
  await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Create a refund for a completed payment.
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number // partial refund in dollars, omit for full
): Promise<void> {
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount ? { amount: Math.round(amount * 100) } : {}),
  });
}

/**
 * Verify a Stripe webhook signature.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
