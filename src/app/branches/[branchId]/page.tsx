import { notFound } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { BranchDashboard } from "@/components/dashboard/branch-dashboard";
import { getDataset } from "@/data/repository";
import { getBranchViewModel } from "@/analytics/core";
import { presentRiskRows } from "@/analytics/presenters";
import { filtersFromSearch } from "@/lib/query";

export default async function BranchPage({ params, searchParams }: { params: Promise<{branchId:string}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const [{branchId}, search] = await Promise.all([params, searchParams]);
  const dataset=getDataset();
  const vm=getBranchViewModel(dataset, branchId, filtersFromSearch(search));
  if(!vm) notFound();
  const rows=presentRiskRows(dataset, vm.stale);
  return <AppShell backHref={`/?from=${vm.filters.from}&to=${vm.filters.to}`} title={vm.branch.name} subtitle={`${vm.branch.city} · Branch manager view`} demo={dataset.metadata?.generatedForDemo}><BranchDashboard vm={vm} branches={dataset.branches} reps={dataset.reps} attentionRows={rows}/></AppShell>;
}
