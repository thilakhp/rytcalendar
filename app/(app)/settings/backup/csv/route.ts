import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import type { NextRequest } from "next/server";

const ALLOWED_TABLES = [
  "vendors",
  "clients",
  "trainers",
  "training_courses",
  "holidays",
  "engagements",
  "batches",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(value: string | null): value is AllowedTable {
  return !!value && (ALLOWED_TABLES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const entity = request.nextUrl.searchParams.get("entity");
  if (!isAllowedTable(entity)) {
    return new Response("Unknown entity", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase.from(entity).select("*");
  if (error) return new Response("Could not export data", { status: 500 });

  const csv = toCsv(data ?? []);
  const filename = `ryt-${entity}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
