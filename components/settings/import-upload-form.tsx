"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { uploadCalendarFile, type UploadResult } from "@/app/(app)/settings/import/actions";

export function ImportUploadForm() {
  const [state, formAction, pending] = useActionState<UploadResult, FormData>(
    uploadCalendarFile,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="file"
        name="file"
        accept=".xlsx"
        required
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
      />
      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Parsing…" : "Upload & Parse"}
      </Button>
    </form>
  );
}
