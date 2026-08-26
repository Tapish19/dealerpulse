import { AppShell } from "@/components/dashboard/app-shell";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { getDataset } from "@/data/repository";
import { getOverviewViewModel } from "@/analytics/core";
import { presentRiskRows } from "@/analytics/presenters";
import { filtersFromSearch } from "@/lib/query";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const dataset = getDataset();
  const vm = getOverviewViewModel(dataset, filtersFromSearch(search));
  const attentionRows = presentRiskRows(dataset, vm.stale);
  const selectedBranch = dataset.branches.find((b) => b.id === vm.filters.branchId);
  const selectedRep = dataset.reps.find((r) => r.id === vm.filters.repId);
  const scope = selectedRep?.name ?? selectedBranch?.name ?? "Group performance";
  return <AppShell title={scope} subtitle={`Leadership view · ${vm.filters.from} → ${vm.filters.to}`} demo={dataset.metadata?.generatedForDemo}><OverviewDashboard vm={vm} branches={dataset.branches} reps={dataset.reps} attentionRows={attentionRows}/></AppShell>;
}
