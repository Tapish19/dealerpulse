"use client";

import { useEffect, useRef } from "react";
import { CalendarClock, CircleDollarSign, MapPin, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatINR, titleCase } from "@/lib/format";
import type { LeadStage, StatusEvent } from "@/types/dealership";

export interface LeadDrawerData {
  id: string;
  customerName: string;
  branchName: string;
  repName: string;
  vehicleModel?: string;
  expectedRevenue: number;
  stage: LeadStage;
  daysIdle?: number;
  source?: string;
  statusHistory: StatusEvent[];
}

function stageVariant(stage: LeadStage): "neutral" | "info" | "warning" | "success" | "danger" {
  if (stage === "delivered") return "success";
  if (stage === "lost") return "danger";
  if (stage === "negotiation" || stage === "ordered") return "warning";
  if (stage === "test_drive") return "info";
  return "neutral";
}

export function LeadDrawer({ open, onClose, data }: { open: boolean; onClose: () => void; data: LeadDrawerData | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  if (!data) return null;
  return <dialog ref={dialogRef} onClose={onClose} className="m-0 ml-auto h-full max-h-none w-full max-w-[520px] border-0 bg-white p-0 shadow-2xl backdrop:bg-[#111827]/25"><div className="flex h-full flex-col"><div className="flex items-start justify-between border-b border-[#eceef1] p-5"><div><div className="text-xs font-semibold uppercase tracking-[.08em] text-[#98a2b3]">Lead journey</div><h2 className="mt-1 text-xl font-bold tracking-[-.03em]">{data.customerName}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><Badge variant={stageVariant(data.stage)}>{titleCase(data.stage)}</Badge>{data.daysIdle !== undefined && data.daysIdle >= 7 && <Badge variant="danger">{data.daysIdle} days idle</Badge>}</div></div><Button variant="ghost" onClick={onClose} aria-label="Close lead details"><X size={18}/></Button></div><div className="overflow-y-auto p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f7f8fa] p-3"><UserRound size={15} className="text-[#667085]"/><div className="mt-2 text-xs text-[#98a2b3]">Owner</div><div className="mt-0.5 text-sm font-semibold">{data.repName}</div></div><div className="rounded-xl bg-[#f7f8fa] p-3"><MapPin size={15} className="text-[#667085]"/><div className="mt-2 text-xs text-[#98a2b3]">Branch</div><div className="mt-0.5 text-sm font-semibold">{data.branchName}</div></div><div className="rounded-xl bg-[#f7f8fa] p-3"><CircleDollarSign size={15} className="text-[#667085]"/><div className="mt-2 text-xs text-[#98a2b3]">Pipeline value</div><div className="mt-0.5 text-sm font-semibold">{formatINR(data.expectedRevenue)}</div></div><div className="rounded-xl bg-[#f7f8fa] p-3"><CalendarClock size={15} className="text-[#667085]"/><div className="mt-2 text-xs text-[#98a2b3]">Vehicle</div><div className="mt-0.5 text-sm font-semibold">{data.vehicleModel ?? "Not specified"}</div></div></div><div className="mt-7"><div className="mb-4 text-xs font-bold uppercase tracking-[.08em] text-[#667085]">Status timeline</div><div className="relative ml-2 border-l border-[#dfe3e8] pl-6">{data.statusHistory.map((event, idx) => <div key={`${event.status}-${event.timestamp}-${idx}`} className="relative pb-6 last:pb-0"><span className="absolute -left-[31px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#4d6fbe] ring-1 ring-[#b8c7e8]"/><div className="flex items-baseline justify-between gap-3"><div className="text-sm font-bold">{titleCase(event.status)}</div><time className="shrink-0 text-[11px] text-[#98a2b3]">{formatDate(event.timestamp)}</time></div>{event.note && <p className="mt-1 text-xs leading-5 text-[#667085]">{event.note}</p>}</div>)}</div></div></div></div></dialog>;
}
