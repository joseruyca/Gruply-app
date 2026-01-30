import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerEnv } from "@/lib/env";

export async function createClient() {
  const { url, anonKey } = getSupabaseServerEnv();

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // En Server Components puede fallar set cookies; en Routes sí funciona.
        }
      },
    },
  });
}
