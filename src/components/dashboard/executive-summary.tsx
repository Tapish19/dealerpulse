import { Sparkles } from "lucide-react";

export function ExecutiveSummary({ text }: { text: string }) {
  return <div className="mb-6 flex gap-3 rounded-2xl border border-[#dfe6f4] bg-gradient-to-r from-[#f4f7ff] to-white p-4 md:p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e5ecff] text-[#315fce]"><Sparkles size={17}/></span><div><div className="text-xs font-bold uppercase tracking-[.08em] text-[#5c76ad]">Executive brief</div><p className="mt-1.5 text-sm leading-6 text-[#344054]">{text}</p></div></div>;
}
