"use client";

import { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { formatINR, formatPct, titleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";

type FunnelStage = "new" | "contacted" | "test_drive" | "negotiation" | "ordered" | "delivered";

interface WhatIfTransition {
  key: string;
  from: FunnelStage;
  to: FunnelStage;
  fromCount: number;
  toCount: number;
  currentRate: number;
}

interface WhatIfData {
  cohortSize: number;
  counts: Record<FunnelStage, number>;
  transitions: WhatIfTransition[];
  delivered: number;
  averageDealValue: number;
}

const MAX_UPLIFT_PP = 20;

export function WhatIfSimulator({ data }: { data: WhatIfData }) {
  const [uplifts, setUplifts] = useState<Record<string, number>>({});

  const result = useMemo(() => {
    const projectedCounts: Record<FunnelStage, number> = { ...data.counts };
    const scenarioRates: Record<string, number> = {};
    let previousCount = data.cohortSize;

    for (const transition of data.transitions) {
      const uplift = uplifts[transition.key] ?? 0;
      const improvedRate = Math.min(1, transition.currentRate + uplift / 100);
      const projectedNext = Math.min(previousCount, Math.max(0, Math.round(previousCount * improvedRate)));
      scenarioRates[transition.key] = improvedRate;
      projectedCounts[transition.from] = previousCount;
      projectedCounts[transition.to] = projectedNext;
      previousCount = projectedNext;
    }

    const additionalOrders = Math.max(0, projectedCounts.ordered - data.counts.ordered);
    const additionalDeliveries = Math.max(0, projectedCounts.delivered - data.delivered);
    const revenueImpact = additionalDeliveries * data.averageDealValue;

    return {
      projectedCounts,
      scenarioRates,
      additionalOrders,
      additionalDeliveries,
      revenueImpact,
    };
  }, [data, uplifts]);

  const hasAnyUplift = Object.values(uplifts).some((value) => value > 0);

  if (data.cohortSize === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#dfe3e8] p-6 text-center text-sm text-[#667085]">
        No lead cohort is available for this selection.
      </div>
    );
  }

  const updateUplift = (key: string, value: number) => {
    setUplifts((current) => ({ ...current, [key]: value }));
  };

  return (
    <div id="what-if" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-[#f7f9fc] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#315fce] shadow-sm">
            <SlidersHorizontal size={17} />
          </span>
          <div>
            <div className="text-sm font-bold">Improve any funnel stage</div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#667085]">
              Adjust conversion at each adjacent stage. Improvements compound through the rest of the funnel, so changing an early stage can increase every downstream stage. Uplift is measured in percentage points.
            </p>
          </div>
        </div>
        <Button variant="secondary" className="h-8 gap-2 text-xs" onClick={() => setUplifts({})} disabled={!hasAnyUplift}>
          <RotateCcw size={14} /> Reset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.transitions.map((transition) => {
          const uplift = uplifts[transition.key] ?? 0;
          const scenarioRate = result.scenarioRates[transition.key] ?? transition.currentRate;
          return (
            <div key={transition.key} className="rounded-xl border border-[#e6e9ed] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#202939]">
                    {titleCase(transition.from)} → {titleCase(transition.to)}
                  </div>
                  <div className="mt-1 text-xs text-[#667085]">
                    {transition.fromCount} → {transition.toCount} actual
                  </div>
                </div>
                <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-bold text-[#315fce]">+{uplift} pp</span>
              </div>

              <input
                aria-label={`${titleCase(transition.from)} to ${titleCase(transition.to)} conversion uplift`}
                type="range"
                min="0"
                max={MAX_UPLIFT_PP}
                step="1"
                value={uplift}
                onChange={(event) => updateUplift(transition.key, Number(event.target.value))}
                className="mt-4 w-full accent-[#315fce]"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-[#98a2b3]"><span>0 pp</span><span>{MAX_UPLIFT_PP} pp</span></div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-[#f4f5f7] px-2.5 py-1.5 font-semibold">{formatPct(transition.currentRate)} current</span>
                <span className="text-[#98a2b3]">→</span>
                <span className="rounded-lg bg-[#edf8f0] px-2.5 py-1.5 font-semibold text-[#257247]">{formatPct(scenarioRate)} scenario</span>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="mb-3 text-xs font-bold uppercase tracking-[.06em] text-[#667085]">Projected funnel</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {(["new", "contacted", "test_drive", "negotiation", "ordered", "delivered"] as FunnelStage[]).map((stage) => {
            const actual = data.counts[stage];
            const projected = result.projectedCounts[stage];
            const delta = projected - actual;
            return (
              <div key={stage} className="rounded-xl border border-[#e6e9ed] p-3">
                <div className="text-[11px] uppercase tracking-[.06em] text-[#8a93a2]">{titleCase(stage)}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold">{projected}</span>
                  {delta > 0 && <span className="text-xs font-bold text-[#257247]">+{delta}</span>}
                </div>
                <div className="mt-1 text-[11px] text-[#98a2b3]">Actual {actual}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e6e9ed] p-3">
          <div className="text-[11px] uppercase tracking-[.06em] text-[#8a93a2]">Extra orders</div>
          <div className="mt-2 text-xl font-bold">+{result.additionalOrders}</div>
        </div>
        <div className="rounded-xl border border-[#e6e9ed] p-3">
          <div className="text-[11px] uppercase tracking-[.06em] text-[#8a93a2]">Est. deliveries</div>
          <div className="mt-2 text-xl font-bold">+{result.additionalDeliveries}</div>
        </div>
        <div className="rounded-xl border border-[#e6e9ed] p-3">
          <div className="text-[11px] uppercase tracking-[.06em] text-[#8a93a2]">Revenue impact</div>
          <div className="mt-2 text-lg font-bold">{formatINR(result.revenueImpact)}</div>
        </div>
      </div>

      <p className="text-[11px] leading-5 text-[#98a2b3]">
        Directional scenario, not a commitment. Each slider adds up to {MAX_UPLIFT_PP} percentage points to that stage's observed cohort conversion, capped at 100%. Downstream counts are recalculated sequentially, and revenue impact uses the cohort's average delivered deal value.
      </p>
    </div>
  );
}
