import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { updateClientRecord } from "@/app/(app)/clients/actions";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  return (
    <>
      <PageHeader title={`Edit ${client.name}`} />
      <Card className="max-w-3xl p-6">
        <ClientForm
          client={client}
          action={updateClientRecord.bind(null, id)}
          cancelHref={`/clients/${id}`}
        />
      </Card>
    </>
  );
}
