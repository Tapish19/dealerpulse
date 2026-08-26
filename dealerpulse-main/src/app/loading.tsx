export default function Loading() {
  return <div className="mx-auto max-w-[1500px] p-6 md:p-8"><div className="mb-8 h-8 w-44 animate-pulse rounded-lg bg-[#e8ebef]"/><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">{Array.from({length:5}).map((_,i)=><div key={i} className="h-36 animate-pulse rounded-2xl bg-[#e8ebef]"/>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_1fr]"><div className="h-96 animate-pulse rounded-2xl bg-[#e8ebef]"/><div className="h-96 animate-pulse rounded-2xl bg-[#e8ebef]"/></div></div>;
}
