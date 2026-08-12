-- RYT Training Management & Scheduling — initial schema
-- Every table carries owner_id + RLS so the app is multi-user-ready even though
-- only one user exists today.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- VENDORS
-- ---------------------------------------------------------------------------
create table vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  company_name text,
  contact_person text,
  email text,
  phone text,
  website text,
  country text,
  primary_training_areas text[] not null default '{}',
  specialization text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vendors_owner_idx on vendors(owner_id);
create trigger vendors_set_updated_at before update on vendors
  for each row execute function set_updated_at();
alter table vendors enable row level security;
create policy "owner_all" on vendors for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  industry text,
  country text,
  contact_person text,
  email text,
  phone text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_owner_idx on clients(owner_id);
create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();
alter table clients enable row level security;
create policy "owner_all" on clients for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- TRAINERS
-- ---------------------------------------------------------------------------
create table trainers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  specialization text,
  email text,
  phone text,
  location text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trainers_owner_idx on trainers(owner_id);
create trigger trainers_set_updated_at before update on trainers
  for each row execute function set_updated_at();
alter table trainers enable row level security;
create policy "owner_all" on trainers for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- TRAINING CATALOG
-- ---------------------------------------------------------------------------
create table training_courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  product_platform text,
  category text,
  standard_duration_days numeric(6,2),
  standard_hours_per_day numeric(5,2),
  standard_total_hours numeric(7,2),
  default_delivery_mode text,
  description text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index training_courses_owner_idx on training_courses(owner_id);
create trigger training_courses_set_updated_at before update on training_courses
  for each row execute function set_updated_at();
alter table training_courses enable row level security;
create policy "owner_all" on training_courses for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- HOLIDAYS
-- ---------------------------------------------------------------------------
create table holidays (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  date date not null,
  name text not null,
  country text,
  region text,
  is_working_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index holidays_owner_idx on holidays(owner_id);
create index holidays_date_idx on holidays(date);
create trigger holidays_set_updated_at before update on holidays
  for each row execute function set_updated_at();
alter table holidays enable row level security;
create policy "owner_all" on holidays for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ENGAGEMENTS  (the client/program relationship)
-- ---------------------------------------------------------------------------
create table engagements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  client_id uuid not null references clients(id) on delete restrict,
  vendor_id uuid references vendors(id) on delete restrict,
  program_name text not null,
  total_pax integer,
  primary_timezone text not null default 'Asia/Kolkata',
  overall_status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index engagements_owner_idx on engagements(owner_id);
create index engagements_client_idx on engagements(client_id);
create index engagements_vendor_idx on engagements(vendor_id);
create trigger engagements_set_updated_at before update on engagements
  for each row execute function set_updated_at();
alter table engagements enable row level security;
create policy "owner_all" on engagements for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- BATCHES  (one specific training course + its dates, within an engagement)
-- ---------------------------------------------------------------------------
create table batches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  training_course_id uuid references training_courses(id) on delete restrict,
  trainer_id uuid references trainers(id) on delete set null,
  start_date date not null,
  end_date date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Kolkata',
  delivery_mode text,
  status text not null default 'planned',
  pax integer,
  location text,
  break_minutes integer not null default 0,
  notes text,
  -- calculated + cached at write time by the app (lib/calc.ts)
  calendar_days integer,
  working_days integer,
  hours_per_day numeric(5,2),
  net_hours_per_day numeric(5,2),
  total_hours numeric(7,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint batches_date_order check (end_date >= start_date)
);
create index batches_owner_idx on batches(owner_id);
create index batches_engagement_idx on batches(engagement_id);
create index batches_date_range_idx on batches(start_date, end_date);
create index batches_status_idx on batches(status);
create trigger batches_set_updated_at before update on batches
  for each row execute function set_updated_at();
alter table batches enable row level security;
create policy "owner_all" on batches for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- SETTINGS  (single row per owner)
-- ---------------------------------------------------------------------------
create table settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) default auth.uid(),
  org_name text not null default 'RYT Global LLP',
  theme jsonb not null default '{}',
  working_weekdays int[] not null default '{1,2,3,4,5}', -- ISO 1=Mon .. 7=Sun
  working_hours jsonb not null default '{"start":"09:00","end":"17:00"}',
  default_timezone text not null default 'Asia/Kolkata',
  default_break_minutes integer not null default 0,
  statuses text[] not null default '{planned,confirmed,in_progress,completed,cancelled}',
  delivery_modes text[] not null default '{VILT,Classroom,Self-Paced,Hybrid}',
  availability_rules jsonb not null default
    '{"confirmed":"blocks","in_progress":"blocks","planned":"tentative","completed":"historical","cancelled":"none"}',
  holiday_rules jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger settings_set_updated_at before update on settings
  for each row execute function set_updated_at();
alter table settings enable row level security;
create policy "owner_all" on settings for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
