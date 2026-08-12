import { Select } from "@/components/ui/form-field";

type Option = { id: string; name: string };

export function ReportFilters({
  tab,
  filters,
  years,
  vendors,
  clients,
  courses,
  trainers,
  statuses,
  deliveryModes,
}: {
  tab: string;
  filters: {
    year?: string;
    month?: string;
    vendor?: string;
    client?: string;
    training?: string;
    trainer?: string;
    status?: string;
    delivery?: string;
  };
  years: number[];
  vendors: Option[];
  clients: Option[];
  courses: Option[];
  trainers: Option[];
  statuses: string[];
  deliveryModes: string[];
}) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <form action="/reports" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      <input type="hidden" name="tab" value={tab} />

      <Select name="year" defaultValue={filters.year ?? ""}>
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </Select>

      <Select name="month" defaultValue={filters.month ?? ""}>
        <option value="">All months</option>
        {months.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </Select>

      <Select name="vendor" defaultValue={filters.vendor ?? ""}>
        <option value="">All vendors</option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </Select>

      <Select name="client" defaultValue={filters.client ?? ""}>
        <option value="">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>

      <Select name="training" defaultValue={filters.training ?? ""}>
        <option value="">All training</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>

      <Select name="trainer" defaultValue={filters.trainer ?? ""}>
        <option value="">All trainers</option>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </Select>

      <Select name="status" defaultValue={filters.status ?? ""}>
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </Select>

      <Select name="delivery" defaultValue={filters.delivery ?? ""}>
        <option value="">All delivery modes</option>
        {deliveryModes.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </Select>

      <div className="col-span-2 flex gap-2 sm:col-span-4 lg:col-span-8">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Apply Filters
        </button>
        <a
          href={`/reports?tab=${tab}`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear
        </a>
      </div>
    </form>
  );
}
