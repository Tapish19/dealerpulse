import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const style = variant === "primary"
    ? "bg-[#111827] text-white hover:bg-[#202938]"
    : variant === "secondary"
      ? "border border-[#d9dde3] bg-white text-[#344054] hover:bg-[#f8f9fb]"
      : "text-[#475467] hover:bg-[#f3f4f6]";
  return <button className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-50", style, className)} {...props} />;
}
