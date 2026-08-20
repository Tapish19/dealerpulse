"use client";

import { useMemo, useState } from "react";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { formatINR, formatPct } from "@/lib/format";

interface WhatIfData {
  testDrives: number;
  orders: number;
  delivered: number;
  testDriveToOrderRate: number;
  orderToDeliveryRate: number;
  averageDealValue: number;
}

export function WhatIfSimulator({ data }: { data: WhatIfData }) {
  const [uplift, setUplift] = useState(10);
  const result = useMemo(() => {
    const improvedRate = Math.min(1, data.testDriveToOrderRate + uplift / 100);
    const projectedOrders = Math.round(data.testDrives * improvedRate);
    const additionalOrders = Math.max(0, projectedOrders - data.orders);
    const additionalDeliveries = Math.max(0, Math.round(additionalOrders * data.orderToDeliveryRate));
    const revenueImpact = additionalDeliveries * data.averageDealValue;
    return { improvedRate, additionalOrders, additionalDeliveries, revenueImpact };
  }, [data, uplift]);

  if (data.testDrives === 0) {
    return <div className="rounded-xl border border-dashed border-[#dfe3e8] p-6 text-center text-sm text-[#667085]">No test-drive cohort is available for this selection.</div>;
  }

  return (
    <div id="what-if" className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-[#f7f9fc] p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#315fce] shadow-sm"><SlidersHorizontal size={17}/></span>
        <div>
          <div className="text-sm font-bold">Improve test-drive → order conversion</div>
          <p className="mt-1 text-xs leading-5 text-[#667085]">Scenario uses this cohort's actual funnel and average delivered deal value. Uplift is measured in percentage points.</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#475467]">Conversion uplift</span>
          <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 font-bold text-[#315fce]">+{uplift} pp</span>
        </div>
        <input
          aria-label="Test drive to order conversion uplift"
          type="range"
          min="0"
          max="20"
          step="1"
          value={uplift}
          onChange={(event) => setUplift(Number(event.target.value))}
          className="w-full accent-[#315fce]"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#98a2b3]"><span>0 pp</span><span>20 pp</span></div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-lg bg-[#f4f5f7] px-3 py-2 font-semibold">{formatPct(data.testDriveToOrderRate)} current</span>
        <ArrowRight size={15} className="text-[#98a2b3]"/>
        <span className="rounded-lg bg-[#edf8f0] px-3 py-2 font-semibold text-[#257247]">{formatPct(result.improvedRate)} scenario</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#e6e9ed] p-3"><div className="text-[11px] uppercase tracking-[.06em] text-[#8a93a2]">Extra orders</div><div className="mt-2 text-xl font-bold">+{result.additionalOrders}</div></div>
        <div className="rounded-xl border border-[#e6e9ed] p-3"><div className="text-[11px] uppercase tracking-[.06em] text-[#8a93a2]">Est. deliveries</div><div className="mt-2 text-xl font-bold">+{result.additionalDeliveries}</div></div>
        <div className="rounded-xl border border-[#e6e9ed] p-3"><div className="text-[11px] uppercase tracking-[.06em] text-[#8a93a2]">Revenue impact</div><div className="mt-2 text-lg font-bold">{formatINR(result.revenueImpact)}</div></div>
      </div>
      <p className="text-[11px] leading-5 text-[#98a2b3]">Directional scenario, not a commitment: additional orders are multiplied by the cohort's observed order→delivery rate ({formatPct(data.orderToDeliveryRate)}).</p>
    </div>
  );
}
