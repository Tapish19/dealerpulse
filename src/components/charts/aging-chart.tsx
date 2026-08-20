"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AgingChart({ data }: { data: { label: string; count: number }[] }) {
  return <div className="h-[230px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#eef0f3"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#7b8492" }}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#7b8492" }}/><Tooltip cursor={{ fill: "#f7f8fa" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e5e9" }}/><Bar dataKey="count" name="Active leads" fill="#6f86bc" radius={[6,6,0,0]} maxBarSize={46}/></BarChart></ResponsiveContainer></div>;
}
