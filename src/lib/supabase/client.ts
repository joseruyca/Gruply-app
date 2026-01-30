import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

function parseDocumentCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const i = c.indexOf("=");
      const name = i >= 0 ? c.slice(0, i) : c;
      const value = i >= 0 ? c.slice(i + 1) : "";
      return { name: decodeURIComponent(name), value: decodeURIComponent(value) };
    });
}

function setCookie(
  name: string,
  value: string,
  options?: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
  }
) {
  if (typeof document === "undefined") return;

  const encName = encodeURIComponent(name);
  const encValue = encodeURIComponent(value);

  let cookie = `${encName}=${encValue}`;

  const path = options?.path ?? "/";
  cookie += `; Path=${path}`;

  if (options?.domain) cookie += `; Domain=${options.domain}`;
  if (typeof options?.maxAge === "number") cookie += `; Max-Age=${options.maxAge}`;
  if (options?.expires) cookie += `; Expires=${options.expires.toUTCString()}`;

  // OAuth redirects: Lax suele ser lo correcto
  const sameSite = options?.sameSite ?? "lax";
  cookie += `; SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`;

  // Si SameSite=None, Secure debe ir true
  const secure = options?.secure ?? (sameSite === "none");
  if (secure) cookie += `; Secure`;

  document.cookie = cookie;
}

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseDocumentCookies();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options as any);
        });
      },
    },
  });
}
