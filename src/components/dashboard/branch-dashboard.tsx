import { DashboardFilters } from "@/components/filters/dashboard-filters";
import { MetricCard } from "./metric-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "./section-header";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { AgingChart } from "@/components/charts/aging-chart";
import { Funnel } from "./funnel";
import { ActionCenter } from "./action-center";
import { TargetForecast } from "./target-forecast";
import { RepLeaderboard } from "./rep-leaderboard";
import { DeliveryPerformance } from "./delivery-performance";
import { WhatIfSimulator } from "./what-if-simulator";
import { LeadTable } from "@/components/leads/lead-table";
import { ExportCsvButton } from "./export-csv-button";
import { formatINR, formatPct, formatDate } from "@/lib/format";
import type { Branch, SalesRep } from "@/types/dealership";
import type { LeadDrawerData } from "@/components/leads/lead-drawer";

export function BranchDashboard({ vm, branches, reps, attentionRows }: { vm:any; branches:Branch[]; reps:SalesRep[]; attentionRows:LeadDrawerData[] }) {
  const m=vm.metrics;
  const exportRows=attentionRows.map((r)=>({lead_id:r.id,customer:r.customerName,stage:r.stage,rep:r.repName,days_idle:r.daysIdle??0,pipeline_value:r.expectedRevenue}));
  return <>
    <DashboardFilters filters={vm.filters} branches={branches} reps={reps} lockBranch/>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="Vehicles delivered" value={String(m.units)} meta={`${Math.round(m.unitAttainment*100)}% of ${m.unitTarget}-unit target`} progress={m.unitAttainment} tone={m.unitAttainment>=.95?"success":m.unitAttainment>=.8?"warning":"danger"}/>
      <MetricCard label="Revenue" value={formatINR(m.revenue)} meta={`${Math.round(m.revenueAttainment*100)}% of revenue target`} progress={m.revenueAttainment}/>
      <MetricCard label="Lead conversion" value={formatPct(m.conversion)} meta={`${m.cohortSize} leads in selected cohort`}/>
      <MetricCard label="Active pipeline" value={String(m.activePipeline)} meta={`${m.highIntentActive} high intent · ${formatINR(m.pipelineValue)}`}/>
      <MetricCard label="At-risk leads" value={String(m.atRisk)} meta={`${m.highIntentAtRisk} high-priority`} tone={m.highIntentAtRisk?"danger":"success"}/>
    </section>
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Card><CardHeader><SectionHeader title="Branch sales trajectory" description="Monthly deliveries against branch target"/></CardHeader><CardContent><SalesTrendChart data={vm.trend}/></CardContent></Card><ActionCenter insights={vm.insights}/></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-3"><Card><CardHeader><SectionHeader title="Latest-month target" description="Transparent forecast from current pipeline"/></CardHeader><CardContent><TargetForecast forecast={vm.forecast}/></CardContent></Card><Card><CardHeader><SectionHeader title="Branch funnel" description="Find where opportunities stop progressing"/></CardHeader><CardContent><Funnel data={vm.funnel}/></CardContent></Card><Card><CardHeader><SectionHeader title="Lead aging" description="Open leads by days since last stage move"/></CardHeader><CardContent><AgingChart data={vm.aging}/></CardContent></Card></section>
    <section className="mt-6"><Card><CardHeader><SectionHeader title="What-if scenario" description="Estimate impact from improving this branch's test-drive → order conversion"/></CardHeader><CardContent><WhatIfSimulator data={vm.whatIf}/></CardContent></Card></section>
    <section className="mt-8"><SectionHeader title="Sales officer leaderboard" description="Managers and sales officers are not ranked together; this table compares equivalent roles."/><Card><CardContent className="px-2 pt-2 md:px-4"><RepLeaderboard rows={vm.reps} filters={vm.filters}/></CardContent></Card></section>
    <section className="mt-8"><SectionHeader title="Delivery operations" description="Order-to-delivery cycle and recorded delay reasons"/><Card><CardContent className="pt-5"><DeliveryPerformance data={vm.delivery}/></CardContent></Card></section>
    <section id="attention-leads" className="mt-8 scroll-mt-24"><SectionHeader title="Branch follow-up queue" description="Leads that have not moved for seven or more days" action={<ExportCsvButton rows={exportRows} filename={`${vm.branch.id}-at-risk-leads.csv`}/>}/><Card><CardContent className="px-2 pt-2 md:px-4"><LeadTable rows={attentionRows}/></CardContent></Card></section>
    <footer className="mt-10 border-t border-[#e3e6ea] py-6 text-xs text-[#8a93a2]">As-of {formatDate(vm.asOf)} · Drill-down preserves selected time range in the URL.</footer>
  </>;
}
