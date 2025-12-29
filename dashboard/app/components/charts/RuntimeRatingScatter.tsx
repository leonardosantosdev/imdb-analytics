"use client";

import {
  CartesianGrid,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";

interface RuntimeRatingDatum {
  genre: string;
  avgRuntimeMinutes: number;
  avgRating: number;
  titleCount: number;
}

interface RuntimeRatingScatterProps {
  data: RuntimeRatingDatum[];
  emptyLabel?: string;
  avgRuntimeLabel?: string;
  avgRatingLabel?: string;
}

export function RuntimeRatingScatter({
  data,
  emptyLabel = "No data available.",
  avgRuntimeLabel = "Avg runtime",
  avgRatingLabel = "Avg rating"
}: RuntimeRatingScatterProps) {
  if (!data.length) {
    return <p className="empty">{emptyLabel}</p>;
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ left: 8, right: 8 }}>
          <CartesianGrid stroke="var(--grid)" />
          <XAxis
            type="number"
            dataKey="avgRuntimeMinutes"
            unit=" min"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <YAxis
            type="number"
            dataKey="avgRating"
            domain={[6, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <ZAxis dataKey="titleCount" range={[80, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "var(--grid)" }}
            formatter={(value: number, name: string) => {
              if (name === "avgRuntimeMinutes") {
                return [`${value} min`, avgRuntimeLabel];
              }
              if (name === "avgRating") {
                return [value.toFixed(2), avgRatingLabel];
              }
              return [value, name];
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              boxShadow: "var(--tooltip-shadow)"
            }}
          />
          <Scatter data={data} fill="var(--accent)" name="avgRating" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
