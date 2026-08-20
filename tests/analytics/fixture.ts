import type { DealershipDataset } from "../../src/types/dealership";

export const fixture: DealershipDataset = {
  branches: [
    { id: "a", name: "Alpha", city: "Chennai" },
    { id: "b", name: "Beta", city: "Bangalore" },
  ],
  reps: [
    { id: "ra", name: "A Rep", role: "sales_officer", branchId: "a" },
    { id: "rb", name: "B Rep", role: "sales_officer", branchId: "b" },
  ],
  leads: [
    {
      id: "l1", customerName: "One", branchId: "a", repId: "ra", createdAt: "2025-12-01T10:00:00Z", expectedRevenue: 1_500_000, currentStatus: "delivered",
      statusHistory: [
        { status: "new", timestamp: "2025-12-01T10:00:00Z" },
        { status: "contacted", timestamp: "2025-12-02T10:00:00Z" },
        { status: "test_drive", timestamp: "2025-12-04T10:00:00Z" },
        { status: "negotiation", timestamp: "2025-12-05T10:00:00Z" },
        { status: "ordered", timestamp: "2025-12-06T10:00:00Z" },
        { status: "delivered", timestamp: "2025-12-10T10:00:00Z" },
      ],
    },
    {
      id: "l2", customerName: "Two", branchId: "a", repId: "ra", createdAt: "2025-12-05T10:00:00Z", expectedRevenue: 2_000_000, currentStatus: "negotiation",
      statusHistory: [
        { status: "new", timestamp: "2025-12-05T10:00:00Z" },
        { status: "contacted", timestamp: "2025-12-06T10:00:00Z" },
        { status: "test_drive", timestamp: "2025-12-08T10:00:00Z" },
        { status: "negotiation", timestamp: "2025-12-09T10:00:00Z" },
      ],
    },
    {
      id: "l3", customerName: "Three", branchId: "b", repId: "rb", createdAt: "2025-12-03T10:00:00Z", expectedRevenue: 1_200_000, currentStatus: "lost",
      statusHistory: [
        { status: "new", timestamp: "2025-12-03T10:00:00Z" },
        { status: "contacted", timestamp: "2025-12-04T10:00:00Z" },
        { status: "lost", timestamp: "2025-12-06T10:00:00Z" },
      ],
    },
  ],
  targets: [
    { branchId: "a", month: "2025-12", unitTarget: 2, revenueTarget: 3_000_000 },
    { branchId: "b", month: "2025-12", unitTarget: 2, revenueTarget: 3_000_000 },
  ],
  deliveries: [
    { leadId: "l1", branchId: "a", repId: "ra", orderDate: "2025-12-06T10:00:00Z", deliveredAt: "2025-12-10T10:00:00Z", daysToDeliver: 4, revenue: 1_480_000, delayReason: "Registration" },
  ],
};
