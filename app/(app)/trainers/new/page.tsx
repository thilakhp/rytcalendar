import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { TrainerForm } from "@/components/trainers/trainer-form";
import { createTrainer } from "@/app/(app)/trainers/actions";

export default function NewTrainerPage() {
  return (
    <>
      <PageHeader title="Add Trainer" />
      <Card className="max-w-3xl p-6">
        <TrainerForm action={createTrainer} cancelHref="/trainers" />
      </Card>
    </>
  );
}
