import { cookies } from "next/headers";

export type DemoGroup = {
  id: string;
  name: string;
  activity: string;
  emoji: string | null;
  currency: string;
  description?: string | null;
  created_by?: string | null;
  created_at?: string;
};

const COOKIE_NAME = "gruply_demo_groups";
const MAX_GROUPS = 12;

function safeParse(raw: string | undefined): DemoGroup[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((g: any) => ({
        id: String(g?.id ?? ""),
        name: String(g?.name ?? "").slice(0, 50),
        activity: String(g?.activity ?? "otro").slice(0, 30),
        emoji: g?.emoji ? String(g.emoji).slice(0, 8) : "👥",
        currency: String(g?.currency ?? "EUR").slice(0, 8),
        description: g?.description ? String(g.description).slice(0, 140) : null,
        created_by: null,
        created_at: g?.created_at ? String(g.created_at) : new Date().toISOString(),
      }))
      .filter((g: DemoGroup) => g.id && g.name);
  } catch {
    return [];
  }
}

export async function readDemoGroups(): Promise<DemoGroup[]> {
  const store = await cookies();
  return safeParse(store.get(COOKIE_NAME)?.value);
}

export async function readDemoGroup(id: string): Promise<DemoGroup | null> {
  const groups = await readDemoGroups();
  return groups.find((g) => g.id === id) ?? null;
}

export async function addDemoGroup(input: {
  name: string;
  activity: string;
  emoji?: string | null;
  description?: string | null;
}) {
  const store = await cookies();
  const groups = safeParse(store.get(COOKIE_NAME)?.value);

  const group: DemoGroup = {
    id: crypto.randomUUID(),
    name: input.name,
    activity: input.activity || "otro",
    emoji: input.emoji || "👥",
    currency: "EUR",
    description: input.description || null,
    created_by: null,
    created_at: new Date().toISOString(),
  };

  const next = [group, ...groups.filter((g) => g.id !== group.id)].slice(0, MAX_GROUPS);

  store.set(COOKIE_NAME, JSON.stringify(next), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return group;
}
