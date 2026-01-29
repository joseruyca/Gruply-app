"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCompetitor, deleteCompetitor } from "@/lib/competitors/repo";

function uniq(xs: string[]) {
  return Array.from(new Set(xs.map(String).filter(Boolean)));
}

export async function createCompetitorAction(groupId: string, formData: FormData) {
  const type = String(formData.get("type") ?? "pair") as any;
  const name = String(formData.get("name") ?? "").trim();

  // pair: member_a + member_b
  const a = String(formData.get("member_a") ?? "").trim();
  const b = String(formData.get("member_b") ?? "").trim();

  // team: member_ids (multi-select)
  const memberIdsRaw = formData.getAll("member_ids").map((x) => String(x));
  const memberIds =
    type === "pair" ? uniq([a, b]) : uniq(memberIdsRaw);

  await createCompetitor({ groupId, type, name, memberIds } as any);

  revalidatePath(`/app/groups/${groupId}/competitors`);
  revalidatePath(`/app/groups/${groupId}`);
  redirect(`/app/groups/${groupId}/competitors?saved=1`);
}

export async function deleteCompetitorAction(groupId: string, competitorId: string) {
  await deleteCompetitor(groupId, competitorId);
  revalidatePath(`/app/groups/${groupId}/competitors`);
  revalidatePath(`/app/groups/${groupId}`);
  redirect(`/app/groups/${groupId}/competitors?deleted=1`);
}
