import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon,
  phase,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <Icon size={28} className="text-slate-300" />
        <p className="text-sm font-medium text-slate-500">{phase}</p>
      </Card>
    </>
  );
}
