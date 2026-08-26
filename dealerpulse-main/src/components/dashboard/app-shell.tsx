import Link from "next/link";
import { Activity, ArrowLeft, Building2, Gauge, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children, backHref, title, subtitle, demo }: { children: ReactNode; backHref?: string; title: string; subtitle?: string; demo?: boolean }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#e7e9ed]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-[-0.03em]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111827] text-white"><Activity size={18} /></span>
              <span className="text-[17px]">DealerPulse</span>
            </Link>
            <div className="desktop-only h-6 w-px bg-[#e4e7ec]" />
            <nav className="desktop-only flex items-center gap-1 text-sm text-[#667085]">
              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#f5f6f7] hover:text-[#101828]"><Gauge size={15} /> Overview</Link>
              <Link href="/#branches" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#f5f6f7] hover:text-[#101828]"><Building2 size={15} /> Branches</Link>
              <Link href="/#action-center" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#f5f6f7] hover:text-[#101828]"><Sparkles size={15} /> Action Center</Link>
            </nav>
          </div>
          {demo && <span className="rounded-full border border-[#d9dde3] bg-[#fafafa] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[#667085]">Synthetic assignment data</span>}
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <div className="mb-6 flex items-start gap-3">
          {backHref && <Link href={backHref} className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e2e5e9] bg-white text-[#667085] hover:text-[#111827]"><ArrowLeft size={17} /></Link>}
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.035em] md:text-[30px]">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
