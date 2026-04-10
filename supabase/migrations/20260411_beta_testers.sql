-- Beta tester signups for Android Play Store testing

CREATE TABLE IF NOT EXISTS nexgigs_beta_testers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  device_type text NOT NULL DEFAULT 'android',
  notes text,
  invited boolean DEFAULT false,
  invited_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON nexgigs_beta_testers(email);
CREATE INDEX IF NOT EXISTS idx_beta_testers_invited ON nexgigs_beta_testers(invited);

ALTER TABLE nexgigs_beta_testers ENABLE ROW LEVEL SECURITY;

-- Only service role can access (signups are server-side)
CREATE POLICY "Service can manage beta testers" ON nexgigs_beta_testers
  FOR ALL USING (true) WITH CHECK (true);
