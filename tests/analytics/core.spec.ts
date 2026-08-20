import { describe, expect, it } from "vitest";
import { aggregateTargets, cohortLeads, deliveryPerformance, getFunnel, overviewMetrics, staleLeadRows, statusAt } from "../../src/analytics/core";
import { fixture } from "./fixture";

const filters = { from: "2025-12-01", to: "2025-12-31" };

describe("DealerPulse analytics", () => {
  it("reconstructs lead status at a historical cutoff", () => {
    expect(statusAt(fixture.leads[0], "2025-12-04T23:59:59Z")).toBe("test_drive");
  });

  it("filters lead cohorts by branch without leaking other branches", () => {
    expect(cohortLeads(fixture, { ...filters, branchId: "a" }).map((l) => l.id)).toEqual(["l1", "l2"]);
  });

  it("calculates conversion from cohort creation to delivered-by-cutoff", () => {
    const metrics = overviewMetrics(fixture, { ...filters, branchId: "a" });
    expect(metrics.conversion).toBe(0.5);
  });

  it("reconstructs funnel stages from status_history rather than current status", () => {
    const funnel = getFunnel(fixture, { ...filters, branchId: "a" });
    expect(funnel.find((x) => x.stage === "ordered")?.count).toBe(1);
    expect(funnel.find((x) => x.stage === "delivered")?.count).toBe(1);
  });

  it("uses the selected end date for stale lead aging", () => {
    const rows = staleLeadRows(fixture, { from: "2025-12-01", to: "2025-12-20", branchId: "a" }, 7);
    expect(rows.map((r) => r.lead.id)).toContain("l2");
    expect(rows[0].daysIdle).toBeGreaterThanOrEqual(7);
  });

  it("does not consider lost or delivered leads active/stale", () => {
    expect(staleLeadRows(fixture, filters).map((r) => r.lead.id)).toEqual(["l2"]);
  });

  it("aggregates monthly branch targets", () => {
    expect(aggregateTargets(fixture, filters)).toEqual({ units: 4, revenue: 6_000_000 });
    expect(aggregateTargets(fixture, { ...filters, branchId: "a" })).toEqual({ units: 2, revenue: 3_000_000 });
  });

  it("calculates delayed delivery behavior from the recorded delay reason", () => {
    const p = deliveryPerformance(fixture, { ...filters, branchId: "a" });
    expect(p.delayedCount).toBe(1);
    expect(p.onTimeRate).toBe(0);
    expect(p.reasons[0]).toEqual({ reason: "Registration", count: 1 });
  });
});
