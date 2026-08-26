import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, meta, tone = "neutral", progress, delta }: { label: string; value: string; meta: string; tone?: "neutral" | "success" | "warning" | "danger"; progress?: number; delta?: number }) {
  const toneClass = tone === "success" ? "text-[#0b8058]" : tone === "warning" ? "text-[#a66100]" : tone === "danger" ? "text-[#bd3838]" : "text-[#667085]";
  return (
    <Card className="min-w-0">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-[#667085]">{label}</p>
          {delta !== undefined && <span className={cn("flex items-center text-xs font-semibold", delta >= 0 ? "text-[#0b8058]" : "text-[#bd3838]")}>{delta >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(delta).toFixed(1)}%</span>}
        </div>
        <div className="metric-value mt-3 text-[30px] font-bold leading-none md:text-[34px]">{value}</div>
        <p className={cn("mt-2 text-xs font-medium", toneClass)}>{meta}</p>
        {progress !== undefined && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]"><div className={cn("h-full rounded-full", progress >= .95 ? "bg-[#14966b]" : progress >= .8 ? "bg-[#df8b14]" : "bg-[#d54b4b]")} style={{ width: `${Math.min(100, Math.max(3, progress * 100))}%` }} /></div>}
      </CardContent>
    </Card>
  );
}
