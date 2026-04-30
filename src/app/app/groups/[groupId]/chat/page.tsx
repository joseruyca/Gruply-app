import { createClient } from "@/lib/supabase/server";
import { listGroupMessages } from "@/lib/chat/repo";
import ChatClient from "./ChatClient";

export default async function GroupChatPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const myId = me.user?.id ?? "";

  const { data: group } = await supabase
    .from("groups")
    .select("name,emoji")
    .eq("id", groupId)
    .maybeSingle();

  let messages: any[] = [];
  let errorMsg: string | null = null;

  try {
    messages = await listGroupMessages(groupId, 60);
  } catch (e: any) {
    // No rompemos la app si falta la tabla o el schema está desincronizado.
    errorMsg = e?.message ? String(e.message) : "Error cargando chat.";
    messages = [];
  }

  return (
    <div className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl pb-24">
      <ChatClient
        groupId={groupId}
        myId={myId}
        groupName={group?.name ?? "Chat"}
        groupEmoji={group?.emoji ?? null}
        initialMessages={messages as any}
        initialError={errorMsg}
      />
    </div>
  );
}
