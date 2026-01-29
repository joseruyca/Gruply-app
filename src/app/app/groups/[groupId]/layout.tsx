import GroupShell from "./shell";
import { getGroupMemberCount, getGroupOrNull, isMember } from "@/lib/group/detail";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const userId = me.user?.id;

  // 1) Sin sesión -> fuera
  if (!userId) redirect("/login");

  // 2) El grupo existe?
  const group = await getGroupOrNull(groupId);
  if (!group) notFound();

  // 3) Eres miembro?
  const ok = await isMember(groupId);
  if (!ok) redirect("/app/groups");

  // 4) count
  const members = await getGroupMemberCount(groupId);

  return (
    <GroupShell
      groupId={groupId}
      groupName={group.name}
      activity={group.activity}
      emoji={group.emoji ?? ""}
      members={members}
    >
      {children}
    </GroupShell>
  );
}

