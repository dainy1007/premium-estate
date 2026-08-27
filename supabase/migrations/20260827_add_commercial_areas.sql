-- 상가 매물 공급면적/전용면적 분리 저장
alter table public.properties
  add column if not exists supply_area numeric,
  add column if not exists exclusive_area numeric;

comment on column public.properties.supply_area is '공급면적(㎡)';
comment on column public.properties.exclusive_area is '전용면적(㎡)';
