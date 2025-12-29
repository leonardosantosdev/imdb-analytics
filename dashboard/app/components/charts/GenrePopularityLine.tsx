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
  "var(--accent)",
  "var(--series-muted-1)",
  "var(--series-muted-2)",
  "var(--series-muted-3)",
  "var(--series-muted-4)",
  "var(--series-muted-5)",
  "var(--series-muted-6)"
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
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="decade"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <YAxis
            tickFormatter={value => `${Math.round(Number(value) / 1000000)}M`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <Tooltip
            formatter={(value: number) => value.toLocaleString()}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              boxShadow: "var(--tooltip-shadow)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
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
