import { titleCase } from "@/lib/format";

export function Funnel({ data }: { data: { stage: string; count: number; stageConversion: number; totalConversion: number; dropOff: number }[] }) {
  const max = data[0]?.count || 1;
  return <div className="space-y-3">{data.map((row, i) => <div key={row.stage}><div className="mb-1.5 flex items-center justify-between text-xs"><div className="flex items-center gap-2"><span className="w-[76px] font-semibold text-[#344054]">{titleCase(row.stage)}</span><span className="text-[#98a2b3]">{row.count}</span></div>{i > 0 && <span className={row.stageConversion < .6 ? "font-semibold text-[#b65a45]" : "text-[#667085]"}>{Math.round(row.stageConversion*100)}% from prior</span>}</div><div className="h-2.5 overflow-hidden rounded-full bg-[#f0f2f5]"><div className="h-full rounded-full bg-gradient-to-r from-[#375fc2] to-[#7392db]" style={{ width: `${Math.max(3, row.count / max * 100)}%` }} /></div></div>)}</div>;
}
