import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ImportBackupForm } from "@/components/settings/import-backup-form";
import { Download } from "lucide-react";

const CSV_ENTITIES = [
  { key: "vendors", label: "Vendors" },
  { key: "clients", label: "Clients" },
  { key: "trainers", label: "Trainers" },
  { key: "training_courses", label: "Training Catalog" },
  { key: "engagements", label: "Engagements" },
  { key: "batches", label: "Batches" },
];

export default function BackupPage() {
  return (
    <>
      <PageHeader
        title="Backup & Restore"
        description="Export your data for safekeeping, or restore from a previous backup."
      />

      <div className="max-w-3xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Export JSON</h2>
          <p className="mb-4 text-sm text-slate-500">
            A complete backup of every vendor, client, trainer, training course,
            holiday, engagement, and batch — everything needed to fully restore
            your data.
          </p>
          <LinkButton href="/settings/backup/export" variant="secondary">
            <Download size={16} /> Export All Data (JSON)
          </LinkButton>
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Export CSV</h2>
          <p className="mb-4 text-sm text-slate-500">
            Export individual lists as CSV for spreadsheets or other tools.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CSV_ENTITIES.map((e) => (
              <LinkButton
                key={e.key}
                href={`/settings/backup/csv?entity=${e.key}`}
                variant="secondary"
                className="justify-start"
              >
                {e.label}
              </LinkButton>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Import JSON Backup</h2>
          <p className="mb-4 text-sm text-slate-500">
            Restore from a JSON file exported by this app.
          </p>
          <ImportBackupForm />
        </Card>
      </div>
    </>
  );
}
