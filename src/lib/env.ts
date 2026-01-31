// src/lib/env.ts

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

/**
 * Helpers para leer ENV de Supabase.
 * - Public: NEXT_PUBLIC_* (cliente)
 * - Server: SUPABASE_* (server). Si no existen, cae a NEXT_PUBLIC_* para dev.
 */

function clean(x: unknown) {
  return typeof x === "string" ? x.trim() : "";
}

function required(name: string, value: string) {
  if (!value) {
    throw new Error(
      `[ENV] Falta ${name}. Revisa .env.local (local) o Vercel → Settings → Environment Variables.`
    );
  }
  return value;
}

export function getSupabasePublicEnv(): SupabaseEnv {
  // En cliente, process.env.* existe por reemplazo de Next.
  // En server también existe, pero NO queremos romper el build si la ruta es dinámica.
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Validación “suave” en server (para no romper build/pre-render):
  if (typeof window === "undefined") {
    return { url, anonKey };
  }

  // Validación fuerte en cliente:
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", url),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey),
  };
}

export function getSupabaseServerEnv(): SupabaseEnv {
  // Recomendado para server: SUPABASE_URL / SUPABASE_ANON_KEY.
  // Si no existen (dev), cae a NEXT_PUBLIC_*.
  const url = clean(process.env.SUPABASE_URL) || clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey =
    clean(process.env.SUPABASE_ANON_KEY) || clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    url: required("SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL)", url),
    anonKey: required("SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)", anonKey),
  };
}
