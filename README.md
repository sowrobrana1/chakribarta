# ChakriBarta — চাকরির খবর | Job Circular BD

বাংলাদেশের সব চাকরির সার্কুলার (সরকারি, ব্যাংক, NGO, প্রাইভেট, শিক্ষক, প্রতিরক্ষা,
ফলাফল) এক জায়গায় — Next.js 14 ওয়েব অ্যাপ, যা পরে Capacitor দিয়ে Android
অ্যাপে রূপ নেবে। Full plan:
`~/workspace/goals/chakribarta-app-play-store/files/chakribarta-full-plan.md`

## Status (24 Oct 2026) — V1 front-end complete & verified

✅ `npm install` এবং `npm run build` দুটোই সফল (Next.js 14.2.35)।
✅ রানটাইম smoke test পাস: হোম feed, details, /saved, manifest, service worker —
সব route 200; অজানা job id 404 দেয়।
✅ **Data loader** (`lib/data.ts`): Supabase env থাকলে `circulars` টেবিল থেকে,
না থাকলে `data/circulars.json` (local fallback) থেকে পড়ে। নিয়ম: published +
(deadline ≥ আজ অথবা ক্যাটাগরি ফলাফল), নতুন আগে। Seed data
(`seed-circulars.json`, ১২টি আসল সার্কুলার) `data/circulars.json`-এ কপি করা আছে।
✅ **Search**: হোমের search bar + ক্যাটাগরি chips এখন client-side লাইভ ফিল্টার করে।
✅ **সেভ করা পেজ** (`/saved`): details পেজের সেভ বোতাম (localStorage) থেকে তালিকা।
✅ **PWA**: installable — `public/manifest.webmanifest`, আইকন
(`public/icons/`, 192/512/1024 + apple-touch 180), theme-color `#0a5c3e`,
`public/sw.js` service worker (static cache-first, পেজ network-first)।

### যা তৈরি আছে

| অংশ | ফাইল |
|---|---|
| Project scaffold (Next 14, App Router, TypeScript) | `package.json`, `next.config.mjs`, `tsconfig.json` |
| Supabase client + feed/details queries (graceful fallback) | `lib/supabase.ts` |
| Types + category list | `lib/types.ts` |
| Bengali digits / date / deadline helpers | `lib/format.ts` |
| হোম পেজ — সবুজ header (logo + bell), search, category chips, deadline badge সহ job cards, empty state | `app/page.tsx`, `components/*` |
| Data loader — Supabase অথবা `data/circulars.json` fallback | `lib/data.ts` |
| Client-side search + ক্যাটাগরি ফিল্টার | `components/HomeFeed.tsx` |
| Details পেজ — countdown banner, তথ্যের তালিকা, circular image, Apply button, save (localStorage) / share | `app/job/[id]/page.tsx` |
| সেভ করা পেজ | `app/saved/page.tsx`, `components/SavedList.tsx` |
| PWA — manifest, আইকন, service worker | `public/manifest.webmanifest`, `public/icons/`, `public/sw.js` |
| Supabase schema + RLS + 3টি sample circular seed | `supabase/schema.sql` |
| সরকারি-অ্যাপ-নয় disclaimer footer | `app/layout.tsx` |

## চালাতে যা লাগবে

1. [Supabase](https://supabase.com)-এ একটা free project তৈরি করো (**এখনো তৈরি হয়নি**)।
2. Dashboard → SQL Editor-এ `supabase/schema.sql` চালাও (tables + 3 sample circular তৈরি হবে)।
3. `.env.example` কপি করে `.env.local` বানিয়ে মান বসাও:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `npm run dev` → http://localhost:3000

Env vars না থাকলে অ্যাপ চলবে, শুধু খালি feed দেখাবে।

## বাকি কাজ (TODO)

- [ ] **Supabase project তৈরি** + schema রান + `.env.local` বসানো, তারপর Vercel-এ deploy
- [ ] **Circular ingest monitor** — সরকারি সাইট/Teletalk/bdjobs থেকে অটো সংগ্রহ,
      অফিসিয়াল source থেকে verify, মেয়াদ শেষ হলে auto-expire (service-role key লাগবে)
- [ ] **Admin panel** — `/admin` login (ADMIN_PASSWORD), circular add/edit/delete,
      stats (মোট/আজকের সার্কুলার, সবচেয়ে বেশি দেখা)
- [ ] **Capacitor Android shell** — package id ঠিক করে Play Console-এ app entry তৈরি
- [ ] **FCM push** — Firebase project, নতুন সার্কুলারে notification, deadline reminder;
      `push_subscriptions` টেবিলে token জমা
- [x] **সার্চ** — হোমে client-side লাইভ ফিল্টার (org/title/category)
- [ ] **Filter উন্নতি** — যোগ্যতা (SSC/HSC/Honours) ও জেলা দিয়ে filter
- [x] **সেভ করা পেজ** — `/saved` (localStorage-ভিত্তিক)
- [ ] **Privacy Policy পেজ** (website-এ) — Play Store submit-এর জন্য বাধ্যতামূলক
- [ ] **AdMob** — Capacitor shell-এর পর বিজ্ঞাপন যোগ
- [ ] V1.5: AI CV Maker (Gemini), বয়স ক্যালকুলেটর, category-wise notification subscribe

## Env vars (সারসংক্ষেপ)

| Var | কোথায় লাগে | অবস্থা |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project তৈরির পর |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase project তৈরির পর |
| `SUPABASE_SERVICE_ROLE_KEY` | শুধু server (ingest/admin) | পরে |
| `ADMIN_PASSWORD` | admin login | পরে |
