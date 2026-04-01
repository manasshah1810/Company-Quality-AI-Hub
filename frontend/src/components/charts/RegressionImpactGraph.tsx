import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Service {
  name: string;
  confidence: number;
  reason: string;
  predicted_failures: string;
}

interface ChangedFile {
  path: string;
  modules_touched: string[];
}

export function RegressionImpactGraph({
  services,
  changedFiles,
}: {
  services: Service[];
  changedFiles: ChangedFile[];
}) {
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  // Extract unique modules from changed files
  const changedModules = Array.from(new Set(changedFiles.flatMap((f) => f.modules_touched)));

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-foreground">Impact Dependency Graph</h3>
        <p className="text-xs text-muted-foreground">Shows code changes (left) flowing through services (right)</p>
      </div>

      {/* GRAPH VISUALIZATION */}
      <div className="relative w-full h-80 bg-background/30 rounded-xl border border-primary/10 overflow-x-auto">
        <svg className="w-full h-full min-w-max" viewBox="0 0 800 300">
          {/* DEFINITIONS */}
          <defs>
            <marker
              id="arrowRed"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" opacity="0.6" />
            </marker>
            <marker
              id="arrowYellow"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#eab308" opacity="0.6" />
            </marker>
          </defs>

          {/* CHANGED MODULES (LEFT SIDE) */}
          <g>
            <text x="30" y="25" className="text-xs font-bold" fill="rgba(255,255,255,0.7)">
              Changed Code
            </text>
            {changedModules.map((module, idx) => (
              <g key={`module-${idx}`}>
                <rect
                  x="10"
                  y={60 + idx * 80}
                  width="140"
                  height="60"
                  rx="8"
                  fill="rgba(239, 68, 68, 0.15)"
                  stroke="rgba(239, 68, 68, 0.5)"
                  strokeWidth="2"
                />
                <text
                  x="85"
                  y={90 + idx * 80}
                  textAnchor="middle"
                  className="text-xs font-bold"
                  fill="rgba(239, 68, 68, 0.9)"
                >
                  {module}
                </text>
              </g>
            ))}
          </g>

          {/* MIDDLE LABEL */}
          <g>
            <text x="350" y="25" className="text-xs font-bold" fill="rgba(255,255,255,0.7)" textAnchor="middle">
              Impact Flow
            </text>
          </g>

          {/* AFFECTED SERVICES (RIGHT SIDE) */}
          <g>
            <text x="630" y="25" className="text-xs font-bold" fill="rgba(255,255,255,0.7)">
              Affected Services
            </text>
            {services.map((service, idx) => {
              const isHovered = hoveredService === service.name;
              const confidencePercent = Math.round(service.confidence * 100);
              const yPos = 60 + idx * 60;

              return (
                <g
                  key={`service-${idx}`}
                  opacity={hoveredService === null || isHovered ? 1 : 0.3}
                  className="transition-opacity"
                >
                  <rect
                    x="550"
                    y={yPos}
                    width="180"
                    height="50"
                    rx="8"
                    fill={
                      confidencePercent > 75
                        ? "rgba(239, 68, 68, 0.15)"
                        : confidencePercent > 50
                          ? "rgba(234, 179, 8, 0.15)"
                          : "rgba(59, 130, 246, 0.15)"
                    }
                    stroke={
                      confidencePercent > 75
                        ? "rgba(239, 68, 68, 0.5)"
                        : confidencePercent > 50
                          ? "rgba(234, 179, 8, 0.5)"
                          : "rgba(59, 130, 246, 0.5)"
                    }
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredService(service.name)}
                    onMouseLeave={() => setHoveredService(null)}
                    style={{ cursor: "pointer" }}
                  />
                  <text
                    x="640"
                    y={yPos + 20}
                    textAnchor="middle"
                    className="text-xs font-bold"
                    fill="rgba(255, 255, 255, 0.9)"
                  >
                    {service.name}
                  </text>
                  <text
                    x="640"
                    y={yPos + 35}
                    textAnchor="middle"
                    className="text-xs"
                    fill={
                      confidencePercent > 75
                        ? "rgba(239, 68, 68, 0.8)"
                        : confidencePercent > 50
                          ? "rgba(234, 179, 8, 0.8)"
                          : "rgba(59, 130, 246, 0.8)"
                    }
                  >
                    {confidencePercent}% confidence
                  </text>
                </g>
              );
            })}
          </g>

          {/* CONNECTION ARROWS */}
          {services.map((service, sIdx) => {
            const isHovered = hoveredService === service.name;
            const confidencePercent = Math.round(service.confidence * 100);
            const yTarget = 60 + sIdx * 60 + 25;

            return changedModules.map((module, mIdx) => {
              const ySource = 60 + mIdx * 80 + 30;
              const strokeWidth = 1 + (service.confidence * 2);

              return (
                <line
                  key={`arrow-${mIdx}-${sIdx}`}
                  x1="150"
                  y1={ySource}
                  x2="550"
                  y2={yTarget}
                  stroke={
                    confidencePercent > 75
                      ? "rgba(239, 68, 68, 0.4)"
                      : confidencePercent > 50
                        ? "rgba(234, 179, 8, 0.4)"
                        : "rgba(59, 130, 246, 0.3)"
                  }
                  strokeWidth={isHovered ? strokeWidth * 2 : strokeWidth}
                  markerEnd={
                    confidencePercent > 75 ? "url(#arrowRed)" : confidencePercent > 50 ? "url(#arrowYellow)" : undefined
                  }
                  opacity={hoveredService === null || isHovered ? 1 : 0.2}
                  style={{ transition: "all 0.2s ease" }}
                />
              );
            });
          })}
        </svg>
      </div>

      {/* LEGEND & HOVER INFO */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-muted-foreground">High Risk (&gt;75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-muted-foreground">Medium Risk (50-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-muted-foreground">Low Risk (&lt;50%)</span>
          </div>
        </div>

        {hoveredService && (
          <div className="p-3 rounded-lg bg-background/50 border border-primary/20 space-y-1">
            <p className="text-xs font-semibold text-foreground">
              {hoveredService}
              {services.find((s) => s.name === hoveredService) && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({Math.round(services.find((s) => s.name === hoveredService)!.confidence * 100)}% confidence)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {services.find((s) => s.name === hoveredService)?.reason}
            </p>
            <p className="text-xs text-orange-400">
              Predicted failures: {services.find((s) => s.name === hoveredService)?.predicted_failures}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">💡 Hover over services to see impact details</p>
      </div>
    </div>
  );
}
