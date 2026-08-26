"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6"><div className="max-w-md rounded-2xl border border-[#e4e7ec] bg-white p-8 text-center shadow-sm"><div className="text-xl font-bold">DealerPulse couldn’t process this view</div><p className="mt-2 text-sm leading-6 text-[#667085]">Check the dataset shape or reset the filters. The analytics layer fails visibly rather than silently dropping malformed records.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>;
}
