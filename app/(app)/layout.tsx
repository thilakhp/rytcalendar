import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("org_name")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <AppShell
      orgName={settings?.org_name ?? "RYT Global LLP"}
      userEmail={user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
