-- Web Push notification subscriptions

CREATE TABLE IF NOT EXISTS nexgigs_push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON nexgigs_push_subscriptions(user_id);

ALTER TABLE nexgigs_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON nexgigs_push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON nexgigs_push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON nexgigs_push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service can manage subscriptions" ON nexgigs_push_subscriptions
  FOR ALL USING (true) WITH CHECK (true);
