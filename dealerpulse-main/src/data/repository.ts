import raw from "./dealership_data.json";
import { normalizeDataset } from "./normalize";

let cached: ReturnType<typeof normalizeDataset> | undefined;

export function getDataset() {
  cached ??= normalizeDataset(raw);
  return cached;
}
