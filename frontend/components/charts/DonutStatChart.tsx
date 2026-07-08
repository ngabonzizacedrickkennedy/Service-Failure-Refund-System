"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface DonutDatum {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutStatChartProps {
  data: DonutDatum[];
  centerLabel?: string;
  emptyMessage?: string;
}

export default function DonutStatChart({ data, centerLabel = "Total", emptyMessage = "No data yet" }: DonutStatChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-muted-foreground)" }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={nonZero}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={2}
              isAnimationActive={true}
            >
              {nonZero.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, entry) => {
                const v = Number(value) || 0;
                return [`${v} (${((v / total) * 100).toFixed(0)}%)`, entry?.payload?.label];
              }}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--color-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-foreground)", lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted-foreground)", marginTop: 2 }}>
            {centerLabel}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginTop: "0.75rem" }}>
        {data.map((d) => (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem" }}>
            <span style={{ height: 8, width: 8, borderRadius: "50%", backgroundColor: d.color, flexShrink: 0 }} />
            <span style={{ color: "var(--color-muted-foreground)" }}>{d.label}</span>
            <span style={{ color: "var(--color-foreground)", fontWeight: 700 }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
