"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Save, Eye, Video, BarChart2, Users, MapPin, FileText,
  RefreshCw, CheckCircle, Globe, Image as ImageIcon,
  ChevronRight, X, Search, Briefcase, HardHat,
  Quote, Sparkles, LayoutGrid, MessageSquareQuote, Handshake, Megaphone,
  Package, HelpCircle, Plus, Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { userService, type UserProfile } from "@/lib/userService";
import api from "@/lib/api";
import { DEFAULT_SETTINGS } from "@/app/api/homepage/route";
import type { HomepageSettings, FeaturedUser } from "@/app/api/homepage/route";

/* ─── Defaults ─────────────────────────────────────────────
   Re-uses the public route's defaults so the editor and the live page can
   never disagree about the shape of a section. */
const DEFAULT: HomepageSettings = DEFAULT_SETTINGS;

type Tab = "hero" | "valueProp" | "stats" | "differentiators" | "programmes" | "providers" | "workers" | "testimonials" | "packages" | "faq" | "partners" | "map" | "finalCta" | "footer";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "hero", label: "Hero & Video", icon: <Video style={{ width: 16, height: 16 }} /> },
  { id: "valueProp", label: "Value Proposition", icon: <Quote style={{ width: 16, height: 16 }} /> },
  { id: "stats", label: "Statistics", icon: <BarChart2 style={{ width: 16, height: 16 }} /> },
  { id: "differentiators", label: "Why Choose Us", icon: <Sparkles style={{ width: 16, height: 16 }} /> },
  { id: "programmes", label: "Modules", icon: <LayoutGrid style={{ width: 16, height: 16 }} /> },
  { id: "providers", label: "Providers", icon: <Briefcase style={{ width: 16, height: 16 }} /> },
  { id: "workers", label: "Workers", icon: <HardHat style={{ width: 16, height: 16 }} /> },
  { id: "testimonials", label: "Testimonials", icon: <MessageSquareQuote style={{ width: 16, height: 16 }} /> },
  { id: "packages", label: "Packages", icon: <Package style={{ width: 16, height: 16 }} /> },
  { id: "faq", label: "FAQ", icon: <HelpCircle style={{ width: 16, height: 16 }} /> },
  { id: "partners", label: "Partners", icon: <Handshake style={{ width: 16, height: 16 }} /> },
  { id: "map", label: "Map & Contact", icon: <MapPin style={{ width: 16, height: 16 }} /> },
  { id: "finalCta", label: "Closing CTA", icon: <Megaphone style={{ width: 16, height: 16 }} /> },
  { id: "footer", label: "Footer", icon: <FileText style={{ width: 16, height: 16 }} /> },
];

/* ─── Helpers ────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "0.6rem 0.875rem", borderRadius: 9,
        border: "1.5px solid var(--color-border)", fontSize: "0.875rem",
        backgroundColor: "var(--color-background)", color: "var(--color-foreground)",
        outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#5B4FE5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91,79,229,0.12)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "0.6rem 0.875rem", borderRadius: 9,
        border: "1.5px solid var(--color-border)", fontSize: "0.875rem",
        backgroundColor: "var(--color-background)", color: "var(--color-foreground)",
        outline: "none", resize: "vertical", lineHeight: 1.6,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#5B4FE5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91,79,229,0.12)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
          backgroundColor: checked ? "#5B4FE5" : "var(--color-border)",
          position: "relative", transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff",
          transition: "left 0.2s", display: "block",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
      <span style={{ fontSize: "0.875rem", color: "var(--color-foreground)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ─── Single-image uploader (S3, path-addressed) ────────────── */
function ImageUploadField({ path, url, onUploaded, onRemoved, label, aspect = "16/10" }: {
  path: string; url: string; onUploaded: (url: string) => void; onRemoved: () => void; label: string; aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const form = new FormData();
      form.append("file", file);
      form.append("path", path);
      const res = await fetch("/api/homepage/image", {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.url);
      toast.success("Image uploaded to S3.");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Image upload failed.");
    }
    setUploading(false);
  };

  const remove = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      await fetch(`/api/homepage/image?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      onRemoved();
      toast.success("Image removed.");
    } catch {
      toast.error("Failed to remove image.");
    }
  };

  return (
    <div>
      <input
        ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
      {url ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--color-border)", aspectRatio: aspect, backgroundColor: "var(--color-neutral-100)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <button type="button" onClick={remove}
            style={{ position: "absolute", top: 6, right: 6, padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: 10, fontWeight: 700, backgroundColor: "rgba(239,68,68,0.92)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
            <X style={{ width: 10, height: 10 }} /> Remove
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ width: "100%", aspectRatio: aspect, borderRadius: 10, border: "1.5px dashed var(--color-border)", backgroundColor: "var(--color-neutral-50)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: uploading ? "not-allowed" : "pointer", color: "var(--color-muted-foreground)" }}>
          {uploading ? (
            <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "#5B4FE5", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <>
              <ImageIcon style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", padding: "0 0.5rem" }}>{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ─── User selection card ────────────────────────────────── */
function UserCard({
  user, selected, onToggle,
}: {
  user: UserProfile & { title?: string };
  selected: boolean;
  onToggle: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const initial = user.fullName?.charAt(0).toUpperCase() || "U";
  const isProvider = user.role === "PROVIDER";
  const accent = "#5B4FE5";
  const bg = "#EEF2FF";

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={onToggle}
      style={{
        position: "relative", cursor: "pointer", borderRadius: 14,
        padding: "1.125rem", textAlign: "center",
        border: selected ? `2px solid ${accent}` : "1.5px solid var(--color-border)",
        backgroundColor: selected ? `${accent}08` : "var(--color-card)",
        transition: "border-color 0.15s, background 0.15s",
        boxShadow: selected ? `0 0 0 3px ${accent}18` : "var(--shadow-sm)",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 20, height: 20, borderRadius: "50%",
          backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: "#fff" }} />
        </div>
      )}
      <div style={{
        width: 56, height: 56, borderRadius: "50%", overflow: "hidden", margin: "0 auto 0.625rem",
        border: `2px solid ${selected ? accent : "var(--color-border)"}40`,
        backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {user.profileImageUrl && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profileImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgErr(true)} />
        ) : (
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: accent }}>{initial}</span>
        )}
      </div>
      <p style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--color-foreground)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.fullName}</p>
      {user.email && <p style={{ fontSize: 10, color: "var(--color-muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>}
      <span style={{
        display: "inline-block", marginTop: 6, fontSize: 9, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.07em",
        padding: "2px 8px", borderRadius: 999,
        backgroundColor: selected ? `${accent}18` : bg, color: accent,
      }}>
        {isProvider ? "Provider" : "Worker"}
      </span>
    </motion.div>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function HomeControllerPage() {
  const [tab, setTab] = useState<Tab>("hero");
  const [settings, setSettings] = useState<HomepageSettings>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  /* users */
  const [allUsers, setAllUsers] = useState<(UserProfile & { title?: string })[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");

  /* Load settings */
  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  /* Load all users */
  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true);
      try {
        const res = await api.get<{ id: string; active: boolean; locked: boolean }[]>("/api/admin/users");
        const ids = res.data.map((u) => u.id);
        const profiles = await Promise.allSettled(ids.map((id) => userService.getUser(id)));
        const users: (UserProfile & { title?: string })[] = profiles
          .filter((p): p is PromiseFulfilledResult<UserProfile> => p.status === "fulfilled")
          .map((p) => p.value)
          .filter((u) => u.role === "PROVIDER" || u.role === "WORKER");
        setAllUsers(users);
      } catch {}
      setLoadingUsers(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch("/api/homepage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      toast.success("Homepage saved to database successfully.");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Failed to save changes.");
    }
    setSaving(false);
  };

  const uploadVideo = async (file: File) => {
    setVideoUploading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/homepage/video", {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setVideoPreviewUrl(data.url);
      setSelectedVideoFile(null);
      toast.success("Video uploaded to S3 successfully.");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Video upload failed.");
    }
    setVideoUploading(false);
  };

  const removeVideo = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      await fetch("/api/homepage/video", {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setVideoPreviewUrl("");
      setHero({ videoUrl: "" });
      toast.success("Video removed.");
    } catch {
      toast.error("Failed to remove video.");
    }
  };

  const setHero = (patch: Partial<HomepageSettings["hero"]>) =>
    setSettings((s) => ({ ...s, hero: { ...s.hero, ...patch } }));

  const setAbout = (patch: Partial<HomepageSettings["about"]>) =>
    setSettings((s) => ({ ...s, about: { ...s.about, ...patch } }));

  const setMap = (patch: Partial<HomepageSettings["map"]>) =>
    setSettings((s) => ({ ...s, map: { ...s.map, ...patch } }));

  const setFooter = (patch: Partial<HomepageSettings["footer"]>) =>
    setSettings((s) => ({ ...s, footer: { ...s.footer, ...patch } }));

  const setStat = (i: number, patch: Partial<{ label: string; value: string }>) =>
    setSettings((s) => {
      const items = [...s.stats.items];
      items[i] = { ...items[i], ...patch };
      return { ...s, stats: { ...s.stats, items } };
    });

  const setValueProp = (patch: Partial<HomepageSettings["valueProp"]>) =>
    setSettings((s) => ({ ...s, valueProp: { ...s.valueProp, ...patch } }));

  const setDifferentiators = (patch: Partial<Omit<HomepageSettings["differentiators"], "items">>) =>
    setSettings((s) => ({ ...s, differentiators: { ...s.differentiators, ...patch } }));

  const setDifferentiatorItem = (i: number, patch: Partial<HomepageSettings["differentiators"]["items"][number]>) =>
    setSettings((s) => {
      const items = [...s.differentiators.items];
      items[i] = { ...items[i], ...patch };
      return { ...s, differentiators: { ...s.differentiators, items } };
    });

  const setProgrammes = (patch: Partial<Omit<HomepageSettings["programmes"], "items">>) =>
    setSettings((s) => ({ ...s, programmes: { ...s.programmes, ...patch } }));

  const setProgrammeItem = (i: number, patch: Partial<HomepageSettings["programmes"]["items"][number]>) =>
    setSettings((s) => {
      const items = [...s.programmes.items];
      items[i] = { ...items[i], ...patch };
      return { ...s, programmes: { ...s.programmes, items } };
    });

  const setTestimonials = (patch: Partial<Omit<HomepageSettings["testimonials"], "items">>) =>
    setSettings((s) => ({ ...s, testimonials: { ...s.testimonials, ...patch } }));

  const setTestimonialItem = (i: number, patch: Partial<HomepageSettings["testimonials"]["items"][number]>) =>
    setSettings((s) => {
      const items = [...s.testimonials.items];
      items[i] = { ...items[i], ...patch };
      return { ...s, testimonials: { ...s.testimonials, items } };
    });

  const setPartners = (patch: Partial<Pick<HomepageSettings["partners"], "visible" | "title">>) =>
    setSettings((s) => ({ ...s, partners: { ...s.partners, ...patch } }));

  const setPartnerItem = (i: number, patch: Partial<{ name: string; logoUrl: string }>) =>
    setSettings((s) => {
      const items = [...s.partners.items];
      items[i] = { ...items[i], ...patch };
      return { ...s, partners: { ...s.partners, items } };
    });

  const setFinalCta = (patch: Partial<HomepageSettings["finalCta"]>) =>
    setSettings((s) => ({ ...s, finalCta: { ...s.finalCta, ...patch } }));

  const setHeroImage = (i: number, patch: Partial<{ url: string; label: string }>) =>
    setSettings((s) => {
      const images = [...s.hero.images];
      images[i] = { ...images[i], ...patch };
      return { ...s, hero: { ...s.hero, images } };
    });

  const setPackages = (patch: Partial<Pick<HomepageSettings["packages"], "visible" | "eyebrow" | "title" | "subtitle">>) =>
    setSettings((s) => ({ ...s, packages: { ...s.packages, ...patch } }));

  const setPackageItem = (i: number, patch: Partial<HomepageSettings["packages"]["items"][number]>) =>
    setSettings((s) => {
      const items = [...s.packages.items];
      items[i] = { ...items[i], ...patch };
      return { ...s, packages: { ...s.packages, items } };
    });

  const setFaq = (patch: Partial<Pick<HomepageSettings["faq"], "visible" | "eyebrow" | "title">>) =>
    setSettings((s) => ({ ...s, faq: { ...s.faq, ...patch } }));

  const setFaqItem = (i: number, patch: Partial<{ question: string; answer: string }>) =>
    setSettings((s) => {
      const items = [...s.faq.items];
      items[i] = { ...items[i], ...patch };
      return { ...s, faq: { ...s.faq, items } };
    });

  const addFaqItem = () =>
    setSettings((s) => ({ ...s, faq: { ...s.faq, items: [...s.faq.items, { question: "", answer: "" }] } }));

  const removeFaqItem = (i: number) =>
    setSettings((s) => ({ ...s, faq: { ...s.faq, items: s.faq.items.filter((_, x) => x !== i) } }));

  const setSocial = (i: number, patch: Partial<{ label: string; href: string }>) =>
    setSettings((s) => {
      const socials = [...s.footer.socials];
      socials[i] = { ...socials[i], ...patch };
      return { ...s, footer: { ...s.footer, socials } };
    });

  const toggleFeatured = useCallback((user: UserProfile, sectionKey: "providers" | "workers") => {
    setSettings((s) => {
      const feat = s[sectionKey].featured;
      const exists = feat.some((f) => f.id === user.id);
      const next: FeaturedUser[] = exists
        ? feat.filter((f) => f.id !== user.id)
        : [...feat, { id: user.id, fullName: user.fullName, role: user.role, profileImageUrl: user.profileImageUrl, title: "" }];
      return { ...s, [sectionKey]: { ...s[sectionKey], featured: next } };
    });
  }, []);

  const providers = allUsers.filter((u) => u.role === "PROVIDER");
  const workers = allUsers.filter((u) => u.role === "WORKER");
  const filteredUsers = (list: typeof allUsers) => list.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const CARD: React.CSSProperties = {
    backgroundColor: "var(--color-card)", borderRadius: 14,
    border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "1.5rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1100 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ color: "var(--color-foreground)", fontWeight: 800, letterSpacing: "-0.02em" }}>Home Controller</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-muted-foreground)", marginTop: 2 }}>
            Edit every section of the public homepage.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.55rem 1rem", borderRadius: 9, fontSize: "0.8125rem", fontWeight: 600,
              border: "1.5px solid var(--color-border)", color: "var(--color-foreground)",
              textDecoration: "none", transition: "background 0.15s",
              backgroundColor: "var(--color-card)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-neutral-100)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-card)")}
          >
            <Eye style={{ width: 14, height: 14 }} />
            Preview
          </a>
          <button
            onClick={save}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.55rem 1.25rem", borderRadius: 9, fontSize: "0.8125rem", fontWeight: 700,
              border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer",
              background: saved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#5B4FE5",
              transition: "background 0.3s, opacity 0.15s",
            }}
          >
            {saving ? (
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
            ) : saved ? <CheckCircle style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 1rem", borderRadius: 9, fontSize: "0.8125rem", fontWeight: 600,
              border: tab === t.id ? "1.5px solid #5B4FE5" : "1.5px solid var(--color-border)",
              backgroundColor: tab === t.id ? "#EEF2FF" : "var(--color-card)",
              color: tab === t.id ? "#5B4FE5" : "var(--color-muted-foreground)",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* HERO */}
      {tab === "hero" && (
        <motion.div key="hero" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={CARD}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1.25rem" }}>Hero Section</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Field label="Eyebrow (small label above the headline)"><Input value={settings.hero.eyebrow} onChange={(v) => setHero({ eyebrow: v })} placeholder="Service Failure Refund Platform" /></Field>
              <Field label="Headline"><Input value={settings.hero.title} onChange={(v) => setHero({ title: v })} placeholder="Service Failure Refund System" /></Field>
              <Field label="Subtitle"><Textarea value={settings.hero.subtitle} onChange={(v) => setHero({ subtitle: v })} rows={3} /></Field>
            </div>
          </div>

          <div style={CARD}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "0.35rem" }}>Hero Image Collage</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-muted-foreground)", marginBottom: "1.25rem" }}>
              Three overlapping photos beside the headline. The caption becomes the pill label on the image.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
              {settings.hero.images.map((img, i) => (
                <div key={i} style={{ padding: "1.125rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <ImageUploadField
                    path={`hero.images.${i}.url`}
                    url={img.url}
                    onUploaded={(url) => setHeroImage(i, { url })}
                    onRemoved={() => setHeroImage(i, { url: "" })}
                    label={`Upload image ${i + 1}`}
                  />
                  <Field label="Caption"><Input value={img.label} onChange={(v) => setHeroImage(i, { label: v })} placeholder="Claims" /></Field>
                </div>
              ))}
            </div>
          </div>

          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>
                Video Background — S3 Bucket: <span style={{ color: "#5B4FE5" }}>service-refund (eu-north-1)</span>
              </p>
            </div>

            {/* Hidden file input — triggered by the button below */}
            <input
              ref={videoFileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setSelectedVideoFile(f);
                /* reset so same file can be re-selected */
                e.target.value = "";
              }}
            />

            {/* Video preview (after successful upload or already saved) */}
            {(videoPreviewUrl || settings.hero.videoUrl) && (
              <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", marginBottom: "1rem", position: "relative" }}>
                <video
                  src={videoPreviewUrl || settings.hero.videoUrl}
                  muted autoPlay loop playsInline
                  style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                />
                <button
                  onClick={removeVideo}
                  style={{
                    position: "absolute", top: 8, right: 8,
                    padding: "0.3rem 0.75rem", borderRadius: 7,
                    fontSize: 11, fontWeight: 700,
                    backgroundColor: "rgba(239,68,68,0.92)", color: "#fff",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <X style={{ width: 11, height: 11 }} /> Remove video
                </button>
              </div>
            )}

            {/* Step 1 – Choose file */}
            {!videoPreviewUrl && !settings.hero.videoUrl && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "1rem 1.25rem", borderRadius: 12,
                border: "1.5px solid var(--color-border)",
                backgroundColor: "var(--color-neutral-50)",
                marginBottom: "0.875rem",
              }}>
                <Video style={{ width: 20, height: 20, color: "var(--color-neutral-400)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-foreground)" }}>
                    {selectedVideoFile ? selectedVideoFile.name : "No video selected"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2 }}>
                    {selectedVideoFile
                      ? `${(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB — ready to upload`
                      : "MP4, WebM, MOV or AVI · max 200 MB"}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => videoFileRef.current?.click()}
                disabled={videoUploading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.6rem 1.125rem", borderRadius: 9, fontSize: "0.8125rem", fontWeight: 700,
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--color-card)", color: "var(--color-foreground)",
                  cursor: videoUploading ? "not-allowed" : "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!videoUploading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-neutral-100)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-card)"; }}
              >
                <Video style={{ width: 14, height: 14 }} />
                {videoPreviewUrl || settings.hero.videoUrl ? "Replace video" : "Choose video from computer"}
              </button>

              {selectedVideoFile && !videoPreviewUrl && !settings.hero.videoUrl && (
                <button
                  type="button"
                  onClick={() => { if (selectedVideoFile) uploadVideo(selectedVideoFile); }}
                  disabled={videoUploading}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.6rem 1.25rem", borderRadius: 9, fontSize: "0.8125rem", fontWeight: 700,
                    border: "none", color: "#fff",
                    background: videoUploading ? "var(--color-neutral-300)" : "#5B4FE5",
                    cursor: videoUploading ? "not-allowed" : "pointer",
                  }}
                >
                  {videoUploading ? (
                    <>
                      <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                      Uploading to S3…
                    </>
                  ) : (
                    <>
                      <Save style={{ width: 13, height: 13 }} />
                      Upload to S3
                    </>
                  )}
                </button>
              )}
            </div>

            <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: "0.625rem" }}>
              Video is stored in your <strong>service-refund</strong> S3 bucket (eu-north-1) and served with a fresh presigned URL on every homepage load.
            </p>
          </div>

          <div style={CARD}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1.25rem" }}>CTA Buttons</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-foreground)" }}>Primary Button</p>
                <Field label="Text"><Input value={settings.hero.cta1Text} onChange={(v) => setHero({ cta1Text: v })} /></Field>
                <Field label="Link"><Input value={settings.hero.cta1Href} onChange={(v) => setHero({ cta1Href: v })} placeholder="/register" /></Field>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-foreground)" }}>Secondary Button</p>
                <Field label="Text"><Input value={settings.hero.cta2Text} onChange={(v) => setHero({ cta2Text: v })} /></Field>
                <Field label="Link"><Input value={settings.hero.cta2Href} onChange={(v) => setHero({ cta2Href: v })} placeholder="/login" /></Field>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VALUE PROPOSITION */}
      {tab === "valueProp" && (
        <motion.div key="valueProp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Value Proposition — shown right below the hero</p>
            <Toggle checked={settings.valueProp.visible} onChange={(v) => setValueProp({ visible: v })} label="Visible" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="Eyebrow (small label above the headline)">
              <Input value={settings.about.eyebrow} onChange={(v) => setAbout({ eyebrow: v })} placeholder="Every problem. One team." />
            </Field>
            <Field label="Headline"><Input value={settings.valueProp.title} onChange={(v) => setValueProp({ title: v })} /></Field>
            <Field label="Body text"><Textarea value={settings.valueProp.body} onChange={(v) => setValueProp({ body: v })} rows={4} /></Field>
          </div>
        </motion.div>
      )}

      {/* STATS */}
      {tab === "stats" && (
        <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Statistics Section</p>
            <Toggle checked={settings.stats.visible} onChange={(v) => setSettings((s) => ({ ...s, stats: { ...s.stats, visible: v } }))} label="Visible on homepage" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {settings.stats.items.map((stat, i) => (
              <div key={i} style={{ padding: "1.125rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <Field label="Value (e.g. 500+)"><Input value={stat.value} onChange={(v) => setStat(i, { value: v })} placeholder="500+" /></Field>
                <Field label="Label"><Input value={stat.label} onChange={(v) => setStat(i, { label: v })} placeholder="Service Providers" /></Field>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* DIFFERENTIATORS */}
      {tab === "differentiators" && (
        <motion.div key="differentiators" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Why Choose Us — 4 pillars, shown with a compact preview of the hero video</p>
            <Toggle checked={settings.differentiators.visible} onChange={(v) => setDifferentiators({ visible: v })} label="Visible" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
            <Field label="Eyebrow"><Input value={settings.differentiators.eyebrow} onChange={(v) => setDifferentiators({ eyebrow: v })} /></Field>
            <Field label="Section Title"><Input value={settings.differentiators.title} onChange={(v) => setDifferentiators({ title: v })} /></Field>
            <Field label="Subtitle"><Input value={settings.differentiators.subtitle} onChange={(v) => setDifferentiators({ subtitle: v })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {settings.differentiators.items.map((item, i) => (
              <div key={i} style={{ padding: "1.125rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <ImageUploadField
                  path={`differentiators.items.${i}.imageUrl`}
                  url={item.imageUrl}
                  onUploaded={(url) => setDifferentiatorItem(i, { imageUrl: url })}
                  onRemoved={() => setDifferentiatorItem(i, { imageUrl: "" })}
                  label="Upload row image"
                />
                <Field label="Eyebrow"><Input value={item.eyebrow} onChange={(v) => setDifferentiatorItem(i, { eyebrow: v })} /></Field>
                <Field label="Title"><Input value={item.title} onChange={(v) => setDifferentiatorItem(i, { title: v })} /></Field>
                <Field label="Description"><Textarea value={item.description} onChange={(v) => setDifferentiatorItem(i, { description: v })} rows={3} /></Field>
                <Field label="Link text"><Input value={item.linkText} onChange={(v) => setDifferentiatorItem(i, { linkText: v })} placeholder="Learn more" /></Field>
                <Field label="Link URL"><Input value={item.href} onChange={(v) => setDifferentiatorItem(i, { href: v })} placeholder="/register" /></Field>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* PROGRAMMES / MODULES */}
      {tab === "programmes" && (
        <motion.div key="programmes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Modules — the platform&rsquo;s core workflow, shown as image tiles</p>
            <Toggle checked={settings.programmes.visible} onChange={(v) => setProgrammes({ visible: v })} label="Visible" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
            <Field label="Eyebrow"><Input value={settings.programmes.eyebrow} onChange={(v) => setProgrammes({ eyebrow: v })} /></Field>
            <Field label="Section Title"><Input value={settings.programmes.title} onChange={(v) => setProgrammes({ title: v })} /></Field>
            <Field label="Subtitle"><Input value={settings.programmes.subtitle} onChange={(v) => setProgrammes({ subtitle: v })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <Field label="Button text"><Input value={settings.programmes.ctaText} onChange={(v) => setProgrammes({ ctaText: v })} placeholder="Start your claim" /></Field>
              <Field label="Button link"><Input value={settings.programmes.ctaHref} onChange={(v) => setProgrammes({ ctaHref: v })} placeholder="/register" /></Field>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {settings.programmes.items.map((item, i) => (
              <div key={i} style={{ padding: "1.125rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <ImageUploadField
                  path={`programmes.items.${i}.imageUrl`}
                  url={item.imageUrl}
                  onUploaded={(url) => setProgrammeItem(i, { imageUrl: url })}
                  onRemoved={() => setProgrammeItem(i, { imageUrl: "" })}
                  label="Upload tile image"
                />
                <Field label="Title"><Input value={item.title} onChange={(v) => setProgrammeItem(i, { title: v })} /></Field>
                <Field label="Description"><Textarea value={item.description} onChange={(v) => setProgrammeItem(i, { description: v })} rows={2} /></Field>
                <Field label="Link"><Input value={item.href} onChange={(v) => setProgrammeItem(i, { href: v })} placeholder="/register" /></Field>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* PROVIDERS */}
      {tab === "providers" && (
        <motion.div key="providers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Providers Section</p>
              <Toggle checked={settings.providers.visible} onChange={(v) => setSettings((s) => ({ ...s, providers: { ...s.providers, visible: v } }))} label="Visible" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Field label="Section Title"><Input value={settings.providers.title} onChange={(v) => setSettings((s) => ({ ...s, providers: { ...s.providers, title: v } }))} /></Field>
              <Field label="Subtitle"><Input value={settings.providers.subtitle} onChange={(v) => setSettings((s) => ({ ...s, providers: { ...s.providers, subtitle: v } }))} /></Field>
            </div>
          </div>

          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Select Featured Providers</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-muted-foreground)", marginTop: 3 }}>
                  {settings.providers.featured.length} selected · Click a card to toggle
                </p>
              </div>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                  style={{ paddingLeft: 30, paddingRight: 10, paddingTop: "0.45rem", paddingBottom: "0.45rem", borderRadius: 8, border: "1.5px solid var(--color-border)", fontSize: "0.8125rem", backgroundColor: "var(--color-background)", color: "var(--color-foreground)", outline: "none", width: 200 }}
                />
              </div>
            </div>

            {loadingUsers ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>Loading providers…</div>
            ) : filteredUsers(providers).length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>No providers found.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
                {filteredUsers(providers).map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    selected={settings.providers.featured.some((f) => f.id === u.id)}
                    onToggle={() => toggleFeatured(u, "providers")}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* WORKERS */}
      {tab === "workers" && (
        <motion.div key="workers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Workers Section</p>
              <Toggle checked={settings.workers.visible} onChange={(v) => setSettings((s) => ({ ...s, workers: { ...s.workers, visible: v } }))} label="Visible" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Field label="Section Title"><Input value={settings.workers.title} onChange={(v) => setSettings((s) => ({ ...s, workers: { ...s.workers, title: v } }))} /></Field>
              <Field label="Subtitle"><Input value={settings.workers.subtitle} onChange={(v) => setSettings((s) => ({ ...s, workers: { ...s.workers, subtitle: v } }))} /></Field>
            </div>
          </div>

          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Select Featured Workers</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-muted-foreground)", marginTop: 3 }}>
                  {settings.workers.featured.length} selected · Click a card to toggle
                </p>
              </div>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                  style={{ paddingLeft: 30, paddingRight: 10, paddingTop: "0.45rem", paddingBottom: "0.45rem", borderRadius: 8, border: "1.5px solid var(--color-border)", fontSize: "0.8125rem", backgroundColor: "var(--color-background)", color: "var(--color-foreground)", outline: "none", width: 200 }}
                />
              </div>
            </div>

            {loadingUsers ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>Loading workers…</div>
            ) : filteredUsers(workers).length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>No workers found.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
                {filteredUsers(workers).map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    selected={settings.workers.featured.some((f) => f.id === u.id)}
                    onToggle={() => toggleFeatured(u, "workers")}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TESTIMONIALS */}
      {tab === "testimonials" && (
        <motion.div key="testimonials" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Testimonials</p>
            <Toggle checked={settings.testimonials.visible} onChange={(v) => setTestimonials({ visible: v })} label="Visible" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
            <Field label="Eyebrow"><Input value={settings.testimonials.eyebrow} onChange={(v) => setTestimonials({ eyebrow: v })} /></Field>
            <Field label="Section Title"><Input value={settings.testimonials.title} onChange={(v) => setTestimonials({ title: v })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {settings.testimonials.items.map((item, i) => (
              <div key={i} style={{ padding: "1.125rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div style={{ maxWidth: 96 }}>
                  <ImageUploadField
                    path={`testimonials.items.${i}.avatarUrl`}
                    url={item.avatarUrl}
                    onUploaded={(url) => setTestimonialItem(i, { avatarUrl: url })}
                    onRemoved={() => setTestimonialItem(i, { avatarUrl: "" })}
                    label="Photo"
                    aspect="1/1"
                  />
                </div>
                <Field label="Quote"><Textarea value={item.quote} onChange={(v) => setTestimonialItem(i, { quote: v })} rows={3} /></Field>
                <Field label="Name / label (e.g. Project Provider)"><Input value={item.name} onChange={(v) => setTestimonialItem(i, { name: v })} /></Field>
                <Field label="Sector / role"><Input value={item.role} onChange={(v) => setTestimonialItem(i, { role: v })} /></Field>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* PACKAGES */}
      {tab === "packages" && (
        <motion.div key="packages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Packages — pricing cards</p>
            <Toggle checked={settings.packages.visible} onChange={(v) => setPackages({ visible: v })} label="Visible" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
            <Field label="Eyebrow"><Input value={settings.packages.eyebrow} onChange={(v) => setPackages({ eyebrow: v })} /></Field>
            <Field label="Section Title"><Input value={settings.packages.title} onChange={(v) => setPackages({ title: v })} /></Field>
            <Field label="Subtitle"><Input value={settings.packages.subtitle} onChange={(v) => setPackages({ subtitle: v })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {settings.packages.items.map((item, i) => (
              <div key={i} style={{ padding: "1.125rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <Field label="Package name"><Input value={item.name} onChange={(v) => setPackageItem(i, { name: v })} /></Field>
                <Field label="Tagline"><Input value={item.tagline} onChange={(v) => setPackageItem(i, { tagline: v })} /></Field>
                <Field label="Price label"><Input value={item.priceLabel} onChange={(v) => setPackageItem(i, { priceLabel: v })} placeholder="Custom quote" /></Field>
                <Field label="Features — one per line">
                  <Textarea
                    value={item.features.join("\n")}
                    onChange={(v) => setPackageItem(i, { features: v.split("\n") })}
                    rows={5}
                  />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  <Field label="Button text"><Input value={item.ctaText} onChange={(v) => setPackageItem(i, { ctaText: v })} /></Field>
                  <Field label="Button link"><Input value={item.ctaHref} onChange={(v) => setPackageItem(i, { ctaHref: v })} placeholder="/register" /></Field>
                </div>
                <Toggle checked={item.popular} onChange={(v) => setPackageItem(i, { popular: v })} label="Most popular" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* FAQ */}
      {tab === "faq" && (
        <motion.div key="faq" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>FAQ — accordion</p>
            <Toggle checked={settings.faq.visible} onChange={(v) => setFaq({ visible: v })} label="Visible" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
            <Field label="Eyebrow"><Input value={settings.faq.eyebrow} onChange={(v) => setFaq({ eyebrow: v })} /></Field>
            <Field label="Section Title"><Input value={settings.faq.title} onChange={(v) => setFaq({ title: v })} /></Field>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {settings.faq.items.map((item, i) => (
              <div key={i} style={{ padding: "1.125rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.625rem" }}>
                  <div style={{ flex: 1 }}>
                    <Field label={`Question ${i + 1}`}><Input value={item.question} onChange={(v) => setFaqItem(i, { question: v })} /></Field>
                  </div>
                  <button type="button" onClick={() => removeFaqItem(i)} title="Remove question"
                    style={{ padding: "0.6rem", borderRadius: 9, border: "1.5px solid var(--color-border)", background: "var(--color-card)", color: "#ef4444", cursor: "pointer", display: "flex" }}>
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                </div>
                <Field label="Answer"><Textarea value={item.answer} onChange={(v) => setFaqItem(i, { answer: v })} rows={3} /></Field>
              </div>
            ))}
          </div>
          <button type="button" onClick={addFaqItem}
            style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.55rem 1rem", borderRadius: 9, fontSize: "0.8125rem", fontWeight: 600, border: "1.5px dashed var(--color-border)", background: "transparent", color: "var(--color-foreground)", cursor: "pointer" }}>
            <Plus style={{ width: 14, height: 14 }} /> Add question
          </button>
        </motion.div>
      )}

      {/* PARTNERS */}
      {tab === "partners" && (
        <motion.div key="partners" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>
              Partners — leave a slot blank to hide it. The whole section stays hidden until at least one partner has a name.
            </p>
            <Toggle checked={settings.partners.visible} onChange={(v) => setPartners({ visible: v })} label="Visible" />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <Field label="Section Title"><Input value={settings.partners.title} onChange={(v) => setPartners({ title: v })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            {settings.partners.items.map((item, i) => (
              <div key={i} style={{ padding: "1rem", borderRadius: 10, border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <ImageUploadField
                  path={`partners.items.${i}.logoUrl`}
                  url={item.logoUrl}
                  onUploaded={(url) => setPartnerItem(i, { logoUrl: url })}
                  onRemoved={() => setPartnerItem(i, { logoUrl: "" })}
                  label="Upload logo"
                  aspect="16/9"
                />
                <Field label="Partner name"><Input value={item.name} onChange={(v) => setPartnerItem(i, { name: v })} /></Field>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* MAP */}
      {tab === "map" && (
        <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Map Section</p>
              <Toggle checked={settings.map.visible} onChange={(v) => setMap({ visible: v })} label="Visible" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Field label="Section Title"><Input value={settings.map.title} onChange={(v) => setMap({ title: v })} /></Field>
              <Field label="Description"><Textarea value={settings.map.description} onChange={(v) => setMap({ description: v })} /></Field>
              <Field label="Address display text"><Input value={settings.map.address} onChange={(v) => setMap({ address: v })} placeholder="Kigali, Rwanda" /></Field>
              <Field label="Map Embed URL (OpenStreetMap / Google Maps)">
                <Textarea value={settings.map.embedUrl} onChange={(v) => setMap({ embedUrl: v })} rows={2} placeholder="https://www.openstreetmap.org/export/embed.html?..." />
                <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4 }}>
                  Tip — get an embed URL from OpenStreetMap or Google Maps → Share → Embed a map → copy the src URL.
                </p>
              </Field>
            </div>
          </div>

          {settings.map.embedUrl && (
            <div style={{ ...CARD, overflow: "hidden", padding: 0 }}>
              <iframe src={settings.map.embedUrl} style={{ width: "100%", height: 320, border: "none", display: "block" }} title="Map preview" />
            </div>
          )}
        </motion.div>
      )}

      {/* FINAL CTA */}
      {tab === "finalCta" && (
        <motion.div key="finalCta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>Closing CTA — shown just above the footer</p>
            <Toggle checked={settings.finalCta.visible} onChange={(v) => setFinalCta({ visible: v })} label="Visible" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="Headline"><Input value={settings.finalCta.title} onChange={(v) => setFinalCta({ title: v })} /></Field>
            <Field label="Subtitle"><Textarea value={settings.finalCta.subtitle} onChange={(v) => setFinalCta({ subtitle: v })} rows={2} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <Field label="Button text"><Input value={settings.finalCta.ctaText} onChange={(v) => setFinalCta({ ctaText: v })} /></Field>
              <Field label="Button link"><Input value={settings.finalCta.ctaHref} onChange={(v) => setFinalCta({ ctaHref: v })} placeholder="/register" /></Field>
            </div>
          </div>
        </motion.div>
      )}

      {/* FOOTER */}
      {tab === "footer" && (
        <motion.div key="footer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={CARD}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1.25rem" }}>Footer Info</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            <Field label="Brand Description"><Textarea value={settings.footer.description} onChange={(v) => setFooter({ description: v })} /></Field>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Field label="Email"><Input value={settings.footer.email} onChange={(v) => setFooter({ email: v })} placeholder="info@ssfrs.rw" /></Field>
              <Field label="Phone"><Input value={settings.footer.phone} onChange={(v) => setFooter({ phone: v })} placeholder="+250 788 000 000" /></Field>
              <Field label="Address"><Input value={settings.footer.address} onChange={(v) => setFooter({ address: v })} placeholder="Kigali, Rwanda" /></Field>
            </div>
          </div>

          <div style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "0.35rem" }}>Social Links</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>
              Leave a URL blank to hide that icon. Known labels (LinkedIn, X, Instagram, Email) get their own icon.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {settings.footer.socials.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Field label="Label"><Input value={s.label} onChange={(v) => setSocial(i, { label: v })} placeholder="LinkedIn" /></Field>
                  <Field label="URL"><Input value={s.href} onChange={(v) => setSocial(i, { href: v })} placeholder="https://…" /></Field>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
