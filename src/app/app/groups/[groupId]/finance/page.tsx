import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  listGroupDebts,
  createExpenseWithDebts,
  markDebtPaid,
  listGroupEntries,
} from "@/lib/finance/repo";

import NewExpenseModal from "./NewExpenseModal";

function eurFromCents(cents: number) {
  const n = (Number(cents || 0) / 100).toFixed(2);
  return n.replace(".", ",") + " €";
}

function shortId(id: string) {
  return id.length > 10 ? id.slice(0, 8) + "…" : id;
}

export default async function GroupFinancePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const userId = me?.user?.id ?? null;

  // members
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId);

  const membersSafe: Array<{ user_id: string; role?: string }> = [
    ...(members ?? []),
  ];

  if (userId && !membersSafe.some((m) => m.user_id === userId)) {
    membersSafe.unshift({ user_id: userId, role: "admin" });
  }

  const memberOptions = membersSafe.map((m) => ({
    id: m.user_id,
    label: userId && m.user_id === userId ? "Yo" : shortId(m.user_id),
  }));

  const defaultPayerId = userId ?? memberOptions[0]?.id ?? "";

  const labelOf = (uid: string) => {
    if (userId && uid === userId) return "Yo";
    return shortId(uid);
  };

  const debts = await listGroupDebts(groupId);
  const entries = await listGroupEntries(groupId);

  async function createExpenseAction(formData: FormData) {
    "use server";

    const titleRaw = String(formData.get("title") ?? "");
    const title = titleRaw.replace(/\s+/g, " ").trim().slice(0, 80) || "Gasto";
    const safeTitle = title.length < 2 ? "Gasto" : title;

    const amountRaw = String(formData.get("amount") ?? "");
    const amount = Number(amountRaw.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Cantidad inválida");
    }

    const payer_id = String(formData.get("payer_id") ?? "") || (userId ?? "");
    if (!payer_id) throw new Error("Falta pagador");

    let participant_ids = formData
      .getAll("participant_ids")
      .map(String)
      .filter(Boolean);

    if (participant_ids.length === 0 && userId) participant_ids = [userId];
    if (participant_ids.length === 0) throw new Error("Selecciona participantes");

    await createExpenseWithDebts(
      {
        groupId,
        title: safeTitle,
        amount, // tu repo hace toCents internamente
        payerId: payer_id,
        participantIds: participant_ids,
      } as any
    );

    revalidatePath(`/app/groups/${groupId}/finance`);
    redirect(`/app/groups/${groupId}/finance?created=1`);
  }

  async function toggleDebtAction(formData: FormData) {
    "use server";
    const debtId = String(formData.get("debt_id") ?? "");
    const paid = String(formData.get("paid") ?? "") === "true";
    await markDebtPaid(debtId, paid);

    revalidatePath(`/app/groups/${groupId}/finance`);
    redirect(`/app/groups/${groupId}/finance`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Finanzas</h1>
        <Link className="text-sm text-slate-600 underline" href={`/app/groups/${groupId}`}>
          Volver
        </Link>
      </div>

      {/* CTA */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Acciones</div>
        <div className="mt-3">
          <NewExpenseModal
            action={createExpenseAction}
            defaultPayerId={defaultPayerId}
            members={memberOptions}
          />
        </div>
      </section>

      {/* Últimos gastos */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Últimos gastos</div>
        <div className="mt-3 grid gap-2">
          {(!entries || entries.length === 0) && (
            <div className="text-sm text-slate-500">Aún no hay gastos.</div>
          )}

          {(entries ?? []).map((e: any) => {
            const who = labelOf(e.payer_id);
            const cents = Number(e.amount_cents ?? 0);

            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{e.title}</div>
                  <div className="mt-1 text-xs text-slate-500">Pagó: {who}</div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-slate-900">
                  {eurFromCents(cents)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Deudas */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Deudas</div>
        <div className="mt-3 grid gap-2">
          {(!debts || debts.length === 0) && (
            <div className="text-sm text-slate-500">Sin deudas pendientes.</div>
          )}

          {(debts ?? []).map((d: any) => {
            const from = labelOf(d.from_user_id);
            const to = labelOf(d.to_user_id);
            const cents = Number(d.amount_cents ?? 0);

            return (
              <div key={d.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold">{from}</span> debe a{" "}
                    <span className="font-semibold">{to}</span>
                  </div>
                  <div className="shrink-0 text-sm font-semibold">
                    {eurFromCents(cents)}
                  </div>
                </div>

                <form action={toggleDebtAction} className="mt-2">
                  <input type="hidden" name="debt_id" value={d.id} />
                  <input type="hidden" name="paid" value={String(!d.paid)} />
                  <button className="text-xs underline text-slate-600">
                    {d.paid ? "Marcar como pendiente" : "Marcar como pagada"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
