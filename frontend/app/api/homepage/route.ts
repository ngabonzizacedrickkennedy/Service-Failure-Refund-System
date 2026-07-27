import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SETTINGS, withDefaults } from "@/lib/homepage";
import type { FeaturedUser, HomepageSettings } from "@/lib/homepage";

export const revalidate = 300; // cache this route for 5 minutes

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

async function fetchUsersFromBackend(role: string): Promise<FeaturedUser[]> {
  try {
    const res = await fetch(`${BACKEND}/api/home/users?role=${role}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/* ── GET – public homepage data ─────────────────────────────────────────── */
export async function GET() {
  /* 1. Load saved settings (or fall back to defaults) */
  let settings: HomepageSettings = { ...DEFAULT_SETTINGS };

  try {
    const res = await fetch(`${BACKEND}/api/home/settings`, { next: { revalidate: 300 } });
    if (res.ok) {
      settings = withDefaults(DEFAULT_SETTINGS, await res.json());
    }
  } catch {}

  /* 2. Always fetch ALL active providers and workers directly from DB */
  const [allProviders, allWorkers] = await Promise.all([
    fetchUsersFromBackend("PROVIDER"),
    fetchUsersFromBackend("WORKER"),
  ]);

  /*
   * 3. Decide what to display:
   *    – If admin has selected specific featured users → show only those (with fresh DB data)
   *    – If admin hasn't selected anyone          → show ALL from database
   */
  if (settings.providers.featured.length > 0) {
    const dbMap = new Map(allProviders.map((u) => [u.id, u]));
    settings.providers.featured = settings.providers.featured
      .map((f) => ({ ...f, ...(dbMap.get(f.id) ?? {}) }))
      .filter((f) => f.id);
  } else {
    settings.providers.featured = allProviders;
  }

  if (settings.workers.featured.length > 0) {
    const dbMap = new Map(allWorkers.map((u) => [u.id, u]));
    settings.workers.featured = settings.workers.featured
      .map((f) => ({ ...f, ...(dbMap.get(f.id) ?? {}) }))
      .filter((f) => f.id);
  } else {
    settings.workers.featured = allWorkers;
  }

  return NextResponse.json(settings);
}

/* ── POST – save settings to backend (admin only, JWT forwarded) ─────────── */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const body = await req.text();

  try {
    const res = await fetch(`${BACKEND}/api/home/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body,
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, status: res.status }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
