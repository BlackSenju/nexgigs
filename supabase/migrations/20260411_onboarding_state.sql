-- Onboarding state tracking for NexGigs profiles.
-- Adds flags used by the Welcome Modal and Getting Started Checklist.

ALTER TABLE nexgigs_profiles
  ADD COLUMN IF NOT EXISTS onboarding_welcomed boolean DEFAULT false;

ALTER TABLE nexgigs_profiles
  ADD COLUMN IF NOT EXISTS onboarding_tour_completed boolean DEFAULT false;

ALTER TABLE nexgigs_profiles
  ADD COLUMN IF NOT EXISTS onboarding_checklist_dismissed boolean DEFAULT false;
