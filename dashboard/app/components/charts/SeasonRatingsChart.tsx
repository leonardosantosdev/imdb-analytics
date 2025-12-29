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

interface SeasonRatingsChartProps {
  data: Array<Record<string, number | string>>;
  series: string[];
  emptyLabel?: string;
}

const palette = [
  "var(--accent)",
  "var(--series-muted-1)",
  "var(--series-muted-2)",
  "var(--series-muted-3)"
];

export function SeasonRatingsChart({
  data,
  series,
  emptyLabel = "No data available."
}: SeasonRatingsChartProps) {
  if (!data.length) {
    return <p className="empty">{emptyLabel}</p>;
  }

  const primary = series[0];

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="seasonNumber"
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
            formatter={(value: number) => value.toFixed(2)}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              boxShadow: "var(--tooltip-shadow)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
          {series.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={palette[index % palette.length]}
              strokeWidth={name === primary ? 3 : 1.5}
              strokeOpacity={name === primary ? 1 : 0.4}
              dot={name === primary}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
