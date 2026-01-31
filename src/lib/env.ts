function required(name: string, value: string | undefined) {
  const v = (value ?? "").trim();
  if (!v) {
    throw new Error(
      `[ENV] Falta ${name}. Revisa .env.local (local) o Vercel → Settings → Environment Variables.`
    );
  }
  return v;
}

// ✅ CLIENTE: no matamos el build, solo devolvemos strings y avisamos
export function getSupabasePublicEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !anonKey) {
    console.warn(
      "[ENV][client] Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "¿Reiniciaste `npm run dev` tras editar .env.local? ¿Hay Service Worker cacheado?"
    );
  }

  return { url, anonKey };
}

// ✅ SERVER: aquí sí exigimos y rompemos si falta
export function getSupabaseServerEnv() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return { url, anonKey };
}
