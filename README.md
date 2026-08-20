# DealerPulse

DealerPulse is a Vercel-ready dealership performance and action dashboard built for the Forward Deployed Engineer take-home assignment. It uses the supplied `dealership_data.json` directly: 5 branches, 30 sales reps, 510 leads, 35 monthly target rows, and 160 delivery records covering June–December 2025.

## Product thesis

The information hierarchy is organized around three executive questions:

1. **Are we going to hit target?** — units, revenue, monthly trend, and an explainable pipeline forecast.
2. **Where is performance breaking down?** — branch ranking, funnel drop-off, lead aging, and delivery operations.
3. **What should managers do today?** — a deterministic Action Center plus a concrete stale-lead follow-up queue.
4. **What changes would matter?** — an interactive test-drive → order what-if simulator grounded in the selected cohort.

## Tech stack

- Next.js App Router + React + TypeScript
- Tailwind CSS with source-owned UI primitives
- Recharts
- Zod at the raw dataset boundary
- Vitest for analytics tests
- Playwright for critical drill-down flows
- Vercel deployment
- No database or separate API: the supplied fixed dataset is small enough to validate and analyze directly

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Production verification:

```bash
npm run check:data
npm run typecheck
npm run test:analytics
npm run build
npm start
```

Optional test suites:

```bash
npm test
npm run test:e2e
```

## Dataset

`src/data/dealership_data.json` is the exact assignment dataset supplied for DealerPulse.

Source shape:

- `branches`: 5 dealership branches
- `sales_reps`: 30 people — 5 branch managers and 25 sales officers
- `leads`: 510 leads with full status histories
- `targets`: 35 branch/month unit and revenue target rows
- `deliveries`: 160 order-to-delivery records with `days_to_deliver` and optional `delay_reason`
- period: June–December 2025

The raw file uses these business fields, among others:

- `assigned_to` for lead ownership
- `model_interested` for vehicle model
- `deal_value` for opportunity/revenue value
- `target_units` and `target_revenue` for branch targets
- `order_placed` as the post-negotiation stage

`src/data/normalize.ts` converts those source fields into a stable internal domain model. Components never parse the raw JSON directly.

### Source-data reconciliation

Fourteen leads are marked `lost` in their top-level lead record even though their final `status_history` entry still shows an earlier open stage. The adapter keeps the top-level source status authoritative at the supplied `last_activity_at` timestamp by adding an explicit reconciled event in the normalized model. This avoids false active-pipeline and stale-lead alerts while keeping the data-quality decision isolated at the raw-data boundary.

## Actual funnel

The supplied dataset contains this journey:

```text
new → contacted → test_drive → negotiation → order_placed → delivered
                                                ↘
                                                  lost can occur at earlier stages
```

There is no `qualified` stage in the assignment JSON, so DealerPulse does not invent one.

## Important metric definitions

- **Vehicles delivered:** delivery events whose `delivery_date` falls inside the selected date range.
- **Revenue:** `deal_value` from the lead associated with those delivery events.
- **Lead conversion:** leads created inside the selected range that reached `delivered` by the selected end date.
- **Active pipeline:** leads created on or before the selected end date whose reconstructed status is neither `lost` nor `delivered` at that point in time.
- **At-risk lead:** an open lead with no meaningful status transition for at least seven days as of the selected end date.
- **Funnel:** reconstructed from `status_history`, not inferred from each lead's final status alone.
- **Target attainment:** delivered units / `target_units` for branch/month rows included in the selected range.
- **Delivery delay:** the source record contains a non-empty `delay_reason`. Order-to-delivery days come from `days_to_deliver` (with timestamp fallback).
- **Forecast:** latest-month delivered units plus probability-weighted open pipeline when days remain. Historical stage-to-delivery probabilities are used instead of a black-box model.
- **What-if:** a 0–20 percentage-point test-drive → order uplift is translated into incremental orders, expected deliveries, and revenue using the selected cohort's observed downstream conversion and average delivered deal value.

## Historical time semantics

The dataset ends on December 31, 2025. DealerPulse intentionally does **not** compare open leads to the computer's current date. Lead aging, pipeline state, and stale alerts are reconstructed relative to the selected dashboard end date. This prevents historical opportunities from appearing hundreds of days stale when the app is opened later.

## Route model

```text
/                         Group overview
/branches/[branchId]      Branch manager drill-down
/reps/[repId]             Sales officer coaching drill-down
```

Lead details open in a drawer so users can inspect the full status journey without losing analytical context.

## Shareable filters

Date and branch state live in query parameters, for example:

```text
/?from=2025-10-01&to=2025-12-31&branch=B3
```

This makes filtered views shareable without a database or saved-view service. The **Share view** button copies the current filtered URL.

## Real data patterns surfaced by the product

For the default Oct–Dec leadership view, the supplied data shows:

- 102 deliveries against 690 target units
- 260 leads created, with 69 delivered by Dec 31 (~26.5% cohort conversion)
- 62 open leads as of Dec 31
- 39 open leads stale for at least 7 days
- 37 of those stale leads already in high-intent stages
- Lakeside Toyota as the clearest branch underperformance exception
- Downtown Toyota as the strongest Oct–Dec cohort converter

The detailed evidence and tradeoffs are documented in `DECISIONS.md`.

## Deploy to Vercel

With Vercel CLI:

```bash
vercel
vercel --prod
```

Or connect the repository through Vercel Git integration. No environment variables are required for this static-dataset version.

## Project structure

```text
src/
  analytics/       Business calculations and view models
  app/             App Router pages and states
  components/      Product UI, charts, filters, lead timeline
  data/            Assignment JSON, validation/normalization, repository
  lib/             Formatting and query helpers
  types/           Domain types

tests/
  analytics/       Deterministic business-logic tests
  e2e/             Critical user journeys

DECISIONS.md        Product/engineering rationale and data observations
```
