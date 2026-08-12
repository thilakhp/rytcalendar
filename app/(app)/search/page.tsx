import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

type ResultGroup = {
  title: string;
  results: { id: string; label: string; sublabel?: string; href: string }[];
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  let groups: ResultGroup[] = [];

  if (query) {
    const like = `%${query}%`;
    const [
      { data: vendors },
      { data: clients },
      { data: trainers },
      { data: courses },
      { data: engagements },
      { data: batches },
    ] = await Promise.all([
      supabase.from("vendors").select("id, name").ilike("name", like).limit(10),
      supabase.from("clients").select("id, name").ilike("name", like).limit(10),
      supabase.from("trainers").select("id, name").ilike("name", like).limit(10),
      supabase.from("training_courses").select("id, name").ilike("name", like).limit(10),
      supabase
        .from("engagements")
        .select("id, program_name, clients(name)")
        .ilike("program_name", like)
        .limit(10),
      query.length >= 4
        ? supabase
            .from("batches")
            .select("id, engagement_id, training_courses(name)")
            .ilike("id", `${query}%`)
            .limit(10)
            .returns<{ id: string; engagement_id: string; training_courses: { name: string } | null }[]>()
        : Promise.resolve({ data: [] as { id: string; engagement_id: string; training_courses: { name: string } | null }[] }),
    ]);

    groups = [
      {
        title: "Programs",
        results: (engagements ?? []).map((e) => ({
          id: e.id,
          label: e.program_name,
          sublabel: (e.clients as unknown as { name: string } | null)?.name,
          href: `/engagements/${e.id}`,
        })),
      },
      {
        title: "Training Catalog",
        results: (courses ?? []).map((c) => ({
          id: c.id,
          label: c.name,
          href: `/catalog/${c.id}/edit`,
        })),
      },
      {
        title: "Vendors",
        results: (vendors ?? []).map((v) => ({
          id: v.id,
          label: v.name,
          href: `/vendors/${v.id}`,
        })),
      },
      {
        title: "Clients",
        results: (clients ?? []).map((c) => ({
          id: c.id,
          label: c.name,
          href: `/clients/${c.id}`,
        })),
      },
      {
        title: "Trainers",
        results: (trainers ?? []).map((t) => ({
          id: t.id,
          label: t.name,
          href: `/trainers/${t.id}/edit`,
        })),
      },
      {
        title: "Batches",
        results: (batches ?? []).map((b) => ({
          id: b.id,
          label: b.training_courses?.name ?? "Batch",
          sublabel: b.id,
          href: `/engagements/${b.engagement_id}`,
        })),
      },
    ].filter((g) => g.results.length > 0);
  }

  return (
    <>
      <PageHeader title="Search" description={query ? `Results for "${query}"` : "Search across your entire workspace."} />

      {!query && (
        <Card className="px-6 py-16 text-center text-sm text-slate-500">
          Use the search bar above to find programs, training courses, vendors,
          clients, trainers, or a batch by ID.
        </Card>
      )}

      {query && groups.length === 0 && (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Search size={24} className="text-slate-300" />
          <p className="text-sm text-slate-500">No results for &quot;{query}&quot;.</p>
        </Card>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.title}
            </h2>
            <Card className="divide-y divide-slate-100">
              {group.results.map((r) => (
                <Link
                  key={r.id}
                  href={r.href}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{r.label}</span>
                  {r.sublabel && <span className="text-slate-400">{r.sublabel}</span>}
                </Link>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
