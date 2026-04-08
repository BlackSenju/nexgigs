CREATE TABLE IF NOT EXISTS nexgigs_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON nexgigs_notifications(user_id, read);
ALTER TABLE nexgigs_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON nexgigs_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON nexgigs_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can manage notifications" ON nexgigs_notifications FOR ALL USING (true) WITH CHECK (true);
