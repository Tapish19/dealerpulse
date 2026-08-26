import { z } from "zod";
import type {
  DealershipDataset,
  LeadStage,
  StatusEvent,
} from "@/types/dealership";

const RawStatusEvent = z
  .object({
    status: z.string(),
    timestamp: z.string(),
    notes: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
  })
  .passthrough();

const RawLead = z
  .object({
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
  })
  .passthrough();

const RawDataset = z
  .object({
    metadata: z.record(z.string(), z.unknown()).optional(),

    branches: z.array(z.record(z.string(), z.unknown())),

    sales_reps: z
      .array(z.record(z.string(), z.unknown()))
      .optional(),

    reps: z
      .array(z.record(z.string(), z.unknown()))
      .optional(),

    leads: z.array(RawLead),

    monthly_targets: z
      .array(z.record(z.string(), z.unknown()))
      .optional(),

    targets: z
      .array(z.record(z.string(), z.unknown()))
      .optional(),

    deliveries: z.array(z.record(z.string(), z.unknown())),
  })
  .passthrough();

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
  const key = str(value)
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  return statusMap[key] ?? "new";
}

/**
 * Converts the supplied dealership_data.json into the stable
 * domain model consumed by the dashboard.
 *
 * Important source-data details:
 *
 * - The source uses `order_placed`; the UI domain model uses `ordered`.
 *
 * - Delivery records primarily reference `lead_id`, so branch, rep and
 *   revenue are joined from the related lead when those values are not
 *   directly present on the delivery record.
 *
 * - A small number of leads contain a top-level `status` that is newer
 *   than the final entry in `status_history`.
 *
 *   For those records we preserve the top-level source truth by adding
 *   a reconciled status event at `last_activity_at`. This prevents those
 *   records from incorrectly appearing as active/stale pipeline.
 */
export function normalizeDataset(
  input: unknown,
): DealershipDataset {
  const raw = RawDataset.parse(input);

  const repsRaw =
    raw.sales_reps ??
    raw.reps ??
    [];

  const targetsRaw =
    raw.monthly_targets ??
    raw.targets ??
    [];

  const branches = raw.branches.map((branch) => ({
    id: str(branch.id),

    name: str(
      branch.name,
      str(
        branch.branch_name,
        "Unnamed branch",
      ),
    ),

    city: str(branch.city, ""),

    managerId:
      str(
        branch.manager_id ??
          branch.managerId,
      ) || undefined,
  }));

  const reps = repsRaw.map((rep) => ({
    id: str(rep.id),

    name: str(
      rep.name,
      "Unknown rep",
    ),

    role: (
      str(rep.role)
        .toLowerCase()
        .includes("manager")
        ? "branch_manager"
        : "sales_officer"
    ) as
      | "branch_manager"
      | "sales_officer",

    branchId: str(
      rep.branch_id ??
        rep.branchId,
    ),

    joinedAt:
      str(
        rep.joined ??
          rep.joined_at ??
          rep.joinedAt,
      ) || undefined,
  }));

  const leads = raw.leads.map((lead) => {
    const historyRaw =
      lead.status_history ??
      lead.statusHistory ??
      [];

    /*
     * IMPORTANT:
     *
     * Explicitly type this as StatusEvent[].
     *
     * Without this annotation TypeScript infers the mapped objects as:
     *
     * {
     *   status: LeadStage;
     *   timestamp: string;
     *   note: string | undefined;
     * }[]
     *
     * That inferred type does not include the optional
     * `reconciled` property defined by StatusEvent, which causes
     * the Vercel production TypeScript build to fail when we push
     * the reconciliation event below.
     */
    const history: StatusEvent[] = historyRaw
      .map((event) => ({
        status: status(event.status),

        timestamp: event.timestamp,

        note:
          event.notes ??
          event.note ??
          undefined,
      }))
      .sort(
        (a, b) =>
          Date.parse(a.timestamp) -
          Date.parse(b.timestamp),
      );

    const topLevelStatus = status(
      lead.status ??
        lead.current_status ??
        lead.currentStatus ??
        history.at(-1)?.status ??
        "new",
    );

    const lastActivity =
      lead.last_activity_at ??
      history.at(-1)?.timestamp ??
      lead.created_at ??
      lead.createdAt ??
      "";

    const finalHistoryStatus =
      history.at(-1)?.status;

    /*
     * Some records in the source JSON have a newer top-level
     * lead status than the last status_history event.
     *
     * Example:
     *
     * status: "lost"
     *
     * while the latest status_history entry may still be
     * "negotiation" or "order_placed".
     *
     * Reconcile those records using the supplied last_activity_at.
     */
    if (
      lastActivity &&
      finalHistoryStatus &&
      topLevelStatus !== finalHistoryStatus
    ) {
      history.push({
        status: topLevelStatus,

        timestamp: lastActivity,

        note: `Lead record status reconciled as ${topLevelStatus.replaceAll(
          "_",
          " ",
        )}.`,

        reconciled: true,
      });

      history.sort(
        (a, b) =>
          Date.parse(a.timestamp) -
          Date.parse(b.timestamp),
      );
    }

    return {
      id: str(lead.id),

      customerName:
        lead.customer_name ??
        lead.customerName ??
        `Lead ${str(lead.id)}`,

      phone:
        lead.phone ??
        undefined,

      branchId:
        lead.branch_id ??
        lead.branchId ??
        "",

      repId:
        lead.sales_rep_id ??
        lead.assigned_to ??
        lead.rep_id ??
        lead.repId ??
        "",

      createdAt:
        lead.created_at ??
        lead.createdAt ??
        history[0]?.timestamp ??
        "",

      lastActivityAt:
        lastActivity ||
        undefined,

      expectedCloseDate:
        lead.expected_close_date ??
        undefined,

      source:
        lead.source ??
        undefined,

      vehicleModel:
        lead.model_interested ??
        lead.vehicle_model ??
        lead.vehicleModel ??
        undefined,

      expectedRevenue:
        lead.deal_value ??
        lead.expected_revenue ??
        lead.expectedRevenue ??
        0,

      currentStatus:
        topLevelStatus,

      statusHistory:
        history,

      lostReason:
        lead.lost_reason ??
        lead.lostReason ??
        undefined,
    };
  });

  /*
   * Explicit Map typing prevents TypeScript from inferring
   * overly narrow tuple/value types during the delivery join.
   */
  const leadById = new Map<
    string,
    (typeof leads)[number]
  >(
    leads.map(
      (lead) =>
        [lead.id, lead] as const,
    ),
  );

  const targets = targetsRaw.map((target) => ({
    branchId: str(
      target.branch_id ??
        target.branchId,
    ),

    month: str(target.month),

    unitTarget: num(
      target.target_units ??
        target.unit_target ??
        target.unitTarget ??
        target.units,
    ),

    revenueTarget: num(
      target.target_revenue ??
        target.revenue_target ??
        target.revenueTarget ??
        target.revenue,
    ),
  }));

  const deliveries = raw.deliveries.map(
    (delivery) => {
      const leadId = str(
        delivery.lead_id ??
          delivery.leadId,
      );

      const relatedLead =
        leadById.get(leadId);

      return {
        leadId,

        branchId:
          str(
            delivery.branch_id ??
              delivery.branchId,
          ) ||
          relatedLead?.branchId ||
          "",

        repId:
          str(
            delivery.sales_rep_id ??
              delivery.rep_id ??
              delivery.repId,
          ) ||
          relatedLead?.repId ||
          "",

        orderDate: str(
          delivery.order_date ??
            delivery.orderDate,
        ),

        deliveredAt: str(
          delivery.delivered_at ??
            delivery.deliveredAt ??
            delivery.delivery_date,
        ),

        daysToDeliver:
          num(
            delivery.days_to_deliver ??
              delivery.daysToDeliver,
            NaN,
          ) || undefined,

        /*
         * The supplied delivery rows do not always contain revenue.
         * Fall back to the corresponding lead's deal value.
         */
        revenue: num(
          delivery.revenue ??
            delivery.amount ??
            delivery.sale_value,
          relatedLead?.expectedRevenue ??
            0,
        ),

        delayReason:
          str(
            delivery.delay_reason ??
              delivery.delayReason,
          ) || undefined,
      };
    },
  );

  const metadata =
    raw.metadata ??
    {};

  const description = str(
    metadata.description,
  );

  const notes = str(
    metadata.notes ??
      metadata.note,
  );

  const range = str(
    metadata.date_range ??
      metadata.dateRange,
  );

  const [
    periodStartText,
    periodEndText,
  ] = range
    .split("-")
    .map((value) =>
      value.trim(),
    );

  return {
    metadata: {
      datasetName:
        str(
          metadata.dataset_name ??
            metadata.datasetName,
        ) ||
        "DealerPulse assignment dataset",

      generatedForDemo:
        Boolean(
          metadata.generated_for_demo ??
            metadata.generatedForDemo,
        ) ||
        /synthetic/i.test(
          `${description} ${notes}`,
        ),

      periodStart:
        str(
          metadata.period_start ??
            metadata.periodStart,
        ) ||
        periodStartText ||
        undefined,

      periodEnd:
        str(
          metadata.period_end ??
            metadata.periodEnd,
        ) ||
        periodEndText ||
        undefined,

      generatedAt:
        str(
          metadata.generated_at ??
            metadata.generatedAt,
        ) || undefined,

      description:
        description ||
        undefined,

      note:
        notes ||
        undefined,
    },

    branches,

    reps,

    leads,

    targets,

    deliveries,
  };
}
