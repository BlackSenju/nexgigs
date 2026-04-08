-- AI Usage Tracking for Tier-Gated AI Features
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS nexgigs_ai_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature text NOT NULL, -- 'tips', 'rewrite', 'matching'
  used_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON nexgigs_ai_usage(user_id, used_at);

-- Check if user is under their daily limit
CREATE OR REPLACE FUNCTION check_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_limit int
) RETURNS boolean AS $$
DECLARE
  usage_count int;
BEGIN
  SELECT COUNT(*) INTO usage_count
  FROM nexgigs_ai_usage
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND used_at > now() - interval '24 hours';
  RETURN usage_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record a usage event
CREATE OR REPLACE FUNCTION record_ai_usage(
  p_user_id uuid,
  p_feature text
) RETURNS void AS $$
BEGIN
  INSERT INTO nexgigs_ai_usage (user_id, feature) VALUES (p_user_id, p_feature);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE nexgigs_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON nexgigs_ai_usage FOR SELECT USING (auth.uid() = user_id);
