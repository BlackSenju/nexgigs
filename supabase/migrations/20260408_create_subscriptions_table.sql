-- NexGigs Subscriptions Table
-- Run this in Supabase Dashboard > SQL Editor
-- This table stores subscription tiers for both Stripe-paid and admin-granted subs

CREATE TABLE IF NOT EXISTS nexgigs_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text,
  price_monthly numeric DEFAULT 0,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON nexgigs_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON nexgigs_subscriptions(status);

-- RLS
ALTER TABLE nexgigs_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription" ON nexgigs_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role (webhooks, admin actions) can do everything
-- This is handled by using the service role key in server actions
