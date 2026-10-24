-- ============================================================
-- ChakriBarta — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor).
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT where practical.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- circulars: the job circulars shown in the app feed
-- ------------------------------------------------------------
create table if not exists public.circulars (
  id             uuid primary key default gen_random_uuid(),
  org            text not null,
  title          text not null,
  category       text not null check (category in (
                   'সরকারি','ব্যাংক','NGO','প্রাইভেট','শিক্ষক','প্রতিরক্ষা','ফলাফল'
                 )),
  posts_count    integer,
  salary         text,
  education      text,
  location       text,
  published_date date not null default current_date,
  deadline       date not null,
  source_url     text,
  apply_url      text,
  image_url      text,
  status         text not null default 'active'
                   check (status in ('active','expired','draft')),
  is_sample      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists circulars_feed_idx
  on public.circulars (status, deadline, published_date desc);
create index if not exists circulars_category_idx
  on public.circulars (category);

alter table public.circulars enable row level security;

-- Public (anon) can read active circulars only.
drop policy if exists "circulars_public_read" on public.circulars;
create policy "circulars_public_read" on public.circulars
  for select using (status = 'active');

-- Writes happen via the service-role key (ingest monitor / admin),
-- which bypasses RLS. No anon insert/update/delete policies on purpose.

-- ------------------------------------------------------------
-- push_subscriptions: device push tokens (FCM / web push later)
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null default 'android'
                 check (platform in ('android','web')),
  token        text not null unique,          -- FCM token or web-push endpoint
  subscription jsonb,                          -- full web-push subscription object (web only)
  categories   text[] not null default '{}',   -- empty = all categories
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
-- No public policies: only service-role access (register via API route later).

-- ------------------------------------------------------------
-- app_settings: simple key/value store for admin settings
-- ------------------------------------------------------------
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
-- No public policies: service-role only.

insert into public.app_settings (key, value) values
  ('site', '{"name":"ChakriBarta","tagline":"চাকরির খবর"}'::jsonb),
  ('ingest', '{"enabled": false, "sources": []}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- Seed: 3 SAMPLE circulars (is_sample = true) so the feed is
-- not empty on day one. Dates are relative to the day the SQL
-- runs, so the samples never look expired. Delete them once
-- real circulars are flowing in.
-- ============================================================
insert into public.circulars
  (org, title, category, posts_count, salary, education, location,
   published_date, deadline, source_url, apply_url, image_url, is_sample)
values
  ('বাংলাদেশ ব্যাংক', 'সহকারী পরিচালক (সাধারণ)', 'ব্যাংক', 25,
   '২২,০০০ – ৫৩,০৬০ টাকা', 'অনার্স', 'ঢাকা',
   current_date - 2, current_date + 12,
   'https://www.bb.org.bd', 'https://erecruitment.bb.org.bd', null, true),
  ('প্রাথমিক শিক্ষা অধিদপ্তর', 'সহকারী শিক্ষক নিয়োগ বিজ্ঞপ্তি', 'সরকারি', 10219,
   '১১,০০০ – ২৬,৫৯০ টাকা', 'HSC', 'সারা দেশ',
   current_date - 4, current_date + 5,
   'https://www.dpe.gov.bd', 'http://dpe.teletalk.com.bd', null, true),
  ('সোনালী ব্যাংক লিমিটেড', 'সিনিয়র অফিসার (সাধারণ)', 'ব্যাংক', 542,
   '২২,০০০ – ৫৩,০৬০ টাকা', 'অনার্স', 'সারা দেশ',
   current_date - 1, current_date + 3,
   'https://www.sonalibank.com.bd', 'https://erecruitment.bb.org.bd', null, true)
on conflict do nothing;
