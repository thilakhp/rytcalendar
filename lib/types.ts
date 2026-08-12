export type Vendor = {
  id: string;
  owner_id: string;
  name: string;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  primary_training_areas: string[];
  specialization: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  owner_id: string;
  name: string;
  industry: string | null;
  country: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Trainer = {
  id: string;
  owner_id: string;
  name: string;
  specialization: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TrainingCourse = {
  id: string;
  owner_id: string;
  name: string;
  product_platform: string | null;
  category: string | null;
  standard_duration_days: number | null;
  standard_hours_per_day: number | null;
  standard_total_hours: number | null;
  default_delivery_mode: string | null;
  description: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Holiday = {
  id: string;
  owner_id: string;
  date: string;
  name: string;
  country: string | null;
  region: string | null;
  is_working_day: boolean;
  created_at: string;
  updated_at: string;
};

export type EngagementStatus =
  | "planned"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Engagement = {
  id: string;
  owner_id: string;
  client_id: string;
  vendor_id: string | null;
  program_name: string;
  total_pax: number | null;
  primary_timezone: string;
  overall_status: EngagementStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Batch = {
  id: string;
  owner_id: string;
  engagement_id: string;
  training_course_id: string | null;
  trainer_id: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  delivery_mode: string | null;
  status: EngagementStatus;
  pax: number | null;
  location: string | null;
  break_minutes: number;
  notes: string | null;
  calendar_days: number | null;
  working_days: number | null;
  hours_per_day: number | null;
  net_hours_per_day: number | null;
  total_hours: number | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilityRule = "blocks" | "tentative" | "historical" | "none";

export type Settings = {
  id: string;
  owner_id: string;
  org_name: string;
  theme: Record<string, unknown>;
  working_weekdays: number[]; // ISO 1=Mon .. 7=Sun
  working_hours: { start: string; end: string };
  default_timezone: string;
  default_break_minutes: number;
  statuses: string[];
  delivery_modes: string[];
  availability_rules: Record<EngagementStatus, AvailabilityRule>;
  holiday_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ImportStaging = {
  id: string;
  owner_id: string;
  batch_key: string;
  source_sheet: string;
  source_cell_refs: string[];
  start_date: string;
  end_date: string;
  raw_text: string;
  candidate_type: "batch" | "holiday";
  program_name: string | null;
  client_id: string | null;
  vendor_id: string | null;
  training_course_id: string | null;
  delivery_mode: string | null;
  status: string;
  review_status: "needs_review" | "approved" | "ignored";
  linked_engagement_id: string | null;
  linked_holiday_id: string | null;
  created_at: string;
  updated_at: string;
};
