# ChakriBarta — চাকরির খবর | Job Circular BD

বাংলাদেশের সব চাকরির সার্কুলার (সরকারি, ব্যাংক, NGO, প্রাইভেট, শিক্ষক, প্রতিরক্ষা,
ফলাফল) এক জায়গায় — Next.js 14 ওয়েব অ্যাপ, যা পরে Capacitor দিয়ে Android
অ্যাপে রূপ নেবে। Full plan:
`~/workspace/goals/chakribarta-app-play-store/files/chakribarta-full-plan.md`

## Status (24 Oct 2026) — Feature phase complete: বয়স ক্যালকুলেটর, AI CV Maker, Push groundwork

✅ **বয়স ক্যালকুলেটর** (`/age`) — পুরোপুরি client-side: জন্ম তারিখ +
হিসাবের তারিখ (ডিফল্ট আজ; সাধারণত সার্কুলারের আবেদনের শেষ তারিখ)
দিলে সঠিক বয়স **বছর/মাস/দিনে** (বাংলা সংখ্যায়)। Quick-check তালিকা:
সাধারণ প্রার্থী ১৮–৩০, মুক্তিযোদ্ধা/শহীদ মুক্তিযোদ্ধার সন্তান ১৮–৩২,
পুলিশ কনস্টেবল ১৮–২০ — প্রতিটির পাশে ✓/হয়নি/পার হয়ে গেছে স্ট্যাটাস।
সঙ্গে পরিষ্কার disclaimer: এটি সাধারণ তথ্য, প্রতিটি সার্কুলারের নিজস্ব
বিজ্ঞপ্তিই চূড়ান্ত। Age-এর হিসাব leap-year/boundary case দিয়ে যাচাই করা।

✅ **AI CV Maker** (`/cv` + `POST /api/cv`) — বাংলা ফর্ম (নাম, পিতা/মাতা,
বর্তমান/স্থায়ী ঠিকানা, মোবাইল, ইমেইল, জন্ম তারিখ, একাধিক সারির
শিক্ষাগত যোগ্যতা, অভিজ্ঞতা, দক্ষতা, ভাষা) → পরিচ্ছন্ন printable CV
preview (Career Objective, Personal Info, শিক্ষার টেবিল, অভিজ্ঞতা,
দক্ষতা, ভাষা, Declaration + স্বাক্ষর); print stylesheet-এ শুধু CV
sheet-টাই ছাপা হয় (browser print দিয়ে PDF সেভ করা যায়)।
- **AI polish**: `GEMINI_API_KEY` সেট থাকলে `/api/cv` Google Gemini
  (model chain: `gemini-flash-latest` → `gemini-3-flash-preview` →
  `gemini-3.8-flash`) দিয়ে Career Objective ও দক্ষতার সারাংশ polished
  English-এ সাজায়। Key না থাকলে বা API fail হলে template text ব্যবহৃত
  হয় (`aiUsed:false`) — CV তৈরি কখনোই আটকায় না; পেজে তখন ছোট নোট
  দেখায় যে AI polish বন্ধ আছে।

✅ **Push notification groundwork** (`/api/push/key`,
`/api/push/subscribe`, header-এর `PushBell`, `sw.js`-এ push +
notificationclick handler) — news sites-এর মতোই self-hosted Web Push:
- Bell বোতামটি হোম header-এ থাকে, কিন্তু `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  সেট না থাকলে **নিজে থেকেই লুকিয়ে থাকে**।
- Subscription সংরক্ষণ `lib/push.ts`-এ, `lib/admin.ts`-এর একই switch
  অনুসরণ করে: Supabase mode-এ `push_subscriptions` টেবিলে
  (platform `web`, token = endpoint, subscription JSON, categories);
  local mode-এ কিছুই durable সংরক্ষণ না করে friendly "শীঘ্রই আসছে"
  JSON ফেরত দেয়।
- **VAPID key এখনো তৈরি হয়নি** — key জোড়া তৈরি ও env সেট করা
  Supabase wiring-এর সঙ্গে করা পরের ধাপ (নিচে TODO)। Push পাঠানোর
  sender (নতুন সার্কুলারে notification) সেই ধাপের পর আসবে।

✅ **নেভিগেশন** — BottomNav এখন ৫ আইটেম (হোম, ক্যাটাগরি, সেভ করা,
**টুলস**, ফলাফল); `/tools` পেজে দুই টুলের কার্ড; হোমে search-এর উপরে
shortcut row (🎂 বয়স ক্যালকুলেটর, 📄 AI CV তৈরি করুন)।

## Status (24 Oct 2026) — Phase 2 complete: admin panel + ingest skeleton

✅ **Admin panel** (`/app/admin`) — পাসওয়ার্ড গেট (`ADMIN_PASSWORD` env,
server-side যাচাই, httpOnly cookie session)।
- `ADMIN_PASSWORD` সেট না থাকলে /admin শুধু Bengali "সেটআপ করা হয়নি"
  নোটিশ দেখায় — কোনোভাবেই open access নয়।
- **Supabase mode** (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  সেট থাকলে): সব স্ট্যাটাসের সার্কুলার তালিকা, add/edit/delete, stats strip
  (মোট সার্কুলার, ৭ দিনের মধ্যে শেষ হচ্ছে এমন, ক্যাটাগরি ও স্ট্যাটাস অনুযায়ী সংখ্যা)।
- **Local mode** (DB নেই): `data/circulars.json` থেকে read-only তালিকা +
  পরিষ্কার নোটিশ যে DB সংযুক্ত হলেই এডিট চালু হবে। API layer
  (`lib/admin.ts`) দুই mode-এর মধ্যে নিজে থেকে switch করে।
- যাচাই: build পাস; no-env → নোটিশ, ভুল পাসওয়ার্ড → 401, সঠিক লগইনে
  local mode-এ ১২টি সার্কুলার + stats, local mode-এ write চেষ্টা → 400।

✅ **Ingest monitor (skeleton)** — `scripts/collect.mjs` (`npm run collect`):
bdjobs homepage-এর embedded JSON ও chakri.com listing থেকে candidate
সংগ্রহ করে, `data/circulars.json`-এর সঙ্গে dedupe করে, নতুনগুলো
`data/candidates.json`-এ `status: "needs_verification"` হিসেবে লেখে।
**কখনোই নিজে থেকে publish করে না** — official source থেকে verify
করাই project-এর hard rule। Fetch fail হলে খালি candidates ফাইল +
console নোট দিয়ে exit 0।
- প্রথম রান: bdjobs থেকে ১০৮টি job parse হয়ে **৫৪টি নতুন candidate**;
  chakri.com তখন HTTP 523 (site down) — gracefully skip হয়েছে।

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
| Admin panel — password gate + dashboard (stats, add/edit/delete) | `app/admin/page.tsx`, `components/admin/*` |
| Admin API — login/logout, circulars CRUD (session-guarded) | `app/api/admin/*` |
| Admin data layer — Supabase (service-role) ⇄ local read-only switch | `lib/admin.ts`, `lib/admin-auth.ts` |
| Ingest monitor (skeleton) — candidates সংগ্রহ, কখনো auto-publish নয় | `scripts/collect.mjs` |
| বয়স ক্যালকুলেটর — exact age (বছর/মাস/দিন) + সাধারণ বয়সসীমা quick-check | `app/age/page.tsx`, `components/AgeCalculator.tsx` |
| AI CV Maker — বাংলা ফর্ম → printable CV preview; Gemini template type + types/template | `app/cv/page.tsx`, `components/CvMaker.tsx`, `app/api/cv/route.ts`, `lib/cv.ts` |
| টুলস পেজ + হোম shortcut row | `app/tools/page.tsx`, `components/ToolsShortcut.tsx` |
| Push groundwork — VAPID key route, subscribe API, header bell, SW push handlers | `app/api/push/*`, `lib/push.ts`, `components/PushBell.tsx`, `public/sw.js` |

## চালাতে যা লাগবে

1. [Supabase](https://supabase.com)-এ একটা free project তৈরি করো (**এখনো তৈরি হয়নি**)।
2. Dashboard → SQL Editor-এ `supabase/schema.sql` চালাও (tables + 3 sample circular তৈরি হবে)।
3. `.env.example` কপি করে `.env.local` বানিয়ে মান বসাও:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (admin writes-এর জন্য, শুধু server)
   - `ADMIN_PASSWORD` (admin panel খুলতে)
4. `npm run dev` → http://localhost:3000

Env vars না থাকলে অ্যাপ চলবে local `data/circulars.json` দিয়ে; admin
panel তখন "সেটআপ করা হয়নি" নোটিশ দেখাবে।

## Admin panel

- ঠিকানা: `/admin`। `ADMIN_PASSWORD` env var দিয়ে লগইন (httpOnly cookie
  session, ৭ দিন)। পাসওয়ার্ড বদলালে পুরনো সব session বাতিল হয়ে যায়।
- Supabase সংযুক্ত থাকলে পুরো CRUD + stats; না থাকলে read-only তালিকা।
- Vercel-এ চালু করতে: Project → Settings → Environment Variables-এ
  `ADMIN_PASSWORD` ও `SUPABASE_SERVICE_ROLE_KEY` যোগ করে redeploy।

## Ingest monitor

```bash
npm run collect   # → data/candidates.json (status: needs_verification)
```

Candidate গুলো যাচাইয়ের ধাপ: প্রতিটির `apply_url`/official notice
খুলে org, title, deadline মিলিয়ে দেখা → ঠিক থাকলে admin panel দিয়ে
(অথবা হাতে) `data/circulars.json` / Supabase-এ publish করা। যাচাই ছাড়া
কোনো candidate কখনো live feed-এ যাবে না।

## বাকি কাজ (TODO)

- [ ] **Supabase project তৈরি** + schema.sql রান + `.env.local` বসানো; তারপর
      Vercel env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`) সেট করে redeploy — এতেই
      admin CRUD ও live DB feed চালু হবে
- [x] **Admin panel** — `/admin` password gate, Supabase mode-এ CRUD + stats,
      local mode-এ read-only (Phase 2-তে তৈরি)
- [x] **Ingest monitor (skeleton)** — bdjobs + chakri.com থেকে candidate সংগ্রহ →
      `data/candidates.json` (needs_verification)। বাকি: Teletalk/সরকারি source
      যোগ, official-source auto-verify ধাপ, মেয়াদ শেষে auto-expire
- [ ] **Capacitor Android shell** — package id ঠিক করে Play Console-এ app entry তৈরি
- [x] **Push groundwork** — Web Push subscribe flow, VAPID key route,
      `push_subscriptions` সংরক্ষণ (Supabase mode), SW push handler।
      বাকি (activation): **VAPID key pair তৈরি** (`npx web-push
      generate-vapid-keys`) → Vercel env-এ `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
      + `VAPID_PRIVATE_KEY` সেট → তারপর push sender (নতুন সার্কুলারে
      notification + deadline reminder, `web-push` প্যাকেজ দিয়ে)
- [x] **সার্চ** — হোমে client-side লাইভ ফিল্টার (org/title/category)
- [ ] **Filter উন্নতি** — যোগ্যতা (SSC/HSC/Honours) ও জেলা দিয়ে filter
- [x] **সেভ করা পেজ** — `/saved` (localStorage-ভিত্তিক)
- [ ] **Privacy Policy পেজ** (website-এ) — Play Store submit-এর জন্য বাধ্যতামূলক
- [ ] **AdMob** — Capacitor shell-এর পর বিজ্ঞাপন যোগ
- [x] V1.5 feature phase: **AI CV Maker** (Gemini polish + template fallback),
      **বয়স ক্যালকুলেটর**, push subscribe groundwork — বাকি:
      category-wise notification subscribe UI (subscribe API ইতিমধ্যে
      categories গ্রহণ করে) ও push sender চালু করা

## Env vars (সারসংক্ষেপ)

| Var | কোথায় লাগে | অবস্থা |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project তৈরির পর |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase project তৈরির পর |
| `SUPABASE_SERVICE_ROLE_KEY` | শুধু server (admin writes) | Admin CRUD চালু করতে সেট করতে হবে |
| `ADMIN_PASSWORD` | শুধু server (admin login gate) | /admin খুলতে সেট করতে হবে |
| `GEMINI_API_KEY` | শুধু server (/api/cv AI polish) | ঐচ্ছিক — না থাকলে CV Maker template mode-এ চলে |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | client + server (push subscribe) | VAPID pair তৈরি করে সেট করতে হবে (Supabase wiring-এর সঙ্গে) |
| `VAPID_PRIVATE_KEY` | শুধু server (push পাঠানো) | VAPID pair তৈরি করে সেট করতে হবে (Supabase wiring-এর সঙ্গে) |
