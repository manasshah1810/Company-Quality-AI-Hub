import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, GitBranch, Route as RouteIcon } from "lucide-react";

interface Node {
  id: string;
  type: "changed" | "affected";
  label: string;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

interface ImpactDependencyGraphProps {
  nodes: Node[];
  edges: Edge[];
  changedService?: string;
}

export function ImpactDependencyGraph({
  nodes,
  edges,
  changedService,
}: ImpactDependencyGraphProps) {
  const graphData = useMemo(() => {
    // Simple layout: changed service on left, dependents spread vertically on right
    const layout: Record<string, { x: number; y: number }> = {};

    // Place changed service on the left
    const changedNode = nodes.find((n) => n.type === "changed");
    if (changedNode) {
      layout[changedNode.id] = { x: 50, y: 250 };
    }

    // Place affected services on the right, spread vertically
    const affectedNodes = nodes.filter((n) => n.type === "affected");
    const spacing = affectedNodes.length > 0 ? 400 / affectedNodes.length : 100;
    affectedNodes.forEach((node, index) => {
      layout[node.id] = {
        x: 350,
        y: 80 + index * spacing,
      };
    });

    return layout;
  }, [nodes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <RouteIcon className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Service Dependency Map</h3>
      </div>

      <div className="relative bg-muted/30 border border-border/50 rounded-xl p-6 overflow-hidden" style={{ height: "400px" }}>
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
          {/* Draw edges/arrows */}
          {edges.map((edge, idx) => {
            const source = graphData[edge.source];
            const target = graphData[edge.target];
            if (!source || !target) return null;

            return (
              <g key={`edge-${idx}`}>
                {/* Arrow line */}
                <defs>
                  <marker
                    id={`arrowhead-${idx}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="rgba(168, 85, 247, 0.4)" />
                  </marker>
                </defs>
                <line
                  x1={source.x + 60}
                  y1={source.y}
                  x2={target.x - 40}
                  y2={target.y}
                  stroke="rgba(168, 85, 247, 0.3)"
                  strokeWidth="2"
                  markerEnd={`url(#arrowhead-${idx})`}
                  strokeDasharray="5,5"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        <div className="relative w-full h-full">
          {nodes.map((node) => {
            const pos = graphData[node.id];
            if (!pos) return null;

            const isChanged = node.type === "changed";

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`
                    flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 min-w-max
                    ${
                      isChanged
                        ? "bg-destructive/10 border-destructive text-destructive glow-red"
                        : "bg-warning/10 border-warning text-warning glow-orange"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {isChanged ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <GitBranch className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {node.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium opacity-75">
                    {isChanged ? "Changed Service" : "Affected Dependent"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-muted/20 rounded-lg border border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">
            Changed Service (Direct Impact)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">
            Dependent Service (Indirect Impact)
          </span>
        </div>
      </div>
    </div>
  );
}
