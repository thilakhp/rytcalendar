import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { TrainerForm } from "@/components/trainers/trainer-form";
import { updateTrainer } from "@/app/(app)/trainers/actions";

export default async function EditTrainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!trainer) notFound();

  return (
    <>
      <PageHeader title={`Edit ${trainer.name}`} />
      <Card className="max-w-3xl p-6">
        <TrainerForm
          trainer={trainer}
          action={updateTrainer.bind(null, id)}
          cancelHref="/trainers"
        />
      </Card>
    </>
  );
}
