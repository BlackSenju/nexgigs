-- Multi-identity model: one user can own zero, one, or many businesses.
-- A business is a separate brand entity with its own storefront, listings,
-- and approval state. Personal selling stays on the user profile.

create table if not exists nexgigs_businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references auth.users(id) on delete cascade,

  slug            text not null unique
                  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$' and length(slug) between 1 and 40),
  name            text not null check (length(name) between 1 and 120),

  business_type   text not null default 'sole_proprietor'
                  check (business_type in ('sole_proprietor','llc','corporation','nonprofit','franchise','other')),

  -- Approval workflow. New businesses default to 'pending' — a storefront
  -- belonging to a non-approved business cannot be published. Admins flip
  -- to 'approved' (manual review) or 'rejected'.
  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected','suspended')),

  description       text,
  website           text,
  logo_url          text,
  team_size         text,
  hiring_categories text[],
  city              text,
  state             text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  approved_at       timestamptz,
  approved_by       uuid references auth.users(id) on delete set null,
  rejection_reason  text
);

create index if not exists nexgigs_businesses_owner_idx on nexgigs_businesses (owner_user_id);
create index if not exists nexgigs_businesses_status_idx on nexgigs_businesses (status) where status = 'approved';

alter table nexgigs_businesses enable row level security;

drop policy if exists business_public_read on nexgigs_businesses;
create policy business_public_read on nexgigs_businesses
  for select
  using (status = 'approved');

drop policy if exists business_owner_all on nexgigs_businesses;
create policy business_owner_all on nexgigs_businesses
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop trigger if exists businesses_updated_at on nexgigs_businesses;
create trigger businesses_updated_at
  before update on nexgigs_businesses
  for each row execute function public.set_updated_at();

-- Wire storefronts to businesses (nullable for now; backfilled below;
-- a follow-up migration will make business_id NOT NULL UNIQUE and drop
-- the legacy user_id link once all data is migrated).
alter table nexgigs_storefronts
  add column if not exists business_id uuid
  references nexgigs_businesses(id) on delete cascade;

create index if not exists nexgigs_storefronts_business_idx on nexgigs_storefronts (business_id);

-- Shop listings: tag whether sold as personal or business + link to business
-- when applicable. Default is 'personal' to preserve existing behavior.
alter table nexgigs_shop_items
  add column if not exists seller_kind text not null default 'personal'
  check (seller_kind in ('personal','business'));

alter table nexgigs_shop_items
  add column if not exists business_id uuid
  references nexgigs_businesses(id) on delete set null;

create index if not exists nexgigs_shop_items_business_idx on nexgigs_shop_items (business_id)
  where business_id is not null;

-- =========================================================
-- Data backfill (run separately after schema lands so the columns exist).
-- For each existing storefront, create a business owned by the same user
-- with the storefront's slug, then link the storefront. Auto-approve since
-- these predate the verification flow.
-- =========================================================
-- with new_businesses as (
--   insert into nexgigs_businesses (
--     owner_user_id, slug, name, business_type, status,
--     description, website, logo_url, team_size, hiring_categories,
--     city, state, approved_at
--   )
--   select
--     sf.user_id, sf.slug,
--     coalesce(p.business_name, p.first_name || ' ' || p.last_initial || '.', 'My Business'),
--     coalesce(p.business_type, 'sole_proprietor'),
--     'approved',
--     p.business_description, p.business_website, p.business_logo_url,
--     p.team_size, p.hiring_categories, p.city, p.state, now()
--   from nexgigs_storefronts sf
--   join nexgigs_profiles p on p.id = sf.user_id
--   where sf.business_id is null
--   returning id, owner_user_id, slug
-- )
-- update nexgigs_storefronts sf
-- set business_id = nb.id
-- from new_businesses nb
-- where sf.user_id = nb.owner_user_id and sf.slug = nb.slug;
