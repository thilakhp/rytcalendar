import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImportUploadForm } from "@/components/settings/import-upload-form";
import { ImportStagingRow } from "@/components/settings/import-staging-row";
import { clearApprovedAndIgnored } from "@/app/(app)/settings/import/actions";
import type { ImportStaging, Settings } from "@/lib/types";

const TABS = [
  { key: "needs_review", label: "Needs Review" },
  { key: "approved", label: "Approved" },
  { key: "ignored", label: "Ignored" },
  { key: "all", label: "All" },
] as const;

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab = status ?? "needs_review";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: allRows },
    { data: clients },
    { data: vendors },
    { data: courses },
    { data: settings },
  ] = await Promise.all([
    supabase.from("import_staging").select("*").order("start_date").returns<ImportStaging[]>(),
    supabase.from("clients").select("id, name").eq("active", true).order("name"),
    supabase.from("vendors").select("id, name").eq("active", true).order("name"),
    supabase.from("training_courses").select("id, name").eq("active", true).order("name"),
    supabase.from("settings").select("*").eq("owner_id", user?.id ?? "").maybeSingle(),
  ]);

  const s = settings as Settings | null;
  const statuses = s?.statuses ?? ["planned", "confirmed", "in_progress", "completed", "cancelled"];

  const rows = allRows ?? [];
  const counts = {
    needs_review: rows.filter((r) => r.review_status === "needs_review").length,
    approved: rows.filter((r) => r.review_status === "approved").length,
    ignored: rows.filter((r) => r.review_status === "ignored").length,
    all: rows.length,
  };
  const visible = activeTab === "all" ? rows : rows.filter((r) => r.review_status === activeTab);

  return (
    <>
      <PageHeader
        title="Excel Migration"
        description="Upload your existing calendar spreadsheet, then review and confirm each entry before it becomes real data — nothing is created automatically."
      />

      <Card className="mb-6 p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Upload Calendar</h2>
        <p className="mb-4 text-sm text-slate-500">
          Upload an .xlsx wall-calendar export. The importer looks for repeating
          day-number / day-of-week / event-text columns and groups consecutive
          matching days into batch candidates.
        </p>
        <ImportUploadForm />
      </Card>

      {rows.length > 0 && (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  href={`/settings/import?status=${t.key}`}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition",
                    activeTab === t.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {t.label} ({counts[t.key]})
                </Link>
              ))}
            </div>
            {(counts.approved > 0 || counts.ignored > 0) && (
              <form action={clearApprovedAndIgnored}>
                <Button type="submit" variant="secondary" size="sm">
                  Clear Approved &amp; Ignored
                </Button>
              </form>
            )}
          </div>

          {visible.length === 0 ? (
            <Card className="px-6 py-12 text-center text-sm text-slate-500">Nothing here.</Card>
          ) : (
            <div className="space-y-4">
              {visible.map((row) => (
                <ImportStagingRow
                  key={row.id}
                  row={row}
                  clients={clients ?? []}
                  vendors={vendors ?? []}
                  courses={courses ?? []}
                  statuses={statuses}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
