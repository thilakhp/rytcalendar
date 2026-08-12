-- Staging area for the Excel migration tool (§53-54). Nothing here becomes
-- real production data until a row is explicitly approved in the Import
-- Review screen.
create table import_staging (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  batch_key text not null,
  source_sheet text not null,
  source_cell_refs text[] not null default '{}',
  start_date date not null,
  end_date date not null,
  raw_text text not null,
  candidate_type text not null default 'batch', -- 'batch' | 'holiday'
  program_name text,
  client_id uuid references clients(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,
  training_course_id uuid references training_courses(id) on delete set null,
  delivery_mode text,
  status text not null default 'planned',
  review_status text not null default 'needs_review', -- 'needs_review' | 'approved' | 'ignored'
  linked_engagement_id uuid references engagements(id) on delete set null,
  linked_holiday_id uuid references holidays(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index import_staging_owner_idx on import_staging(owner_id);
create index import_staging_review_status_idx on import_staging(review_status);
create trigger import_staging_set_updated_at before update on import_staging
  for each row execute function set_updated_at();
alter table import_staging enable row level security;
create policy "owner_all" on import_staging for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
