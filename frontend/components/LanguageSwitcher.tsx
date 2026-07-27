"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import type { Locale } from "@/i18n/routing";
import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

const LOCALES = [
  { code: "en", flag: "🇬🇧" },
  { code: "fr", flag: "🇫🇷" },
  { code: "rw", flag: "🇷🇼" },
  { code: "es", flag: "🇪🇸" },
  { code: "de", flag: "🇩🇪" },
  { code: "it", flag: "🇮🇹" },
  { code: "pt", flag: "🇵🇹" },
] as const;

interface Props {
  variant?: "light" | "dark";
}

export default function LanguageSwitcher({ variant = "dark" }: Props) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const handleSelect = (code: string) => {
    setOpen(false);
    router.replace(pathname, { locale: code });
  };

  const isDark = variant === "dark";
  const textColor = isDark ? "rgba(255,255,255,0.75)" : "#475569";
  const hoverBg = isDark ? "rgba(255,255,255,0.1)" : "#F1F5F9";
  const dropdownBg = isDark ? "#1E293B" : "#fff";
  const dropdownBorder = isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0";
  const dropdownText = isDark ? "rgba(255,255,255,0.85)" : "#334155";
  const dropdownHover = isDark ? "rgba(255,255,255,0.08)" : "#F8FAFC";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.375rem 0.625rem",
          borderRadius: 8,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#E2E8F0"}`,
          background: "transparent",
          color: textColor,
          cursor: "pointer",
          fontSize: "0.8125rem",
          fontWeight: 500,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = hoverBg)}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        title={t("language")}
      >
        <Globe style={{ width: 14, height: 14 }} />
        <span>{current.flag}</span>
        <span>{t(current.code as Locale)}</span>
        <ChevronDown
          style={{
            width: 12,
            height: 12,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 48 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 150,
              borderRadius: 10,
              border: `1px solid ${dropdownBorder}`,
              backgroundColor: dropdownBg,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              zIndex: 49,
              overflow: "hidden",
            }}
          >
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleSelect(loc.code)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.875rem",
                  border: "none",
                  background: loc.code === locale ? (isDark ? "rgba(255,255,255,0.1)" : "#EEF2FF") : "transparent",
                  color: loc.code === locale ? (isDark ? "#fff" : "#5B4FE5") : dropdownText,
                  fontWeight: loc.code === locale ? 600 : 400,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (loc.code !== locale) (e.currentTarget as HTMLElement).style.background = dropdownHover;
                }}
                onMouseLeave={(e) => {
                  if (loc.code !== locale) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span>{loc.flag}</span>
                <span>{t(loc.code as Locale)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
