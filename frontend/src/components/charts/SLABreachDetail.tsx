import { X, AlertTriangle, TrendingDown, Zap, Server, BarChart3, Clock3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SLABreachDetailProps {
  tileName: string;
  onClose: () => void;
  stressLevel?: string;
}

export function SLABreachDetail({ tileName, onClose, stressLevel = "Peak Season" }: SLABreachDetailProps) {
  // Generate timeline data showing when latency spiked
  const timelineData = [
    { time: "14:32", latency: 145, cpu: 42, memory: 2.1 },
    { time: "14:33", latency: 178, cpu: 51, memory: 2.5 },
    { time: "14:34", latency: 312, cpu: 73, memory: 4.2 },
    { time: "14:35", latency: 485, cpu: 88, memory: 5.8 },
    { time: "14:36", latency: 628, cpu: 92, memory: 6.5 },
    { time: "14:37", latency: 450, cpu: 78, memory: 5.2 },
    { time: "14:38", latency: 285, cpu: 61, memory: 3.8 },
    { time: "14:39", latency: 165, cpu: 48, memory: 2.6 }
  ];

  const isParserTile = tileName.includes("Parser") || tileName.includes("Extraction");
  const isCoreEngineTile = tileName.includes("Processing") || tileName.includes("Schedule");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md px-4 animate-in fade-in">
      <div className="glass-strong rounded-2xl w-full max-w-2xl border border-destructive/30 shadow-glow-destructive animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">SLA Breach Root Cause Analysis</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Drill-down for: <span className="text-destructive font-mono">{tileName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/20 transition-all"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Breach Timing */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-destructive" /> Timeline of Latency Spike
            </h3>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 overflow-hidden">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="time"
                    stroke="rgb(120, 120, 120)"
                    style={{ fontSize: "9px" }}
                    label={{ value: "Time (UTC)", position: "insideBottom", offset: -5, fontSize: 10, fill: "rgb(120, 120, 120)", fontWeight: "bold" }}
                  />
                  <YAxis
                    stroke="rgb(120, 120, 120)"
                    style={{ fontSize: "9px" }}
                    label={{ value: "Latency (ms)", angle: -90, position: "insideLeft", fontSize: 10, fill: "rgb(120, 120, 120)", fontWeight: "bold", offset: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      padding: "6px",
                      color: "#fff"
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff", fontSize: "10px", fontWeight: "bold" }}
                    formatter={(value: any) => [`${value}ms`, "Latency"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="rgb(239, 68, 68)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground">
              <strong>Breach Time:</strong> 14:35 UTC (P95 exceeded 450ms SLA threshold)
            </p>
          </div>

          {/* Resource State at Breach */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" /> Resource State at Breach Time (14:35)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-foreground">CPU Load</span>
                  <span className="text-destructive font-mono font-bold">92%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-destructive w-[92%]" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-foreground">Memory Usage</span>
                  <span className="text-destructive font-mono font-bold">6.5GB / 16GB</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-destructive" style={{ width: "40%" }} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-foreground">Active Containers</span>
                  <span className="text-warning font-mono font-bold">16 / 24</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: "67%" }} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-foreground">Throughput</span>
                  <span className="text-primary font-mono font-bold">4,200 req/s</span>
                </div>
                <p className="text-[8px] text-muted-foreground">Hitting platform limits</p>
              </div>
            </div>
          </div>

          {/* Root Cause */}
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <h3 className="text-xs font-bold text-destructive uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Identified Root Cause
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isParserTile
                ? `The custom Python preprocessing script in "${tileName}" attempted to deduplicate 287,000+ nested JSON entities without pagination. This synchronous operation locked the thread for 1.8 seconds, causing cascading timeouts across dependent services. CPU spiked to 92% as the LLM synthesis engine queued requests.`
                : isCoreEngineTile
                  ? `The core "${tileName}" service experienced a GC pause (400ms) during memory compaction while processing 50K concurrent extraction requests. Concurrent user load exceeded the platform's configured thread pool size (512), causing request queuing.`
                  : `Database connection pool exhaustion detected. All 100 available connections were consumed by stalled extraction queries, preventing new requests from acquiring a connection. This cascaded into timeout errors across the tile.`}
            </p>
          </div>

          {/* Recommendations */}
          <div className="space-y-3 p-4 rounded-xl bg-success/5 border border-success/20">
            <h3 className="text-xs font-bold text-success uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4" /> Recommended Actions
            </h3>
            <ul className="space-y-2">
              {isParserTile ? (
                <>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Move deduplication logic to asynchronous batch pre-processing (off the critical path)
                  </li>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Implement pagination: process 5K entities per batch with inter-batch delays
                  </li>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Add circuit breaker: if dedup exceeds 500ms, skip and log for manual review
                  </li>
                </>
              ) : isCoreEngineTile ? (
                <>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Scale containers from 16 → 24 for this tenant before next peak load
                  </li>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Lower GC pause target from 400ms → 100ms via JVM tuning (Xmx config)
                  </li>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Increase thread pool size from 512 → 1024 (requires load test validation)
                  </li>
                </>
              ) : (
                <>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Increase database connection pool from 100 → 200 connections
                  </li>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Add query timeout (5s) to kill stalled extraction queries automatically
                  </li>
                  <li className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-success font-bold">→</span>
                    Implement connection retry logic with exponential backoff
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Link to Capacity Planning */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[10px] text-muted-foreground flex items-start gap-2">
              <BarChart3 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>
                <strong className="text-primary">Capacity Planning Impact:</strong> This breach indicates the system needs to scale containers incrementally during peak season to maintain SLA compliance. Estimated recovery: {isParserTile ? "30-45 min" : "5-10 min"} with recommended fixes applied.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-[9px] text-muted-foreground">
            Report generated: {new Date().toLocaleString()}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/80 transition-all uppercase tracking-widest"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
