import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { RadialGauge } from "@/components/charts/RadialGauge";
import { DataTable, Column } from "@/components/common/DataTable";
import { AISummaryDrawer } from "@/components/ai/AISummaryDrawer";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useChatContext } from "@/context/ChatContext";
import { useEffect } from "react";
import { ShieldCheck, Zap, AlertTriangle, Eye, ShieldAlert, FileSearch, ArrowRight, Sliders, TrendingUp, Info, MessageSquare, ExternalLink, Sparkles } from "lucide-react";

const chartTooltipStyle = {
  backgroundColor: "hsl(222, 47%, 8%)",
  border: "1px solid hsl(217, 33%, 17%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(210, 40%, 98%)"
};

const TreemapContent = (props: any) => {
  const { x, y, width, height, name, coverage, confidence, viewMode } = props;
  if (width < 40 || height < 30) return null;

  // Coloring Logic
  let fill = `hsl(187, 94%, ${30 + (coverage / 100) * 30}%)`; // Default Coverage Blue
  if (viewMode === "confidence") {
    // Heat Map Style: Red (Low) to Yellow (Med) to Green (High)
    if (confidence < 70) {
      fill = `hsl(350, 89%, ${40 + (confidence / 70) * 20}%)`; // Red for Blind Spots
    } else if (confidence < 90) {
      fill = `hsl(45, 93%, ${40 + (confidence / 90) * 20}%)`; // Yellow/Amber
    } else {
      fill = `hsl(142, 70%, 45%)`; // Green
    }
  }

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(222, 47%, 6%)" strokeWidth={2} rx={4} className="hover:opacity-80 transition-all cursor-crosshair" />
      <text x={x + width / 2} y={y + height / 2 - (viewMode === "confidence" && confidence < 70 ? 10 : 6)} textAnchor="middle" fill="hsl(210, 40%, 92%)" fontSize={10} fontWeight={600} className="pointer-events-none">
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={9} fontWeight="bold">
        {viewMode === "coverage" ? `${coverage}% COVER` : `${confidence}% CONF`}
      </text>
      {viewMode === "confidence" && confidence < 70 && (
        <text x={x + width / 2} y={y + height / 2 + 22} textAnchor="middle" fill="white" fontSize={8} fontWeight="black" className="uppercase tracking-widest animate-pulse">
          Blind Spot
        </text>
      )}
    </g>
  );
};

export default function Analytics() {
  const [viewMode, setViewMode] = useState<"coverage" | "confidence">("coverage");
  const [simCoverage, setSimCoverage] = useState(94); // Base Global Coverage
  const [simTargetComponent, setSimTargetComponent] = useState("1040 Parser");
  const [aiHeatmapData, setAiHeatmapData] = useState<any[] | null>(null);
  const [generatingHeatmap, setGeneratingHeatmap] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["analyticsGlossary"],
    queryFn: () => apiClient("/api/glossary")
  });

  const { setContextData } = useChatContext();

  useEffect(() => {
    if (data) {
      setContextData({
        page: "Quality Intelligence / Analytics",
        defectPredictions: data.defectPredictions,
        coverageTreemap: data.coverageTreemap,
        bugLeakageTrend: data.bugLeakageTrend,
        aiHeatmap: aiHeatmapData
      });
    }
  }, [data, aiHeatmapData, setContextData]);

  // Fetch AI-generated heatmap when switching to confidence mode
  const handleViewModeChange = async (mode: "coverage" | "confidence") => {
    setViewMode(mode);

    if (mode === "confidence" && !aiHeatmapData) {
      setGeneratingHeatmap(true);
      try {
        const response = await apiClient("/api/analytics/generate-heatmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisType: "blind-spots",
            focusArea: "tax-processing"
          })
        });

        setAiHeatmapData(response.heatmapData);
        toast.success("AI Heatmap Generated", {
          description: "Claude analyzed module confidence across your codebase",
          icon: <Sparkles className="w-4 h-4 text-primary" />
        });
      } catch (error: any) {
        console.error("Failed to generate AI heatmap:", error);
        toast.error("Failed to generate AI heatmap", {
          description: error.message || "Using default coverage view"
        });
      } finally {
        setGeneratingHeatmap(false);
      }
    }
  };

  const defectPredictions: any[] = data?.defectPredictions || [];
  const bugLeakageTrend: any[] = data?.bugLeakageTrend || [];
  const maintenanceTimeTrend: any[] = data?.maintenanceTimeTrend || [];
  const coverageTreemap: any[] = data?.coverageTreemap || [];

  // Use AI-generated data when in confidence mode, otherwise use static coverage data
  const displayTreemap = viewMode === "confidence" && aiHeatmapData ? aiHeatmapData : coverageTreemap;

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Analytics Data...</div>;

  // PRD Section 4.1 Formula Simulation
  const calculateSimScore = (cov: number) => {
    const raw = (cov * 0.20) + (97.3 * 0.30) + (98.7 * 0.25) + (96 * 0.15) + (88 * 0.10);
    return Math.round((raw / 95.865) * 91); // Normalized to initial state
  };

  const simScore = calculateSimScore(simCoverage);
  const scoreDelta = simScore - 91;

  const breakdownBars = [
    { label: "Code Coverage", value: simCoverage, original: 94 },
    { label: "Regression Pass Rate", value: 97.3 },
    { label: "AI Accuracy", value: 98.7 },
    { label: "Defect Density", value: 88 },
    { label: "Performance SLA", value: 96 },
  ];

  const handleRecommendationAction = (r: any) => {
    const queryParams = new URLSearchParams({
      component: r.component,
      action: r.recommendation,
      risk: r.riskScore.toString()
    });
    navigate(`/synthetic-data?${queryParams.toString()}`);
  };

  const handleTaskOrchestration = (r: any) => {
    toast.success("Agentic Orchestration: JIRA/Slack Synchronized", {
      description: `Critical ticket created for ${r.component}. Alert dispatched to QA-Squad Slack.`,
      icon: <MessageSquare className="w-4 h-4 text-primary" />
    });
  };

  const predictionColumns: Column<any>[] = [
    { key: "component", label: "Component", sortable: true, render: r => <span className="font-medium text-foreground">{r.component}</span> },
    {
      key: "riskScore", label: "Risk Score", sortable: true, render: r => (
        <span className={`font-mono font-medium ${r.riskLevel === "High" ? "text-destructive" : r.riskLevel === "Medium" ? "text-warning" : "text-success"}`}>
          {r.riskLevel === "High" ? "🔴" : r.riskLevel === "Medium" ? "🟡" : "🟢"} {r.riskScore}%
        </span>
      )
    },
    { key: "predictedDefects", label: "Predicted Defects" },
    { key: "lastChange", label: "Last Change" },
    { key: "complexity", label: "Complexity" },
    {
      key: "recommendation",
      label: "Actionable Intelligence (PRD 8.5)",
      render: r => (
        <div className="flex items-center gap-2 group">
          <span className="text-muted-foreground italic flex-1 text-[10px] truncate max-w-[120px]">{r.recommendation}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={() => handleRecommendationAction(r)}
              title="Generate Synthetic Data Fix"
              className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-tighter border border-primary/20 hover:bg-primary hover:text-white shadow-sm"
            >
              Resolve <ArrowRight className="w-2.5 h-2.5" />
            </button>
            {r.riskLevel === "High" && (
              <button
                onClick={() => handleTaskOrchestration(r)}
                title="Sync with JIRA/Slack"
                className="flex items-center gap-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-[8px] font-black uppercase tracking-tighter border border-destructive/20 hover:bg-destructive hover:text-white shadow-sm"
              >
                Escalate <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Quality Intelligence & Analytics" subtitle="Predictive insights and quality trends">
        <AISummaryDrawer
          systemPrompt="Analyze these quality engineering metrics. Identify the top 3 risk areas, highlight what improved most, and give 3 actionable recommendations for the next sprint."
          context={JSON.stringify({ releaseScore: simScore, breakdownBars, defectPredictions: defectPredictions.slice(0, 5) })}
          title="Quality Intelligence"
        />
      </PageHeader>

      {/* Release Readiness Section with Predictive What-If Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Readiness Gauge */}
        <div className="glass rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <h3 className="font-heading font-semibold text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Release Readiness Score</h3>
          <RadialGauge value={simScore} label="Overall" />
          {scoreDelta !== 0 && (
            <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${scoreDelta > 0 ? "text-success bg-success/10 border border-success/20" : "text-destructive bg-destructive/10 border border-destructive/20"}`}>
              {scoreDelta > 0 ? "+" : ""}{scoreDelta} Simulated
            </div>
          )}
        </div>

        {/* Breakdown Panel */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Score Breakdown
          </h3>
          <div className="space-y-3">
            {breakdownBars.map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className={`font-mono font-bold ${bar.label === "Code Coverage" && bar.value > (bar.original || 0) ? "text-success" : "text-foreground"}`}>
                    {bar.value}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/20 overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${bar.label === "Code Coverage" && bar.value > (bar.original || 0) ? "bg-success shadow-glow-success" : "bg-primary shadow-glow"}`}
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive What-If Simulation Card (PRD 4.1) */}
        <div className="glass-strong rounded-xl p-5 border-primary/20 bg-primary/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary mb-4">
              <Sliders className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">What-If Simulator</h3>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-6 italic">
              "If I increase <strong>{simTargetComponent}</strong> coverage to 99%, how much does our Release Confidence Score rise?"
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">Target Component</label>
                  <span className="text-[9px] font-mono text-primary">v2.4.2</span>
                </div>
                <select
                  value={simTargetComponent}
                  onChange={(e) => setSimTargetComponent(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-[10px] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="1040 Parser">1040 Parser</option>
                  <option value="Gateway Auth">Gateway Auth</option>
                  <option value="Report Generator">Report Generator</option>
                  <option value="AI Engine">AI Engine</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">Coverage Optimization</label>
                  <span className="text-[10px] font-mono text-success font-bold">{simCoverage}%</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="100"
                  value={simCoverage}
                  onChange={(e) => setSimCoverage(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[8px] text-muted-foreground mt-1 font-mono">
                  <span>BASELINE (94)</span>
                  <span>OPTIMIZED (100)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-success text-[10px] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Projected Score: {calculateSimScore(simCoverage)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Defect Prediction Panel */}
      <div className="glass-strong rounded-2xl p-6 border-white/5 relative bg-black/20">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning border border-warning/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            Defect Prediction Panel: Intelligence to Action
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded border border-white/5 font-mono">
            Model: Cognify-X Predictive v4
          </span>
        </div>
        <DataTable data={defectPredictions} columns={predictionColumns} />
      </div>

      {/* Coverage Treemap */}
      <div className="glass rounded-xl p-6 border-white/10 relative">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="font-heading font-semibold text-base text-foreground flex items-center gap-2">
              {viewMode === "coverage" ? <Eye className="w-4 h-4 text-primary" /> : <ShieldAlert className="w-4 h-4 text-destructive" />}
              {viewMode === "coverage" ? "Test Coverage by Service" : "AI Blind-Spot Heat Map (Section 5)"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 italic">
              {viewMode === "coverage"
                ? "Global coverage distribution across microservices core logic."
                : "Highlighting modules where coverage is high but AI model confidence is low."}
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/5 shadow-inner">
            <button
              onClick={() => handleViewModeChange("coverage")}
              className={`px-5 py-2 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === "coverage" ? "bg-primary text-primary-foreground shadow-glow scale-105" : "text-muted-foreground hover:bg-white/5 opacity-60 hover:opacity-100"}`}
            >
              <Eye className="w-3.5 h-3.5" /> Test Coverage
            </button>
            <button
              onClick={() => handleViewModeChange("confidence")}
              disabled={generatingHeatmap}
              className={`px-5 py-2 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === "confidence" ? "bg-destructive text-white shadow-glow-destructive scale-105" : "text-muted-foreground hover:bg-white/5 opacity-60 hover:opacity-100"} ${generatingHeatmap ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {generatingHeatmap ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> Generating AI...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" /> AI Identification Confidence
                </>
              )}
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <Treemap
            data={displayTreemap}
            dataKey={viewMode === "coverage" ? "size" : "coverage"}
            aspectRatio={4 / 3}
            content={<TreemapContent viewMode={viewMode} />}
            animationDuration={800}
          />
        </ResponsiveContainer>

        {viewMode === "confidence" && (
          <>
            <div className="mt-4 flex items-center justify-center gap-8 text-[9px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-success" /> Optimal Presence ({">"}90%)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-400" /> Medium Certainty (70-90%)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-destructive animate-pulse" /> High Risk Blind Spot ({"<"}70%)
              </div>
            </div>

            {/* Blind Spots Alert Card */}
            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 border-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-destructive mb-2">🚨 Blind Spots Detected: 3 Modules at Risk</h4>
                  <p className="text-xs text-foreground mb-3">
                    These modules have high test coverage but low AI confidence. They're difficult for AI to validate and are at higher risk of escaped defects.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2 rounded bg-black/2 border border-destructive/20">
                      <div className="text-[9px] font-bold text-destructive">Payment Gateway</div>
                      <div className="text-[8px] text-muted-foreground">62% AI confidence</div>
                    </div>
                    <div className="p-2 rounded bg-black/20 border border-destructive/20">
                      <div className="text-[9px] font-bold text-destructive">Tax Organizer</div>
                      <div className="text-[8px] text-muted-foreground">58% AI confidence</div>
                    </div>
                    <div className="p-2 rounded bg-black/20 border border-destructive/20">
                      <div className="text-[9px] font-bold text-destructive">Reports Engine</div>
                      <div className="text-[8px] text-muted-foreground">68% AI confidence</div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/debug-center")}
                    className="px-3 py-1.5 rounded bg-destructive text-white text-[9px] font-bold hover:bg-destructive/90 transition-all flex items-center gap-1"
                  >
                    Go to Debug Center →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5 border-white/10">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Bug Leakage to Production (12 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={bugLeakageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                label={{ value: "Timeline", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                unit="%"
                label={{ value: "Leakage Rate", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="rate" stroke="hsl(350, 89%, 60%)" strokeWidth={3} dot={{ fill: "hsl(350, 89%, 60%)", r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-xl p-5 border-white/10">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" /> Test Maintenance Time (12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={maintenanceTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                label={{ value: "Timeline", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                unit=" hrs"
                label={{ value: "Maintenance Hours", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="hours" fill="hsl(187, 94%, 43%)" radius={[4, 4, 0, 0]} className="hover:opacity-80 transition-opacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
