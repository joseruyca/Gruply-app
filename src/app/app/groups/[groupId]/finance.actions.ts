"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createExpenseWithDebts, markDebtPaid } from "@/lib/finance/repo";
import { getGroupOrNull } from "@/lib/groups/detail";
import { listGroupMembers } from "@/lib/groups/members";

function parseCents(amount: string) {
  const cleaned = amount.replace(",", ".").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function createExpenseAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = String(formData.get("amount") ?? "");
  const payerId = String(formData.get("payerId") ?? "");

  if (!groupId) redirect(`/error?m=${encodeURIComponent("groupId missing")}`);
  if (title.length < 2) redirect(`/error?m=${encodeURIComponent("Título demasiado corto")}`);
  const cents = parseCents(amount);
  if (!cents) redirect(`/error?m=${encodeURIComponent("Cantidad inválida")}`);
  if (!payerId) redirect(`/error?m=${encodeURIComponent("Pagador requerido")}`);

  // participants: all checked inputs named p_<userId> = on
  const members = await listGroupMembers(groupId);
  const participantIds = members
    .map((m) => m.user_id)
    .filter((uid) => formData.get("p_" + uid) === "on");

  if (participantIds.length === 0) redirect(`/error?m=${encodeURIComponent("Selecciona participantes")}`);

  const group = await getGroupOrNull(groupId);
  if (!group) redirect(`/error?m=${encodeURIComponent("Grupo no encontrado")}`);

  await createExpenseWithDebts({
    groupId,
    title,
    amount: cents / 100,
    payerId,
    participantIds,
  });

  revalidatePath(`/app/groups/${groupId}`);
  redirect(`/app/groups/${groupId}?tab=finance`);
}

export async function toggleDebtPaidAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const debtId = String(formData.get("debtId") ?? "");
  const next = String(formData.get("next") ?? "") === "paid";

  if (!groupId || !debtId) redirect(`/error?m=${encodeURIComponent("missing ids")}`);

  await markDebtPaid(debtId, next);

  revalidatePath(`/app/groups/${groupId}`);
  redirect(`/app/groups/${groupId}?tab=finance`);
}

