"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  sparklineData?: number[];
}

export function KPICard({ label, value, change, sparklineData }: KPICardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        {change !== undefined && (
          <span className={`text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
          </span>
        )}
        {sparklineData && sparklineData.length > 1 && (
          <div className="h-8 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((v) => ({ v }))}>
                <Line type="monotone" dataKey="v" stroke={change && change >= 0 ? "#16a34a" : "#dc2626"} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
