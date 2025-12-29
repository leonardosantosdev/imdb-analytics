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
          <CartesianGrid horizontal={false} stroke="rgba(27, 26, 23, 0.06)" />
          <XAxis
            type="number"
            domain={[7, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <YAxis
            dataKey="episodeLabel"
            type="category"
            width={220}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), ratingLabel]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(27, 26, 23, 0.08)",
              boxShadow: "0 10px 30px rgba(20, 18, 14, 0.12)"
            }}
          />
          <Bar dataKey="averageRating" fill="#6d597a" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
