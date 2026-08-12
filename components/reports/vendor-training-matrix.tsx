import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { MatrixCell } from "@/lib/analytics";

export function VendorTrainingMatrix({
  vendors,
  courses,
  cell,
  metric,
  tab,
}: {
  vendors: { id: string; name: string }[];
  courses: { id: string; name: string }[];
  cell: (vendorId: string, courseId: string) => MatrixCell | undefined;
  metric: "batches" | "days" | "hours";
  tab: string;
}) {
  if (vendors.length === 0 || courses.length === 0) {
    return (
      <Card className="px-6 py-12 text-center text-sm text-slate-500">
        No data for the current filters.
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {(["batches", "days", "hours"] as const).map((m) => (
          <Link
            key={m}
            href={`/reports?tab=${tab}&metric=${m}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
              metric === m ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {m}
          </Link>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/60">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vendor \ Training
              </th>
              {courses.map((c) => (
                <th
                  key={c.id}
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{v.name}</td>
                {courses.map((c) => {
                  const value = cell(v.id, c.id)?.[metric];
                  return (
                    <td key={c.id} className="px-4 py-3 text-right text-slate-600">
                      {value ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
