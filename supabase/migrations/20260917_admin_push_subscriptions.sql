create table if not exists public.admin_push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_push_subscriptions enable row level security;

-- Browser clients must not be able to read push endpoints or encryption keys.
-- The Next.js server accesses this table with SUPABASE_SERVICE_ROLE_KEY only.
revoke all on table public.admin_push_subscriptions from anon, authenticated;
