"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";

interface GenrePopularityLineProps {
  data: Array<Record<string, number | string>>;
  genres: string[];
  emptyLabel?: string;
}

const palette = [
  "#2a9d8f",
  "#264653",
  "#e9c46a",
  "#f4a261",
  "#e76f51",
  "#6d597a",
  "#4c7c59"
];

export function GenrePopularityLine({
  data,
  genres,
  emptyLabel = "No data available."
}: GenrePopularityLineProps) {
  if (!data.length) {
    return <p className="empty">{emptyLabel}</p>;
  }

  const primary = genres[0];

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} stroke="rgba(27, 26, 23, 0.06)" />
          <XAxis
            dataKey="decade"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <YAxis
            tickFormatter={value => `${Math.round(Number(value) / 1000000)}M`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <Tooltip
            formatter={(value: number) => value.toLocaleString()}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(27, 26, 23, 0.08)",
              boxShadow: "0 10px 30px rgba(20, 18, 14, 0.12)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {genres.map((genre, index) => (
            <Line
              key={genre}
              type="monotone"
              dataKey={genre}
              stroke={palette[index % palette.length]}
              strokeWidth={genre === primary ? 3 : 1.5}
              strokeOpacity={genre === primary ? 1 : 0.4}
              dot={genre === primary}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
