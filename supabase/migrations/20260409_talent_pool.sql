CREATE TABLE IF NOT EXISTS nexgigs_talent_pool (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gigger_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(business_user_id, gigger_id)
);

CREATE INDEX IF NOT EXISTS idx_talent_pool_business ON nexgigs_talent_pool(business_user_id);
ALTER TABLE nexgigs_talent_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own talent pool" ON nexgigs_talent_pool FOR SELECT USING (auth.uid() = business_user_id);
CREATE POLICY "Service can manage talent pool" ON nexgigs_talent_pool FOR ALL USING (true) WITH CHECK (true);
