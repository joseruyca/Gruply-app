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

  const group = await getGroupOrNull(groupId);
  if (!group) notFound();

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const userId = me.user?.id;

  if (userId) {
    const ok = await isMember(groupId);
    if (!ok) redirect("/app/groups");
  }

  let members = userId ? await getGroupMemberCount(groupId) : 1;
  if (!members || members < 1) members = 1;

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
