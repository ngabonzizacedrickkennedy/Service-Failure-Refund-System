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
  children: React.ReactNode;
}

export default function ChartCard({ title, subtitle, delay = 0, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ ...CARD_STYLE, padding: "1.5rem" }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: subtitle ? 2 : "1rem" }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>{subtitle}</p>
      )}
      {children}
    </motion.div>
  );
}
