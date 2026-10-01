import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR } from "../lib/format";
import type { revenueTrend } from "../data/mockData";

export function RevenueChart({ data }: { data: typeof revenueTrend }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="atRiskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B3402A" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#B3402A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="recoveredFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F7A4D" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#1F7A4D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DD" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#8B8579" }}
            axisLine={{ stroke: "#E5E2DD" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8B8579" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatINR(v, { compact: true })}
            width={48}
          />
          <Tooltip
            formatter={(value, name) => [formatINR(Number(value)), name === "atRisk" ? "Revenue at Risk" : "Revenue Recovered"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E5E2DD",
              fontSize: 12,
              fontFamily: "IBM Plex Mono, monospace",
            }}
          />
          <Area
            type="monotone"
            dataKey="atRisk"
            stroke="#B3402A"
            strokeWidth={2}
            fill="url(#atRiskFill)"
          />
          <Area
            type="monotone"
            dataKey="recovered"
            stroke="#1F7A4D"
            strokeWidth={2}
            fill="url(#recoveredFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
