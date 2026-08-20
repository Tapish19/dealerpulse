import { readFile } from "node:fs/promises";

const url = new URL("../src/data/dealership_data.json", import.meta.url);
const data = JSON.parse(await readFile(url, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const key of ["branches", "sales_reps", "leads", "targets", "deliveries"]) {
  assert(Array.isArray(data[key]), `${key} must be an array`);
}

const branchIds = new Set(data.branches.map((branch) => branch.id));
const repIds = new Set(data.sales_reps.map((rep) => rep.id));
const leadsById = new Map(data.leads.map((lead) => [lead.id, lead]));
const allowedStatuses = new Set(["new", "contacted", "test_drive", "negotiation", "order_placed", "delivered", "lost"]);

for (const rep of data.sales_reps) assert(branchIds.has(rep.branch_id), `Unknown branch ${rep.branch_id} for rep ${rep.id}`);
for (const lead of data.leads) {
  assert(branchIds.has(lead.branch_id), `Unknown branch ${lead.branch_id} for lead ${lead.id}`);
  assert(repIds.has(lead.assigned_to), `Unknown rep ${lead.assigned_to} for lead ${lead.id}`);
  assert(allowedStatuses.has(lead.status), `Unknown lead status ${lead.status} on ${lead.id}`);
  for (const event of lead.status_history ?? []) assert(allowedStatuses.has(event.status), `Unknown history status ${event.status} on ${lead.id}`);
}
for (const target of data.targets) assert(branchIds.has(target.branch_id), `Unknown branch ${target.branch_id} in targets`);
for (const delivery of data.deliveries) assert(leadsById.has(delivery.lead_id), `Unknown lead ${delivery.lead_id} in deliveries`);

const reconciliations = data.leads.filter((lead) => lead.status_history?.at(-1)?.status !== lead.status).length;
console.log(`DealerPulse data OK: ${data.branches.length} branches, ${data.sales_reps.length} reps, ${data.leads.length} leads, ${data.targets.length} targets, ${data.deliveries.length} deliveries.`);
console.log(`Source-status reconciliations handled by adapter: ${reconciliations}.`);
