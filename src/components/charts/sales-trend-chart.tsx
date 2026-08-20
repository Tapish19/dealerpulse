"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/format";

type Row = { month: string; units: number; revenue: number; targetUnits: number; targetRevenue: number; attainment: number };

export function SalesTrendChart({ data, showTarget = true }: { data: Row[]; showTarget?: boolean }) {
  const rows = data.map((d) => ({ ...d, label: new Date(`${d.month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short" }) }));
  return (
    <div className="h-[270px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef0f3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#7b8492" }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#7b8492" }} />
          <Tooltip cursor={{ fill: "#f7f8fa" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e5e9", boxShadow: "0 10px 30px rgba(0,0,0,.08)" }} formatter={(value, name, item) => name === "Revenue" ? [formatINR(item.payload.revenue), "Revenue"] : [value, name]} />
          <Bar dataKey="units" name="Delivered" fill="#315fce" radius={[5, 5, 0, 0]} maxBarSize={34} />
          {showTarget && <Line type="monotone" dataKey="targetUnits" name="Target" stroke="#111827" strokeWidth={2} dot={{ r: 3, fill: "#111827" }} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
