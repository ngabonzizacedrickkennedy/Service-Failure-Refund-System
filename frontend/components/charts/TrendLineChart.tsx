"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TrendDatum {
  key: string;
  label: string;
  value: number;
}

interface TrendLineChartProps {
  data: TrendDatum[];
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  height?: number;
}

const RANGE_OPTIONS: { key: string; label: string; months: number }[] = [
  { key: "6M", label: "6M", months: 6 },
  { key: "12M", label: "12M", months: 12 },
  { key: "ALL", label: "All", months: Infinity },
];

function navButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    height: 24,
    width: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    border: "1px solid var(--color-border)",
    background: "var(--color-muted)",
    color: enabled ? "var(--color-foreground)" : "var(--color-muted-foreground)",
    cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.45,
  };
}

export default function TrendLineChart({ data, valueFormatter, emptyMessage = "No data yet", height = 200 }: TrendLineChartProps) {
  const [range, setRange] = useState<string>("6M");
  const [offset, setOffset] = useState(0);

  if (data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-muted-foreground)" }}>{emptyMessage}</p>
      </div>
    );
  }

  const rangeMonths = RANGE_OPTIONS.find((r) => r.key === range)?.months ?? 6;
  const windowSize = Math.min(rangeMonths, data.length);
  const maxOffset = Math.max(0, data.length - windowSize);
  const clampedOffset = Math.min(offset, maxOffset);

  const end = data.length - clampedOffset;
  const start = Math.max(0, end - windowSize);
  const visible = data.slice(start, end);

  const canGoOlder = start > 0;
  const canGoNewer = clampedOffset > 0;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value?: number | string }[] }) => {
    if (!active || !payload || !payload.length) return null;
    const v = Number(payload[0].value) || 0;
    return (
      <div
        style={{
          background: "var(--color-foreground)",
          color: "var(--color-card)",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "var(--shadow-elevated)",
          whiteSpace: "nowrap",
        }}
      >
        {valueFormatter ? valueFormatter(v) : v}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => canGoOlder && setOffset(clampedOffset + windowSize)}
            disabled={!canGoOlder}
            style={navButtonStyle(canGoOlder)}
            aria-label="Older"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => canGoNewer && setOffset(Math.max(0, clampedOffset - windowSize))}
            disabled={!canGoNewer}
            style={navButtonStyle(canGoNewer)}
            aria-label="Newer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div style={{ display: "flex", gap: 2, backgroundColor: "var(--color-muted)", borderRadius: 999, padding: 2 }}>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => { setRange(r.key); setOffset(0); }}
              style={{
                padding: "3px 11px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: range === r.key ? "var(--color-card)" : "transparent",
                color: range === r.key ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                boxShadow: range === r.key ? "var(--shadow-sm)" : "none",
                transition: "background-color 0.12s, color 0.12s",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip cursor={{ stroke: "var(--color-border)", strokeDasharray: "4 4" }} content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-foreground)", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
