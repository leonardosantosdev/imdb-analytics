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
          <CartesianGrid vertical={false} stroke="rgba(27, 26, 23, 0.06)" />
          <XAxis
            dataKey="genre"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <YAxis
            domain={[6, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), tooltipLabel]}
            cursor={{ fill: "rgba(255, 107, 61, 0.12)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(27, 26, 23, 0.08)",
              boxShadow: "0 10px 30px rgba(20, 18, 14, 0.12)"
            }}
          />
          <Bar dataKey="weightedRating" fill="#ff6b3d" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
