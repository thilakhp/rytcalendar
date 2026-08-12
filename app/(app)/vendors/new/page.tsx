import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { VendorForm } from "@/components/vendors/vendor-form";
import { createVendor } from "@/app/(app)/vendors/actions";

export default function NewVendorPage() {
  return (
    <>
      <PageHeader title="Add Vendor" />
      <Card className="max-w-3xl p-6">
        <VendorForm action={createVendor} cancelHref="/vendors" />
      </Card>
    </>
  );
}
