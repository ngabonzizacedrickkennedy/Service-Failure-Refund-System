"use client";

import { useEffect, useState, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, Menu, X, Star, Plus, Minus, Check,
  MapPin, Phone, Mail, Moon, Sun, ImageIcon, Globe, Play, Pause,
} from "lucide-react";
import { localizeSettings } from "@/lib/homepage";
import type { HomepageSettings, FeaturedUser } from "@/lib/homepage";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/* ── Design tokens ────────────────────────────────────────────────────────
   Dark forest-green canvas, near-black chrome, one blue accent. Declared
   once here and consumed through the class names in HOME_CSS below.        */
const HOME_CSS = `
.hp {
  --hp-green: #143A2E;
  --hp-green-soft: #1A4737;
  --hp-black: #0A0A0A;
  --hp-blue: #2F6BFF;
  --hp-gold: #D9A441;
  --hp-muted: #A5BAAF;
  --hp-line: rgba(255,255,255,0.10);
  background: var(--hp-green);
  color: #fff;
  overflow-x: hidden;
}
/* Dark theme — same layout, near-black canvas instead of the forest green.
   Only the tokens change, so every section follows automatically. */
:root[data-theme="dark"] .hp {
  --hp-green: #0B1310;
  --hp-green-soft: #131E19;
  --hp-black: #000000;
  --hp-muted: #93A69C;
  --hp-line: rgba(255,255,255,0.08);
}
:root[data-theme="dark"] .hp-ph {
  background: linear-gradient(140deg, #16241E 0%, #0F1A16 100%);
}

/* Keeps the page's own colour behind any overscroll / short-content gap
   instead of the white body default. */
body:has(.hp) { background: #0A0A0A; }
:root[data-theme="dark"] body:has(.hp) { background: #000000; }
.hp h1, .hp h2, .hp h3, .hp h4 { color: #fff; }
.hp section { padding: 4.5rem 1.5rem; }
.hp-wrap { max-width: 1240px; margin: 0 auto; width: 100%; }

/* ── Chrome ── */
.hp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: var(--hp-black);
  display: flex; align-items: center; justify-content: space-between;
  gap: 1.5rem; padding: 0.9rem 2rem;
}
.hp-mark {
  font-size: 0.9375rem; font-weight: 800; letter-spacing: 0.15em;
  color: #fff; text-decoration: none; white-space: nowrap;
}
.hp-nav-links { display: none; align-items: center; gap: 1.85rem; }
@media (min-width: 1080px) { .hp-nav-links { display: flex; } }
.hp-nav-link {
  background: none; border: none; padding: 0; cursor: pointer;
  font-size: 0.9375rem; font-weight: 500; color: #fff; opacity: 0.92;
  transition: opacity 0.15s; white-space: nowrap;
}
.hp-nav-link:hover { opacity: 0.65; }
.hp-nav-right { display: none; align-items: center; gap: 1rem; }
@media (min-width: 1080px) { .hp-nav-right { display: flex; } }
.hp-icon-btn {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.22); background: transparent;
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.hp-icon-btn:hover { background: rgba(255,255,255,0.1); }
.hp-signin {
  padding: 0.55rem 1.35rem; border-radius: 999px; background: var(--hp-blue);
  color: #fff; font-size: 0.875rem; font-weight: 700; text-decoration: none;
  white-space: nowrap; transition: filter 0.15s;
}
.hp-signin:hover { filter: brightness(1.12); }
.hp-burger { display: flex; background: none; border: none; color: #fff; cursor: pointer; }
@media (min-width: 1080px) { .hp-burger { display: none; } }
.hp-drawer {
  position: fixed; top: 70px; left: 0; right: 0; z-index: 99;
  background: var(--hp-black); padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1.25rem;
  border-top: 1px solid var(--hp-line);
}

/* ── Type scale ── */
.hp-eyebrow {
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--hp-muted); margin-bottom: 0.9rem;
}
.hp-h1 {
  font-size: clamp(1.9rem, 3.7vw, 2.9rem); font-weight: 800; line-height: 1.05;
  letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 1.15rem;
}
.hp-h2 {
  font-size: clamp(1.45rem, 2.6vw, 2.15rem); font-weight: 800; line-height: 1.1;
  letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 0.8rem;
}
.hp-h3 {
  font-size: clamp(1.1rem, 1.75vw, 1.45rem); font-weight: 800; line-height: 1.15;
  letter-spacing: -0.015em; text-transform: uppercase; margin-bottom: 0.75rem;
}
.hp-lead { font-size: 0.9375rem; line-height: 1.65; color: var(--hp-muted); }
.hp-body { font-size: 0.875rem; line-height: 1.7; color: var(--hp-muted); }
.hp-center { text-align: center; }
.hp-center .hp-lead { max-width: 44rem; margin-left: auto; margin-right: auto; }
.hp-head { margin-bottom: 2.75rem; }

/* ── Buttons ── */
.hp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 700;
  text-decoration: none; cursor: pointer; white-space: nowrap;
  transition: filter 0.15s, background 0.15s, color 0.15s;
}
.hp-btn-primary { background: var(--hp-blue); color: #fff; border: none; }
.hp-btn-primary:hover { filter: brightness(1.12); }
.hp-btn-ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.45); }
.hp-btn-ghost:hover { background: rgba(255,255,255,0.1); }
.hp-inline-link {
  display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 700;
  color: #fff; text-decoration: none; padding-bottom: 0.3rem;
  border-bottom: 1.5px solid rgba(255,255,255,0.5); transition: border-color 0.15s;
}
.hp-inline-link:hover { border-bottom-color: #fff; }

/* ── Hero ── */
.hp-hero { padding-top: 7.5rem !important; padding-bottom: 4rem !important; }
.hp-hero-grid { display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center; }
@media (min-width: 980px) { .hp-hero-grid { grid-template-columns: 1fr 1fr; gap: 4rem; } }
.hp-hero-actions { display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 2rem; }
.hp-collage { position: relative; width: 100%; aspect-ratio: 1 / 0.85; min-height: 290px; }

/* Admin-uploaded hero video, layered behind the photo collage. When it is
   present the tiles are inset so the footage stays visible around them. */
.hp-collage-video {
  position: absolute; inset: 0; z-index: 0;
  border-radius: 18px; overflow: hidden;
  background: #0A0A0A;
  box-shadow: 0 26px 60px rgba(0,0,0,0.45);
}
.hp-collage-video video { width: 100%; height: 100%; object-fit: cover; display: block; }
/* Darkens the footage so the tiles and their labels stay readable over it. */
.hp-collage-video::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(10,10,10,0.28) 0%, rgba(10,10,10,0.52) 100%);
}
.hp-video-toggle {
  position: absolute; left: 12px; top: 12px; z-index: 2;
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.8rem; border-radius: 999px; cursor: pointer;
  background: rgba(10,10,10,0.6); backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.2); color: #fff;
  font-size: 0.75rem; font-weight: 700;
  transition: background 0.15s;
}
.hp-video-toggle:hover { background: rgba(10,10,10,0.82); }

.hp-collage-stack { position: absolute; inset: 0; z-index: 1; }
.hp-collage.has-video .hp-collage-stack { inset: 9%; }

.hp-collage figure {
  position: absolute; border-radius: 16px; overflow: hidden; margin: 0;
  box-shadow: 0 26px 60px rgba(0,0,0,0.42);
}
.hp-collage figure:nth-child(1) { top: 0; right: 0; width: 74%; height: 58%; transform: rotate(-1.2deg); z-index: 1; }
.hp-collage figure:nth-child(2) { bottom: 8%; left: 0; width: 58%; height: 50%; transform: rotate(2.6deg); z-index: 3; }
.hp-collage figure:nth-child(3) { bottom: 0; right: 2%; width: 54%; height: 46%; transform: rotate(-2.4deg); z-index: 2; }
.hp-collage img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hp-tag {
  position: absolute; left: 14px; bottom: 14px; padding: 0.4rem 0.95rem; border-radius: 999px;
  background: rgba(10,10,10,0.72); backdrop-filter: blur(6px);
  font-size: 0.75rem; font-weight: 700; color: #fff;
}

/* Placeholder shown until an admin uploads the real image. */
.hp-ph {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(140deg, #1E5142 0%, #163E31 100%);
  color: rgba(255,255,255,0.28);
}

/* ── Numbered step cards ── */
/* auto-fit, so three cards sit in a row of three and four in a row of four
   instead of leaving a hole in a fixed 3-column track. */
.hp-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(235px, 1fr)); gap: 1.35rem; }
.hp-step {
  display: flex; flex-direction: column; text-decoration: none;
  border: 1px solid var(--hp-line); border-radius: 18px; overflow: hidden;
  background: rgba(255,255,255,0.02); transition: transform 0.2s, border-color 0.2s;
}
.hp-step:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.24); }
.hp-step-media { position: relative; aspect-ratio: 16 / 11; }
.hp-step-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hp-step-no {
  position: absolute; top: 12px; left: 12px; width: 34px; height: 34px; border-radius: 50%;
  background: rgba(10,10,10,0.72); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: #fff;
}
.hp-step-body { padding: 1.35rem 1.25rem 1.6rem; }
.hp-step-body h4 {
  font-size: 1rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: -0.01em; margin-bottom: 0.6rem;
}

/* ── Alternating feature rows ── */
.hp-row { display: grid; grid-template-columns: 1fr; gap: 2rem; align-items: center; margin-bottom: 4.5rem; }
.hp-row:last-child { margin-bottom: 0; }
@media (min-width: 980px) { .hp-row { grid-template-columns: 1fr 1fr; gap: 3.5rem; } }
.hp-row-media { border-radius: 18px; overflow: hidden; aspect-ratio: 16 / 11; }
.hp-row-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
@media (min-width: 980px) { .hp-row.flip .hp-row-media { order: 2; } }

/* ── Stats ── */
.hp-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
@media (min-width: 860px) { .hp-stats { grid-template-columns: repeat(4, 1fr); } }
.hp-stat-value {
  font-size: clamp(1.85rem, 3.3vw, 2.5rem); font-weight: 800; line-height: 1;
  letter-spacing: -0.03em; margin-bottom: 0.5rem;
}
.hp-stat-label {
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: var(--hp-muted);
}
.hp-stat-rule { width: 34px; height: 2px; background: var(--hp-blue); margin-top: 1rem; border-radius: 999px; }

/* ── Card grids (people, testimonials, packages) ── */
.hp-card {
  background: var(--hp-green-soft); border: 1px solid var(--hp-line);
  border-radius: 16px; padding: 1.5rem;
}
.hp-grid-4 { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 640px) { .hp-grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .hp-grid-4 { grid-template-columns: repeat(4, 1fr); } }
.hp-people { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 1rem; }
.hp-avatar {
  width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
  font-weight: 800; color: #fff;
}
.hp-avatar img { width: 100%; height: 100%; object-fit: cover; }
.hp-stars { display: flex; gap: 2px; margin-bottom: 1rem; color: var(--hp-gold); }
.hp-quote { font-size: 0.875rem; line-height: 1.7; color: #E6EFE9; margin-bottom: 1.4rem; }
.hp-chip {
  display: inline-block; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; padding: 3px 10px; border-radius: 999px;
  background: rgba(255,255,255,0.1); color: #CFE0D7;
}

/* ── Packages ── */
.hp-pkg { position: relative; display: flex; flex-direction: column; }
.hp-pkg-popular { border-color: rgba(255,255,255,0.3); }
.hp-pkg-badge {
  position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
  padding: 0.45rem 1.15rem; border-radius: 999px; background: #fff; color: var(--hp-black);
  font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  white-space: nowrap;
}
.hp-pkg h4 { font-size: 1.125rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.4rem; }
.hp-pkg-price {
  font-size: 1.125rem; font-weight: 800; text-transform: uppercase;
  margin: 1.35rem 0 1.15rem;
}
.hp-pkg ul { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; flex: 1; margin-bottom: 1.6rem; }
.hp-pkg li { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 0.875rem; color: #DCE8E1; }
.hp-pkg li svg { flex-shrink: 0; margin-top: 3px; color: var(--hp-blue); }

/* ── FAQ ── */
.hp-faq { max-width: 860px; margin: 0 auto; }
.hp-faq-item { border-bottom: 1px solid var(--hp-line); }
.hp-faq-q {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
  padding: 1.25rem 0; background: none; border: none; cursor: pointer; text-align: left;
  font-size: 0.9375rem; font-weight: 700; color: #fff;
}
.hp-faq-q svg { flex-shrink: 0; color: #fff; }
.hp-faq-a { overflow: hidden; }
.hp-faq-a p { padding-bottom: 1.25rem; max-width: 68ch; }

/* ── Map / contact ── */
.hp-map { display: grid; grid-template-columns: 1fr; gap: 2.5rem; align-items: start; }
@media (min-width: 980px) { .hp-map { grid-template-columns: 380px 1fr; gap: 3.5rem; } }
.hp-contact-row { display: flex; gap: 0.9rem; align-items: flex-start; margin-bottom: 1.15rem; }
.hp-contact-row svg { flex-shrink: 0; margin-top: 4px; color: var(--hp-blue); }
.hp-map-frame {
  border-radius: 18px; overflow: hidden; border: 1px solid var(--hp-line);
  min-height: 340px; background: var(--hp-green-soft);
}

/* ── Partners ── */
.hp-partners { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 2.5rem 3.5rem; }
.hp-partners > * { height: 38px; display: flex; align-items: center; opacity: 0.55; }
.hp-partners img { height: 100%; width: auto; object-fit: contain; filter: grayscale(100%) brightness(3); }

/* ── Footer ── */
.hp-footer { background: var(--hp-black); padding: 4rem 1.5rem 2rem; }
.hp-footer-grid { display: grid; grid-template-columns: 1fr; gap: 2.25rem; margin-bottom: 3rem; }
@media (min-width: 760px) { .hp-footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; gap: 2.5rem; } }
.hp-footer h5 {
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--hp-muted); margin-bottom: 1.1rem;
}
.hp-footer-links { display: flex; flex-direction: column; gap: 0.7rem; }
.hp-footer-links a, .hp-footer-links span {
  color: #D5DED9; font-size: 0.875rem; text-decoration: none; transition: color 0.15s;
}
.hp-footer-links a:hover { color: #fff; }
.hp-socials { display: flex; gap: 0.75rem; }
.hp-social {
  width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.22);
  display: flex; align-items: center; justify-content: center; color: #fff;
  text-decoration: none; transition: background 0.15s;
}
.hp-social:hover { background: rgba(255,255,255,0.1); }
.hp-copy {
  border-top: 1px solid rgba(255,255,255,0.09); padding-top: 2rem;
  font-size: 0.8125rem; color: #8A9791;
}

@media (max-width: 640px) {
  .hp section { padding: 3.25rem 1.25rem; }
  .hp-hero { padding-top: 6.25rem !important; }
  .hp-head { margin-bottom: 2.5rem; }
  .hp-row { margin-bottom: 4rem; }
  .hp-btn { width: 100%; }
  .hp-nav { padding: 1rem 1.25rem; }
}
@keyframes hp-spin { to { transform: rotate(360deg); } }

/* Entrance animation is pure CSS with fill-mode both, so the end state is
   "visible" even if the animation never runs. Never gate copy on JS. */
@keyframes hp-in {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: none; }
}
.hp-reveal { animation: hp-in 0.55s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .hp-reveal { animation: none; }
}
`;

/* ── Small building blocks ───────────────────────────────────────────────── */

function Media({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="hp-ph">
        <ImageIcon size={30} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={() => setBroken(true)} />;
}

/** Counts up on first scroll into view. Starts *at* the target so the real
 *  figure shows even if the observer never fires (no JS, reduced motion). */
/**
 * The hero background video, uploaded by an admin in Home Controller. It sits
 * behind the photo collage and can be paused — autoplaying video with no way
 * to stop it is a genuine accessibility problem, not just a nicety.
 */
function HeroVideo({
  src,
  label,
  onFail,
}: {
  src: string;
  label: string;
  onFail: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="hp-collage-video">
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={onFail}
      />
      <button type="button" className="hp-video-toggle" onClick={toggle} aria-label={label}>
        {playing ? <Pause size={12} /> : <Play size={12} />}
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}

function Counter({ target }: { target: string }) {
  const [display, setDisplay] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Respect the motion preference — and never animate a figure the user
       asked to see as-is. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(target.replace(/[^0-9]/g, "")) || 0;
        const suffix = target.replace(/[0-9,]/g, "").trim();
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / 1800, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(ease * num).toLocaleString() + suffix);
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

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <div className={`hp-reveal ${className}`.trim()} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function SectionHead({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <Reveal>
      <div className="hp-head hp-center">
        {eyebrow && <p className="hp-eyebrow">{eyebrow}</p>}
        <h2 className="hp-h2">{title}</h2>
        {lead && <p className="hp-lead">{lead}</p>}
      </div>
    </Reveal>
  );
}

function PersonCard({ user, providerLabel, workerLabel }: {
  user: FeaturedUser; providerLabel: string; workerLabel: string;
}) {
  const [broken, setBroken] = useState(false);
  const initial = user.fullName?.charAt(0).toUpperCase() || "U";
  return (
    <div className="hp-card" style={{ padding: "1.5rem 1.25rem", textAlign: "center" }}>
      <div className="hp-avatar" style={{ width: 68, height: 68, margin: "0 auto 1rem", fontSize: "1.4rem" }}>
        {user.profileImageUrl && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profileImageUrl} alt="" onError={() => setBroken(true)} />
        ) : initial}
      </div>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{user.fullName}</p>
      {user.title && <p className="hp-body" style={{ fontSize: "0.8125rem", marginBottom: 8 }}>{user.title}</p>}
      <span className="hp-chip">{user.role === "PROVIDER" ? providerLabel : workerLabel}</span>
    </div>
  );
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hp-faq-item">
      <button className="hp-faq-q" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {question}
        {open ? <Minus size={20} /> : <Plus size={20} />}
      </button>
      <motion.div
        className="hp-faq-a"
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <p className="hp-body">{answer}</p>
      </motion.div>
    </div>
  );
}

/* lucide-react 1.x dropped brand glyphs, so anything without a neutral
   equivalent falls back to the globe. */
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  x: <X size={18} />,
  twitter: <X size={18} />,
  email: <Mail size={18} />,
  mail: <Mail size={18} />,
};

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const t = useTranslations("Home");
  const tNav = useTranslations("Nav");
  const locale = useLocale();
  const [raw, setRaw] = useState<HomepageSettings | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  /* A presigned video URL can expire. Tracking the failure here rather than
     inside HeroVideo lets the collage drop its inset too, instead of sitting
     small with empty space where the video should have been. */
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    fetch("/api/homepage").then((r) => r.json()).then(setRaw).catch(() => {});
  }, []);

  /* Admin-authored copy lives in the database in one base language; this
     overlays whatever has been translated for the active locale. */
  const settings = useMemo(
    () => (raw ? localizeSettings(raw, locale) : null),
    [raw, locale]
  );

  /* The theme lives on <html>, not in React. Subscribing to the same
     "themechange" event the dashboard header dispatches keeps this icon in
     sync wherever the preference is flipped. */
  const dark = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("themechange", onChange);
      return () => window.removeEventListener("themechange", onChange);
    },
    () => document.documentElement.getAttribute("data-theme") === "dark",
    () => false,
  );

  const toggleTheme = () => {
    const next = !dark;
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new Event("themechange"));
  };

  const goTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setNavOpen(false);
  }, []);

  if (!settings) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#143A2E" }}>
        <div style={{ width: 34, height: 34, border: "3px solid rgba(255,255,255,0.18)", borderTopColor: "#fff", borderRadius: "50%", animation: "hp-spin 0.7s linear infinite" }} />
        <style>{`@keyframes hp-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const navLinks: [string, string][] = [
    [tNav("about"), "about"],
    [tNav("services"), "services"],
    [tNav("modules"), "how-it-works"],
    [tNav("providers"), "providers"],
    [tNav("workers"), "workers"],
    [tNav("contact"), "contact"],
  ];

  const heroImages = settings.hero.images ?? [];
  const showHeroVideo = Boolean(settings.hero.videoUrl) && !videoFailed;
  const steps = settings.programmes.items.filter((i) => i.title.trim());
  const rows = settings.differentiators.items.filter((i) => i.title.trim());
  const quotes = settings.testimonials.items.filter((i) => i.quote.trim());
  const packages = settings.packages.items.filter((i) => i.name.trim());
  const faqs = settings.faq.items.filter((i) => i.question.trim());
  const partners = settings.partners.items.filter((i) => i.name.trim() || i.logoUrl);
  const socials = (settings.footer.socials ?? []).filter((s) => s.href.trim());

  return (
    <div className="hp">
      <style>{HOME_CSS}</style>

      {/* ── Nav ── */}
      <nav className="hp-nav">
        <Link href="/" className="hp-mark">SSFRS</Link>

        <div className="hp-nav-links">
          {navLinks.map(([label, id]) => (
            <button key={id} className="hp-nav-link" onClick={() => goTo(id)}>{label}</button>
          ))}
        </div>

        <div className="hp-nav-right">
          <LanguageSwitcher variant="dark" />
          <button className="hp-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link href="/login" className="hp-signin">{tNav("signIn")}</Link>
        </div>

        <button className="hp-burger" onClick={() => setNavOpen(!navOpen)} aria-label="Menu">
          {navOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {navOpen && (
        <div className="hp-drawer">
          {navLinks.map(([label, id]) => (
            <button key={id} className="hp-nav-link" style={{ textAlign: "left" }} onClick={() => goTo(id)}>{label}</button>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.5rem" }}>
            <LanguageSwitcher variant="dark" />
            <Link href="/login" className="hp-signin">{tNav("signIn")}</Link>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="hp-hero">
        <div className="hp-wrap hp-hero-grid">
          <div className="hp-reveal">
            <p className="hp-eyebrow">{settings.hero.eyebrow}</p>
            <h1 className="hp-h1">{settings.hero.title}</h1>
            <p className="hp-lead" style={{ maxWidth: 540 }}>{settings.hero.subtitle}</p>
            <div className="hp-hero-actions">
              <Link href={settings.hero.cta1Href} className="hp-btn hp-btn-primary">{settings.hero.cta1Text}</Link>
              <Link href={settings.hero.cta2Href} className="hp-btn hp-btn-ghost">{settings.hero.cta2Text}</Link>
            </div>
          </div>

          <div
            className={`hp-collage hp-reveal ${showHeroVideo ? "has-video" : ""}`}
            style={{ animationDelay: "0.12s" }}
          >
            {showHeroVideo && (
              <HeroVideo
                src={settings.hero.videoUrl}
                label={t("watchVideo")}
                onFail={() => setVideoFailed(true)}
              />
            )}
            <div className="hp-collage-stack">
              {heroImages.slice(0, 3).map((img, i) => (
                <figure key={i}>
                  <Media src={img.url} alt={img.label} />
                  {img.label && <figcaption className="hp-tag">{img.label}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      {settings.programmes.visible && steps.length > 0 && (
        <section id="how-it-works">
          <div className="hp-wrap">
            <SectionHead
              eyebrow={settings.programmes.eyebrow}
              title={settings.programmes.title}
              lead={settings.programmes.subtitle}
            />
            <div className="hp-grid-3">
              {steps.map((item, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <Link href={item.href || "/register"} className="hp-step" style={{ height: "100%" }}>
                    <div className="hp-step-media">
                      <Media src={item.imageUrl} alt={item.title} />
                      <span className="hp-step-no">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="hp-step-body">
                      <h4>{item.title}</h4>
                      <p className="hp-body">{item.description}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
            {settings.programmes.ctaText && (
              <Reveal>
                <div className="hp-center" style={{ marginTop: "4rem" }}>
                  <Link href={settings.programmes.ctaHref || "/register"} className="hp-btn hp-btn-primary">
                    {settings.programmes.ctaText}
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ── Stats ── */}
      {settings.stats.visible && (
        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap hp-stats">
            {settings.stats.items.map((stat, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="hp-center">
                  <div className="hp-stat-value"><Counter target={stat.value} /></div>
                  <div className="hp-stat-label">{stat.label}</div>
                  <div className="hp-stat-rule" style={{ margin: "1rem auto 0" }} />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Alternating feature rows ── */}
      {settings.differentiators.visible && rows.length > 0 && (
        <section id="services">
          <div className="hp-wrap">
            <SectionHead
              eyebrow={settings.differentiators.eyebrow}
              title={settings.differentiators.title}
              lead={settings.differentiators.subtitle}
            />
            {rows.map((item, i) => (
              <Reveal key={i}>
                <div className={`hp-row ${i % 2 === 1 ? "flip" : ""}`}>
                  <div className="hp-row-media">
                    <Media src={item.imageUrl} alt={item.title} />
                  </div>
                  <div>
                    {item.eyebrow && <p className="hp-eyebrow">{item.eyebrow}</p>}
                    <h3 className="hp-h3">{item.title}</h3>
                    <p className="hp-lead" style={{ marginBottom: "2rem" }}>{item.description}</p>
                    {item.linkText && (
                      <Link href={item.href || "/register"} className="hp-inline-link">
                        {item.linkText} <ArrowRight size={17} />
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Value proposition ── */}
      {settings.valueProp.visible && (
        <section id="about">
          <div className="hp-wrap hp-center" style={{ maxWidth: 820 }}>
            <Reveal>
              <p className="hp-eyebrow">{settings.about.eyebrow}</p>
              <h2 className="hp-h2">{settings.valueProp.title}</h2>
              <p className="hp-lead">{settings.valueProp.body}</p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Providers ── */}
      {settings.providers.visible && (
        <section id="providers">
          <div className="hp-wrap">
            <SectionHead title={settings.providers.title} lead={settings.providers.subtitle} />
            {settings.providers.featured.length > 0 ? (
              <div className="hp-people">
                {settings.providers.featured.map((u) => (
                  <PersonCard key={u.id} user={u} providerLabel={t("personProvider")} workerLabel={t("personWorker")} />
                ))}
              </div>
            ) : (
              <p className="hp-body hp-center">{t("noProviders")}</p>
            )}
          </div>
        </section>
      )}

      {/* ── Workers ── */}
      {settings.workers.visible && (
        <section id="workers" style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <SectionHead title={settings.workers.title} lead={settings.workers.subtitle} />
            {settings.workers.featured.length > 0 ? (
              <div className="hp-people">
                {settings.workers.featured.map((u) => (
                  <PersonCard key={u.id} user={u} providerLabel={t("personProvider")} workerLabel={t("personWorker")} />
                ))}
              </div>
            ) : (
              <p className="hp-body hp-center">{t("noWorkers")}</p>
            )}
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {settings.testimonials.visible && quotes.length > 0 && (
        <section id="testimonials">
          <div className="hp-wrap">
            <SectionHead eyebrow={settings.testimonials.eyebrow} title={settings.testimonials.title} />
            <div className="hp-grid-4">
              {quotes.map((item, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div className="hp-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div className="hp-stars">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={15} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    <p className="hp-quote" style={{ flex: 1 }}>{item.quote}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div className="hp-avatar">
                        {item.avatarUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={item.avatarUrl} alt="" />
                          : (item.name?.charAt(0).toUpperCase() || "?")}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{item.name}</p>
                        {item.role && <p className="hp-body" style={{ fontSize: "0.875rem" }}>{item.role}</p>}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Packages ── */}
      {settings.packages.visible && packages.length > 0 && (
        <section id="packages">
          <div className="hp-wrap">
            <SectionHead
              eyebrow={settings.packages.eyebrow}
              title={settings.packages.title}
              lead={settings.packages.subtitle}
            />
            <div className="hp-grid-3">
              {packages.map((pkg, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className={`hp-card hp-pkg ${pkg.popular ? "hp-pkg-popular" : ""}`} style={{ height: "100%" }}>
                    {pkg.popular && <span className="hp-pkg-badge">{t("mostPopular")}</span>}
                    <h4>{pkg.name}</h4>
                    <p className="hp-body">{pkg.tagline}</p>
                    <p className="hp-pkg-price">{pkg.priceLabel}</p>
                    <ul>
                      {pkg.features.filter((f) => f.trim()).map((f, fi) => (
                        <li key={fi}><Check size={17} />{f}</li>
                      ))}
                    </ul>
                    <Link href={pkg.ctaHref || "/register"} className="hp-btn hp-btn-primary" style={{ width: "100%" }}>
                      {pkg.ctaText}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Partners ── */}
      {settings.partners.visible && partners.length > 0 && (
        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap hp-center">
            <p className="hp-eyebrow">{settings.partners.title}</p>
            <div className="hp-partners">
              {partners.map((item, i) => (
                <div key={i}>
                  {item.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.logoUrl} alt={item.name} />
                    : <span style={{ fontWeight: 800, fontSize: "1.0625rem" }}>{item.name}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {settings.faq.visible && faqs.length > 0 && (
        <section id="faq">
          <div className="hp-wrap">
            <SectionHead eyebrow={settings.faq.eyebrow} title={settings.faq.title} />
            <div className="hp-faq">
              {faqs.map((item, i) => <FaqRow key={i} question={item.question} answer={item.answer} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Map & contact ── */}
      {settings.map.visible && (
        <section id="contact">
          <div className="hp-wrap hp-map">
            <Reveal>
              <div>
                <p className="hp-eyebrow">{t("locationBadge")}</p>
                <h2 className="hp-h2">{settings.map.title}</h2>
                <p className="hp-lead" style={{ marginBottom: "2.25rem" }}>{settings.map.description}</p>
                <div className="hp-contact-row"><MapPin size={18} /><span className="hp-body">{settings.map.address}</span></div>
                <div className="hp-contact-row"><Mail size={18} /><span className="hp-body">{settings.footer.email}</span></div>
                <div className="hp-contact-row"><Phone size={18} /><span className="hp-body">{settings.footer.phone}</span></div>
              </div>
            </Reveal>
            <div className="hp-map-frame">
              <iframe src={settings.map.embedUrl} title="Location map" loading="lazy"
                style={{ width: "100%", height: "100%", minHeight: 420, border: "none", display: "block" }} />
            </div>
          </div>
        </section>
      )}

      {/* ── Closing CTA ── */}
      {settings.finalCta.visible && (
        <section className="hp-center" style={{ paddingTop: 0 }}>
          <div className="hp-wrap" style={{ maxWidth: 760 }}>
            <Reveal>
              <h2 className="hp-h2">{settings.finalCta.title}</h2>
              <p className="hp-lead" style={{ marginBottom: "2.5rem" }}>{settings.finalCta.subtitle}</p>
              <Link href={settings.finalCta.ctaHref} className="hp-btn hp-btn-primary">
                {settings.finalCta.ctaText}
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="hp-footer">
        <div className="hp-wrap">
          <div className="hp-footer-grid">
            <div>
              <p className="hp-mark" style={{ display: "block", marginBottom: "1.25rem" }}>SSFRS</p>
              <p className="hp-body" style={{ maxWidth: 320, marginBottom: "2rem" }}>{settings.footer.description}</p>
              {socials.length > 0 && (
                <>
                  <h5>{t("followUs")}</h5>
                  <div className="hp-socials">
                    {socials.map((s, i) => (
                      <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="hp-social" aria-label={s.label}>
                        {SOCIAL_ICONS[s.label.toLowerCase()] ?? <Globe size={18} />}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <h5>{t("footerPlatform")}</h5>
              <div className="hp-footer-links">
                <button className="hp-nav-link" style={{ textAlign: "left", color: "#D5DED9" }} onClick={() => goTo("services")}>{tNav("services")}</button>
                <button className="hp-nav-link" style={{ textAlign: "left", color: "#D5DED9" }} onClick={() => goTo("how-it-works")}>{tNav("modules")}</button>
                <button className="hp-nav-link" style={{ textAlign: "left", color: "#D5DED9" }} onClick={() => goTo("about")}>{tNav("about")}</button>
                <button className="hp-nav-link" style={{ textAlign: "left", color: "#D5DED9" }} onClick={() => goTo("testimonials")}>{t("testimonialsBadge")}</button>
              </div>
            </div>

            <div>
              <h5>{t("footerContact")}</h5>
              <div className="hp-footer-links">
                <span>{settings.footer.address}</span>
                <a href={`mailto:${settings.footer.email}`}>{settings.footer.email}</a>
                <a href={`tel:${settings.footer.phone}`}>{settings.footer.phone}</a>
              </div>
            </div>

            <div>
              <h5>{tNav("getStarted")}</h5>
              <div className="hp-footer-links">
                <Link href="/register">{t("footerRegister")}</Link>
                <Link href="/login">{t("footerLogin")}</Link>
              </div>
            </div>
          </div>

          <div className="hp-copy">© {new Date().getFullYear()} SSFRS</div>
        </div>
      </footer>
    </div>
  );
}
