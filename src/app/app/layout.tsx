import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppTabs from "@/components/nav/AppTabs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  return (
    <div className="mx-auto min-h-dvh max-w-xl md:max-w-2xl lg:max-w-5xl pb-20">
      {children}
      <AppTabs />
    </div>
  );
}