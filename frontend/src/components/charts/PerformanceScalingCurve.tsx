import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface PerformanceScalingCurveProps {
  stressLevel: string;
  simMetrics: {
    throughput: number;
    errorRate: number;
    p95: number;
    progress: number;
  };
}

export function PerformanceScalingCurve({ stressLevel, simMetrics }: PerformanceScalingCurveProps) {
  // Generate realistic performance curve data across stress levels
  const generateScalingData = () => {
    const baseData = [
      { concurrency: "1K", "Standard": 45, "Peak Season": 65, "Extreme": 280 },
      { concurrency: "10K", "Standard": 52, "Peak Season": 95, "Extreme": 420 },
      { concurrency: "50K", "Standard": 68, "Peak Season": 180, "Extreme": 680 },
      { concurrency: "100K", "Standard": 125, "Peak Season": 320, "Extreme": 950 }
    ];
    return baseData;
  };

  const scalingData = generateScalingData();
  const slaThreshold = 450; // SLA threshold in ms

  // Determine which stress level to show
  const getActiveStressLevel = () => {
    if (stressLevel === "Extreme") return "Extreme";
    if (stressLevel === "Peak Season") return "Peak Season";
    return "Standard";
  };

  const activeLevel = getActiveStressLevel();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
            <TrendingUp className="w-4 h-4 text-primary" /> Response Time vs Concurrency
          </h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Classic scaling curve showing P95 latency across all stress levels
          </p>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/30 border border-white/10 text-[9px] font-bold text-primary">
          <div className="w-2 h-2 rounded-full bg-primary" />
          Active: {activeLevel}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-black/40 border border-white/10 overflow-hidden">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={scalingData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="concurrency"
              stroke="rgb(120, 120, 120)"
              style={{ fontSize: "10px" }}
              label={{ value: "User Concurrency", position: "insideBottom", offset: -5, fontSize: 10, fill: "rgb(120, 120, 120)", fontWeight: "bold" }}
            />
            <YAxis
              stroke="rgb(120, 120, 120)"
              style={{ fontSize: "10px" }}
              label={{ value: "P95 Latency (ms)", angle: -90, position: "insideLeft", fontSize: 10, fill: "rgb(120, 120, 120)", fontWeight: "bold", offset: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                padding: "8px",
                color: "#fff"
              }}
              itemStyle={{ color: "#fff" }}
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
              labelStyle={{ color: "#fff", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}
              formatter={(value: any) => [`${value}ms`, ""]}
            />
            <ReferenceLine
              y={slaThreshold}
              strokeDasharray="5 5"
              stroke="rgb(239, 68, 68)"
              label={{
                value: "SLA Threshold (450ms)",
                position: "right",
                fill: "rgb(239, 68, 68)",
                fontSize: 10,
                offset: 10
              }}
            />
            <Line
              type="monotone"
              dataKey="Standard"
              dot={{ r: 4, fill: "rgb(34, 197, 94)" }}
              stroke="rgb(34, 197, 94)"
              strokeWidth={2}
              isAnimationActive={false}
              opacity={activeLevel === "Standard" ? 1 : 0.3}
            />
            <Line
              type="monotone"
              dataKey="Peak Season"
              dot={{ r: 4, fill: "rgb(234, 179, 8)" }}
              stroke="rgb(234, 179, 8)"
              strokeWidth={2}
              isAnimationActive={false}
              opacity={activeLevel === "Peak Season" ? 1 : 0.3}
            />
            <Line
              type="monotone"
              dataKey="Extreme"
              dot={{ r: 4, fill: "rgb(239, 68, 68)" }}
              stroke="rgb(239, 68, 68)"
              strokeWidth={2}
              isAnimationActive={false}
              opacity={activeLevel === "Extreme" ? 1 : 0.3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-success mt-1 flex-shrink-0" />
          <div className="text-[10px]">
            <p className="font-bold text-success">Standard Load</p>
            <p className="text-muted-foreground">1-10k users, 45-125ms response</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-warning mt-1 flex-shrink-0" />
          <div className="text-[10px]">
            <p className="font-bold text-warning">Peak Season</p>
            <p className="text-muted-foreground">10-50k users, 65-320ms response</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive mt-1 flex-shrink-0" />
          <div className="text-[10px]">
            <p className="font-bold text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Extreme Load
            </p>
            <p className="text-muted-foreground">50k+ users, 280-950ms response</p>
          </div>
        </div>
      </div>
    </div>
  );
}
