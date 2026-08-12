# RYT Training Planner

Private training engagement management & scheduling app for RYT Global LLP.
Next.js 16 (App Router) + Supabase (Postgres, Auth, Row Level Security).

Built in five phases, all complete:

- **Phase 1 — Foundation**: auth, navigation, and master data (Vendors,
  Clients, Trainers, Training Catalog, Holidays, Settings).
- **Phase 2 — Training Engagements & Batches**: the core "one program, many
  training batches" form, with live calendar-day / working-day / hours
  calculations (weekends and holidays excluded automatically), catalog
  auto-fill with per-batch override, PAX inheritance, and a Program Summary.
- **Phase 3 — Calendar & Availability**: Month/Week/Day/Year calendar views
  populated automatically from your batches (multi-day batches render across
  their real working days only), a click-through Training Details panel,
  scheduling-conflict detection, and an Availability checker that classifies
  each day as available/tentative/occupied using the rules configured in
  Settings.
- **Phase 4 — Dashboard & Reports**: a full analytics dashboard (today's
  schedule, KPI cards, upcoming batches, in-progress batches, sortable
  vendor/training analytics, a monthly workload chart), a Reports page with
  filters (year/month/vendor/client/training/trainer/status/delivery mode)
  and seven report views (by vendor, training, client, trainer, monthly
  workload/utilization, a vendor × training matrix, and a status breakdown),
  and global search across programs, catalog, vendors, clients, trainers,
  and batch IDs.
- **Phase 5 — PWA, Backup & Migration**: installable home-screen app with an
  offline banner, JSON/CSV export and JSON restore, and a guided Excel
  migration tool with a human-reviewed Import Review screen.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click **New project**.
2. Pick any name (e.g. `ryt-training-planner`) and a region close to you. Save the
   database password somewhere safe — you likely won't need it again for this app.
3. Once the project finishes provisioning, go to **Project Settings → API**.
   Copy the **Project URL** and the **publishable** key (`sb_publishable_...`
   — Supabase's newer name for the anon/public key). Never use the
   **secret** key (`sb_secret_...` / `service_role`) anywhere in this app —
   it must never reach the browser.
4. Go to **Authentication → Providers** and confirm **Email** is enabled
   (it is by default).
5. Go to **Authentication → Users → Add user** and create your own login
   (email + password). This app has no public sign-up page on purpose — it's
   a private, single-user system, so accounts are created directly in Supabase.

## 2. Apply the database schema

In the Supabase dashboard, go to **SQL Editor → New query**, and run the
files in `supabase/migrations/` **in order**:

1. `0001_init.sql` — all core tables (vendors, clients, trainers,
   training_courses, holidays, engagements, batches, settings) with Row
   Level Security enabled on every table, scoped to `owner_id = auth.uid()`.
2. `0002_new_user_settings.sql` — auto-creates a default `settings` row
   whenever a new user signs up.
3. `0003_import_staging.sql` — the staging table behind the Excel migration
   tool (see [Excel Migration](#excel-migration) below).

If you created your user *before* running migration `0002`, the Settings page
creates your settings row automatically the first time you open it.

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste in the Project URL and publishable key from step 1.

## 4. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/login`.
Sign in with the user you created in step 1.5.

## 5. Deploy to Vercel

1. Push this repo to GitHub (or your git host of choice).
2. In Vercel, **Add New Project** → import the repo.
3. Add the two environment variables from `.env.local` in the Vercel project
   settings (**Environment Variables**), for Production, Preview, and
   Development.
4. Deploy. The app is served over HTTPS automatically, which PWA install
   requires.

## Installing on your phone (PWA)

Once deployed (installability needs a real HTTPS domain — `localhost` won't
prompt to install):

- **Android / Chrome**: open the site, then either accept the automatic
  install banner or open **Settings → Install on your phone** in the app
  itself and tap **Add to Home Screen**.
- **iPhone / iPad (Safari)**: open the site in Safari, tap the **Share**
  button, then **Add to Home Screen**. Safari doesn't support automatic
  install prompts — this manual step is the only way on iOS.

Installed, it opens full-screen with no browser chrome and its own home
screen icon. Since it's fully cloud-backed, a yellow banner appears at the
top any time your device goes offline, so you're never looking at stale data
without knowing it — the app does not cache or fake sync of your training
data.

## Backup & Restore

**Settings → Backup & Restore** (`/settings/backup`):

- **Export All Data (JSON)** — a complete snapshot of every vendor, client,
  trainer, training course, holiday, engagement, and batch. Keep this
  somewhere safe; it's the file to use for **Import JSON Backup** below.
- **Export CSV** — per-entity CSV downloads (Vendors, Clients, Trainers,
  Training Catalog, Engagements, Batches) for spreadsheets or other tools.
- **Import JSON Backup** — restores from a previously exported JSON file.
  Records are matched by ID, so re-importing the same file is safe
  (idempotent), but importing a backup that shares IDs with your current
  data **will overwrite those records**. You must tick the confirmation
  checkbox before the import runs.

## Excel Migration

**Settings → Excel Migration** (`/settings/import`) turns your existing
wall-calendar spreadsheet into real Engagements, Batches, and Holidays —
with a human review step in between, so nothing is invented or assumed.

**How it works:**

1. **Upload** an `.xlsx` file. The parser looks for the wall-calendar layout
   (a day-number column, followed by a day-of-week column, followed by an
   event-text column, repeating across each month) on every sheet, and
   groups consecutive days with identical event text into one multi-day
   candidate — this is how the source file represents a training that spans
   several days.
2. It applies a few conservative guesses: `VILT`/`vILT` in the text sets the
   delivery mode; text containing "holiday", "PTO", "leave", or "vacation"
   is proposed as a Holiday instead of a training batch; and if a candidate's
   text contains the exact name of an existing Vendor, Client, or Training
   Course, that field is pre-filled. Everything else — most entries, since
   real spreadsheets rarely spell out full names — is left blank
   intentionally rather than guessed.
3. **Review every candidate** under **Needs Review**. Each batch candidate
   lets you set/confirm the Client (required), Vendor, Training Course,
   delivery mode, status, and exact dates/times before you **Approve &
   Create Batch** — which creates one real Engagement + Batch. Holiday
   candidates confirm the date and name before **Approve & Create Holiday**.
   Misclassified rows (e.g. a holiday the keyword guess missed) can be
   flipped with **Mark as Holiday** / **Mark as Batch**. **Ignore** discards
   a row without creating anything; **Delete** removes it outright.
4. Nothing becomes real data until you approve it — you can re-upload
   additional files, and previously reviewed rows stay put (filter by
   Needs Review / Approved / Ignored / All). Once you're done with a batch
   of approved/ignored rows, **Clear Approved & Ignored** tidies the queue.

## Project structure

```
app/(auth)/          Login, password reset — public routes
app/(app)/            Everything behind auth: dashboard, calendar,
                       availability, engagements, vendors, clients, trainers,
                       catalog, reports, search, and settings (incl. backup
                       and Excel migration)
app/auth/confirm/     Handles Supabase email links (password reset)
app/manifest.ts        PWA manifest
app/icon.tsx, apple-icon.tsx, icon-192/, icon-512/  Generated app icons
public/sw.js            Minimal service worker (static-asset caching only —
                         never caches pages or data)
lib/supabase/          Browser, server, and proxy (middleware) Supabase clients
lib/validation/         Zod schemas for every form
lib/types.ts            Hand-written types matching the database schema
lib/calc.ts             Calendar days / working days / hours calculation engine
lib/schedule.ts         Day-map building, availability rules, conflict detection
lib/analytics.ts        Vendor/training/client/trainer/monthly aggregation
lib/xlsx-import.ts       Wall-calendar spreadsheet parser
lib/csv.ts               CSV serialization for exports
components/ui/          Shared primitives (button, card, form fields, table)
components/data/        Reusable list/search/status components
components/calendar/    Month/Week/Day/Year views + Training Details panel
components/availability/ Date-range form + results list
components/reports/     Sortable report tables, filters, tabs, matrix
components/dashboard/   Monthly workload chart
components/pwa/         Install prompt, offline banner, SW registration
components/settings/    Settings form, holiday form, backup/import UI
supabase/migrations/    SQL migrations, applied in order via the SQL Editor
```

## Notes on this build

- Vendors, Clients, and Trainers are never hard-deleted from the UI — only
  deactivated — so historical training records stay intact.
- Holidays *can* be deleted outright since they don't carry historical
  training data.
- Row Level Security means even though only one user exists today, the
  schema is already multi-user-ready (every table is scoped by `owner_id`).
- PAX (headcount) is a per-**engagement** figure, not a per-batch one — the
  same cohort typically attends every batch in a program, so vendor/client/
  program totals use each engagement's PAX once rather than summing every
  batch (a bug I caught and fixed during Phase 2 testing).

## Future maintenance

- **Everything is manageable from the UI** — vendors, clients, trainers,
  training courses, engagements, holidays, and settings all have their own
  forms. You should never need to touch SQL or the Supabase dashboard for
  day-to-day use, only for the one-time setup above.
- **Schema changes**: if this app is extended later, add new files to
  `supabase/migrations/` numbered after `0003_import_staging.sql`, and apply
  them the same way (SQL Editor, in order).
- **Dependencies**: `npm outdated` / `npm update` as usual. The `xlsx`
  package is intentionally installed from SheetJS's own CDN
  (`https://cdn.sheetjs.com/...`) rather than the npm registry, because the
  npm-published version has unpatched security advisories — check
  [cdn.sheetjs.com](https://cdn.sheetjs.com) for newer versions before
  bumping it.
- **Backups**: use **Settings → Backup & Restore → Export All Data (JSON)**
  periodically, especially before any risky change (bulk edits, schema
  migrations, imports).
