import { notFound } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { RepDashboard } from "@/components/dashboard/rep-dashboard";
import { getDataset } from "@/data/repository";
import { getRepViewModel, lastActivityAt, statusAt } from "@/analytics/core";
import { presentLead } from "@/analytics/presenters";
import { filtersFromSearch } from "@/lib/query";

export default async function RepPage({ params, searchParams }: { params: Promise<{repId:string}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const [{repId}, search] = await Promise.all([params, searchParams]);
  const dataset=getDataset();
  const vm=getRepViewModel(dataset, repId, filtersFromSearch(search));
  if(!vm) notFound();
  const cutoff=Date.parse(`${vm.filters.to}T23:59:59.999Z`);
  const activeRows=vm.active.map((lead:any)=>{
    const last=lastActivityAt(lead, cutoff);
    const daysIdle=last?Math.max(0,Math.floor((cutoff-Date.parse(last))/86400000)):0;
    return {...presentLead(dataset,lead,daysIdle), stage: statusAt(lead,cutoff)!};
  }).sort((a:any,b:any)=>(b.daysIdle??0)-(a.daysIdle??0));
  return <AppShell backHref={`/branches/${vm.branch.id}?from=${vm.filters.from}&to=${vm.filters.to}`} title={vm.rep.name} subtitle={`Sales Officer · ${vm.branch.name}`} demo={dataset.metadata?.generatedForDemo}><RepDashboard vm={vm} branches={dataset.branches} reps={dataset.reps} activeRows={activeRows}/></AppShell>;
}
