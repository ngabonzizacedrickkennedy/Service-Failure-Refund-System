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
  valueProp: {
    visible: boolean;
    title: string;
    body: string;
  };
  differentiators: {
    visible: boolean;
    title: string;
    subtitle: string;
    items: Array<{ title: string; description: string }>;
  };
  programmes: {
    visible: boolean;
    title: string;
    subtitle: string;
    items: Array<{ title: string; description: string; imageUrl: string; href: string }>;
  };
  testimonials: {
    visible: boolean;
    title: string;
    items: Array<{ quote: string; name: string; role: string }>;
  };
  partners: {
    visible: boolean;
    title: string;
    items: Array<{ name: string; logoUrl: string }>;
  };
  finalCta: {
    visible: boolean;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
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
  valueProp: {
    visible: true,
    title: "Built for accountability, not excuses.",
    body:
      "SSFRS exists because service failures happen — deadlines slip, work goes undelivered, trust breaks down. We built a platform where every claim is backed by evidence, every decision is auditable, and every refund is processed with the same rigor as the projects it protects.",
  },
  differentiators: {
    visible: true,
    title: "Why Choose SSFRS",
    subtitle: "A refund process providers and workers can both trust.",
    items: [
      { title: "AI-Verified Evidence", description: "Every claim is checked against GPS-tagged photos, EXIF timestamps, and message history before a human ever reviews it." },
      { title: "Escrow-Backed Funding", description: "Provider funds are held in escrow the moment a project starts, so a valid refund is never blocked by a missing payment." },
      { title: "Independent Evaluation", description: "Claims are decided by evaluators outside the provider–worker relationship, with AI-assisted mediation reports for context." },
      { title: "Full Audit Trail", description: "Every contract signature, status change, and refund decision is logged and available to admins in real time." },
    ],
  },
  programmes: {
    visible: true,
    title: "Our Modules",
    subtitle: "Every stage of a project, covered end to end.",
    items: [
      { title: "Claim Filing & Evidence", description: "Providers file structured claims with proof documents, ghost-project photos, and message evidence.", imageUrl: "", href: "/register" },
      { title: "AI Mediation", description: "AI-assisted analysis cross-checks evidence and produces a mediation report for evaluators.", imageUrl: "", href: "/register" },
      { title: "Contract Validation", description: "Digital contracts are signed by both parties and validated by admins before work begins.", imageUrl: "", href: "/register" },
      { title: "Refund Processing", description: "Approved claims move through a dedicated refund office with full status tracking.", imageUrl: "", href: "/register" },
    ],
  },
  testimonials: {
    visible: true,
    title: "What Our Users Say",
    items: [
      { quote: "The evidence-based claim process meant we didn't have to argue back and forth — the photos and timestamps spoke for themselves.", name: "Project Provider", role: "Construction" },
      { quote: "I could see exactly why a claim was decided the way it was. Nothing felt arbitrary.", name: "Skilled Worker", role: "Software Development" },
      { quote: "Funds being held in escrow from day one changed how confidently we take on new workers.", name: "Project Provider", role: "Design & Creative" },
    ],
  },
  partners: {
    visible: true,
    title: "Trusted By",
    items: [
      { name: "", logoUrl: "" },
      { name: "", logoUrl: "" },
      { name: "", logoUrl: "" },
      { name: "", logoUrl: "" },
      { name: "", logoUrl: "" },
      { name: "", logoUrl: "" },
    ],
  },
  finalCta: {
    visible: true,
    title: "Ready to protect every project?",
    subtitle: "Join providers and workers already using SSFRS to file, evaluate, and resolve service claims with full transparency.",
    ctaText: "Create your account",
    ctaHref: "/register",
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
      const saved: Partial<HomepageSettings> = await res.json();
      // Shallow-merge per section so rows saved before newer sections existed
      // (valueProp, differentiators, programmes, testimonials, partners, finalCta)
      // still fall back to defaults instead of crashing the public page.
      settings = { ...DEFAULT_SETTINGS, ...saved };
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
