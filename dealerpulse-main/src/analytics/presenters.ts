import type { DealershipDataset, Lead } from "../types/dealership";
import type { LeadRiskRow } from "./core";

export function presentLead(dataset: DealershipDataset, lead: Lead, daysIdle?: number) {
  const branch = dataset.branches.find((b) => b.id === lead.branchId);
  const rep = dataset.reps.find((r) => r.id === lead.repId);
  return {
    id: lead.id,
    customerName: lead.customerName,
    branchName: branch?.name ?? lead.branchId,
    repName: rep?.name ?? lead.repId,
    vehicleModel: lead.vehicleModel,
    expectedRevenue: lead.expectedRevenue,
    stage: lead.currentStatus,
    daysIdle,
    source: lead.source,
    statusHistory: lead.statusHistory,
  };
}

export function presentRiskRows(dataset: DealershipDataset, rows: LeadRiskRow[]) {
  return rows.map((row) => ({ ...presentLead(dataset, row.lead, row.daysIdle), stage: row.stage }));
}
