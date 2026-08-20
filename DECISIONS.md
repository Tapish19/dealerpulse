# DealerPulse — Product & Engineering Decisions

## 1. Product thesis

I designed DealerPulse around three questions a dealership CEO or branch manager should be able to answer quickly:

1. **Are we going to hit target?**
2. **Where is performance breaking down?**
3. **What should my managers do today?**

This led to an executive decision cockpit rather than a page full of independent charts. The first screen moves from vital signs, to target trajectory, to exceptions, to branch comparison, and finally to the concrete leads requiring follow-up.

## 2. What I chose to build and why

### Executive overview

The group page surfaces five vital signs:

- delivered units vs target
- revenue vs target
- lead-cohort conversion
- active pipeline and high-intent pipeline
- leads at risk

The purpose is not to maximize metric density. It is to give leadership a quick health check and then expose the strongest reason to investigate further.

### Action Center

Charts explain what happened; managers need to know what to do next. The Action Center turns deterministic business rules into prioritized operational prompts, including:

- high-intent leads with no movement for 7+ days
- branches behind unit target
- branch delivery-cycle outliers
- positive conversion outliers worth copying across the group

Each insight links to a branch or a concrete follow-up queue. I intentionally did not use an LLM here. For this dataset, deterministic rules are faster, reproducible, explainable, and easier to trust.

### Drill-down: group → branch → sales officer → lead

The navigation mirrors management responsibility:

- CEO: group and branch comparison
- branch manager: branch target, sales-officer leaderboard, funnel, aging, and delivery execution
- sales-officer coaching: conversion, active book, funnel, and comparison against the branch
- individual lead: chronological status journey and notes

I use a lead drawer rather than another route so the manager keeps analytical context while inspecting a lead.

### Conversion funnel from status history

Every lead contains a complete status history, so funnel counts are reconstructed from the stages a lead actually reached. Using only the top-level `status` would undercount earlier stages and produce a misleading funnel.

### Lead aging

Open leads are bucketed by time since the last status transition:

- 0–2 days
- 3–6 days
- 7–13 days
- 14+ days

A lead is considered stale at 7+ days. High-intent stages (`test_drive`, `negotiation`, `ordered`) receive additional priority because they represent more immediate pipeline value.

### Explainable target forecasting

For an in-progress month, the forecast uses historical stage-to-delivery probabilities. An open negotiation lead contributes more expected delivery probability than a new lead. This creates a transparent forecast a manager can challenge and understand.

I deliberately avoided presenting a small historical dataset as if it supported a sophisticated ML model.

### What-if scenario

The overview and branch views include an interactive test-drive → order conversion scenario. The user can apply a 0–20 percentage-point uplift and see estimated incremental orders, downstream deliveries, and revenue. The calculation uses the selected cohort's observed test-drive → order rate, observed order → delivery rate, and average delivered deal value, so the impact updates with filters rather than relying on a hard-coded example.

I label this as directional rather than a forecast commitment: it isolates one funnel lever and intentionally does not assume capacity, inventory, or lead-volume changes.

### Delivery operations

The assignment includes delivery records and delay reasons, which means dealership performance should not stop at the order. DealerPulse shows:

- share of deliveries without a recorded delay reason
- average and median order-to-delivery cycle
- deliveries with a recorded delay reason
- delay reasons

This can surface operational bottlenecks that sales-only dashboards miss.

### CSV export and shareable URLs

The follow-up queues can be exported to CSV for manager action. Filter state is encoded in the URL, and the filter bar includes a **Share view** control that copies the current URL, so a CEO can send a specific period/branch view without adding user accounts or saved-report infrastructure.

## 3. Data and time semantics

There are several different business dates in this domain:

- lead creation date
- stage transition timestamps
- order date
- actual delivery date

I do not treat them as interchangeable.

### Event metrics

Delivered units and revenue are counted by delivery date inside the selected period.

### Cohort metrics

Conversion uses leads created in the selected period and asks whether they reached `delivered` by the selected end date.

### Pipeline snapshot

Pipeline status is reconstructed **as of the selected end date** using status history. The final status stored on the lead is not blindly applied to historical views.

### Historical aging

The assignment dataset ends in 2025. Comparing an open December 2025 lead against the real current date would incorrectly make every historical lead appear hundreds of days stale. Aging therefore uses the dashboard's selected `to` date.

This distinction is small in code but material in product correctness.

## 4. Architecture decision: no backend/database

The supplied dataset contains 510 leads. A separate Express API, database, Redis cache, WebSocket layer, or queue would add deployment and review complexity without improving the user's experience.

The architecture is therefore:

```text
JSON
  ↓
Zod boundary validation + normalization
  ↓
Typed domain model
  ↓
Analytics / insight engine
  ↓
Server-rendered view models
  ↓
Interactive chart/filter/drill-down components
  ↓
Vercel
```

The main engineering investment is in clean domain logic rather than unnecessary infrastructure.

If the product later moved from a take-home dataset to live dealership operations, I would retain the analytics interfaces and replace the repository with a real event/data service.

## 5. Component and code boundaries

React components do not calculate business metrics directly. The layers are separated into:

- `data/`: validation, aliases, and normalization
- `types/`: canonical dealership domain model
- `analytics/`: funnel, targets, pipeline, aging, delivery metrics, forecasting, and insights
- `components/`: presentation and interaction
- `app/`: route composition and URL-backed filters

This allows metric definitions to be unit-tested without rendering React.

## 6. URL-backed filtering

Date and branch filters live in query parameters instead of opaque component state. Benefits:

- views can be shared
- browser back/forward works naturally
- pages can be server rendered from the URL
- drill-down links preserve the selected analysis window

Selecting a sales officer navigates to the coaching page rather than pretending a branch-level monthly target is an individual target. The dataset contains branch targets, not rep targets.

## 7. Managers vs sales officers

The dataset has 5 branch managers and 25 sales officers. I intentionally exclude managers from the sales-officer performance leaderboard because ranking unlike job roles can create an invalid management signal.

If managers carry an explicit personal quota in a future data model, that could become a separate comparable cohort.

## 8. Visual design

The design direction is restrained B2B software rather than a hackathon dashboard:

- neutral background and white surfaces
- large, legible KPI values
- blue primarily for analytical data
- green for healthy outcomes
- amber for risk
- red only for manager action
- limited chart colors
- responsive 1/2/3-column transitions

Action priority is communicated through hierarchy and copy, not just color.

## 9. Loading, empty, error, and responsive states

Even though a local JSON dataset loads quickly, the product includes loading skeletons, an explicit processing error state, 404 handling for invalid drill-down IDs, empty lead queues, horizontally scrollable data tables, and responsive chart containers. These states matter because the evaluation asks whether the product feels complete rather than merely functional on one happy-path desktop viewport.

## 10. Testing strategy

I prioritized calculations that would create bad executive decisions if wrong:

- historical status reconstruction
- branch isolation
- cohort conversion
- funnel reconstruction from status history
- stale aging relative to selected end date
- lost/delivered exclusion from active pipeline
- branch target aggregation
- delayed delivery calculations

Playwright covers the critical interaction story:

- overview → branch drill-down
- URL-backed time filters
- at-risk lead → journey drawer

## 11. Tradeoffs

### Static JSON vs API

**Chosen:** static JSON + typed adapter.

**Tradeoff:** all data ships with the application and there is no real-time mutation. For the supplied fixed dataset this is simpler and faster. In production I would place the same analytics contracts behind a backend/event store.

### Deterministic insights vs AI summaries

**Chosen:** deterministic insights plus a generated executive sentence.

**Tradeoff:** less conversational flexibility, but the output is reproducible and every statement can be traced to a metric. A future LLM layer should summarize these computed facts, not calculate them.

### Transparent forecast vs ML

**Chosen:** historical stage-probability weighting.

**Tradeoff:** it does not model seasonality or individual model/rep effects. It is, however, explainable and appropriate for a seven-month dataset.

### No authentication

Explicitly skipped because the assignment says to assume the CEO is already authenticated.


### Source-data reconciliation

Fourteen lead rows report `status: lost` while their final `status_history` entry still shows an earlier open stage. Because those same rows provide a `last_activity_at` timestamp, the normalization layer treats the declared current status as effective at that timestamp. This prevents false open-pipeline and stale-lead alerts while keeping the reconciliation explicit and localized at the raw-data boundary.

## 12. What I would build next

With more time and live data I would add, in order:

1. **Real source integration and freshness SLAs** — replace the repository adapter with CRM/DMS event ingestion and display data freshness per source.
2. **Follow-up actions** — create tasks, assign/reassign leads, and record manager acknowledgements directly from the Action Center.
3. **Forecast calibration** — backtest the pipeline forecast and add confidence intervals and per-branch calibration.
4. **Lost-reason analysis** — quantify controllable vs uncontrollable loss reasons by branch and rep.
5. **Scheduled executive digest** — send a concise morning summary sourced only from computed metrics and exceptions.
6. **Saved views / permissions** — only once multiple users and role-specific scope become real requirements.
7. **Scenario expansion** — extend the current test-drive → order what-if model to lead volume, source mix, inventory constraints, and delivery capacity.

## 13. Interesting patterns in the supplied dataset

I analyzed the supplied `dealership_data.json` directly. The following patterns stood out and influenced the dashboard's Action Center, branch comparisons, funnel views, and follow-up prioritization.

- **The group is substantially below target, although December shows momentum.** Across Oct–Dec 2025, the group recorded 102 deliveries against 690 target units (~14.8% unit attainment) and about ₹24.81 Cr of delivered deal value against roughly ₹152.41 Cr of revenue target (~16.3%). Monthly unit attainment improved from ~8.6% in October to ~12.5% in November and ~23.9% in December, so the direction is improving even though the absolute target gap remains large.
- **Lakeside Toyota in Bangalore is the clearest branch-level exception.** It recorded only 3 deliveries against 128 target units in Oct–Dec (~2.3% attainment). Among leads created in the same period, only 2 of 41 reached delivery by Dec 31 (~4.9% cohort conversion), far below the other branches. This is large enough to warrant a branch-specific root-cause investigation rather than treating the group as uniformly underperforming.
- **Downtown Toyota converts leads well despite still missing target.** For Oct–Dec leads, Downtown converted 24 of 57 leads to delivery by period end (~42.1%), the highest branch conversion rate. Yet it delivered only 31 vehicles against 155 target units (~20.0% attainment). That suggests its problem is not simply sales execution; lead volume, target calibration, inventory, and delivery capacity may also be contributing.
- **Walk-in leads are materially stronger than social-media leads.** Across the full dataset, 64 of 140 walk-in leads are delivered (~45.7%), compared with 10 of 72 social-media leads (~13.9%). In the Oct–Dec cohort the gap remains large: walk-ins convert at ~42.9% versus ~13.0% for social media. This makes source mix an important management lever rather than a vanity acquisition metric.
- **The stale pipeline is concentrated in very late-stage opportunities.** As of Dec 31, 62 leads remain open and 39 have had no stage movement for at least seven days. Of those stale leads, 37 are already in high-intent stages, including 33 at `order_placed`. These are more commercially urgent than a generic list of old leads because substantial deal value is already close to conversion.
- **The funnel loses leads throughout the journey rather than at only one step.** Of 260 leads created in Oct–Dec, 196 reached `contacted`, 148 reached `test_drive`, 116 reached `negotiation`, 93 reached `order_placed`, and 69 reached `delivered` by Dec 31. The final order-placed → delivered transition still loses about 25.8% of that cohort, which supports showing both sales funnel health and post-order execution.
- **Delivery reliability varies meaningfully by branch.** Only 40 of 102 Oct–Dec deliveries (~39.2%) have no recorded delay reason. The most common recorded reasons are customer-requested date changes (15), factory allocation delays (11), and logistics delays in transit (10). Central Toyota has the strongest no-delay share at ~56.3% and the shortest average order-to-delivery cycle at ~17.1 days, compared with roughly 21–22 days for most other branches.
- **Several loss reasons look operationally addressable.** Across the full dataset, common lost reasons include `Better offer elsewhere` (40), `Not ready to purchase` (40), `Financing not approved` (38), `Unresponsive after follow-up` (38), and `Budget constraints` (36). This suggests future lost-reason analysis could separate pricing, financing, follow-up discipline, and uncontrollable customer timing into different intervention strategies.

These observations are derived from the supplied dataset and are intentionally reflected in deterministic dashboard insights rather than hard-coded copy.
