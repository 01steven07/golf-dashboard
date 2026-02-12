"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export interface DistanceRateData {
  label: string;
  rate: number;
  count: number;
}

interface DistanceRateChartProps {
  data: DistanceRateData[];
  title: string;
  color?: string;
}

export function DistanceRateChart({
  data,
  title,
  color = "#22c55e",
}: DistanceRateChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        データが不足しています
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={70}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toFixed(1)}%`,
                "成功率",
              ]}
            />
            <Bar dataKey="rate" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
