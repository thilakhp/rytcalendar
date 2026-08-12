export type CalendarBatch = {
  id: string;
  engagement_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: string;
  pax: number | null;
  delivery_mode: string | null;
  location: string | null;
  working_days: number | null;
  total_hours: number | null;
  notes: string | null;
  training_courses: { name: string } | null;
  trainers: { name: string } | null;
  engagements: {
    program_name: string;
    total_pax: number | null;
    clients: { name: string } | null;
    vendors: { name: string } | null;
  } | null;
};

export type DayEntry = {
  date: string;
  batches: CalendarBatch[];
};
