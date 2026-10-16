-- Preserve original registration date while allowing an admin to refresh listing exposure.
alter table public.properties add column if not exists bumped_at timestamptz;
create index if not exists properties_bumped_at_idx on public.properties (bumped_at desc nulls last);
