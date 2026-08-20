import type {
  Branch,
  DashboardFilters,
  DealershipDataset,
  Delivery,
  Insight,
  Lead,
  LeadStage,
  SalesRep,
} from "../types/dealership";
import { STAGES } from "../types/dealership";

const DAY = 86_400_000;
const HIGH_INTENT = new Set<LeadStage>(["test_drive", "negotiation", "ordered"]);

export const DEFAULT_FROM = "2025-10-01";
export const DEFAULT_TO = "2025-12-31";

function atStart(value: string): number {
  return Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
}
function atEnd(value: string): number {
  return Date.parse(`${value.slice(0, 10)}T23:59:59.999Z`);
}
function monthKey(timestamp: string | number): string {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
function daysBetween(a: number, b: number): number {
  return Math.max(0, Math.floor((b - a) / DAY));
}
function safeRate(num: number, den: number): number {
  return den > 0 ? num / den : 0;
}
function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function getDatasetAsOf(dataset: DealershipDataset): string {
  const stamps: number[] = [];
  for (const lead of dataset.leads) {
    stamps.push(Date.parse(lead.createdAt));
    for (const h of lead.statusHistory) stamps.push(Date.parse(h.timestamp));
  }
  for (const d of dataset.deliveries) stamps.push(Date.parse(d.deliveredAt));
  const max = Math.max(...stamps.filter(Number.isFinite));
  return new Date(max).toISOString();
}

export function clampFilters(dataset: DealershipDataset, filters: Partial<DashboardFilters>): DashboardFilters {
  const asOf = getDatasetAsOf(dataset).slice(0, 10);
  const minCreated = dataset.leads.reduce((min, l) => (l.createdAt < min ? l.createdAt : min), dataset.leads[0]?.createdAt ?? DEFAULT_FROM).slice(0, 10);
  let from = filters.from || DEFAULT_FROM;
  let to = filters.to || asOf || DEFAULT_TO;
  if (from < minCreated) from = minCreated;
  if (to > asOf) to = asOf;
  if (from > to) from = to;
  let branchId = filters.branchId && dataset.branches.some((b) => b.id === filters.branchId) ? filters.branchId : undefined;
  const repId = filters.repId && dataset.reps.some((r) => r.id === filters.repId) ? filters.repId : undefined;
  if (repId) branchId = dataset.reps.find((r) => r.id === repId)?.branchId ?? branchId;
  return { from, to, branchId, repId };
}

export function statusAt(lead: Lead, at: string | number): LeadStage | null {
  const cutoff = typeof at === "number" ? at : Date.parse(at);
  if (Date.parse(lead.createdAt) > cutoff) return null;
  let current: LeadStage = "new";
  for (const event of lead.statusHistory) {
    if (Date.parse(event.timestamp) <= cutoff) current = event.status;
    else break;
  }
  return current;
}

export function lastActivityAt(lead: Lead, at: string | number): string | null {
  const cutoff = typeof at === "number" ? at : Date.parse(at);
  let last: string | null = Date.parse(lead.createdAt) <= cutoff ? lead.createdAt : null;
  for (const event of lead.statusHistory) {
    if (Date.parse(event.timestamp) <= cutoff) last = event.timestamp;
    else break;
  }
  return last;
}

export function stagesReachedBy(lead: Lead, at: string | number): Set<LeadStage> {
  const cutoff = typeof at === "number" ? at : Date.parse(at);
  const reached = new Set<LeadStage>();
  if (Date.parse(lead.createdAt) <= cutoff) reached.add("new");
  for (const event of lead.statusHistory) {
    if (Date.parse(event.timestamp) <= cutoff) reached.add(event.status);
    else break;
  }
  return reached;
}

function matchesScope<T extends { branchId: string; repId?: string }>(item: T, filters: DashboardFilters): boolean {
  if (filters.branchId && item.branchId !== filters.branchId) return false;
  if (filters.repId && item.repId !== filters.repId) return false;
  return true;
}

export function scopedLeads(dataset: DealershipDataset, filters: DashboardFilters): Lead[] {
  return dataset.leads.filter((l) => matchesScope(l, filters));
}

export function cohortLeads(dataset: DealershipDataset, filters: DashboardFilters): Lead[] {
  const from = atStart(filters.from);
  const to = atEnd(filters.to);
  return scopedLeads(dataset, filters).filter((l) => {
    const created = Date.parse(l.createdAt);
    return created >= from && created <= to;
  });
}

export function scopedDeliveries(dataset: DealershipDataset, filters: DashboardFilters): Delivery[] {
  const from = atStart(filters.from);
  const to = atEnd(filters.to);
  return dataset.deliveries.filter((d) => matchesScope(d, filters) && Date.parse(d.deliveredAt) >= from && Date.parse(d.deliveredAt) <= to);
}

export function activeLeadsAsOf(dataset: DealershipDataset, filters: DashboardFilters): Lead[] {
  const cutoff = atEnd(filters.to);
  return scopedLeads(dataset, filters).filter((lead) => {
    const s = statusAt(lead, cutoff);
    return s !== null && s !== "lost" && s !== "delivered";
  });
}

export interface LeadRiskRow {
  lead: Lead;
  stage: LeadStage;
  lastActivityAt: string;
  daysIdle: number;
  highIntent: boolean;
}

export function staleLeadRows(dataset: DealershipDataset, filters: DashboardFilters, minDays = 7): LeadRiskRow[] {
  const cutoff = atEnd(filters.to);
  return activeLeadsAsOf(dataset, filters)
    .map((lead) => {
      const last = lastActivityAt(lead, cutoff)!;
      const stage = statusAt(lead, cutoff)!;
      return {
        lead,
        stage,
        lastActivityAt: last,
        daysIdle: daysBetween(Date.parse(last), cutoff),
        highIntent: HIGH_INTENT.has(stage),
      };
    })
    .filter((row) => row.daysIdle >= minDays)
    .sort((a, b) => Number(b.highIntent) - Number(a.highIntent) || b.daysIdle - a.daysIdle);
}

export function getFunnel(dataset: DealershipDataset, filters: DashboardFilters) {
  const cohort = cohortLeads(dataset, filters);
  const cutoff = atEnd(filters.to);
  return STAGES.map((stage, index) => {
    const count = cohort.filter((lead) => stagesReachedBy(lead, cutoff).has(stage)).length;
    const prev = index === 0 ? count : cohort.filter((lead) => stagesReachedBy(lead, cutoff).has(STAGES[index - 1])).length;
    return {
      stage,
      count,
      stageConversion: index === 0 ? 1 : safeRate(count, prev),
      totalConversion: safeRate(count, cohort.length),
      dropOff: index === 0 ? 0 : Math.max(0, prev - count),
    };
  });
}

function monthRange(from: string, to: string): string[] {
  const start = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00Z`);
  const result: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCMonth(d.getUTCMonth() + 1)) {
    result.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

export function aggregateTargets(dataset: DealershipDataset, filters: DashboardFilters) {
  const months = new Set(monthRange(filters.from, filters.to));
  const rows = dataset.targets.filter((t) => months.has(t.month) && (!filters.branchId || t.branchId === filters.branchId));
  return rows.reduce((acc, t) => ({ units: acc.units + t.unitTarget, revenue: acc.revenue + t.revenueTarget }), { units: 0, revenue: 0 });
}

export function monthlyTrend(dataset: DealershipDataset, filters: DashboardFilters) {
  const months = monthRange(filters.from, filters.to);
  return months.map((month) => {
    const deliveries = dataset.deliveries.filter((d) => monthKey(d.deliveredAt) === month && matchesScope(d, filters));
    const targets = dataset.targets.filter((t) => t.month === month && (!filters.branchId || t.branchId === filters.branchId));
    const targetUnits = targets.reduce((sum, t) => sum + t.unitTarget, 0);
    const targetRevenue = targets.reduce((sum, t) => sum + t.revenueTarget, 0);
    return {
      month,
      units: deliveries.length,
      revenue: deliveries.reduce((sum, d) => sum + d.revenue, 0),
      targetUnits,
      targetRevenue,
      attainment: safeRate(deliveries.length, targetUnits),
    };
  });
}

export function leadAging(dataset: DealershipDataset, filters: DashboardFilters) {
  const cutoff = atEnd(filters.to);
  const buckets = [
    { label: "0–2 days", min: 0, max: 2, count: 0 },
    { label: "3–6 days", min: 3, max: 6, count: 0 },
    { label: "7–13 days", min: 7, max: 13, count: 0 },
    { label: "14+ days", min: 14, max: Number.POSITIVE_INFINITY, count: 0 },
  ];
  for (const lead of activeLeadsAsOf(dataset, filters)) {
    const last = lastActivityAt(lead, cutoff);
    if (!last) continue;
    const age = daysBetween(Date.parse(last), cutoff);
    const bucket = buckets.find((b) => age >= b.min && age <= b.max);
    if (bucket) bucket.count += 1;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

export function deliveryPerformance(dataset: DealershipDataset, filters: DashboardFilters) {
  const rows = scopedDeliveries(dataset, filters);
  const cycleDays = rows.map((d) => d.daysToDeliver ?? Math.max(0, (Date.parse(d.deliveredAt) - Date.parse(d.orderDate)) / DAY));
  // The assignment delivery records include an explicit delay_reason rather than a promised date.
  // Treat that source field as the authoritative delayed/not-delayed indicator.
  const delayed = rows.filter((d) => Boolean(d.delayReason));
  const reasonMap = new Map<string, number>();
  for (const d of delayed) {
    const reason = d.delayReason || "Other";
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
  }
  return {
    count: rows.length,
    onTimeRate: rows.length ? 1 - delayed.length / rows.length : 0,
    delayedCount: delayed.length,
    averageCycleDays: average(cycleDays),
    medianCycleDays: median(cycleDays),
    reasons: [...reasonMap.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
  };
}

export function branchScorecards(dataset: DealershipDataset, filters: DashboardFilters) {
  return dataset.branches
    .filter((b) => !filters.branchId || b.id === filters.branchId)
    .map((branch) => {
      const f = { ...filters, branchId: branch.id, repId: undefined };
      const deliveries = scopedDeliveries(dataset, f);
      const cohort = cohortLeads(dataset, f);
      const deliveredCohort = cohort.filter((lead) => stagesReachedBy(lead, atEnd(filters.to)).has("delivered")).length;
      const target = aggregateTargets(dataset, f);
      const active = activeLeadsAsOf(dataset, f);
      const stale = staleLeadRows(dataset, f);
      return {
        branch,
        units: deliveries.length,
        revenue: deliveries.reduce((sum, d) => sum + d.revenue, 0),
        unitTarget: target.units,
        revenueTarget: target.revenue,
        unitAttainment: safeRate(deliveries.length, target.units),
        revenueAttainment: safeRate(deliveries.reduce((sum, d) => sum + d.revenue, 0), target.revenue),
        conversion: safeRate(deliveredCohort, cohort.length),
        active: active.length,
        stale: stale.length,
        highIntentStale: stale.filter((s) => s.highIntent).length,
      };
    })
    .sort((a, b) => b.unitAttainment - a.unitAttainment);
}

export function repScorecards(dataset: DealershipDataset, filters: DashboardFilters, includeManagers = false) {
  return dataset.reps
    .filter((r) => includeManagers || r.role === "sales_officer")
    .filter((r) => !filters.branchId || r.branchId === filters.branchId)
    .filter((r) => !filters.repId || r.id === filters.repId)
    .map((rep) => {
      const f = { ...filters, branchId: rep.branchId, repId: rep.id };
      const deliveries = scopedDeliveries(dataset, f);
      const cohort = cohortLeads(dataset, f);
      const deliveredCohort = cohort.filter((lead) => stagesReachedBy(lead, atEnd(filters.to)).has("delivered")).length;
      return {
        rep,
        leads: cohort.length,
        delivered: deliveries.length,
        revenue: deliveries.reduce((sum, d) => sum + d.revenue, 0),
        conversion: safeRate(deliveredCohort, cohort.length),
        active: activeLeadsAsOf(dataset, f).length,
        stale: staleLeadRows(dataset, f).length,
        highIntentStale: staleLeadRows(dataset, f).filter((s) => s.highIntent).length,
      };
    })
    .sort((a, b) => b.delivered - a.delivered || b.conversion - a.conversion);
}

export function stageConversionProbabilities(dataset: DealershipDataset, cutoffDate: string) {
  const cutoff = atEnd(cutoffDate);
  const historical = dataset.leads.filter((l) => Date.parse(l.createdAt) <= cutoff);
  const result: Record<string, number> = {};
  for (const stage of STAGES) {
    const reached = historical.filter((l) => stagesReachedBy(l, cutoff).has(stage));
    const delivered = reached.filter((l) => stagesReachedBy(l, cutoff).has("delivered"));
    result[stage] = safeRate(delivered.length, reached.length);
  }
  return result as Record<(typeof STAGES)[number], number>;
}

export function forecastLatestMonth(dataset: DealershipDataset, filters: DashboardFilters) {
  const month = filters.to.slice(0, 7);
  const monthStart = `${month}-01`;
  const nextMonthDate = new Date(`${month}-01T00:00:00Z`);
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const monthEnd = new Date(nextMonthDate.getTime() - 1);
  const effectiveTo = Math.min(atEnd(filters.to), monthEnd.getTime());
  const remainingDays = Math.max(0, Math.ceil((monthEnd.getTime() - effectiveTo) / DAY));
  const monthFilters = { ...filters, from: monthStart, to: filters.to };
  const delivered = scopedDeliveries(dataset, monthFilters).length;
  const target = aggregateTargets(dataset, { ...filters, from: monthStart, to: monthStart }).units;

  const priorDate = new Date(`${monthStart}T00:00:00Z`);
  priorDate.setUTCDate(priorDate.getUTCDate() - 1);
  const probabilities = stageConversionProbabilities(dataset, priorDate.toISOString().slice(0, 10));
  const pipeline = activeLeadsAsOf(dataset, filters).filter((lead) => {
    if (!lead.expectedCloseDate) return true;
    return Date.parse(`${lead.expectedCloseDate.slice(0, 10)}T23:59:59.999Z`) <= monthEnd.getTime();
  });
  let expectedPipeline = 0;
  for (const lead of pipeline) {
    const stage = statusAt(lead, effectiveTo);
    if (stage && stage !== "lost" && stage !== "delivered") expectedPipeline += probabilities[stage as keyof typeof probabilities] ?? 0;
  }
  const projected = remainingDays > 0 ? delivered + expectedPipeline : delivered;
  return {
    month,
    delivered,
    target,
    projected,
    remainingDays,
    gap: target - projected,
    confidence: pipeline.length >= 10 ? "medium" as const : "low" as const,
    stageProbabilities: probabilities,
  };
}

export function overviewMetrics(dataset: DealershipDataset, filters: DashboardFilters) {
  const deliveries = scopedDeliveries(dataset, filters);
  const cohort = cohortLeads(dataset, filters);
  const deliveredCohort = cohort.filter((lead) => stagesReachedBy(lead, atEnd(filters.to)).has("delivered")).length;
  const target = aggregateTargets(dataset, filters);
  const active = activeLeadsAsOf(dataset, filters);
  const stale = staleLeadRows(dataset, filters);
  const revenue = deliveries.reduce((sum, d) => sum + d.revenue, 0);
  return {
    units: deliveries.length,
    unitTarget: target.units,
    unitAttainment: safeRate(deliveries.length, target.units),
    revenue,
    revenueTarget: target.revenue,
    revenueAttainment: safeRate(revenue, target.revenue),
    conversion: safeRate(deliveredCohort, cohort.length),
    cohortSize: cohort.length,
    activePipeline: active.length,
    highIntentActive: active.filter((l) => HIGH_INTENT.has(statusAt(l, atEnd(filters.to))!)).length,
    atRisk: stale.length,
    highIntentAtRisk: stale.filter((r) => r.highIntent).length,
    pipelineValue: active.reduce((sum, l) => sum + l.expectedRevenue, 0),
  };
}

export function generateInsights(dataset: DealershipDataset, filters: DashboardFilters): Insight[] {
  const insights: Insight[] = [];
  const stale = staleLeadRows(dataset, filters);
  const high = stale.filter((r) => r.highIntent);
  if (high.length) {
    const value = high.reduce((sum, r) => sum + r.lead.expectedRevenue, 0);
    const pipelineLabel = value >= 10_000_000 ? `₹${(value / 10_000_000).toFixed(1)} Cr` : `₹${(value / 100_000).toFixed(1)}L`;
    insights.push({
      id: "stale-high-intent",
      severity: high.length >= 5 ? "critical" : "warning",
      type: "stale_leads",
      title: `${high.length} high-intent lead${high.length === 1 ? "" : "s"} stalled for 7+ days`,
      description: `${pipelineLabel} of potential pipeline is sitting in test drive, negotiation, or order stages without recent movement.`,
      leadIds: high.map((r) => r.lead.id),
      value,
      actionLabel: "Review leads",
      actionHref: "#attention-leads",
    });
  }

  const cards = branchScorecards(dataset, filters);
  const underperformer = cards.filter((b) => b.unitTarget > 0).sort((a, b) => a.unitAttainment - b.unitAttainment)[0];
  if (underperformer && underperformer.unitAttainment < 0.85) {
    insights.push({
      id: `target-${underperformer.branch.id}`,
      severity: underperformer.unitAttainment < 0.7 ? "critical" : "warning",
      type: "target_risk",
      title: `${underperformer.branch.name} is behind target`,
      description: `${underperformer.units} deliveries against ${underperformer.unitTarget} target units (${Math.round(underperformer.unitAttainment * 100)}% attainment) in the selected period.`,
      branchId: underperformer.branch.id,
      value: underperformer.unitAttainment,
      actionLabel: "View branch",
      actionHref: `/branches/${underperformer.branch.id}?from=${filters.from}&to=${filters.to}`,
    });
  }

  if (!filters.repId) {
    const groupDelivery = deliveryPerformance(dataset, filters);
    const branchDelayRows = cards.map((card) => {
      const p = deliveryPerformance(dataset, { ...filters, branchId: card.branch.id, repId: undefined });
      return { branch: card.branch, ...p };
    }).filter((x) => x.count >= 3);
    const delayOutlier = branchDelayRows
      .sort((a, b) => (a.onTimeRate - b.onTimeRate) || (b.averageCycleDays - a.averageCycleDays))[0];
    const poorReliability = delayOutlier && groupDelivery.count >= 5 && delayOutlier.onTimeRate < groupDelivery.onTimeRate - 0.12;
    const slowCycle = delayOutlier && groupDelivery.averageCycleDays > 0 && delayOutlier.averageCycleDays > groupDelivery.averageCycleDays * 1.2;
    if (delayOutlier && (poorReliability || slowCycle)) {
      const description = poorReliability
        ? `${Math.round(delayOutlier.onTimeRate * 100)}% without a recorded delay versus ${Math.round(groupDelivery.onTimeRate * 100)}% for the group; ${delayOutlier.delayedCount} deliveries carry a delay reason.`
        : `${delayOutlier.averageCycleDays.toFixed(1)} days order-to-delivery versus ${groupDelivery.averageCycleDays.toFixed(1)} days group average.`;
      insights.push({
        id: `delay-${delayOutlier.branch.id}`,
        severity: "warning",
        type: "delivery_delay",
        title: `${delayOutlier.branch.name} has a delivery execution problem`,
        description,
        branchId: delayOutlier.branch.id,
        value: poorReliability ? delayOutlier.onTimeRate : delayOutlier.averageCycleDays,
        actionLabel: "Investigate",
        actionHref: `/branches/${delayOutlier.branch.id}?from=${filters.from}&to=${filters.to}#delivery`,
      });
    }

    if (cards.length > 1) {
      const groupConv = overviewMetrics(dataset, filters).conversion;
      const best = [...cards].sort((a, b) => b.conversion - a.conversion)[0];
      if (best && best.conversion >= groupConv + 0.05 && best.conversion > 0) {
        insights.push({
          id: `positive-${best.branch.id}`,
          severity: "positive",
          type: "performance_spike",
          title: `${best.branch.name} is converting above the group`,
          description: `${Math.round(best.conversion * 100)}% cohort conversion versus ${Math.round(groupConv * 100)}% group average. Review its rep mix and follow-up pattern for practices worth copying.`,
          branchId: best.branch.id,
          value: best.conversion,
          actionLabel: "See what works",
          actionHref: `/branches/${best.branch.id}?from=${filters.from}&to=${filters.to}`,
        });
      }
    }
  }
  return insights.slice(0, 4);
}

export function getWhatIfInputs(dataset: DealershipDataset, filters: DashboardFilters) {
  const cohort = cohortLeads(dataset, filters);
  const cutoff = atEnd(filters.to);
  const reached = (stage: LeadStage) => cohort.filter((lead) => stagesReachedBy(lead, cutoff).has(stage));
  const testDrives = reached("test_drive").length;
  const orders = reached("ordered").length;
  const deliveredLeads = reached("delivered");
  const delivered = deliveredLeads.length;
  const values = deliveredLeads.map((lead) => lead.expectedRevenue).filter((value) => value > 0);
  const fallbackValues = cohort.map((lead) => lead.expectedRevenue).filter((value) => value > 0);
  return {
    testDrives,
    orders,
    delivered,
    testDriveToOrderRate: safeRate(orders, testDrives),
    orderToDeliveryRate: safeRate(delivered, orders),
    averageDealValue: average(values.length ? values : fallbackValues),
  };
}

export function getOverviewViewModel(dataset: DealershipDataset, input: Partial<DashboardFilters> = {}) {
  const filters = clampFilters(dataset, input);
  const metrics = overviewMetrics(dataset, filters);
  const funnel = getFunnel(dataset, filters);
  const trend = monthlyTrend(dataset, filters);
  const aging = leadAging(dataset, filters);
  const branches = branchScorecards(dataset, filters);
  const delivery = deliveryPerformance(dataset, filters);
  const stale = staleLeadRows(dataset, filters);
  const insights = generateInsights(dataset, filters);
  const forecast = forecastLatestMonth(dataset, filters);
  return {
    filters,
    asOf: getDatasetAsOf(dataset),
    metrics,
    funnel,
    trend,
    aging,
    branches,
    delivery,
    stale,
    insights,
    forecast,
    whatIf: getWhatIfInputs(dataset, filters),
    executiveSummary: buildExecutiveSummary(metrics, insights, forecast),
  };
}

export function getBranchViewModel(dataset: DealershipDataset, branchId: string, input: Partial<DashboardFilters> = {}) {
  const branch = dataset.branches.find((b) => b.id === branchId);
  if (!branch) return null;
  const filters = clampFilters(dataset, { ...input, branchId, repId: undefined });
  return {
    branch,
    filters,
    asOf: getDatasetAsOf(dataset),
    metrics: overviewMetrics(dataset, filters),
    funnel: getFunnel(dataset, filters),
    trend: monthlyTrend(dataset, filters),
    aging: leadAging(dataset, filters),
    reps: repScorecards(dataset, filters),
    delivery: deliveryPerformance(dataset, filters),
    stale: staleLeadRows(dataset, filters),
    insights: generateInsights(dataset, filters),
    forecast: forecastLatestMonth(dataset, filters),
    whatIf: getWhatIfInputs(dataset, filters),
  };
}

export function getRepViewModel(dataset: DealershipDataset, repId: string, input: Partial<DashboardFilters> = {}) {
  const rep = dataset.reps.find((r) => r.id === repId);
  if (!rep) return null;
  const branch = dataset.branches.find((b) => b.id === rep.branchId)!;
  const filters = clampFilters(dataset, { ...input, branchId: rep.branchId, repId });
  const branchFilters = { ...filters, repId: undefined };
  return {
    rep,
    branch,
    filters,
    asOf: getDatasetAsOf(dataset),
    metrics: overviewMetrics(dataset, filters),
    branchMetrics: overviewMetrics(dataset, branchFilters),
    funnel: getFunnel(dataset, filters),
    branchFunnel: getFunnel(dataset, branchFilters),
    trend: monthlyTrend(dataset, filters),
    aging: leadAging(dataset, filters),
    delivery: deliveryPerformance(dataset, filters),
    branchDelivery: deliveryPerformance(dataset, branchFilters),
    stale: staleLeadRows(dataset, filters),
    active: activeLeadsAsOf(dataset, filters),
    insights: generateInsights(dataset, filters),
  };
}

export function buildExecutiveSummary(metrics: ReturnType<typeof overviewMetrics>, insights: Insight[], forecast: ReturnType<typeof forecastLatestMonth>) {
  const health = metrics.unitAttainment >= 0.95 ? "on plan" : metrics.unitAttainment >= 0.8 ? "slightly behind plan" : "materially behind plan";
  const risk = metrics.highIntentAtRisk ? `${metrics.highIntentAtRisk} high-intent leads need manager follow-up` : "no high-intent stale leads are currently flagged";
  const forecastText = forecast.target > 0
    ? forecast.projected >= forecast.target
      ? `The latest-month forecast is at or above its ${forecast.target}-unit target.`
      : `The latest month is tracking about ${Math.ceil(forecast.target - forecast.projected)} units below target.`
    : "No target is available for the latest month.";
  const top = insights[0]?.title ? `Top action: ${insights[0].title}.` : "No major exception is currently flagged.";
  return `The group is ${health} at ${Math.round(metrics.unitAttainment * 100)}% of unit target. ${risk}. ${forecastText} ${top}`;
}

export function getLeadContext(dataset: DealershipDataset, leadId: string) {
  const lead = dataset.leads.find((l) => l.id === leadId);
  if (!lead) return null;
  return {
    lead,
    branch: dataset.branches.find((b) => b.id === lead.branchId),
    rep: dataset.reps.find((r) => r.id === lead.repId),
    delivery: dataset.deliveries.find((d) => d.leadId === lead.id),
  };
}

export function findBranch(dataset: DealershipDataset, id?: string): Branch | undefined {
  return dataset.branches.find((b) => b.id === id);
}

export function findRep(dataset: DealershipDataset, id?: string): SalesRep | undefined {
  return dataset.reps.find((r) => r.id === id);
}
