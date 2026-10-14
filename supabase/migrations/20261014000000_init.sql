-- CV Builder: initial schema.
-- Every table is owner-scoped through RLS. Columns that affect billing or
-- AI quotas (profiles.pro_until, ai_usage, payments) are written only by the
-- server with the service role key, never by the browser.

create extension if not exists "pgcrypto";

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  pro_until timestamptz,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- CVs ------------------------------------------------------------------------

create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled CV',
  target_role text not null default '',
  job_description text not null default '',
  language text not null default 'English',
  -- Interview transcript: [{ role: 'user' | 'assistant', content: string }]
  interview jsonb not null default '[]'::jsonb,
  interview_done boolean not null default false,
  template text not null default 'classic',
  accent text not null default '#1f4e79',
  photo_path text,
  -- Generated CV (see src/lib/cv-schema.ts) and its ATS review.
  content jsonb,
  ats jsonb,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cvs_user_id_idx on public.cvs (user_id, updated_at desc);

alter table public.cvs enable row level security;

create policy "cvs: read own" on public.cvs for select using (auth.uid() = user_id);
create policy "cvs: insert own" on public.cvs for insert with check (auth.uid() = user_id);
create policy "cvs: update own" on public.cvs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cvs: delete own" on public.cvs for delete using (auth.uid() = user_id);

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cvs_touch_updated_at
  before update on public.cvs
  for each row execute function public.touch_updated_at();

-- Uploaded diplomas and certificates ----------------------------------------

create table public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  -- What the AI read from the document (see src/lib/cv-schema.ts DocumentFacts).
  extracted jsonb,
  created_at timestamptz not null default now()
);

create index cv_documents_cv_id_idx on public.cv_documents (cv_id);

alter table public.cv_documents enable row level security;

create policy "cv_documents: read own" on public.cv_documents for select using (auth.uid() = user_id);
create policy "cv_documents: insert own" on public.cv_documents for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.cvs c where c.id = cv_id and c.user_id = auth.uid())
  );
create policy "cv_documents: update own" on public.cv_documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cv_documents: delete own" on public.cv_documents for delete using (auth.uid() = user_id);

-- AI usage (quota tracking, server-written) ---------------------------------

create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('interview', 'document', 'generate')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index ai_usage_user_kind_idx on public.ai_usage (user_id, kind, created_at desc);

alter table public.ai_usage enable row level security;

create policy "ai_usage: read own" on public.ai_usage for select using (auth.uid() = user_id);

-- Payments (server-written from the Stripe webhook) --------------------------

create table public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_session_id text not null unique,
  amount_total integer,
  currency text,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments: read own" on public.payments for select using (auth.uid() = user_id);

-- Storage: private bucket, files live under "<user_id>/<cv_id>/..." ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-files',
  'cv-files',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "cv-files: read own"
  on storage.objects for select
  using (bucket_id = 'cv-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cv-files: upload own"
  on storage.objects for insert
  with check (bucket_id = 'cv-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cv-files: delete own"
  on storage.objects for delete
  using (bucket_id = 'cv-files' and (storage.foldername(name))[1] = auth.uid()::text);
