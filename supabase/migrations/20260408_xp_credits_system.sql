-- XP Credits system: tracks NexGigs credits earned via XP redemption
CREATE TABLE IF NOT EXISTS nexgigs_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL, -- 'earned', 'redeemed', 'expired'
  description text,
  xp_spent int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credits_user ON nexgigs_credits(user_id);

ALTER TABLE nexgigs_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON nexgigs_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage credits" ON nexgigs_credits FOR ALL USING (true) WITH CHECK (true);
