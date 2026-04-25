-- Shared trigger function (idempotent — safe across migrations).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Storefronts (Phase 1) — branded seller pages with AI-generated drafts.
-- One storefront per user (1:1). Public read for published, owner-only write.

create table if not exists nexgigs_storefronts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  slug            text not null unique,

  industry        text not null default 'other'
                  check (industry in ('service','clothing','food','coaching','maker','events','wellness','tech','other')),

  status          text not null default 'draft'
                  check (status in ('draft','published','suspended')),

  -- Branding
  hero_image_url  text,
  logo_kind       text not null default 'icon'
                  check (logo_kind in ('icon','image')),
  logo_value      text,
  brand_color     text not null default '#FF4D00'
                  check (brand_color ~* '^#[0-9a-f]{6}$'),
  accent_color    text default '#0A0A0A'
                  check (accent_color is null or accent_color ~* '^#[0-9a-f]{6}$'),

  -- Copy
  tagline         text,
  about_html      text,
  how_it_works    jsonb,
  faqs            jsonb,
  social_links    jsonb,
  service_areas   text[],

  -- Layout config (which sections to show, in what order)
  sections        jsonb not null default
                  '["hero","packages","about","how_it_works","photos","faqs","contact"]'::jsonb,
  photo_gallery   text[],

  -- AI provenance — so we can show "AI-drafted, edited by you" affordances
  ai_drafted_at   timestamptz,

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz,

  -- Slug shape: lowercase + digits + dashes; 1..40 chars; cannot start/end with dash
  constraint storefront_slug_format
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$' and length(slug) between 1 and 40)
);

create index if not exists nexgigs_storefronts_user_id_idx on nexgigs_storefronts (user_id);
create index if not exists nexgigs_storefronts_published_idx on nexgigs_storefronts (status) where status = 'published';

alter table nexgigs_storefronts enable row level security;

-- Anyone can read published storefronts.
drop policy if exists storefront_public_read on nexgigs_storefronts;
create policy storefront_public_read on nexgigs_storefronts
  for select
  using (status = 'published');

-- Owner can do anything to their own row.
drop policy if exists storefront_owner_all on nexgigs_storefronts;
create policy storefront_owner_all on nexgigs_storefronts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists storefronts_updated_at on nexgigs_storefronts;
create trigger storefronts_updated_at
  before update on nexgigs_storefronts
  for each row execute function public.set_updated_at();
