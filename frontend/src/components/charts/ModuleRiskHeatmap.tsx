import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface ModuleRiskHeatmapProps {
  onCellClick?: (module: string, factor: string, risk: number) => void;
}

export function ModuleRiskHeatmap({ onCellClick }: ModuleRiskHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Mock data: Major application modules with risk factors
  const modules = [
    { name: "Auth Service", risk: 0.3 },
    { name: "Tax Organizer", risk: 0.62 },
    { name: "FormsEngine", risk: 0.78 },
    { name: "Payment Gateway", risk: 0.45 },
  ];

  const riskFactors = [
    { name: "Test Coverage", weight: 0.25 },
    { name: "Commit Volatility", weight: 0.3 },
    { name: "Bug Density", weight: 0.25 },
    { name: "AI Confidence", weight: 0.2 },
  ];

  // Calculate risk for each cell (0-1 scale)
  const getCellRisk = (moduleIndex: number, factorIndex: number): number => {
    const moduleBase = modules[moduleIndex].risk;
    const factorWeight = riskFactors[factorIndex].weight;
    
    // Create variation by factor
    const variation = (factorIndex * 0.15 - 0.225);
    let risk = Math.max(0, Math.min(1, moduleBase + variation));
    
    // For AI Confidence, inverse relationship (lower = higher risk)
    if (factorIndex === 3) {
      risk = 1 - risk;
    }
    
    return risk;
  };

  const getCellColor = (risk: number) => {
    if (risk < 0.3) return "bg-success";
    if (risk < 0.5) return "bg-success/70";
    if (risk < 0.65) return "bg-warning/70";
    if (risk < 0.8) return "bg-warning";
    return "bg-destructive";
  };

  const getRiskLabel = (risk: number) => {
    if (risk < 0.3) return "🟢 Safe";
    if (risk < 0.5) return "🟢 Low";
    if (risk < 0.65) return "🟡 Med";
    if (risk < 0.8) return "🟠 High";
    return "🔴 Critical";
  };

  const handleCellClick = (module: string, factor: string, risk: number) => {
    if (onCellClick) {
      onCellClick(module, factor, risk);
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-heading font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
        <span>Code Risk Heatmap</span>
        <span className="text-[10px] font-normal text-muted-foreground">Module × Risk Factor</span>
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        Click any cell to drill into module details and see mitigation recommendations
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row (Risk Factors) */}
          <div className="flex gap-1 mb-1">
            <div className="w-32 h-6" />
            {riskFactors.map((factor) => (
              <div key={factor.name} className="w-28 text-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                  {factor.name}
                </span>
              </div>
            ))}
          </div>

          {/* Data Rows (Modules) */}
          {modules.map((module, moduleIdx) => (
            <div key={module.name} className="flex gap-1 mb-1">
              {/* Module Label */}
              <div className="w-32 flex items-center px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-[10px] font-bold text-foreground truncate">
                  {module.name}
                </span>
              </div>

              {/* Risk Cells */}
              {riskFactors.map((factor, factorIdx) => {
                const risk = getCellRisk(moduleIdx, factorIdx);
                const cellId = `${module.name}-${factor.name}`;
                const isHovered = hoveredCell === cellId;

                return (
                  <motion.div
                    key={cellId}
                    className={`w-28 h-10 rounded-lg cursor-pointer transition-all border border-white/10 flex items-center justify-center group relative overflow-hidden ${getCellColor(
                      risk
                    )} hover:shadow-lg hover:shadow-primary/20`}
                    onMouseEnter={() => setHoveredCell(cellId)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleCellClick(module.name, factor.name, risk)}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                    <div className="relative z-10 text-center">
                      <div className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                        {Math.round(risk * 100)}%
                      </div>
                      <div className="text-[7px] text-white/70 font-medium mt-0.5">
                        {getRiskLabel(risk)}
                      </div>
                    </div>

                    {/* Hover Tooltip */}
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 rounded-lg whitespace-nowrap text-[8px] text-white border border-white/20 z-20"
                      >
                        {module.name} - {factor.name}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-black/90" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-border/30 flex items-center justify-between text-[9px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Risk Level:</span>
          <div className="flex gap-1">
            <div className="w-5 h-3 rounded bg-success" title="Safe (0-30%)" />
            <div className="w-5 h-3 rounded bg-success/70" title="Low (30-50%)" />
            <div className="w-5 h-3 rounded bg-warning/70" title="Medium (50-65%)" />
            <div className="w-5 h-3 rounded bg-warning" title="High (65-80%)" />
            <div className="w-5 h-3 rounded bg-destructive" title="Critical (80%+)" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[8px] text-muted-foreground/70 italic">
          <ChevronRight className="w-3 h-3" />
          Click cell for drill-down
        </div>
      </div>
    </div>
  );
}
