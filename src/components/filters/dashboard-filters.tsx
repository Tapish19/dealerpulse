"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Check, RotateCcw, Share2 } from "lucide-react";
import type { Branch, DashboardFilters, SalesRep } from "@/types/dealership";
import { Button } from "@/components/ui/button";

function setParams(current: URLSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value) next.set(key, value); else next.delete(key);
  }
  return next;
}

export function DashboardFilters({ filters, branches, reps, lockBranch = false, lockRep = false }: { filters: DashboardFilters; branches: Branch[]; reps: SalesRep[]; lockBranch?: boolean; lockRep?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const scopedReps = filters.branchId ? reps.filter((r) => r.branchId === filters.branchId && r.role === "sales_officer") : reps.filter((r) => r.role === "sales_officer");

  const navigate = (patch: Record<string, string | undefined>) => {
    const current = new URLSearchParams();
    current.set("from", filters.from); current.set("to", filters.to);
    if (filters.branchId) current.set("branch", filters.branchId);
    if (filters.repId) current.set("rep", filters.repId);
    const next = setParams(current, patch);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const presets = [
    { label: "This month", from: `${filters.to.slice(0, 7)}-01`, to: filters.to },
    { label: "Last 3 months", from: "2025-10-01", to: "2025-12-31" },
    { label: "All time", from: "2025-06-01", to: "2025-12-31" },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-[#e2e5e9] bg-white p-3 card-shadow md:p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[145px] flex-1 md:flex-none">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#8a93a2]">From</span>
          <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 text-[#98a2b3]" size={16}/><input aria-label="From date" type="date" value={filters.from} onChange={(e) => navigate({ from: e.target.value })} className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white pl-9 pr-2 text-sm outline-none focus:border-[#8ba8e8]" /></div>
        </label>
        <label className="min-w-[145px] flex-1 md:flex-none">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#8a93a2]">To</span>
          <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 text-[#98a2b3]" size={16}/><input aria-label="To date" type="date" value={filters.to} onChange={(e) => navigate({ to: e.target.value })} className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white pl-9 pr-2 text-sm outline-none focus:border-[#8ba8e8]" /></div>
        </label>
        <label className="min-w-[190px] flex-1">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#8a93a2]">Branch</span>
          <select aria-label="Branch" disabled={lockBranch} value={filters.branchId ?? ""} onChange={(e) => navigate({ branch: e.target.value || undefined, rep: undefined })} className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white px-3 text-sm outline-none disabled:bg-[#f6f7f8] disabled:text-[#667085]">
            <option value="">All branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label className="min-w-[185px] flex-1">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#8a93a2]">Sales rep</span>
          <select aria-label="Sales representative" disabled={lockRep} value={filters.repId ?? ""} onChange={(e) => { const id=e.target.value; if (id) router.push(`/reps/${id}?from=${filters.from}&to=${filters.to}`); else navigate({ rep: undefined }); }} className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white px-3 text-sm outline-none disabled:bg-[#f6f7f8] disabled:text-[#667085]">
            <option value="">All reps</option>{scopedReps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2 md:ml-auto">
          {presets.map((p) => <Button key={p.label} variant="secondary" onClick={() => navigate({ from: p.from, to: p.to })}>{p.label}</Button>)}
          <Button variant="secondary" onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              window.prompt("Copy this DealerPulse view", window.location.href);
            }
          }}>{copied ? <><Check size={15}/> Copied</> : <><Share2 size={15}/> Share view</>}</Button>
          <Button aria-label="Reset filters" title="Reset filters" variant="ghost" onClick={() => router.push(pathname)}><RotateCcw size={16}/></Button>
        </div>
      </div>
    </div>
  );
}
