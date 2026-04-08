-- Business Profile Fields for Company Hiring
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS business_type text; -- 'sole_proprietor', 'llc', 'corporation', 'nonprofit', 'franchise'
ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS business_description text;
ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS business_website text;
ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS business_logo_url text;
ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS business_verified boolean DEFAULT false;
ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS hiring_categories text[] DEFAULT '{}';
ALTER TABLE nexgigs_profiles ADD COLUMN IF NOT EXISTS team_size text; -- '1', '2-5', '6-10', '11-25', '26-50', '50+'
