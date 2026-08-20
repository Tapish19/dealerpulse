import { DashboardFilters } from "@/components/filters/dashboard-filters";
import { MetricCard } from "./metric-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "./section-header";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { AgingChart } from "@/components/charts/aging-chart";
import { Funnel } from "./funnel";
import { ActionCenter } from "./action-center";
import { DeliveryPerformance } from "./delivery-performance";
import { ComparisonStrip } from "./comparison-strip";
import { LeadTable } from "@/components/leads/lead-table";
import { ExportCsvButton } from "./export-csv-button";
import { formatINR, formatPct, formatDate } from "@/lib/format";
import type { Branch, SalesRep } from "@/types/dealership";
import type { LeadDrawerData } from "@/components/leads/lead-drawer";

export function RepDashboard({ vm, branches, reps, activeRows }: { vm:any; branches:Branch[]; reps:SalesRep[]; activeRows:LeadDrawerData[] }) {
  const m=vm.metrics;
  const comparison=[
    {label:"Conversion", person:m.conversion, benchmark:vm.branchMetrics.conversion, format:"pct" as const},
    {label:"Deliveries", person:m.units, benchmark:vm.branchMetrics.units/Math.max(1,reps.filter((r)=>r.branchId===vm.rep.branchId&&r.role==="sales_officer").length), format:"number" as const},
    {label:"Delivery cycle", person:vm.delivery.averageCycleDays, benchmark:vm.branchDelivery.averageCycleDays, format:"days" as const},
  ];
  const exportRows=activeRows.map((r)=>({lead_id:r.id,customer:r.customerName,stage:r.stage,days_idle:r.daysIdle??0,vehicle:r.vehicleModel??"",pipeline_value:r.expectedRevenue}));
  return <>
    <DashboardFilters filters={vm.filters} branches={branches} reps={reps} lockBranch lockRep/>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="Leads handled" value={String(m.cohortSize)} meta="Created in selected cohort"/>
      <MetricCard label="Vehicles delivered" value={String(m.units)} meta={formatINR(m.revenue) + " delivered revenue"}/>
      <MetricCard label="Lead conversion" value={formatPct(m.conversion)} meta={`Branch avg ${formatPct(vm.branchMetrics.conversion)}`} tone={m.conversion>=vm.branchMetrics.conversion?"success":"warning"}/>
      <MetricCard label="Active pipeline" value={String(m.activePipeline)} meta={`${m.highIntentActive} high-intent`}/>
      <MetricCard label="Stale leads" value={String(m.atRisk)} meta={`${m.highIntentAtRisk} high-priority`} tone={m.highIntentAtRisk?"danger":"success"}/>
    </section>
    <section className="mt-6"><SectionHeader title="Coaching snapshot" description={`How ${vm.rep.name} compares with ${vm.branch.name}`}/><ComparisonStrip items={comparison}/></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]"><Card><CardHeader><SectionHeader title="Delivery trend" description="Rep-level monthly output"/></CardHeader><CardContent><SalesTrendChart data={vm.trend} showTarget={false}/></CardContent></Card><ActionCenter insights={vm.insights}/></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-2"><Card><CardHeader><SectionHeader title="Rep funnel" description="Stage conversion for this representative’s lead cohort"/></CardHeader><CardContent><Funnel data={vm.funnel}/></CardContent></Card><Card><CardHeader><SectionHeader title="Lead aging" description="Current workload by inactivity window"/></CardHeader><CardContent><AgingChart data={vm.aging}/></CardContent></Card></section>
    <section className="mt-8"><SectionHeader title="Delivery execution" description="Customer handoff after orders"/><Card><CardContent className="pt-5"><DeliveryPerformance data={vm.delivery}/></CardContent></Card></section>
    <section id="attention-leads" className="mt-8"><SectionHeader title="Active lead book" description="Open opportunities as of the selected end date" action={<ExportCsvButton rows={exportRows} filename={`${vm.rep.id}-active-leads.csv`}/>}/><Card><CardContent className="px-2 pt-2 md:px-4"><LeadTable rows={activeRows}/></CardContent></Card></section>
    <footer className="mt-10 border-t border-[#e3e6ea] py-6 text-xs text-[#8a93a2]">As-of {formatDate(vm.asOf)} · Sales officers are compared with equivalent-role peers only.</footer>
  </>;
}
