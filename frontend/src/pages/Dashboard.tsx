import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Gauge, AlertTriangle, TrendingDown, Bot, X, Zap, ShieldAlert, Building2, TrendingUp, CheckCircle2, Shield } from "lucide-react";
import CountUp from "react-countup";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/common/KPICard";
import { HeatmapGrid } from "@/components/charts/HeatmapGrid";
import { ModuleRiskHeatmap } from "@/components/charts/ModuleRiskHeatmap";
import { DefectForecast } from "@/components/charts/DefectForecast";
import { RadialGauge } from "@/components/charts/RadialGauge";
import { AISummaryDrawer } from "@/components/ai/AISummaryDrawer";
import { useApiData } from "@/hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useChatContext } from "@/context/ChatContext";
import { useEffect } from "react";

const chartTooltipStyle = {
  backgroundColor: "hsl(222, 47%, 8%)",
  border: "1px solid hsl(217, 33%, 17%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(210, 40%, 98%)"
};

// Release Confidence Signals Card (renamed from ConfidenceCard)
const ReleaseConfidenceSignals = ({ index }: any) => {
  const signals = [
    { label: "Coverage", value: 94, color: "text-cyan-400" },
    { label: "Regression Health", value: 97, color: "text-success" },
    { label: "Untested Blind Spots", value: 3, color: "text-warning", isBad: true },
    { label: "Escaped Defect Risk", value: 4.2, suffix: "%", color: "text-destructive", isBad: true }
  ];

  const overallConfidence = 91;
  const confidenceStatus = overallConfidence >= 90 ? "safe" : overallConfidence >= 75 ? "risky" : "hold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass rounded-xl p-6 relative overflow-hidden group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Release Confidence Signals
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Holistic deployment readiness assessment
          </p>
        </div>
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Status Band */}
      <div className="mb-5 p-3 rounded-lg border-2 flex items-center justify-between"
        style={{
          borderColor: confidenceStatus === "safe" ? "hsl(142, 70%, 45%)" : confidenceStatus === "risky" ? "hsl(45, 93%, 50%)" : "hsl(350, 89%, 60%)",
          backgroundColor: confidenceStatus === "safe" ? "hsl(142, 70%, 45%, 0.1)" : confidenceStatus === "risky" ? "hsl(45, 93%, 50%, 0.1)" : "hsl(350, 89%, 60%, 0.1)"
        }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {confidenceStatus === "safe" ? "🟢" : confidenceStatus === "risky" ? "🟡" : "🔴"}
          </span>
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest"
              style={{ color: confidenceStatus === "safe" ? "hsl(142, 70%, 45%)" : confidenceStatus === "risky" ? "hsl(45, 93%, 50%)" : "hsl(350, 89%, 60%)" }}>
              {confidenceStatus === "safe" ? "SAFE TO SHIP" : confidenceStatus === "risky" ? "RISKY" : "HOLD RELEASE"}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {confidenceStatus === "safe"
                ? "All signals green for production deployment"
                : confidenceStatus === "risky"
                  ? "Address risks before deploying to enterprise"
                  : "Critical untested modules in release path"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">{overallConfidence}</div>
          <div className="text-[9px] text-muted-foreground">/ 100</div>
        </div>
      </div>

      {/* Signal Metrics */}
      <div className="space-y-2">
        {signals.map((signal, i) => (
          <div key={signal.label} className="flex items-center justify-between text-[10px] p-2 rounded bg-muted/20">
            <span className="text-muted-foreground">{signal.label}</span>
            <span className={`font-bold ${signal.color}`}>
              {signal.value}{signal.suffix || (signal.isBad ? " modules" : "%")}
            </span>
          </div>
        ))}
      </div>

      {/* Trend Indicator */}
      <div className="mt-4 pt-4 border-t border-border/20 flex items-center gap-2 text-[9px]">
        <TrendingDown className="w-3 h-3 text-destructive" />
        <span className="text-muted-foreground">Trend: <span className="text-destructive font-bold">Red flag +4.2%</span></span>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number; failures: number } | null>(null);

  const { data: liveJobs = [] } = useQuery({
    queryKey: ["liveJobs"],
    queryFn: () => apiClient("/api/jobs"),
    refetchInterval: 3000,
  });

  const { data, isLoading, error } = useApiData("dashboard-kpis", "/api/dashboard/kpis");
  const { setContextData } = useChatContext();

  useEffect(() => {
    if (data) {
      setContextData({
        page: "Command Center / Dashboard",
        metrics: data.dashboardKPIs,
        risks: data.riskMetadata,
        criticalIssues: { cluster: data.criticalCluster, trace: data.criticalTrace }
      });
    }
  }, [data, setContextData]);

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground animate-pulse">Initializing AI Analysis Engine...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Failed to fetch telemetry from server. Check MCP connection.</div>;

  const { dashboardKPIs, dailyExecutions, weeklyDefects, coverageByModule, aiMappingAccuracy, failureHeatmap, atRiskClients, riskMetadata, criticalCluster, criticalTrace } = data;

  const summaryContext = JSON.stringify({
    totalTestCases: 84720, passRate: "97.3%", escapedDefects: "0.38%", avgRegressionTime: "4.2 hrs",
    aiHealingEvents: 1847, releaseConfidence: "91/100"
  });

  const weeklyDefectsWithTrend = weeklyDefects.map((d, i) => ({
    ...d,
    predictedRisk: 55 + (i * 2) + Math.cos(i / 2) * 15
  }));

  const daysLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxHeatmapVal = Math.max(...failureHeatmap.map(d => d.failures));
  const getCellColor = (val: number) => {
    const ratio = val / maxHeatmapVal;
    if (ratio < 0.25) return "bg-success/20";
    if (ratio < 0.5) return "bg-success/40";
    if (ratio < 0.7) return "bg-warning/40";
    if (ratio < 0.85) return "bg-warning/60";
    return "bg-destructive/60 hover:bg-destructive/80";
  };

  const handleHeatmapClick = (day: string, hour: number, failures: number) => {
    setSelectedCell({ day, hour, failures });
    if (failures > 15) {
      toast.error(`Winnie Insight: Critical spike detected in ${criticalCluster || 'Service Cluster'}.`, {
        description: `Found ${failures} ${criticalTrace || 'Network Error'} traces. Click "Analysis" below for details.`,
        duration: 4000,
        icon: "🐝"
      });
    } else {
      toast.info(`Filtering logs for ${day} ${hour}:00`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Command Center" subtitle="Real-time quality engineering overview">
        <div className="flex items-center gap-4">
          <AISummaryDrawer
            systemPrompt="You are Winnie, HubSync's QA Intelligence Agent. Summarize the following QA platform metrics in 4 bullet points. You MUST explicitly identify the 'Top 3 Blocking Risks for the Next Release', followed by key wins and strategic recommendations."
            context={summaryContext}
          />
        </div>
      </PageHeader>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {dashboardKPIs.map((kpi, i) => {
          const displayKPI = kpi.label === "AI Healing Events (30d)"
            ? {
              ...kpi,
              label: "Maint. Hours Avoided",
              value: 923,
              suffix: "+ hrs",
              change: kpi.value,
              changeLabel: "healed tests",
              icon: "Clock"
            }
            : kpi;

          return <KPICard key={displayKPI.label} {...displayKPI} index={i} />;
        })}
      </div>

      {/* Release Readiness Score at Top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden group border-primary/30 bg-gradient-to-b from-primary/10 to-transparent"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Shield className="w-32 h-32 text-primary" />
        </div>

        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 relative z-10">
          Release Readiness Score — Production Deployment Confidence
        </h2>

        <div className="relative z-10 mb-6">
          <RadialGauge value={91} label="Overall" size={200} />
        </div>

        <div className="text-center text-sm text-muted-foreground relative z-10">
          <p className="mb-2">This score integrates test coverage, regression health, AI confidence, and defect predictions.</p>
          <p className="text-[10px] italic">When all signals align to 90+, your build is safe for enterprise deployment.</p>
        </div>
      </motion.div>

      {/* 3-Column Command Center Grid: Code Risk | Defect Predictions | At-Risk Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code Risk Heatmap */}
        <div className="lg:col-span-2">
          <ModuleRiskHeatmap
            onCellClick={(module, factor, risk) => {
              toast.info(`${module} - ${factor}: ${Math.round(risk * 100)}%`, {
                description: `Analyzing risk factors for ${module}...`
              });
            }}
          />
        </div>

        {/* At-Risk Clients (from original) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl p-5 border-l-4 border-warning bg-warning/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-warning/10">
              <Building2 className="w-4 h-4 text-warning" />
            </div>
            <h4 className="text-sm font-bold text-foreground">At-Risk Enterprise Clients</h4>
          </div>
          <div className="space-y-3">
            {(atRiskClients || [
              { name: "Enterprise Client Alpha", risk: "84%", trend: "up", status: "Critical" },
              { name: "Regional Financial Beta", risk: "62%", trend: "up", status: "High" },
              { name: "Global Partners Gamma", risk: "39%", trend: "down", status: "Moderate" },
            ]).map((client: any) => (
              <div key={client.name} className="p-2.5 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between group hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-foreground truncate">{client.name}</p>
                  <p className="text-[8px] text-muted-foreground">Confidence: {100 - parseInt(client.risk)}%</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={`px-1 rounded-sm text-[7px] font-bold uppercase mb-1 ${client.status === 'Critical' ? 'bg-destructive/20 text-destructive' : client.status === 'High' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                    {client.status}
                  </span>
                  <div className={`flex items-center gap-0.5 text-[9px] font-mono ${client.trend === 'up' ? 'text-destructive' : 'text-success'}`}>
                    {client.risk} {client.trend === 'up' ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Defect Forecast */}
      <DefectForecast />

      {/* Release Confidence Signals Card */}
      <div className="grid grid-cols-1">
        <ReleaseConfidenceSignals index={0} />
      </div>

      {/* AI Model Performance (Agent Testing Integration) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-5 border-l-4 border-info bg-info/5 relative overflow-hidden group hover:bg-info/10 transition-colors"
      >
        <div className="absolute top-0 right-0 p-1 opacity-5">
          <Zap className="w-32 h-32 text-info rotate-12" />
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-info/10">
                <Bot className="w-4 h-4 text-info" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">AI Model Performance (Agent Testing)</h4>
                <p className="text-[10px] text-muted-foreground">Production AI agent validation via QA agents</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-muted-foreground font-bold">Classification</span>
                  <span className="text-[9px] text-destructive font-bold flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> -2.1%
                  </span>
                </div>
                <div className="text-sm font-bold text-foreground">96.3%</div>
                <div className="text-[8px] text-muted-foreground mt-1">vs 98.4% baseline</div>
              </div>

              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-destructive font-bold">Extraction ⚠️</span>
                  <span className="text-[9px] text-destructive font-bold flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> -5.2%
                  </span>
                </div>
                <div className="text-sm font-bold text-destructive">93.2%</div>
                <div className="text-[8px] text-muted-foreground mt-1">CRITICAL REGRESSION</div>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-muted-foreground font-bold">Mapping</span>
                  <span className="text-[9px] text-success font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> +0.1%
                  </span>
                </div>
                <div className="text-sm font-bold text-success">99.1%</div>
                <div className="text-[8px] text-muted-foreground mt-1">Within tolerance</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 mb-4 text-[9px]">
              <div className="text-muted-foreground mb-2">
                Last Test Run: <span className="font-mono font-bold text-primary">2 minutes ago (15,847 cases)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-destructive/30 text-destructive text-[8px] font-bold uppercase">
                  Regression Detected
                </span>
                <span className="text-muted-foreground">Deployment BLOCKED by Safety Gate</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/agent-testing")}
                className="px-4 py-2 rounded-lg bg-info text-white text-[10px] font-bold hover:bg-info/90 transition-colors"
              >
                View Agent Testing
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground text-[10px] font-bold hover:bg-white/10 transition-colors disabled opacity-50 cursor-not-allowed"
                disabled
              >
                Unblock? (Review Required)
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Executions */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Daily Test Executions</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyExecutions}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                tickFormatter={v => v.slice(5)}
                interval={14}
                label={{ value: "Submission Date", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                label={{ value: "Executions", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="Gateway" stroke="hsl(187, 94%, 43%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Workpapers" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Tax Organizer" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Defects */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Weekly Defect Breakdown by Severity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={weeklyDefectsWithTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                label={{ value: "Reporting Week", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                label={{ value: "Defect Count", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Critical" stackId="a" fill="hsl(350, 89%, 60%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="High" stackId="a" fill="hsl(38, 92%, 50%)" />
              <Bar dataKey="Medium" stackId="a" fill="hsl(187, 94%, 43%)" />
              <Bar dataKey="Low" stackId="a" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="predictedRisk" name="Predicted Risk Trend" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage Donut */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Test Coverage by Module</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={coverageByModule}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                dataKey="value"
                paddingAngle={3}
                label={({ name, value }) => `${name} ${value}%`}
              >
                {coverageByModule.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* AI Mapping Accuracy */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">AI Mapping Accuracy Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={aiMappingAccuracy}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                label={{ value: "Reporting Month", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
              />
              <YAxis
                domain={[90, 100]}
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                label={{ value: "Accuracy %", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="accuracy" stroke="hsl(187, 94%, 43%)" strokeWidth={2} fill="url(#accGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intelligent Regression Engine Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-5 border-l-4 border-blue-500 bg-blue-500/5 relative overflow-hidden group hover:bg-blue-500/10 transition-colors"
      >
        <div className="absolute top-0 right-0 p-1 opacity-5">
          <Zap className="w-32 h-32 text-blue-500 rotate-12" />
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Intelligent Regression Engine</h4>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-[10px] text-success font-bold uppercase">
                ✓ Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Latest Analysis: <span className="font-mono font-bold text-blue-400">PR #4482</span> — 2 files changed with <span className="font-mono text-amber-400">+0.96 Δ complexity</span>.
              <br />
              Smart selection: <span className="font-bold text-green-400">5 test suites selected</span> (vs 47 full suite) — <span className="font-bold text-green-400">77% time reduction</span> (14.3 hours saved daily).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/regression-analysis")}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 transition-colors"
              >
                View Regression Analysis
              </button>
              <button
                onClick={() => navigate("/test-suites")}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground text-[10px] font-bold hover:bg-white/10 transition-colors"
              >
                Run Smart Regression
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Heatmap Section - Removed, replaced with ModuleRiskHeatmap above */}
    </div>
  );
}
