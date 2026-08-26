import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleAlert, Lightbulb } from "lucide-react";
import type { Insight } from "@/types/dealership";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const icon = {
  critical: <CircleAlert size={17}/>,
  warning: <AlertTriangle size={17}/>,
  positive: <CheckCircle2 size={17}/>,
  info: <Lightbulb size={17}/>,
};
const tone = {
  critical: "bg-[#fff0f0] text-[#b83232]",
  warning: "bg-[#fff7e6] text-[#9a5c00]",
  positive: "bg-[#eaf8f2] text-[#087a54]",
  info: "bg-[#edf3ff] text-[#2d5fc8]",
};

export function ActionCenter({ insights }: { insights: Insight[] }) {
  return <Card id="action-center" className="h-full"><CardHeader><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#111827] text-white"><Lightbulb size={16}/></span><div><h2 className="font-bold tracking-[-0.02em]">Action Center</h2><p className="text-xs text-[#7c8594]">Prioritized manager exceptions</p></div></div></CardHeader><CardContent className="mt-4 space-y-3">{insights.length === 0 ? <div className="rounded-xl bg-[#f4faf7] p-4 text-sm text-[#31735b]">No material exceptions are flagged for this view.</div> : insights.map((item) => <div key={item.id} className="rounded-xl border border-[#eceef1] p-4"><div className="flex gap-3"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone[item.severity]}`}>{icon[item.severity]}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold leading-5">{item.title}</h3><p className="mt-1 text-xs leading-5 text-[#667085]">{item.description}</p><Link href={item.actionHref} className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-[#315fce] hover:underline">{item.actionLabel}<ArrowRight size={13}/></Link></div></div></div>)}</CardContent></Card>;
}
