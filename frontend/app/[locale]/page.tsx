"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, ChevronDown, Shield, FileCheck, RefreshCw,
  Users, MapPin, Phone, Mail, Menu, X, Star,
  Briefcase, Award, CheckCircle, Globe,
} from "lucide-react";
import type { HomepageSettings, FeaturedUser } from "../api/homepage/route";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const ACCENT = "#5B4FE5";

function Counter({ target }: { target: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(target.replace(/[^0-9]/g, "")) || 0;
        const suffix = target.replace(/[0-9,]/g, "").trim();
        const start = Date.now();
        const dur = 1800;
        const tick = () => {
          const p = Math.min((Date.now() - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const val = Math.round(ease * num);
          setDisplay(val.toLocaleString() + suffix);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{display}</span>;
}

function PersonCard({ user, index, providerLabel, workerLabel }: { user: FeaturedUser; index: number; providerLabel: string; workerLabel: string }) {
  const [imgErr, setImgErr] = useState(false);
  const initial = user.fullName?.charAt(0).toUpperCase() || "U";
  const bg = user.role === "PROVIDER" ? "#EEF2FF" : "#CCFBF1";
  const color = user.role === "PROVIDER" ? ACCENT : "#0D9488";

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.07 }}
      style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${color}40`, backgroundColor: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {user.profileImageUrl && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profileImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgErr(true)} />
        ) : (
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{initial}</span>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A", marginBottom: 4 }}>{user.fullName}</p>
        {user.title && <p style={{ fontSize: "0.8125rem", color: "#64748B", marginBottom: 4 }}>{user.title}</p>}
        <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 10px", borderRadius: 999, backgroundColor: bg, color }}>
          {user.role === "PROVIDER" ? providerLabel : workerLabel}
        </span>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay }}
      style={{ background: "#fff", borderRadius: 16, padding: "2rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, marginBottom: "1.25rem", backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <h4 style={{ fontWeight: 700, color: "#0F172A", marginBottom: "0.5rem" }}>{title}</h4>
      <p style={{ fontSize: "0.875rem", color: "#64748B", lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
  );
}

export default function HomePage() {
  const t = useTranslations("Home");
  const tNav = useTranslations("Nav");
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.08]);

  useEffect(() => {
    fetch("/api/homepage").then((r) => r.json()).then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setNavOpen(false);
  }, []);

  if (!settings) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.15)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const features = [
    { icon: <Shield style={{ width: 22, height: 22, color: ACCENT }} />, title: t("featureSecureTitle"), desc: t("featureSecureDesc") },
    { icon: <Star style={{ width: 22, height: 22, color: ACCENT }} />, title: t("featureAiTitle"), desc: t("featureAiDesc") },
    { icon: <RefreshCw style={{ width: 22, height: 22, color: ACCENT }} />, title: t("featureRefundTitle"), desc: t("featureRefundDesc") },
    { icon: <FileCheck style={{ width: 22, height: 22, color: ACCENT }} />, title: t("featureContractTitle"), desc: t("featureContractDesc") },
    { icon: <Globe style={{ width: 22, height: 22, color: ACCENT }} />, title: t("featureLangTitle"), desc: t("featureLangDesc") },
  ];

  const navLinks: [string, string][] = [
    [tNav("about"), "about"],
    [tNav("services"), "features"],
    [tNav("providers"), "providers"],
    [tNav("workers"), "workers"],
    [tNav("contact"), "contact"],
  ];

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .nav-link { color: rgba(255,255,255,0.75); font-size:0.875rem; font-weight:500; text-decoration:none; transition:color 0.15s; cursor:pointer; background:none; border:none; }
        .nav-link:hover { color:#fff; }
        .people-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:1.25rem; }
        @media(min-width:768px) { .people-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }
        .feature-grid { display:grid; grid-template-columns:1fr; gap:1.25rem; }
        @media(min-width:640px) { .feature-grid { grid-template-columns:1fr 1fr; } }
        @media(min-width:1024px) { .feature-grid { grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); } }
        .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:2rem; }
        @media(min-width:768px) { .stats-grid { grid-template-columns:repeat(4,1fr); } }
        .map-layout { display:flex; flex-direction:column; gap:2.5rem; }
        @media(min-width:900px) { .map-layout { flex-direction:row; align-items:flex-start; } }
        .footer-grid { display:grid; grid-template-columns:1fr; gap:2.5rem; }
        @media(min-width:768px) { .footer-grid { grid-template-columns: 2fr 1fr 1fr; } }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: scrolled ? "rgba(15,23,42,0.92)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none", transition: "all 0.3s", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: "#fff", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ced.png" alt="RG Partners" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em" }}>SSFRS</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="hidden md:flex">
          {navLinks.map(([label, id]) => (
            <button key={id} className="nav-link" onClick={() => scrollToSection(id)}>{label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="hidden md:flex">
          <LanguageSwitcher variant="dark" />
          <Link href="/login" style={{ padding: "0.45rem 1.125rem", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            {tNav("signIn")}
          </Link>
          <Link href="/register" style={{ padding: "0.45rem 1.125rem", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg, #5B4FE5, #4C3FD1)", boxShadow: "0 2px 8px rgba(91,79,229,0.4)", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            {tNav("getStarted")}
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setNavOpen(!navOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}>
          {navOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
        </button>
      </nav>

      {navOpen && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 99, background: "rgba(15,23,42,0.97)", backdropFilter: "blur(12px)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {navLinks.map(([label, id]) => (
            <button key={id} className="nav-link" onClick={() => scrollToSection(id)} style={{ textAlign: "left", fontSize: "1rem" }}>{label}</button>
          ))}
          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Link href="/login" style={{ flex: 1, textAlign: "center", padding: "0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>{tNav("signIn")}</Link>
            <Link href="/register" style={{ flex: 1, textAlign: "center", padding: "0.6rem", borderRadius: 8, background: ACCENT, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>{tNav("getStarted")}</Link>
          </div>
          <LanguageSwitcher variant="dark" />
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{ position: "relative", height: "100vh", minHeight: 600, overflow: "hidden" }}>
        {settings.hero.videoUrl ? (
          <motion.div style={{ position: "absolute", inset: 0, scale: heroScale }}>
            <video ref={videoRef} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} src={settings.hero.videoUrl} />
          </motion.div>
        ) : (
          <motion.div style={{ position: "absolute", inset: 0, scale: heroScale, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #2E2464 70%, #4C3FD1 100%)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,18,38,0.65) 0%, rgba(10,18,38,0.78) 60%, rgba(10,18,38,0.92) 100%)" }} />

        <motion.div style={{ position: "relative", zIndex: 2, opacity: heroOpacity, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.375rem 1rem", borderRadius: 999, marginBottom: "1.5rem", backgroundColor: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)" }}>
            <Shield style={{ width: 13, height: 13, color: "#A78BFA" }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C4B5FD" }}>{t("platformBadge")}</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            style={{ color: "#fff", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: "1.5rem", fontSize: "clamp(2.25rem, 6vw, 4.5rem)", maxWidth: 820 }}>
            {settings.hero.title}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
            style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.75, fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: 640, marginBottom: "2.5rem" }}>
            {settings.hero.subtitle}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href={settings.hero.cta1Href} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none", color: "#fff", background: "linear-gradient(135deg, #5B4FE5, #4C3FD1)", boxShadow: "0 4px 20px rgba(91,79,229,0.45)", transition: "transform 0.15s, box-shadow 0.15s" }}>
              {settings.hero.cta1Text}<ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href={settings.hero.cta2Href} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 2rem", borderRadius: 10, fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.08)", transition: "background 0.15s, border-color 0.15s" }}>
              {settings.hero.cta2Text}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}
          onClick={() => scrollToSection("stats")}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("platformBadge").split(" ")[0]}</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown style={{ width: 18, height: 18, color: "rgba(255,255,255,0.4)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      {settings.stats.visible && (
        <section id="stats" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="stats-grid">
              {settings.stats.items.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
                    <Counter target={stat.value} />
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</div>
                  <div style={{ width: 32, height: 2, background: ACCENT, margin: "0.875rem auto 0", borderRadius: 999 }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About / Features ── */}
      {settings.about.visible && (
        <section id="features" style={{ background: "#F8FAFC", padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: ACCENT, padding: "0.25rem 0.875rem", borderRadius: 999, backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE", marginBottom: "1rem" }}>
                {t("platformSection")}
              </div>
              <h2 style={{ color: "#0F172A", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }} id="about">
                {settings.about.title}
              </h2>
              <p style={{ color: "#64748B", fontSize: "1.0625rem", lineHeight: 1.75, maxWidth: 600, margin: "0 auto" }}>{settings.about.description}</p>
            </motion.div>
            <div className="feature-grid">
              {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.08} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Providers ── */}
      {settings.providers.visible && (
        <section id="providers" style={{ background: "#fff", padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: "3rem" }}>
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: ACCENT, padding: "0.25rem 0.875rem", borderRadius: 999, backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE", marginBottom: "1rem" }}>
                {t("providersBadge")}
              </div>
              <h2 style={{ color: "#0F172A", fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>{settings.providers.title}</h2>
              <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.75 }}>{settings.providers.subtitle}</p>
            </motion.div>
            {settings.providers.featured.length > 0 ? (
              <div className="people-grid">
                {settings.providers.featured.map((u, i) => <PersonCard key={u.id} user={u} index={i} providerLabel={t("personProvider")} workerLabel={t("personWorker")} />)}
              </div>
            ) : (
              <p style={{ color: "#94A3B8", fontSize: "0.9375rem" }}>{t("noProviders")}</p>
            )}
          </div>
        </section>
      )}

      {/* ── Workers ── */}
      {settings.workers.visible && (
        <section id="workers" style={{ background: "#F8FAFC", padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: "3rem" }}>
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0D9488", padding: "0.25rem 0.875rem", borderRadius: 999, backgroundColor: "#CCFBF1", border: "1px solid #99F6E4", marginBottom: "1rem" }}>
                {t("workersBadge")}
              </div>
              <h2 style={{ color: "#0F172A", fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>{settings.workers.title}</h2>
              <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.75 }}>{settings.workers.subtitle}</p>
            </motion.div>
            {settings.workers.featured.length > 0 ? (
              <div className="people-grid">
                {settings.workers.featured.map((u, i) => <PersonCard key={u.id} user={u} index={i} providerLabel={t("personProvider")} workerLabel={t("personWorker")} />)}
              </div>
            ) : (
              <p style={{ color: "#94A3B8", fontSize: "0.9375rem" }}>{t("noWorkers")}</p>
            )}
          </div>
        </section>
      )}

      {/* ── Map ── */}
      {settings.map.visible && (
        <section id="contact" style={{ background: "#fff", padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="map-layout">
              <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ flex: "0 0 340px" }}>
                <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: ACCENT, padding: "0.25rem 0.875rem", borderRadius: 999, backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE", marginBottom: "1rem" }}>
                  {t("locationBadge")}
                </div>
                <h2 style={{ color: "#0F172A", fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>{settings.map.title}</h2>
                <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.75, marginBottom: "2rem" }}>{settings.map.description}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                  {[
                    { icon: <MapPin style={{ width: 16, height: 16, color: ACCENT }} />, text: settings.map.address },
                    { icon: <Mail style={{ width: 16, height: 16, color: ACCENT }} />, text: settings.footer.email },
                    { icon: <Phone style={{ width: 16, height: 16, color: ACCENT }} />, text: settings.footer.phone },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                      <span style={{ fontSize: "0.9375rem", color: "#334155", fontWeight: 500, lineHeight: 1.5, paddingTop: 6 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                style={{ flex: 1, minHeight: 420, borderRadius: 18, overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                <iframe src={settings.map.embedUrl} style={{ width: "100%", height: "100%", minHeight: 420, border: "none", display: "block" }} title="Location map" loading="lazy" />
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", padding: "5rem 1.5rem 2.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="footer-grid" style={{ marginBottom: "3rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: "#fff", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ced.png" alt="RG Partners" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <span style={{ fontWeight: 900, fontSize: "1.125rem", letterSpacing: "-0.02em", display: "block" }}>RG Partners</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.02em" }}>SSFRS Platform</span>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.75, maxWidth: 320 }}>{settings.footer.description}</p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>{t("footerPlatform")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {([[t("footerLogin"), "/login"], [t("footerRegister"), "/register"], [t("providersBadge"), "/register"], [t("workersBadge"), "/register"]] as [string, string][]).map(([label, href]) => (
                  <Link key={label} href={href} style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>{t("footerContact")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>{settings.footer.email}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>{settings.footer.phone}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>{settings.footer.address}</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem" }}>© {new Date().getFullYear()} RG Partners. All rights reserved.</p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {([[t("footerPrivacy"), "#"], [t("footerTerms"), "#"]] as [string, string][]).map(([label, href]) => (
                <Link key={label} href={href} style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
