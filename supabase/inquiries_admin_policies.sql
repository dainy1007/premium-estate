-- 개발 단계용 문의 관리 정책
-- 관리자 로그인 기능을 추가한 뒤에는 anon 권한을 제거하고 authenticated 전용으로 변경하세요.

alter table public.inquiries enable row level security;

drop policy if exists "Allow public inquiry insert" on public.inquiries;
create policy "Allow public inquiry insert"
on public.inquiries
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow authenticated inquiry read" on public.inquiries;
drop policy if exists "Allow public inquiry read" on public.inquiries;
create policy "Allow public inquiry read"
on public.inquiries
for select
to anon, authenticated
using (true);

drop policy if exists "Allow public inquiry update" on public.inquiries;
create policy "Allow public inquiry update"
on public.inquiries
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public inquiry delete" on public.inquiries;
create policy "Allow public inquiry delete"
on public.inquiries
for delete
to anon, authenticated
using (true);
