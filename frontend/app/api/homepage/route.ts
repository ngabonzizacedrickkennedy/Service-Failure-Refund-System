import { NextRequest, NextResponse } from "next/server";

export const revalidate = 300; // cache this route for 5 minutes

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export interface FeaturedUser {
  id: string;
  fullName: string;
  role: string;
  profileImageUrl: string | null;
  title: string;
}

export interface HomepageSettings {
  hero: {
    title: string;
    subtitle: string;
    videoUrl: string;
    cta1Text: string;
    cta1Href: string;
    cta2Text: string;
    cta2Href: string;
  };
  stats: {
    visible: boolean;
    items: Array<{ label: string; value: string }>;
  };
  about: {
    visible: boolean;
    title: string;
    description: string;
  };
  providers: {
    visible: boolean;
    title: string;
    subtitle: string;
    featured: FeaturedUser[];
  };
  workers: {
    visible: boolean;
    title: string;
    subtitle: string;
    featured: FeaturedUser[];
  };
  map: {
    visible: boolean;
    title: string;
    description: string;
    embedUrl: string;
    address: string;
  };
  footer: {
    description: string;
    email: string;
    phone: string;
    address: string;
  };
}

export const DEFAULT_SETTINGS: HomepageSettings = {
  hero: {
    title: "Service Failure Refund System",
    subtitle:
      "A comprehensive platform for managing service claims, evaluating worker performance, and processing refunds with precision and transparency.",
    videoUrl: "",
    cta1Text: "Get Started",
    cta1Href: "/register",
    cta2Text: "Sign In",
    cta2Href: "/login",
  },
  stats: {
    visible: true,
    items: [
      { label: "Service Providers", value: "500+" },
      { label: "Skilled Workers", value: "2,000+" },
      { label: "Claims Processed", value: "10,000+" },
      { label: "Success Rate", value: "98%" },
    ],
  },
  about: {
    visible: true,
    title: "Why Choose SSFRS?",
    description:
      "Our platform bridges the gap between service providers and skilled workers, ensuring transparent claim resolution and fair refund processing.",
  },
  providers: {
    visible: true,
    title: "Our Service Providers",
    subtitle: "Trusted organisations managing service projects on our platform.",
    featured: [],
  },
  workers: {
    visible: true,
    title: "Our Skilled Workers",
    subtitle: "Qualified professionals delivering quality service across every sector.",
    featured: [],
  },
  map: {
    visible: true,
    title: "Find Us",
    description:
      "We operate across Rwanda, connecting service providers and skilled workers nationwide.",
    embedUrl:
      "https://www.openstreetmap.org/export/embed.html?bbox=29.9%2C-2.0%2C30.2%2C-1.8&layer=mapnik&marker=-1.9441%2C30.0619",
    address: "Kigali, Rwanda",
  },
  footer: {
    description:
      "SSFRS provides a structured approach to service failure management, ensuring fair outcomes for all parties.",
    email: "info@ssfrs.rw",
    phone: "+250 788 000 000",
    address: "KG 11 Ave, Kigali, Rwanda",
  },
};

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
      const saved: HomepageSettings = await res.json();
      settings = saved;
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
    const featuredIds = new Set(settings.providers.featured.map((u) => u.id));
    const dbMap = new Map(allProviders.map((u) => [u.id, u]));
    settings.providers.featured = settings.providers.featured
      .map((f) => ({ ...f, ...(dbMap.get(f.id) ?? {}) }))
      .filter((f) => f.id);
  } else {
    settings.providers.featured = allProviders;
  }

  if (settings.workers.featured.length > 0) {
    const featuredIds = new Set(settings.workers.featured.map((u) => u.id));
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
