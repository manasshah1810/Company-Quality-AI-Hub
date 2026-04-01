import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DefectForecastProps {
  onMitigationClick?: () => void;
}

export function DefectForecast({ onMitigationClick }: DefectForecastProps) {
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Mock data: Top at-risk modules with predicted defects
  const predictions = [
    {
      module: "FormsEngine",
      predictedDefects: 12,
      normalBaseline: 3,
      multiplier: 4.2,
      timeFrame: "48 hours",
      riskFactors: ["High commit volatility", "Newly untested edge cases"],
      recommendation: "Generate synthetic test data for field validation",
      color: "destructive"
    },
    {
      module: "Tax Organizer",
      predictedDefects: 7,
      normalBaseline: 2,
      multiplier: 3.5,
      timeFrame: "72 hours",
      riskFactors: ["Increased complexity", "Low test coverage"],
      recommendation: "Deploy regression test suite",
      color: "warning"
    },
    {
      module: "Payment Gateway",
      predictedDefects: 4,
      normalBaseline: 1,
      multiplier: 4.0,
      timeFrame: "48 hours",
      riskFactors: ["API integration changes"],
      recommendation: "Enhanced E2E integration tests",
      color: "warning"
    }
  ];

  const handleMitigationClick = (module: string) => {
    toast.success(`Mitigation Initiated: ${module}`, {
      description: "Redirecting to Synthetic Data Generator to create targeted tests...",
    });
    setTimeout(() => {
      navigate("/synthetic-data", { state: { module } });
    }, 500);
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-destructive/10">
          <AlertCircle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-sm text-foreground">
            Defect Forecast (Next 72h)
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            AI predicted defect hotspots if code ships now
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {predictions.map((prediction, idx) => {
            const isExpanded = expandedModule === prediction.module;
            const bgClass =
              prediction.color === "destructive"
                ? "bg-destructive/5 border-destructive/20"
                : "bg-warning/5 border-warning/20";

            return (
              <motion.div
                key={prediction.module}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-lg border ${bgClass} overflow-hidden`}
              >
                <button
                  onClick={() =>
                    setExpandedModule(isExpanded ? null : prediction.module)
                  }
                  className="w-full p-4 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-foreground truncate">
                        {prediction.module}
                      </h4>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full ${
                          prediction.color === "destructive"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {prediction.multiplier}× Risk
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {prediction.predictedDefects}{" "}
                        <span className="text-foreground font-bold">predicted bugs</span>
                      </span>
                      <span className="opacity-70">
                        (vs {prediction.normalBaseline} baseline)
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-black/30">
                        {prediction.timeFrame}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {isExpanded ? "▼" : "▶"}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/30 px-4 py-4 bg-black/20 space-y-3"
                    >
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">
                          Risk Factors:
                        </p>
                        <ul className="space-y-1">
                          {prediction.riskFactors.map((factor, i) => (
                            <li key={i} className="text-[10px] text-muted-foreground flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted/60" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                        <p className="text-[9px] text-muted-foreground mb-2">
                          RECOMMENDED ACTION:
                        </p>
                        <p className="text-[10px] font-medium text-foreground mb-3">
                          {prediction.recommendation}
                        </p>
                        <button
                          onClick={() => handleMitigationClick(prediction.module)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-[9px] font-bold uppercase transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          Deploy Mitigation Tests
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          <span className="font-bold text-destructive">⚠️ Hold Release?</span> FormsEngine has 3 untested modules in critical path. Recommend generating synthetic tests before production deployment.
        </p>
      </div>
    </div>
  );
}
