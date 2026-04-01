import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface CoTStep {
  text: string;
  status: "success" | "failed" | "warning" | "info";
  duration?: string;
}

interface CoTFlowDiagramProps {
  steps: string[];
  failureStep?: number;
}

export function CoTFlowDiagram({ steps, failureStep }: CoTFlowDiagramProps) {
  const renderSteps = (): CoTStep[] => {
    return steps.map((text, i) => {
      if (failureStep !== undefined && i === failureStep) {
        return { text, status: "failed", duration: "2.3s" };
      } else if (failureStep !== undefined && i > failureStep) {
        return { text, status: "info", duration: "skipped" };
      } else {
        return { text, status: "success", duration: `${(i + 1) * 0.8}s` };
      }
    });
  };

  const flowSteps = renderSteps();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success text-white";
      case "failed":
        return "bg-destructive text-white";
      case "warning":
        return "bg-warning text-black";
      case "info":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="w-4 h-4" />;
    if (status === "failed") return <AlertCircle className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
        Chain of Thought Execution Flow
      </div>

      {/* Flow Diagram */}
      <div className="relative pl-8">
        {flowSteps.map((step, i) => (
          <div key={i} className="mb-6 relative">
            {/* Connector Line */}
            {i < flowSteps.length - 1 && (
              <div
                className={`absolute left-[-28px] top-8 w-0.5 h-12 ${
                  step.status === "failed" ? "bg-destructive" : "bg-border/40"
                }`}
              />
            )}

            {/* Node */}
            <div className="flex items-start gap-3">
              {/* Circle Node */}
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 mt-0.5 absolute left-[-36px] ${getStatusColor(step.status)}`}
              >
                {step.status === "success" && <CheckCircle2 className="w-4 h-4" />}
                {step.status === "failed" && <AlertCircle className="w-4 h-4" />}
                {step.status === "info" && <span className="text-[10px] font-bold">{i + 1}</span>}
                {step.status === "warning" && <Clock className="w-3 h-3" />}
              </div>

              {/* Step Content */}
              <div className="flex-1 p-3 rounded-lg bg-muted/20 border border-border/40">
                <div className="text-sm text-foreground leading-relaxed">{step.text}</div>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/20">
                  <span className={`text-[10px] font-mono font-bold ${
                    step.status === "success" ? "text-success" :
                    step.status === "failed" ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    ⏱ {step.duration}
                  </span>
                  {step.status === "failed" && (
                    <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                      ✗ EXECUTION HALTED
                    </span>
                  )}
                  {step.status === "info" && (
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      — Skipped
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Bar */}
      <div className="mt-6 pt-3 border-t border-border/20">
        <div className="grid grid-cols-3 gap-2 text-[9px]">
          <div className="p-2 rounded bg-success/10">
            <div className="text-muted-foreground mb-1">Completed</div>
            <div className="font-bold text-success">{flowSteps.filter(s => s.status === "success").length}/{flowSteps.length}</div>
          </div>
          {failureStep !== undefined && (
            <div className="p-2 rounded bg-destructive/10">
              <div className="text-muted-foreground mb-1">Failed at Step</div>
              <div className="font-bold text-destructive">{failureStep + 1}</div>
            </div>
          )}
          <div className="p-2 rounded bg-primary/10">
            <div className="text-muted-foreground mb-1">Total Time</div>
            <div className="font-bold text-primary">{(flowSteps.length * 0.8).toFixed(1)}s</div>
          </div>
        </div>
      </div>
    </div>
  );
}
