import type { ReactNode } from "react";
export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-base font-bold tracking-[-0.02em] md:text-lg">{title}</h2>{description && <p className="mt-1 text-sm text-[#667085]">{description}</p>}</div>{action}</div>;
}
