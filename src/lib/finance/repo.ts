import { createClient } from "@/lib/supabase/server";

function toCents(x: any): number {
  const n = typeof x === "number" ? x : Number(String(x ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export type DebtRow = {
  id: string;
  amount_cents: number;
  status: "open" | "paid";
  debtor_id: string;
  creditor_id: string;
  entry_id: string;
  title: string;
  created_at: string;
  debtor_name: string | null;
  creditor_name: string | null;
};

export async function listGroupDebts(groupId: string): Promise<DebtRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("finance_debts")
    .select(
      `
      id, amount_cents, status, debtor_id, creditor_id, entry_id, created_at,
      finance_entries:finance_entries(title),
      debtor:profiles!finance_debts_debtor_id_fkey(full_name),
      creditor:profiles!finance_debts_creditor_id_fkey(full_name)
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    amount_cents: r.amount_cents,
    status: r.status,
    debtor_id: r.debtor_id,
    creditor_id: r.creditor_id,
    entry_id: r.entry_id,
    title: r.finance_entries?.title ?? "",
    created_at: r.created_at,
    debtor_name: r.debtor?.full_name ?? null,
    creditor_name: r.creditor?.full_name ?? null,
  })) as DebtRow[];
}

export type FinanceEntryRow = {
  id: string;
  group_id: string;
  title: string;
  amount_cents: number;
  payer_id: string;
  created_at: string;
};

export async function listGroupEntries(groupId: string): Promise<FinanceEntryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_entries")
    .select("id,group_id,title,amount_cents,payer_id,created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as any;
}

/**
 * Crea:
 * - 1 fila en finance_entries
 * - N filas en finance_entry_participants
 * - deudas en finance_debts (cada participante debe su parte al payer)
 *
 * input.amount viene en euros (number). Aquí lo convertimos a cents.
 */
export async function createExpenseWithDebts(input: {
  groupId: string;
  title: string;
  amount: number; // euros
  payerId: string;
  participantIds: string[];
}) {
  const supabase = await createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("not_authenticated");

  const amountCents = toCents(input.amount);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Cantidad inválida");
  }

  const payerId = String(input.payerId || "").trim();
  if (!payerId) throw new Error("Falta pagador");

  const parts = Array.from(
    new Set((input.participantIds ?? []).map((x) => String(x).trim()).filter(Boolean))
  );

  if (parts.length === 0) throw new Error("Selecciona participantes");

  // Asegura que el pagador está dentro de participantes (para repartir bien)
  if (!parts.includes(payerId)) parts.unshift(payerId);

  // 1) Insert entry (OJO: amount_cents NOT NULL)
  const { data: entry, error: e1 } = await supabase
    .from("finance_entries")
    .insert({
      group_id: input.groupId,
      title: input.title,
      amount_cents: amountCents,
      payer_id: payerId,
      currency: "EUR",
      created_by: uid,
    })
    .select("id")
    .single();

  if (e1) throw new Error(e1.message);

  const entryId = entry.id as string;

  // 2) participants rows
  const { error: e2 } = await supabase.from("finance_entry_participants").insert(
    parts.map((pid) => ({
      entry_id: entryId,
      user_id: pid,
    }))
  );
  if (e2) throw new Error(e2.message);

  // 3) compute debts: split equally among participants
  const n = parts.length;
  const base = Math.floor(amountCents / n);
  let rem = amountCents - base * n;

  const shares = parts.map((pid) => {
    const extra = rem > 0 ? 1 : 0;
    if (rem > 0) rem -= 1;
    return { pid, cents: base + extra };
  });

  const debts = shares
    .filter((s) => s.pid !== payerId && s.cents > 0)
    .map((s) => ({
      entry_id: entryId,
      group_id: input.groupId,
      debtor_id: s.pid,
      creditor_id: payerId,
      amount_cents: s.cents,
      status: "open" as const,
    }));

  if (debts.length > 0) {
    const { error: e3 } = await supabase.from("finance_debts").insert(debts);
    if (e3) throw new Error(e3.message);
  }

  return entryId;
}

export async function markDebtPaid(debtId: string, paid: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("finance_debts")
    .update({
      status: paid ? "paid" : "open",
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", debtId);

  if (error) throw new Error(error.message);
}

export async function myUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
