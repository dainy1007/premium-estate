-- 관리자 매물 상태 관리 필드
-- Supabase SQL Editor에서 실행하거나 Supabase CLI migration으로 적용하세요.

alter table public.properties
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_hidden boolean not null default false,
  add column if not exists listing_status text not null default 'active',
  add column if not exists display_order integer not null default 0,
  add column if not exists view_count integer not null default 0,
  add column if not exists admin_memo text;

alter table public.properties
  drop constraint if exists properties_listing_status_check;

alter table public.properties
  add constraint properties_listing_status_check
  check (listing_status in ('active', 'completed'));

create index if not exists properties_public_listing_idx
  on public.properties (is_hidden, listing_status, is_featured, display_order, created_at desc);

comment on column public.properties.is_featured is '홈페이지 추천 매물 여부';
comment on column public.properties.is_hidden is '홈페이지 비공개 여부';
comment on column public.properties.listing_status is '매물 상태: active 또는 completed';
comment on column public.properties.display_order is '수동 노출 순서, 큰 값 우선 사용 가능';
comment on column public.properties.view_count is '상세페이지 조회수';
comment on column public.properties.admin_memo is '관리자 전용 메모';
