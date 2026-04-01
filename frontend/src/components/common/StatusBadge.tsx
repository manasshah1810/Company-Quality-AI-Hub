import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const config: Record<string, { icon: any; className: string }> = {
  Passed: { icon: CheckCircle2, className: "text-success bg-success/10" },
  Pass: { icon: CheckCircle2, className: "text-success bg-success/10" },
  Ready: { icon: CheckCircle2, className: "text-success bg-success/10" },
  Approved: { icon: CheckCircle2, className: "text-success bg-success/10" },
  Degraded: { icon: AlertTriangle, className: "text-warning bg-warning/10" },
  Regression: { icon: AlertTriangle, className: "text-warning bg-warning/10" },
  Pending: { icon: Clock, className: "text-warning bg-warning/10" },
  Retraining: { icon: Clock, className: "text-primary bg-primary/10" },
  Failed: { icon: XCircle, className: "text-destructive bg-destructive/10" },
  Defect: { icon: XCircle, className: "text-destructive bg-destructive/10" },
  Rejected: { icon: XCircle, className: "text-destructive bg-destructive/10" },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const c = config[status] || config.Pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.className} ${size === "md" ? "text-sm px-3 py-1.5" : ""}`}>
      <Icon className={size === "md" ? "w-4 h-4" : "w-3 h-3"} />
      {status}
    </span>
  );
}
