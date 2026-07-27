/**
 * Shape, defaults and helpers for the public homepage content.
 *
 * Kept out of app/api/homepage/route.ts because a Next route module may only
 * export its handlers and route config — exporting helpers from there makes
 * the whole route segment fail to build.
 */

export interface FeaturedUser {
  id: string;
  fullName: string;
  role: string;
  profileImageUrl: string | null;
  title: string;
}

export interface HomepageSettings {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    videoUrl: string;
    cta1Text: string;
    cta1Href: string;
    cta2Text: string;
    cta2Href: string;
    /** The tilted image collage beside the headline. Admin-uploaded. */
    images: Array<{ url: string; label: string }>;
  };
  stats: {
    visible: boolean;
    items: Array<{ label: string; value: string }>;
  };
  about: {
    visible: boolean;
    eyebrow: string;
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
    socials: Array<{ label: string; href: string }>;
  };
  valueProp: {
    visible: boolean;
    title: string;
    body: string;
  };
  differentiators: {
    visible: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Rendered as full-width alternating image / text rows. */
    items: Array<{
      eyebrow: string;
      title: string;
      description: string;
      imageUrl: string;
      linkText: string;
      href: string;
    }>;
  };
  programmes: {
    visible: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
    items: Array<{ title: string; description: string; imageUrl: string; href: string }>;
  };
  testimonials: {
    visible: boolean;
    eyebrow: string;
    title: string;
    items: Array<{ quote: string; name: string; role: string; avatarUrl: string }>;
  };
  packages: {
    visible: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{
      name: string;
      tagline: string;
      priceLabel: string;
      features: string[];
      popular: boolean;
      ctaText: string;
      ctaHref: string;
    }>;
  };
  faq: {
    visible: boolean;
    eyebrow: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
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
  /**
   * Per-locale text overrides, keyed by locale then by dot-path into this
   * object — e.g. { fr: { "hero.title": "…", "faq.items.0.question": "…" } }.
   *
   * Flat paths rather than a nested copy: the admin form and the public
   * resolver both stay trivial, and a path that no longer exists is simply
   * ignored instead of resurrecting a stale section. Anything missing or
   * blank falls back to the base (English) text.
   */
  translations: Record<string, Record<string, string>>;
}

export const DEFAULT_SETTINGS: HomepageSettings = {
  hero: {
    eyebrow: "Service Failure Refund Platform",
    title: "Every service failure, resolved on evidence.",
    subtitle:
      "A comprehensive platform for managing service claims, evaluating worker performance, and processing refunds with precision and transparency.",
    videoUrl: "",
    cta1Text: "Get Started",
    cta1Href: "/register",
    cta2Text: "Sign In",
    cta2Href: "/login",
    images: [
      { url: "", label: "Claims" },
      { url: "", label: "Evidence" },
      { url: "", label: "Refunds" },
    ],
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
    eyebrow: "Every problem. One team.",
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
    socials: [
      { label: "LinkedIn", href: "" },
      { label: "X", href: "" },
      { label: "Instagram", href: "" },
      { label: "Email", href: "" },
    ],
  },
  valueProp: {
    visible: true,
    title: "Built for accountability, not excuses.",
    body:
      "SSFRS exists because service failures happen — deadlines slip, work goes undelivered, trust breaks down. We built a platform where every claim is backed by evidence, every decision is auditable, and every refund is processed with the same rigor as the projects it protects.",
  },
  differentiators: {
    visible: true,
    eyebrow: "Every problem. One team.",
    title: "Whatever goes wrong, see it resolved fairly.",
    subtitle: "A refund process providers and workers can both trust.",
    items: [
      { eyebrow: "Evidence", title: "AI-Verified Evidence", description: "Every claim is checked against GPS-tagged photos, EXIF timestamps, and message history before a human ever reviews it.", imageUrl: "", linkText: "File a claim", href: "/register" },
      { eyebrow: "Funding", title: "Escrow-Backed Funding", description: "Provider funds are held in escrow the moment a project starts, so a valid refund is never blocked by a missing payment.", imageUrl: "", linkText: "How escrow works", href: "/register" },
      { eyebrow: "Evaluation", title: "Independent Evaluation", description: "Claims are decided by evaluators outside the provider–worker relationship, with AI-assisted mediation reports for context.", imageUrl: "", linkText: "Meet the process", href: "/register" },
      { eyebrow: "Accountability", title: "Full Audit Trail", description: "Every contract signature, status change, and refund decision is logged and available to admins in real time.", imageUrl: "", linkText: "See the trail", href: "/register" },
    ],
  },
  programmes: {
    visible: true,
    eyebrow: "How it works",
    title: "File it. We evaluate it. Resolved.",
    subtitle: "Every stage of a project, covered end to end.",
    ctaText: "Start your claim",
    ctaHref: "/register",
    items: [
      { title: "Claim Filing & Evidence", description: "Providers file structured claims with proof documents, ghost-project photos, and message evidence.", imageUrl: "", href: "/register" },
      { title: "AI Mediation", description: "AI-assisted analysis cross-checks evidence and produces a mediation report for evaluators.", imageUrl: "", href: "/register" },
      { title: "Contract Validation", description: "Digital contracts are signed by both parties and validated by admins before work begins.", imageUrl: "", href: "/register" },
      { title: "Refund Processing", description: "Approved claims move through a dedicated refund office with full status tracking.", imageUrl: "", href: "/register" },
    ],
  },
  testimonials: {
    visible: true,
    eyebrow: "Real people. Real projects.",
    title: "What Our Users Say",
    items: [
      { quote: "The evidence-based claim process meant we didn't have to argue back and forth — the photos and timestamps spoke for themselves.", name: "Project Provider", role: "Construction", avatarUrl: "" },
      { quote: "I could see exactly why a claim was decided the way it was. Nothing felt arbitrary.", name: "Skilled Worker", role: "Software Development", avatarUrl: "" },
      { quote: "Funds being held in escrow from day one changed how confidently we take on new workers.", name: "Project Provider", role: "Design & Creative", avatarUrl: "" },
    ],
  },
  packages: {
    visible: true,
    eyebrow: "Packages",
    title: "Pick your plan",
    subtitle: "Every project is quoted to your scope — no fixed menu, no surprises.",
    items: [
      {
        name: "Single Claim",
        tagline: "One dispute, resolved end to end.",
        priceLabel: "Custom quote",
        features: ["Structured claim filing", "AI evidence check", "Independent evaluation", "Refund processing"],
        popular: false,
        ctaText: "Get started",
        ctaHref: "/register",
      },
      {
        name: "Provider Account",
        tagline: "Every project, one accountable team.",
        priceLabel: "Custom quote",
        features: ["Unlimited claims", "Escrow-backed funding", "Digital contracts", "Full audit trail", "Priority evaluation"],
        popular: true,
        ctaText: "Get started",
        ctaHref: "/register",
      },
      {
        name: "Organisation",
        tagline: "Teams and institutions at scale.",
        priceLabel: "Custom quote",
        features: ["Multi-user access", "Custom reporting", "Dedicated refund office", "Compliance exports"],
        popular: false,
        ctaText: "Talk to us",
        ctaHref: "/register",
      },
    ],
  },
  faq: {
    visible: true,
    eyebrow: "Questions",
    title: "Frequently asked questions",
    items: [
      { question: "What does SSFRS actually do?", answer: "SSFRS manages the full lifecycle of a service failure — from filing a claim with evidence, through independent evaluation, to a processed refund." },
      { question: "How does the process work?", answer: "A provider files a claim with supporting evidence. Our AI cross-checks it, an independent evaluator decides, and the refund office processes the outcome." },
      { question: "Who can file a claim?", answer: "Registered project providers can file claims against work delivered on the platform. Workers are notified and can submit their own justification." },
      { question: "How long does a claim take?", answer: "Most claims move through evaluation within days. Every status change is logged so both parties can track progress in real time." },
      { question: "Do you work with organisations?", answer: "Yes. Organisations can run multiple users under one account with custom reporting and compliance exports." },
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
  translations: {},
};

/** Keys that hold a URL, an id or a flag — never translated. */
const NON_TRANSLATABLE_KEYS = new Set([
  "videoUrl", "imageUrl", "avatarUrl", "logoUrl", "url", "embedUrl",
  "href", "cta1Href", "cta2Href", "ctaHref",
  "email", "phone", "id", "role", "profileImageUrl",
]);

/** Sections whose contents come from the database, not the editor. */
const NON_TRANSLATABLE_PATHS = new Set(["providers.featured", "workers.featured", "translations"]);

/**
 * Every dot-path in the settings that holds translatable copy, in document
 * order. Derived from the object itself so a new field becomes translatable
 * the moment it exists — no second list to keep in sync.
 */
export function translatablePaths(value: unknown, prefix = ""): string[] {
  if (NON_TRANSLATABLE_PATHS.has(prefix)) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => translatablePaths(item, `${prefix}.${i}`));
  }
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, child]) =>
      NON_TRANSLATABLE_KEYS.has(key)
        ? []
        : translatablePaths(child, prefix ? `${prefix}.${key}` : key)
    );
  }
  return typeof value === "string" && value.trim() ? [prefix] : [];
}

export function getAtPath(root: unknown, path: string): string {
  let cur: unknown = root;
  for (const part of path.split(".")) {
    if (Array.isArray(cur)) cur = cur[Number(part)];
    else if (isPlainObject(cur)) cur = cur[part];
    else return "";
  }
  return typeof cur === "string" ? cur : "";
}

function setAtPath(root: unknown, path: string, value: string): void {
  const parts = path.split(".");
  let cur: unknown = root;
  for (const part of parts.slice(0, -1)) {
    if (Array.isArray(cur)) cur = cur[Number(part)];
    else if (isPlainObject(cur)) cur = cur[part];
    else return;
  }
  const last = parts[parts.length - 1];
  if (Array.isArray(cur)) cur[Number(last)] = value;
  else if (isPlainObject(cur)) cur[last] = value;
}

/**
 * Returns a copy of the settings with the given locale's overrides applied.
 * Blank or missing entries keep the base text, so a half-finished translation
 * renders as a mix rather than as holes.
 */
export function localizeSettings(
  settings: HomepageSettings,
  locale: string
): HomepageSettings {
  const overrides = settings.translations?.[locale];
  if (!overrides) return settings;

  const copy: HomepageSettings = JSON.parse(JSON.stringify(settings));
  for (const [path, text] of Object.entries(overrides)) {
    if (typeof text === "string" && text.trim()) setAtPath(copy, path, text);
  }
  return copy;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Completes stored settings against DEFAULT_SETTINGS.
 *
 * The backend keeps this whole object as one opaque JSON blob, so a row saved
 * before a field existed is missing it entirely. A shallow spread would leave
 * those keys `undefined` and crash the page, so objects merge recursively and
 * each array entry is completed from the first default entry as a template.
 */
export function withDefaults<T>(defaults: T, saved: unknown): T {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(saved)) return defaults;
    const template = defaults[0];
    if (!isPlainObject(template)) return saved as unknown as T;
    return saved.map((item) => withDefaults(template, item)) as unknown as T;
  }
  if (isPlainObject(defaults)) {
    if (!isPlainObject(saved)) return defaults;
    const out: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      out[key] = withDefaults((defaults as Record<string, unknown>)[key], saved[key]);
    }
    return out as T;
  }
  return (saved === undefined || saved === null ? defaults : saved) as T;
}
