import Link from "next/link";
import { sendReset, resendConfirm } from "./actions";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string; resent?: string }> }) {
  const sp = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl md:max-w-2xl lg:max-w-5xl flex-col px-5 py-10">
      <h1 className="text-2xl font-bold">Recuperar acceso</h1>
      <p className="mt-2 text-sm text-slate-600">Usa tu mismo email. Te enviamos un enlace.</p>

      {(sp.sent === "1") && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Enlace de restablecimiento enviado. Revisa tu email.
        </div>
      )}

      {(sp.resent === "1") && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Confirmación reenviada. Revisa tu email.
        </div>
      )}

      <form className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required className="h-11 rounded-2xl border border-slate-200 bg-white px-3" />
        </label>

        <button formAction={sendReset} className="mt-2 h-11 rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">
          Enviar enlace para nueva contraseña
        </button>

        <button formAction={resendConfirm} className="h-11 rounded-2xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50">
          Reenviar email de confirmación
        </button>

        <Link className="mt-3 text-sm font-semibold text-emerald-600 underline" href="/login">
          Volver a login
        </Link>
      </form>
    </main>
  );
}