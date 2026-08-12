"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importBackup, type ImportResult } from "@/app/(app)/settings/backup/actions";

export function ImportBackupForm() {
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleImport() {
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      startTransition(async () => {
        const res = await importBackup(text);
        setResult(res);
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p>
          Importing a backup will overwrite any existing records that share the
          same ID. This can&apos;t be undone — make sure this is the file you
          intend to restore.
        </p>
      </div>

      <input
        type="file"
        accept="application/json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
      />

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        I understand this may overwrite existing records with matching IDs.
      </label>

      <Button
        type="button"
        variant="danger"
        disabled={!file || !confirmed || isPending}
        onClick={handleImport}
      >
        {isPending ? "Importing…" : "Import Backup"}
      </Button>

      {result && "error" in result && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>
      )}
      {result && "success" in result && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Imported: {Object.entries(result.counts).map(([k, v]) => `${v} ${k}`).join(", ") || "nothing to import"}.
        </p>
      )}
    </div>
  );
}
