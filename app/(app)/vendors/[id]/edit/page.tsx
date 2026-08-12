import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { VendorForm } from "@/components/vendors/vendor-form";
import { updateVendor } from "@/app/(app)/vendors/actions";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!vendor) notFound();

  return (
    <>
      <PageHeader title={`Edit ${vendor.name}`} />
      <Card className="max-w-3xl p-6">
        <VendorForm
          vendor={vendor}
          action={updateVendor.bind(null, id)}
          cancelHref={`/vendors/${id}`}
        />
      </Card>
    </>
  );
}
