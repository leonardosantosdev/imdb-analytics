"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface GenreWeightedDatum {
  genre: string;
  weightedRating: number;
}

interface GenreWeightedBarProps {
  data: GenreWeightedDatum[];
  emptyLabel?: string;
  tooltipLabel?: string;
}

export function GenreWeightedBar({
  data,
  emptyLabel = "No data available.",
  tooltipLabel = "Weighted rating"
}: GenreWeightedBarProps) {
  if (!data.length) {
    return <p className="empty">{emptyLabel}</p>;
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="genre"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <YAxis
            domain={[6, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), tooltipLabel]}
            cursor={{ fill: "var(--accent-soft)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              boxShadow: "var(--tooltip-shadow)"
            }}
          />
          <Bar dataKey="weightedRating" fill="var(--accent)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
