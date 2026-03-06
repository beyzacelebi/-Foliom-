-- Foliom: user_books tablosu
-- Supabase SQL Editor'da çalıştırın

create table if not exists public.user_books (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_id    int  not null,
  title      text not null,
  author     text not null,
  grad1      text not null default '#1a2e5a',
  grad2      text not null default '#3a0e20',
  status     text not null default 'later'
               check (status in ('reading', 'later', 'done')),
  progress   int  not null default 0 check (progress between 0 and 100),
  chapter    text,
  added_at   timestamptz not null default now(),
  unique (user_id, book_id)
);

-- Row Level Security: sadece kitabı ekleyen kullanıcı görebilir/değiştirebilir
alter table public.user_books enable row level security;

create policy "Sadece sahip okuyabilir"
  on public.user_books for select
  using (auth.uid() = user_id);

create policy "Sadece sahip ekleyebilir"
  on public.user_books for insert
  with check (auth.uid() = user_id);

create policy "Sadece sahip güncelleyebilir"
  on public.user_books for update
  using (auth.uid() = user_id);

create policy "Sadece sahip silebilir"
  on public.user_books for delete
  using (auth.uid() = user_id);
