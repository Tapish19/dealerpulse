import { aggregateTargets, cohortLeads, deliveryPerformance, getFunnel, overviewMetrics, staleLeadRows, statusAt } from "../../src/analytics/core";
import { fixture } from "./fixture";

function equal<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}
function deepEqual(actual: unknown, expected: unknown, message: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}: expected ${e}, got ${a}`);
}

const filters = { from: "2025-12-01", to: "2025-12-31" };
equal(statusAt(fixture.leads[0], "2025-12-04T23:59:59Z"), "test_drive", "historical status");
deepEqual(cohortLeads(fixture, { ...filters, branchId: "a" }).map((l) => l.id), ["l1", "l2"], "branch cohort");
equal(overviewMetrics(fixture, { ...filters, branchId: "a" }).conversion, 0.5, "conversion");
equal(getFunnel(fixture, { ...filters, branchId: "a" }).find((x) => x.stage === "ordered")?.count, 1, "ordered funnel count");
deepEqual(staleLeadRows(fixture, filters).map((r) => r.lead.id), ["l2"], "stale rows");
deepEqual(aggregateTargets(fixture, { ...filters, branchId: "a" }), { units: 2, revenue: 3_000_000 }, "target aggregate");
equal(deliveryPerformance(fixture, { ...filters, branchId: "a" }).delayedCount, 1, "delayed count");
console.log("DealerPulse analytics smoke tests passed.");
