-- 빠른 관리에서 예약 설정·해제를 기존 매물 상태와 함께 저장합니다.
alter table public.properties
  drop constraint if exists properties_listing_status_check,
  add constraint properties_listing_status_check
    check (listing_status in ('active', 'reserved', 'completed'));

comment on column public.properties.listing_status
  is '매물 상태: active(노출중), reserved(예약중), completed(계약완료)';
