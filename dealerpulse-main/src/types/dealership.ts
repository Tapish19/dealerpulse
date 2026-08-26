export const STAGES = [
  "new",
  "contacted",
  "test_drive",
  "negotiation",
  "ordered",
  "delivered",
] as const;

export type LeadStage = (typeof STAGES)[number] | "lost";
export type RepRole = "branch_manager" | "sales_officer";

export interface Branch {
  id: string;
  name: string;
  city: string;
  managerId?: string;
}

export interface SalesRep {
  id: string;
  name: string;
  role: RepRole;
  branchId: string;
  joinedAt?: string;
}

export interface StatusEvent {
  status: LeadStage;
  timestamp: string;
  note?: string;
  reconciled?: boolean;
}

export interface Lead {
  id: string;
  customerName: string;
  phone?: string;
  branchId: string;
  repId: string;
  createdAt: string;
  lastActivityAt?: string;
  expectedCloseDate?: string;
  source?: string;
  vehicleModel?: string;
  expectedRevenue: number;
  currentStatus: LeadStage;
  statusHistory: StatusEvent[];
  lostReason?: string;
}

export interface BranchTarget {
  branchId: string;
  month: string;
  unitTarget: number;
  revenueTarget: number;
}

export interface Delivery {
  leadId: string;
  branchId: string;
  repId: string;
  orderDate: string;
  deliveredAt: string;
  daysToDeliver?: number;
  revenue: number;
  delayReason?: string;
}

export interface DealershipDataset {
  metadata?: {
    datasetName?: string;
    generatedForDemo?: boolean;
    periodStart?: string;
    periodEnd?: string;
    generatedAt?: string;
    description?: string;
    note?: string;
  };
  branches: Branch[];
  reps: SalesRep[];
  leads: Lead[];
  targets: BranchTarget[];
  deliveries: Delivery[];
}

export interface DashboardFilters {
  from: string;
  to: string;
  branchId?: string;
  repId?: string;
}

export interface Insight {
  id: string;
  severity: "critical" | "warning" | "positive" | "info";
  type: "stale_leads" | "target_risk" | "conversion_drop" | "delivery_delay" | "performance_spike";
  title: string;
  description: string;
  branchId?: string;
  repId?: string;
  leadIds?: string[];
  value?: number;
  actionLabel: string;
  actionHref: string;
}
