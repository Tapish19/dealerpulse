import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardFilters } from "@/components/filters/dashboard-filters";
import { MetricCard } from "./metric-card";
import { ActionCenter } from "./action-center";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { AgingChart } from "@/components/charts/aging-chart";
import { Funnel } from "./funnel";
import { BranchScorecardTable } from "./branch-scorecard";
import { DeliveryPerformance } from "./delivery-performance";
import { TargetForecast } from "./target-forecast";
import { ExecutiveSummary } from "./executive-summary";
import { WhatIfSimulator } from "./what-if-simulator";
import { SectionHeader } from "./section-header";
import { ExportCsvButton } from "./export-csv-button";
import { LeadTable } from "@/components/leads/lead-table";
import { formatINR, formatPct, formatDate } from "@/lib/format";
import type { Branch, SalesRep } from "@/types/dealership";
import type { LeadDrawerData } from "@/components/leads/lead-drawer";

export function OverviewDashboard({ vm, branches, reps, attentionRows }: { vm: any; branches: Branch[]; reps: SalesRep[]; attentionRows: LeadDrawerData[] }) {
  const m = vm.metrics;
  const visibleAttentionRows = attentionRows.slice(0, 20);
  const exportRows = attentionRows.map((r) => ({ lead_id: r.id, customer: r.customerName, stage: r.stage, rep: r.repName, branch: r.branchName, days_idle: r.daysIdle ?? 0, pipeline_value: r.expectedRevenue }));
  const drop = [...vm.funnel].slice(1).sort((a: any,b: any) => a.stageConversion - b.stageConversion)[0];
  return <>
    <DashboardFilters filters={vm.filters} branches={branches} reps={reps}/>
    <ExecutiveSummary text={vm.executiveSummary}/>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="Vehicles delivered" value={String(m.units)} meta={`${Math.round(m.unitAttainment*100)}% of target · ${m.unitTarget} units`} progress={m.unitAttainment} tone={m.unitAttainment >= .95 ? "success" : m.unitAttainment >= .8 ? "warning" : "danger"}/>
      <MetricCard label="Revenue" value={formatINR(m.revenue)} meta={`${Math.round(m.revenueAttainment*100)}% of revenue target`} progress={m.revenueAttainment} tone={m.revenueAttainment >= .95 ? "success" : m.revenueAttainment >= .8 ? "warning" : "danger"}/>
      <MetricCard label="Lead conversion" value={formatPct(m.conversion)} meta={`${m.cohortSize} leads created in cohort`} tone="neutral"/>
      <MetricCard label="Active pipeline" value={String(m.activePipeline)} meta={`${m.highIntentActive} high-intent · ${formatINR(m.pipelineValue)} value`} tone="neutral"/>
      <MetricCard label="Leads at risk" value={String(m.atRisk)} meta={`${m.highIntentAtRisk} high-priority follow-ups`} tone={m.highIntentAtRisk > 0 ? "danger" : "success"}/>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
      <Card><CardHeader><SectionHeader title="Sales vs target" description="Delivered units by month with branch targets overlaid"/></CardHeader><CardContent><SalesTrendChart data={vm.trend}/></CardContent></Card>
      <ActionCenter insights={vm.insights}/>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
      <Card><CardHeader><SectionHeader title="Latest-month forecast" description="Explainable pipeline-weighted outlook"/></CardHeader><CardContent><TargetForecast forecast={vm.forecast}/></CardContent></Card>
      <Card><CardHeader><SectionHeader title="Conversion funnel" description={drop ? `Largest leak: ${Math.round((1-drop.stageConversion)*100)}% before ${String(drop.stage).replaceAll('_',' ')}` : "Lead journey progression"}/></CardHeader><CardContent><Funnel data={vm.funnel}/></CardContent></Card>
      <Card><CardHeader><SectionHeader title="Lead aging" description="Days since the last meaningful status change"/></CardHeader><CardContent><AgingChart data={vm.aging}/></CardContent></Card>
    </section>

    <section className="mt-6">
      <Card><CardHeader><SectionHeader title="What-if scenario" description="Estimate the commercial impact of improving test-drive → order conversion"/></CardHeader><CardContent><WhatIfSimulator data={vm.whatIf}/></CardContent></Card>
    </section>

    <section id="branches" className="mt-8">
      <SectionHeader title="Branch performance" description="Ranked on unit target attainment, with drill-down into each branch"/>
      <Card><CardContent className="px-2 pt-2 md:px-4"><BranchScorecardTable rows={vm.branches} filters={vm.filters}/></CardContent></Card>
    </section>

    <section className="mt-8">
      <SectionHeader title="Delivery operations" description="Post-order execution, cycle time, and recorded delay reasons"/>
      <Card><CardContent className="pt-5"><DeliveryPerformance data={vm.delivery}/></CardContent></Card>
    </section>

    <section id="attention-leads" className="mt-8 scroll-mt-24">
      <SectionHeader title="Manager follow-up queue" description={`Top ${Math.min(20, attentionRows.length)} of ${attentionRows.length} open leads with no stage movement for 7+ days`} action={<ExportCsvButton rows={exportRows} filename="dealerpulse-at-risk-leads.csv"/>}/>
      <Card><CardContent className="px-2 pt-2 md:px-4"><LeadTable rows={visibleAttentionRows}/></CardContent></Card>
    </section>

    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e6ea] py-6 text-xs text-[#8a93a2]">
      <span>As-of date: {formatDate(vm.asOf)} · Lead aging uses dataset time, not today.</span>
      <span>Conversion = leads created in selected period that reached delivered by period end.</span>
    </footer>
  </>;
}
