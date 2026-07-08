"use client";

export interface StatItem {
  key: string;
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}

export default function StatRow({ stats }: { stats: StatItem[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem" }}>
      {stats.map((s, i) => (
        <div
          key={s.key}
          style={{
            minWidth: 130,
            paddingRight: i < stats.length - 1 ? "2.5rem" : 0,
            borderRight: i < stats.length - 1 ? "1px solid var(--color-border)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.5rem" }}>
            <span style={{ color: "var(--color-muted-foreground)", display: "flex" }}>{s.icon}</span>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted-foreground)" }}>{s.label}</p>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-foreground)", lineHeight: 1 }}>{s.value}</p>
          {s.sub && <p style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", marginTop: 4, fontWeight: 500 }}>{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
