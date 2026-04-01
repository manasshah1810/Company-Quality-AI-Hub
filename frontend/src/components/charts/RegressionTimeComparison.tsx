import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export interface TimeSavingsData {
  full_regression_hours: number;
  smart_regression_hours: number;
  percentage_saved: number;
  assumptions: string;
}

export function RegressionTimeComparison({ timeSavings }: { timeSavings: TimeSavingsData }) {
  const data = [
    {
      name: "Full Regression",
      hours: timeSavings.full_regression_hours,
      color: "#ef4444",
      label: "18.5h",
    },
    {
      name: "Smart Set",
      hours: timeSavings.smart_regression_hours,
      color: "#22c55e",
      label: "4.2h",
    },
  ];

  const saved = timeSavings.full_regression_hours - timeSavings.smart_regression_hours;

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-foreground">Time Savings Projection</h3>
        <p className="text-xs text-muted-foreground">{timeSavings.assumptions}</p>
      </div>

      {/* BAR CHART */}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: "12px" }}
            label={{ value: "Testing Strategy", position: "insideBottom", offset: -5, fontSize: 10, fill: "rgba(255,255,255,0.5)", fontWeight: "bold" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: "12px" }}
            label={{ value: "Hours", angle: -90, position: "insideLeft", fontSize: 10, fill: "rgba(255,255,255,0.5)", fontWeight: "bold", offset: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
            formatter={(value) => `${value}h`}
            cursor={{ fill: "rgba(255,255,255,0.1)" }}
          />
          <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-center space-y-1">
          <div className="text-xl font-bold text-red-400">{timeSavings.full_regression_hours.toFixed(1)}h</div>
          <div className="text-xs text-muted-foreground">Full Suite</div>
          <div className="text-xs text-muted-foreground">(47 suites)</div>
        </div>

        <div className="p-3 rounded-lg bg-green-400/10 border border-green-400/20 text-center space-y-1">
          <div className="text-xl font-bold text-green-400">{timeSavings.smart_regression_hours.toFixed(1)}h</div>
          <div className="text-xs text-muted-foreground">Smart Set</div>
          <div className="text-xs text-muted-foreground">(5 suites)</div>
        </div>

        <div className="p-3 rounded-lg bg-blue-400/10 border border-blue-400/20 text-center space-y-1">
          <div className="text-xl font-bold text-blue-400">{saved.toFixed(1)}h</div>
          <div className="text-xs text-muted-foreground">Saved Daily</div>
          <div className="text-xs text-blue-300 font-semibold">{timeSavings.percentage_saved}% reduction</div>
        </div>
      </div>

      {/* BREAKDOWN */}
      <div className="pt-4 border-t border-primary/10 space-y-2">
        <p className="text-xs text-muted-foreground font-medium">📊 Breakdown:</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Parallelization: 8 concurrent nodes reduces full suite from {(timeSavings.full_regression_hours * 2.5).toFixed(1)}h serial</p>
          <p>• Smart selection filters by code impact, defect history, coverage gaps</p>
          <p>• Risk coverage: Selected {5} high-impact suites cover {95}% of potential defects</p>
        </div>
      </div>
    </div>
  );
}
