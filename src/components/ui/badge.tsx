import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const styles = {
  neutral: "bg-[#f2f4f7] text-[#475467]",
  success: "bg-[#eaf8f2] text-[#087a54]",
  warning: "bg-[#fff6df] text-[#9b5b00]",
  danger: "bg-[#fff0f0] text-[#b83232]",
  info: "bg-[#edf3ff] text-[#2d5fc8]",
};
export function Badge({ className, variant = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof styles }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles[variant], className)} {...props} />;
}
