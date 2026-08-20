import type { DashboardFilters } from "@/types/dealership";

export function filtersFromSearch(search: Record<string, string | string[] | undefined>): Partial<DashboardFilters> {
  const get = (key: string) => typeof search[key] === "string" ? search[key] as string : undefined;
  return { from: get("from"), to: get("to"), branchId: get("branch"), repId: get("rep") };
}
