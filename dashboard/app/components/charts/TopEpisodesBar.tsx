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

interface TopEpisodeDatum {
  episodeLabel: string;
  averageRating: number;
}

interface TopEpisodesBarProps {
  data: TopEpisodeDatum[];
  emptyLabel?: string;
  ratingLabel?: string;
}

export function TopEpisodesBar({
  data,
  emptyLabel = "No data available.",
  ratingLabel = "Rating"
}: TopEpisodesBarProps) {
  if (!data.length) {
    return <p className="empty">{emptyLabel}</p>;
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis
            type="number"
            domain={[7, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <YAxis
            dataKey="episodeLabel"
            type="category"
            width={220}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), ratingLabel]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              boxShadow: "var(--tooltip-shadow)"
            }}
          />
          <Bar dataKey="averageRating" fill="var(--accent)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
