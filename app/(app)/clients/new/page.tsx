import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { createClientRecord } from "@/app/(app)/clients/actions";

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="Add Client" />
      <Card className="max-w-3xl p-6">
        <ClientForm action={createClientRecord} cancelHref="/clients" />
      </Card>
    </>
  );
}
