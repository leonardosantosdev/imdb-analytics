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
          <CartesianGrid stroke="rgba(27, 26, 23, 0.06)" />
          <XAxis
            type="number"
            dataKey="avgRuntimeMinutes"
            unit=" min"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <YAxis
            type="number"
            dataKey="avgRating"
            domain={[6, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#5f5b54" }}
          />
          <ZAxis dataKey="titleCount" range={[80, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
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
              border: "1px solid rgba(27, 26, 23, 0.08)",
              boxShadow: "0 10px 30px rgba(20, 18, 14, 0.12)"
            }}
          />
          <Scatter data={data} fill="#2a9d8f" name="avgRating" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
