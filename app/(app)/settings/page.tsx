import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { SettingsForm } from "@/components/settings/settings-form";
import { InstallApp } from "@/components/pwa/install-app";
import { CalendarClock, DatabaseBackup, FileSpreadsheet } from "lucide-react";
import type { Settings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!settings) {
    const { data: created } = await supabase
      .from("settings")
      .insert({ owner_id: user.id })
      .select("*")
      .single();
    settings = created;
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure branding, working rules, statuses, and availability logic."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/settings/holidays" variant="secondary">
              <CalendarClock size={16} /> Manage Holidays
            </LinkButton>
            <LinkButton href="/settings/backup" variant="secondary">
              <DatabaseBackup size={16} /> Backup & Restore
            </LinkButton>
            <LinkButton href="/settings/import" variant="secondary">
              <FileSpreadsheet size={16} /> Excel Migration
            </LinkButton>
          </div>
        }
      />
      <div className="max-w-3xl space-y-6">
        <InstallApp />
        <Card className="p-6">
          <SettingsForm settings={settings as Settings} />
        </Card>
      </div>
    </>
  );
}
