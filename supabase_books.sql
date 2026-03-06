-- Books table (authored books)
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  genre text not null default 'Roman',
  status text not null default 'Taslak', -- Taslak | Yayında | Tamamlandı
  cover_grad1 text default '#1a2e5a',
  cover_grad2 text default '#3a0e20',
  total_reads bigint default 0,
  total_votes bigint default 0,
  total_comments bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chapters table
create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_no integer not null default 1,
  title text not null,
  content text,
  word_count integer default 0,
  char_count integer default 0,
  status text not null default 'Taslak', -- Taslak | Yayında
  comments_open boolean default true,
  pub_note text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(book_id, chapter_no)
);

-- Book characters table
create table if not exists book_characters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text default 'other', -- main | side | villain | other
  age text,
  description text,
  color text default '#2e4f91',
  photo_url text,
  created_at timestamptz default now()
);

-- RLS
alter table books enable row level security;
alter table chapters enable row level security;
alter table book_characters enable row level security;

-- Books policies
create policy "users can select own books" on books for select using (auth.uid() = user_id);
create policy "users can insert own books" on books for insert with check (auth.uid() = user_id);
create policy "users can update own books" on books for update using (auth.uid() = user_id);
create policy "users can delete own books" on books for delete using (auth.uid() = user_id);

-- Chapters policies
create policy "users can select own chapters" on chapters for select using (auth.uid() = user_id);
create policy "users can insert own chapters" on chapters for insert with check (auth.uid() = user_id);
create policy "users can update own chapters" on chapters for update using (auth.uid() = user_id);
create policy "users can delete own chapters" on chapters for delete using (auth.uid() = user_id);

-- Book characters policies
create policy "users can select own characters" on book_characters for select using (auth.uid() = user_id);
create policy "users can insert own characters" on book_characters for insert with check (auth.uid() = user_id);
create policy "users can update own characters" on book_characters for update using (auth.uid() = user_id);
create policy "users can delete own characters" on book_characters for delete using (auth.uid() = user_id);
