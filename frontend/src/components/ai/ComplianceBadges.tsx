import { ShieldCheck, Lock, Award, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComplianceBadge {
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  verified: boolean;
}

export function ComplianceBadges() {
  const badges: ComplianceBadge[] = [
    {
      label: "GDPR",
      icon: <Lock className="w-4 h-4" />,
      tooltip: "Data anonymization compliant with GDPR Article 32 (pseudonymization) and Article 4 (data protection by design)",
      verified: true,
    },
    {
      label: "PII Masked",
      icon: <CheckCircle2 className="w-4 h-4" />,
      tooltip: "Zero personally identifiable information. All SSNs, names, and sensitive fields are synthetic and unmappable to real entities.",
      verified: true,
    },
    {
      label: "SOC 2",
      icon: <Award className="w-4 h-4" />,
      tooltip: "Type II certified data generation processes. Audit trails maintained for all synthetic dataset creation and access.",
      verified: true,
    },
    {
      label: "HIPAA Ready",
      icon: <ShieldCheck className="w-4 h-4" />,
      tooltip: "Compatible with HIPAA BAA. Support for healthcare data synthesis available on custom configuration.",
      verified: false,
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Tooltip key={badge.label}>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all cursor-help ${
                  badge.verified
                    ? "bg-success/10 border-success/30 text-success hover:border-success/50"
                    : "bg-muted/20 border-muted/30 text-muted-foreground hover:border-muted/50"
                }`}
              >
                {badge.icon}
                <span className="text-xs font-semibold">{badge.label}</span>
                {badge.verified && <span className="text-[10px] ml-0.5">✓</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs leading-relaxed">{badge.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
