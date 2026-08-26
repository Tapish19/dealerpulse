"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({ rows, filename = "dealerpulse-export.csv" }: { rows: Record<string, string | number | boolean | null | undefined>[]; filename?: string }) {
  const download = () => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"','""')}"`;
    const csv = [headers.map(escape).join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  return <Button variant="secondary" onClick={download} disabled={!rows.length}><Download size={15}/> Export CSV</Button>;
}
