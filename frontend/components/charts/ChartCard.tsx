"use client";

import { motion } from "framer-motion";

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 20,
  boxShadow: "var(--shadow-card)",
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  delay?: number;
  compact?: boolean;
  children: React.ReactNode;
}

export default function ChartCard({ title, subtitle, delay = 0, compact = false, children }: ChartCardProps) {
  const padding = compact ? "1rem 1.125rem" : "1.5rem";
  const bodyGap = compact ? "0.625rem" : "1rem";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ ...CARD_STYLE, padding }}
    >
      <p style={{ fontSize: compact ? 9 : 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: subtitle ? 2 : bodyGap }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: compact ? "0.6875rem" : "0.75rem", color: "var(--color-muted-foreground)", marginBottom: bodyGap }}>{subtitle}</p>
      )}
      {children}
    </motion.div>
  );
}
