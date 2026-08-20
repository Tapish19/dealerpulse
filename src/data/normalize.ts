import { z } from "zod";
import type { DealershipDataset, LeadStage } from "@/types/dealership";

const RawStatusEvent = z.object({
  status: z.string(),
  timestamp: z.string(),
  notes: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
}).passthrough();

const RawLead = z.object({
  id: z.union([z.string(), z.number()]),
  customer_name: z.string().optional(),
  customerName: z.string().optional(),
  phone: z.string().optional().nullable(),
  branch_id: z.string().optional(),
  branchId: z.string().optional(),
  sales_rep_id: z.string().optional(),
  assigned_to: z.string().optional(),
  rep_id: z.string().optional(),
  repId: z.string().optional(),
  created_at: z.string().optional(),
  createdAt: z.string().optional(),
  last_activity_at: z.string().optional(),
  expected_close_date: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  model_interested: z.string().optional().nullable(),
  vehicle_model: z.string().optional().nullable(),
  vehicleModel: z.string().optional().nullable(),
  deal_value: z.number().optional(),
  expected_revenue: z.number().optional(),
  expectedRevenue: z.number().optional(),
  status: z.string().optional(),
  current_status: z.string().optional(),
  currentStatus: z.string().optional(),
  status_history: z.array(RawStatusEvent).optional(),
  statusHistory: z.array(RawStatusEvent).optional(),
  lost_reason: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable(),
}).passthrough();

const RawDataset = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
  branches: z.array(z.record(z.string(), z.unknown())),
  sales_reps: z.array(z.record(z.string(), z.unknown())).optional(),
  reps: z.array(z.record(z.string(), z.unknown())).optional(),
  leads: z.array(RawLead),
  monthly_targets: z.array(z.record(z.string(), z.unknown())).optional(),
  targets: z.array(z.record(z.string(), z.unknown())).optional(),
  deliveries: z.array(z.record(z.string(), z.unknown())),
}).passthrough();

const statusMap: Record<string, LeadStage> = {
  new: "new",
  contacted: "contacted",
  contact: "contacted",
  test_drive: "test_drive",
  "test drive": "test_drive",
  testdrive: "test_drive",
  negotiation: "negotiation",
  negotiating: "negotiation",
  ordered: "ordered",
  order: "ordered",
  booked: "ordered",
  order_placed: "ordered",
  "order placed": "ordered",
  delivered: "delivered",
  lost: "lost",
};

function str(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}
function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function status(value: unknown): LeadStage {
  const key = str(value).trim().toLowerCase().replace(/-/g, "_");
  return statusMap[key] ?? "new";
}

/**
 * Converts the assignment JSON into the UI's stable domain model.
 *
 * The source dataset has a few intentional/realistic irregularities:
 * - `order_placed` is the order stage used by the file.
 * - delivery rows only reference lead_id, so branch/rep/revenue are joined from leads.
 * - a small number of leads have a top-level `status` newer than the final history
 *   status. We preserve that source truth by adding a reconciled terminal event at
 *   `last_activity_at`, preventing false open-pipeline alerts.
 */
export function normalizeDataset(input: unknown): DealershipDataset {
  const raw = RawDataset.parse(input);
  const repsRaw = raw.sales_reps ?? raw.reps ?? [];
  const targetsRaw = raw.monthly_targets ?? raw.targets ?? [];

  const branches = raw.branches.map((b) => ({
    id: str(b.id),
    name: str(b.name, str(b.branch_name, "Unnamed branch")),
    city: str(b.city, ""),
    managerId: str(b.manager_id ?? b.managerId) || undefined,
  }));

  const reps = repsRaw.map((r) => ({
    id: str(r.id),
    name: str(r.name, "Unknown rep"),
    role: (str(r.role).toLowerCase().includes("manager") ? "branch_manager" : "sales_officer") as "branch_manager" | "sales_officer",
    branchId: str(r.branch_id ?? r.branchId),
    joinedAt: str(r.joined ?? r.joined_at ?? r.joinedAt) || undefined,
  }));

  const leads = raw.leads.map((l) => {
    const historyRaw = l.status_history ?? l.statusHistory ?? [];
    const history = historyRaw
      .map((h) => ({
        status: status(h.status),
        timestamp: h.timestamp,
        note: h.notes ?? h.note ?? undefined,
      }))
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    const topLevelStatus = status(l.status ?? l.current_status ?? l.currentStatus ?? history.at(-1)?.status ?? "new");
    const lastActivity = l.last_activity_at ?? history.at(-1)?.timestamp ?? l.created_at ?? l.createdAt ?? "";
    const finalHistoryStatus = history.at(-1)?.status;

    if (lastActivity && finalHistoryStatus && topLevelStatus !== finalHistoryStatus) {
      history.push({
        status: topLevelStatus,
        timestamp: lastActivity,
        note: `Lead record status reconciled as ${topLevelStatus.replaceAll("_", " ")}.`,
        reconciled: true,
      });
      history.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    }

    return {
      id: str(l.id),
      customerName: l.customer_name ?? l.customerName ?? `Lead ${str(l.id)}`,
      phone: l.phone ?? undefined,
      branchId: l.branch_id ?? l.branchId ?? "",
      repId: l.sales_rep_id ?? l.assigned_to ?? l.rep_id ?? l.repId ?? "",
      createdAt: l.created_at ?? l.createdAt ?? history[0]?.timestamp ?? "",
      lastActivityAt: lastActivity || undefined,
      expectedCloseDate: l.expected_close_date ?? undefined,
      source: l.source ?? undefined,
      vehicleModel: l.model_interested ?? l.vehicle_model ?? l.vehicleModel ?? undefined,
      expectedRevenue: l.deal_value ?? l.expected_revenue ?? l.expectedRevenue ?? 0,
      currentStatus: topLevelStatus,
      statusHistory: history,
      lostReason: l.lost_reason ?? l.lostReason ?? undefined,
    };
  });

  const leadById = new Map<string, (typeof leads)[number]>(leads.map((lead) => [lead.id, lead] as const));

  const targets = targetsRaw.map((t) => ({
    branchId: str(t.branch_id ?? t.branchId),
    month: str(t.month),
    unitTarget: num(t.target_units ?? t.unit_target ?? t.unitTarget ?? t.units),
    revenueTarget: num(t.target_revenue ?? t.revenue_target ?? t.revenueTarget ?? t.revenue),
  }));

  const deliveries = raw.deliveries.map((d) => {
    const leadId = str(d.lead_id ?? d.leadId);
    const lead = leadById.get(leadId);
    return {
      leadId,
      branchId: str(d.branch_id ?? d.branchId) || lead?.branchId || "",
      repId: str(d.sales_rep_id ?? d.rep_id ?? d.repId) || lead?.repId || "",
      orderDate: str(d.order_date ?? d.orderDate),
      deliveredAt: str(d.delivered_at ?? d.deliveredAt ?? d.delivery_date),
      daysToDeliver: num(d.days_to_deliver ?? d.daysToDeliver, NaN) || undefined,
      revenue: num(d.revenue ?? d.amount ?? d.sale_value, lead?.expectedRevenue ?? 0),
      delayReason: str(d.delay_reason ?? d.delayReason) || undefined,
    };
  });

  const metadata = raw.metadata ?? {};
  const description = str(metadata.description);
  const notes = str(metadata.notes ?? metadata.note);
  const range = str(metadata.date_range ?? metadata.dateRange);
  const [periodStartText, periodEndText] = range.split("-").map((x) => x.trim());

  return {
    metadata: {
      datasetName: str(metadata.dataset_name ?? metadata.datasetName) || "DealerPulse assignment dataset",
      generatedForDemo: Boolean(metadata.generated_for_demo ?? metadata.generatedForDemo) || /synthetic/i.test(`${description} ${notes}`),
      periodStart: str(metadata.period_start ?? metadata.periodStart) || periodStartText || undefined,
      periodEnd: str(metadata.period_end ?? metadata.periodEnd) || periodEndText || undefined,
      generatedAt: str(metadata.generated_at ?? metadata.generatedAt) || undefined,
      description: description || undefined,
      note: notes || undefined,
    },
    branches,
    reps,
    leads,
    targets,
    deliveries,
  };
}
