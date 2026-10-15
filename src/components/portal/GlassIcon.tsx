import type { LucideIcon } from "lucide-react";

export function GlassIcon({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8 rounded-lg" : "h-11 w-11";
  const ic = size === "lg" ? 30 : size === "sm" ? 16 : 22;
  return (
    <span className={`glass-icon ${box}`} aria-hidden>
      <Icon size={ic} />
    </span>
  );
}
