-- 매물 가격 문자열을 검색 가능한 원 단위 숫자로 변환합니다.
-- 지원 예시: 3억, 6억5000만원, 6억 5,000만원, 68000만원, 680000000

alter table public.properties
add column if not exists price_amount bigint;

comment on column public.properties.price_amount is
'가격대 검색용 원 단위 금액. price 문자열에서 트리거로 자동 계산됩니다.';

create or replace function public.parse_korean_property_price(price_text text)
returns bigint
language plpgsql
immutable
as $$
declare
  cleaned text;
  eok_part numeric := 0;
  man_part numeric := 0;
begin
  if price_text is null or btrim(price_text) = '' then
    return null;
  end if;

  cleaned := regexp_replace(price_text, '[[:space:],원]', '', 'g');

  -- 6억, 6.5억, 6억5000만 형태
  if cleaned ~ '^[0-9]+(\.[0-9]+)?억([0-9]+)?만?$' then
    eok_part := split_part(cleaned, '억', 1)::numeric;

    if split_part(cleaned, '억', 2) <> '' then
      man_part := nullif(regexp_replace(split_part(cleaned, '억', 2), '만$', ''), '')::numeric;
    end if;

    return round(eok_part * 100000000 + coalesce(man_part, 0) * 10000)::bigint;
  end if;

  -- 68000만 형태
  if cleaned ~ '^[0-9]+(\.[0-9]+)?만$' then
    return round(regexp_replace(cleaned, '만$', '')::numeric * 10000)::bigint;
  end if;

  -- 원 단위 숫자만 입력한 형태
  if cleaned ~ '^[0-9]+$' then
    return cleaned::bigint;
  end if;

  -- 월세처럼 보증금/월세가 함께 적힌 복합 문구는 임의 계산하지 않습니다.
  return null;
exception
  when others then
    return null;
end;
$$;

create or replace function public.set_property_price_amount()
returns trigger
language plpgsql
as $$
begin
  new.price_amount := public.parse_korean_property_price(new.price);
  return new;
end;
$$;

drop trigger if exists properties_set_price_amount on public.properties;

create trigger properties_set_price_amount
before insert or update of price
on public.properties
for each row
execute function public.set_property_price_amount();

-- 기존 매물도 현재 가격 문자열을 기준으로 일괄 변환합니다.
update public.properties
set price_amount = public.parse_korean_property_price(price);

create index if not exists properties_price_amount_idx
on public.properties (price_amount);
