export function formatINR(value: number, compact = true): string {
  if (compact) {
    if (Math.abs(value) >= 10_000_000) return `₹${(value / 10_000_000).toFixed(value >= 100_000_000 ? 0 : 1)} Cr`;
    if (Math.abs(value) >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`;
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatPct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
