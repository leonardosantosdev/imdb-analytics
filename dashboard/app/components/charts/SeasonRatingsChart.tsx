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

const palette = ["#e76f51", "#2a9d8f", "#264653", "#f4a261"];

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
          <CartesianGrid vertical={false} stroke="rgba(27, 26, 23, 0.06)" />
          <XAxis
            dataKey="seasonNumber"
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
            formatter={(value: number) => value.toFixed(2)}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(27, 26, 23, 0.08)",
              boxShadow: "0 10px 30px rgba(20, 18, 14, 0.12)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
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
