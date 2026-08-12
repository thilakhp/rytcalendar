import { Search } from "lucide-react";

export function SearchFilterBar({
  basePath,
  q,
  status,
  placeholder = "Search…",
}: {
  basePath: string;
  q?: string;
  status?: string;
  placeholder?: string;
}) {
  return (
    <form
      action={basePath}
      className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <select
        name="status"
        defaultValue={status ?? "active"}
        className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      >
        <option value="active">Active only</option>
        <option value="all">All</option>
        <option value="inactive">Inactive only</option>
      </select>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Apply
      </button>
    </form>
  );
}
