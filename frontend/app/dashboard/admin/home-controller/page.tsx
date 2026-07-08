"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Save, Eye, Video, BarChart2, Users, MapPin, FileText,
  RefreshCw, CheckCircle, Globe, Image as ImageIcon,
  ChevronRight, X, Search, Briefcase, HardHat,
} from "lucide-react";
import { toast } from "react-toastify";
import { userService, type UserProfile } from "@/lib/userService";
import api from "@/lib/api";
import type { HomepageSettings, FeaturedUser } from "@/app/api/homepage/route";

/* ─── Defaults ───────────────────────────────────────────── */
const DEFAULT: HomepageSettings = {
  hero: { title: "Service Failure Refund System", subtitle: "A comprehensive platform for managing service claims, evaluating worker performance, and processing refunds.", videoUrl: "", cta1Text: "Get Started", cta1Href: "/register", cta2Text: "Sign In", cta2Href: "/login" },
  stats: { visible: true, items: [{ label: "Service Providers", value: "500+" }, { label: "Skilled Workers", value: "2,000+" }, { label: "Claims Processed", value: "10,000+" }, { label: "Success Rate", value: "98%" }] },
  about: { visible: true, title: "Why Choose SSFRS?", description: "Our platform bridges the gap between service providers and skilled workers, ensuring transparent claim resolution and fair refund processing." },
  providers: { visible: true, title: "Our Service Providers", subtitle: "Trusted organisations managing service projects on our platform.", featured: [] },
  workers: { visible: true, title: "Our Skilled Workers", subtitle: "Qualified professionals delivering quality service across every sector.", featured: [] },
  map: { visible: true, title: "Find Us", description: "We operate across Rwanda, connecting service providers and skilled workers nationwide.", embedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=29.9%2C-2.0%2C30.2%2C-1.8&layer=mapnik&marker=-1.9441%2C30.0619", address: "Kigali, Rwanda" },
  footer: { description: "SSFRS provides a structured approach to service failure management, ensuring fair outcomes for all parties.", email: "info@ssfrs.rw", phone: "+250 788 000 000", address: "KG 11 Ave, Kigali, Rwanda" },
};

type Tab = "hero" | "stats" | "providers" | "workers" | "map" | "footer";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "hero", label: "Hero & Video", icon: <Video style={{ width: 16, height: 16 }} /> },
  { id: "stats", label: "Statistics", icon: <BarChart2 style={{ width: 16, height: 16 }} /> },
  { id: "providers", label: "Providers", icon: <Briefcase style={{ width: 16, height: 16 }} /> },
  { id: "workers", label: "Workers", icon: <HardHat style={{ width: 16, height: 16 }} /> },
  { id: "map", label: "Map & Contact", icon: <MapPin style={{ width: 16, height: 16 }} /> },
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
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; }}
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
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; }}
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
          backgroundColor: checked ? "#2563EB" : "var(--color-border)",
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
  const accent = isProvider ? "#2563EB" : "#7C3AED";
  const bg = isProvider ? "#EFF6FF" : "#F5F3FF";

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
              background: saved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#1E293B,#334155)",
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
              border: tab === t.id ? "1.5px solid #2563EB" : "1.5px solid var(--color-border)",
              backgroundColor: tab === t.id ? "#EFF6FF" : "var(--color-card)",
              color: tab === t.id ? "#2563EB" : "var(--color-muted-foreground)",
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
              <Field label="Headline"><Input value={settings.hero.title} onChange={(v) => setHero({ title: v })} placeholder="Service Failure Refund System" /></Field>
              <Field label="Subtitle"><Textarea value={settings.hero.subtitle} onChange={(v) => setHero({ subtitle: v })} rows={3} /></Field>
            </div>
          </div>

          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)" }}>
                Video Background — S3 Bucket: <span style={{ color: "#2563EB" }}>service-refund (eu-north-1)</span>
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
                    background: videoUploading ? "var(--color-neutral-300)" : "linear-gradient(135deg, #2563EB, #1d4ed8)",
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
        </motion.div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
