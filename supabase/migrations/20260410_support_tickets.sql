CREATE TABLE IF NOT EXISTS nexgigs_support_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON nexgigs_support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON nexgigs_support_tickets(status, priority);
ALTER TABLE nexgigs_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON nexgigs_support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage tickets" ON nexgigs_support_tickets FOR ALL USING (true) WITH CHECK (true);
