import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealerPulse — Dealership Performance & Action Center",
  description: "Executive dealership performance dashboard with branch and rep drilldowns, lead aging, target forecasting, and actionable insights.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
