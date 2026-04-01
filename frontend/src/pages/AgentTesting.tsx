import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, Bot, ShieldAlert, ZapOff, CheckCircle2, XCircle, Zap, Target, ShieldCheck, Layers, Database, MessageSquare, Split, FileJson, Cpu, ArrowRight, TrendingDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ChatBot } from "@/components/ai/ChatBot";
import { CoTFlowDiagram } from "@/components/debugging/CoTFlowDiagram";
import { VisualDiffViewer } from "@/components/debugging/VisualDiffViewer";
import { apiClient } from "@/lib/apiClient";

export interface AgentJob {
  id: string;
  fullId: string;
  qaAgent: string;
  targetAgent: string;
  testType: string;
  form: string;
  accuracy: number;
  baseline: number;
  delta: number;
  status: "Pass" | "Regression" | "Degraded" | "Retraining" | "Pending" | "Running" | "Failed" | "Blocked";
  runtime: string;
  cotTrace?: string[];
  mcp?: boolean;
}

const accuracyTrend = Array.from({ length: 30 }, (_, i) => ({
  version: `v2.${i + 1}`,
  Classification: +(92 + Math.random() * 7 + i * 0.15).toFixed(1),
  Extraction: +(90 + Math.random() * 8 + i * 0.12).toFixed(1),
  Mapping: +(93 + Math.random() * 6 + i * 0.1).toFixed(1),
}));

const chartTooltipStyle = { backgroundColor: "hsl(222, 47%, 8%)", border: "1px solid hsl(217, 33%, 17%)", borderRadius: "8px", fontSize: "12px" };

export default function AgentTesting() {
  const [filterStatus, setFilterStatus] = useState("All");
  const [showRegressionDetail, setShowRegressionDetail] = useState<AgentJob | null>(null);
  const [activePersona, setActivePersona] = useState("Balanced");
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [jobs, setJobs] = useState<AgentJob[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const fetchedJobs = await apiClient("/api/jobs");
        // Merge fetched jobs with the static agentJobs block using ID mapping
        const newJobs = fetchedJobs.map((j: any) => ({
          id: j.id.slice(0, 7), // short ID for display
          fullId: j.id, // full ID for API calls
          qaAgent: j.qaAgent,
          targetAgent: j.targetAgent,
          testType: j.testType,
          form: j.form,
          accuracy: j.accuracy || 0,
          baseline: j.baseline || 0,
          delta: j.delta || 0,
          status: j.status,
          runtime: j.runtime || "0s",
          mcp: true
        }));

        setJobs(newJobs);
      } catch (e) {
        console.error("Failed to poll jobs:", e);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const personas = {
    "Balanced": { desc: "Standard QA distribution across all metrics.", icon: <ShieldCheck className="w-3.5 h-3.5 text-primary" /> },
    "Edge-Case Hunter": { desc: "Aggressive fuzzing and edge case identification (PRD 4.3).", icon: <Target className="w-3.5 h-3.5 text-primary" /> },
    "Schema Enforcer": { desc: "Focuses on API contract parity and strict schema validation.", icon: <Layers className="w-3.5 h-3.5 text-primary" /> }
  };

  const regressions = jobs.filter(j => j.delta <= -2.1 && j.status !== "Retraining");
  const criticalRegression = regressions.some(j => j.delta <= -5);
  const filtered = jobs.filter(j => filterStatus === "All" || j.status === filterStatus);

  const columns: Column<AgentJob>[] = [
    { key: "id", label: "Job ID", render: r => <span className="text-primary font-mono">{r.id}</span> },
    {
      key: "qaAgent", label: "QA Agent", render: r => (
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-[11px] font-medium"><Bot className="w-3 h-3 text-primary" />{r.qaAgent}</span>
          <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 ml-4 italic">
            {activePersona} Mode
          </span>
        </div>
      )
    },
    { key: "targetAgent", label: "Target AI Agent", sortable: true },
    { key: "testType", label: "Test Type" },
    { key: "form", label: "Form" },
    { key: "accuracy", label: "Accuracy", sortable: true, render: r => <span className="font-mono">{r.accuracy}%</span> },
    { key: "baseline", label: "Baseline", render: r => <span className="font-mono text-muted-foreground">{r.baseline}%</span> },
    {
      key: "delta", label: "Delta", sortable: true, render: r => (
        <span className={`font-mono font-medium ${r.delta > 0 ? "text-success" : r.delta < -1 ? "text-destructive" : "text-warning"}`}>
          {r.delta > 0 ? "+" : ""}{r.delta}%
        </span>
      )
    },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
    {
      key: "mcp" as any,
      label: "Sync",
      render: () => (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-success/10 text-success text-[8px] font-bold border border-success/20 uppercase tracking-widest">
          <Database className="w-2.5 h-2.5" /> MCP Connected
        </div>
      )
    },
    { key: "runtime", label: "Runtime" },
  ];

  const handleBlockDeployment = async (job: AgentJob) => {
    try {
      const result = await apiClient(`/api/jobs/${job.fullId}/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      toast.error(`Kill Switch Activated: Deployment Blocked!`, {
        description: `Job ${job.id} halted. ${result.blockRecord?.regressionSeverity || "Severe"} regression detected. Rollback to v2.3 recommended.`,
        icon: <ZapOff className="w-4 h-4 text-destructive" />
      });
    } catch (err: any) {
      toast.error("Block Failed", {
        description: err.message
      });
    }
  };

  const handleInspectTrace = async (job: AgentJob) => {
    try {
      // Load detailed analysis from backend using full ID
      const analysis = await apiClient(`/api/jobs/${job.fullId}/analysis`);

      // Merge analysis with job data for display
      const enrichedJob = {
        ...job,
        cotTrace: analysis.cotTrace,
        failureDetails: analysis.failureDetails,
        recommendations: analysis.recommendations
      };

      setShowRegressionDetail(enrichedJob);

      toast.info("Failure Analysis Loaded", {
        description: `${analysis.failureDetails?.severity || "High"} regression in ${job.targetAgent}`,
        icon: <AlertTriangle className="w-4 h-4 text-destructive" />
      });
    } catch (err: any) {
      toast.error("Analysis Failed", {
        description: "Could not load failure trace: " + err.message
      });
    }
  };

  const handleStartRetraining = async (id: string) => {
    try {
      await apiClient(`/api/jobs/${id}/retrain`, {
        method: "PUT"
      });

      toast.success(`Training Cycle Initiated`, {
        description: `Retraining scheduled for ${id}. Estimated completion in 4 hours.`,
        icon: <Cpu className="w-4 h-4 text-warning" />,
        duration: 5000
      });

      setShowRegressionDetail(null);
    } catch (err: any) {
      toast.error("Failed to start retraining", {
        description: err.message
      });
    }
  };

  const handleMoreInfo = () => {
    toast.info("Detailed Documentation", {
      description: "Opening root cause breakdown for IRS 2025 rule set...",
      duration: 3000
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Agent-on-Agent Testing" subtitle="Deploy QA agents to validate production AI agents" />

      {/* Intro Banner */}
      <div className="glass glow-border rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Bot className="w-10 h-10 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-heading font-semibold text-foreground">Intelligence Testing, Not Just Execution</h3>
            <p className="text-sm text-muted-foreground">Deploy specialized QA Agents to validate HubSync's production AI Agents — test intelligence, not just execution.</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {[
              { label: "Fetch Context", icon: <Database className="w-3 h-3" />, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "Validate Schema", icon: <ShieldCheck className="w-3 h-3" />, color: "text-purple-400", bg: "bg-purple-400/10" },
              { label: "Sync Ground Truth", icon: <RefreshCw className="w-3 h-3" />, color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { label: "Load QA Agent", icon: <Bot className="w-3 h-3" />, color: "text-amber-400", bg: "bg-amber-400/10" }
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${step.bg} border border-white/5 shadow-sm active:scale-95 transition-transform cursor-default group`}>
                  <div className={`${step.color} group-hover:animate-pulse`}>{step.icon}</div>
                  <span className={`text-[9px] font-bold uppercase tracking-tighter ${step.color}`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/30" />}
              </div>
            ))}
          </div>
          <div className="ml-4 pl-4 border-l border-white/10 flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-success uppercase tracking-widest">
              <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
              MCP: ACTIVE
            </div>
            <span className="text-[8px] text-muted-foreground font-mono mt-0.5">v4.2.0-stable</span>
          </div>
        </div>
      </div>

      {/* Regression Alerts / Safety Gate with Business Impact */}
      {regressions.length > 0 && (
        <div className={`glass rounded-xl p-5 border ${criticalRegression ? 'border-destructive animate-pulse-subtle bg-destructive/10' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-destructive flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Safety Gate: {criticalRegression ? 'HALTED' : 'WARNING'} (PRD 4.3)
            </h3>
          </div>
          <p className="text-xs text-destructive/80 mb-3 font-medium italic">
            Regression detected in model update. Critical threshold exceeded ( -2.1% accuracy drop ). Deployment blocked to prevent production impact.
          </p>

          {/* Business Impact Analysis */}
          {criticalRegression && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive/40">
              <div className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-2">Business Impact Analysis</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-mono text-foreground">
                    <span className="text-destructive font-bold">$106,400</span> potential daily loss
                  </div>
                  <div className="text-[8px] text-muted-foreground italic mt-1">40k documents × $2.65 avg error</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-foreground">
                    <span className="text-destructive font-bold">5.2%</span> accuracy drop
                  </div>
                  <div className="text-[8px] text-muted-foreground italic mt-1">Extraction: 98.4% → 93.2%</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-foreground">
                    Risk Level: <span className="text-destructive font-bold">CRITICAL</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground italic mt-1">Rollback to v2.3 recommended</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {regressions.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center gap-3">
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                  <span className="font-mono text-xs text-primary">{job.id}</span>
                  <span className="text-xs text-foreground font-medium">{job.targetAgent} — {job.testType}</span>
                  <span className="font-mono text-xs text-destructive font-bold">{job.delta}% drop</span>
                </div>
                <button
                  onClick={() => handleInspectTrace(job)}
                  className="px-3 py-1 rounded bg-destructive/20 text-destructive text-[10px] font-bold hover:bg-destructive hover:text-white transition-all border border-destructive/30"
                >
                  Inspect Failure Trace
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Type Examples - Visual Illustration of What's Being Validated */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Classification Example */}
        <div className="glass rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cpu className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Classification Test</h4>
          </div>
          <div className="space-y-2 text-[9px]">
            <div>
              <span className="text-muted-foreground font-bold">What:</span>
              <span className="text-foreground ml-1">Classify document type from image</span>
            </div>
            <div className="p-2 rounded bg-black/30 border border-white/5">
              <span className="text-muted-foreground text-[8px]">Input:</span>
              <div className="text-foreground font-mono text-[8px] mt-1">[IRS Form 1120S Image]</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-bold">Expected:</span>
              <span className="text-foreground font-mono">"IRS 1120S"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-bold">Got:</span>
              <span className="text-destructive font-mono">"IRS 1120" ✗</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 flex items-start gap-2">
              <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-destructive font-bold">-4% | 40 docs/day misclassified</span>
            </div>
          </div>
        </div>

        {/* Extraction Example */}
        <div className="glass rounded-xl p-4 border border-destructive/50 hover:border-destructive transition-colors bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <FileJson className="w-4 h-4 text-destructive" />
            </div>
            <h4 className="font-bold text-xs text-destructive uppercase tracking-wider">Extraction Test (Critical)</h4>
          </div>
          <div className="space-y-2 text-[9px]">
            <div>
              <span className="text-muted-foreground font-bold">What:</span>
              <span className="text-foreground ml-1">Extract Line 7 amount from form</span>
            </div>
            <div className="p-2 rounded bg-black/30 border border-white/5">
              <span className="text-muted-foreground text-[8px]">Input:</span>
              <div className="text-foreground font-mono text-[8px] mt-1">"Interest: $15,100"</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-bold">Expected:</span>
              <span className="text-success font-mono">15100 ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-bold">Got:</span>
              <span className="text-destructive font-mono">12450 ✗</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="text-destructive font-bold text-[8px]">Error: $2,650 discrepancy | $106K daily loss</span>
            </div>
          </div>
        </div>

        {/* Mapping Example */}
        <div className="glass rounded-xl p-4 border border-success/50 hover:border-success transition-colors bg-success/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Target className="w-4 h-4 text-success" />
            </div>
            <h4 className="font-bold text-xs text-success uppercase tracking-wider">Mapping Test</h4>
          </div>
          <div className="space-y-2 text-[9px]">
            <div>
              <span className="text-muted-foreground font-bold">What:</span>
              <span className="text-foreground ml-1">Map fields to tax code correctly</span>
            </div>
            <div className="p-2 rounded bg-black/30 border border-white/5">
              <span className="text-muted-foreground text-[8px]">Input:</span>
              <div className="text-foreground font-mono text-[8px] mt-1">Line 7 → K-1 mapping</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-bold">Expected:</span>
              <span className="text-success font-mono">K-1 Sch C ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-bold">Got:</span>
              <span className="text-success font-mono">K-1 Sch C ✓</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
              <span className="text-success font-bold">PASS | 99% confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accuracy Trend / Continuous Optimization */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-semibold text-sm text-foreground">AI Agent Accuracy Trend (30 Versions)</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVersionCompare(true)}
              className="px-3 py-1 rounded-lg bg-black/20 text-foreground text-[10px] font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <Split className="w-3 h-3" /> Compare Versions
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 uppercase tracking-tighter">
              <Zap className="w-3 h-3 fill-current" /> Continuous Optimization Active (Section 8.5)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis
                  dataKey="version"
                  tick={{ fontSize: 9, fill: "hsl(215, 20%, 55%)" }}
                  interval={4}
                  label={{ value: "Model Version", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
                />
                <YAxis
                  domain={[88, 100]}
                  tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                  label={{ value: "Accuracy %", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <ReferenceLine
                  y={91}
                  stroke="hsl(0, 84%, 60%)"
                  strokeDasharray="4 4"
                  label={{ position: 'right', value: 'BLOCK DEPLOYMENT ( -2.1% )', fill: 'hsl(0, 84%, 60%)', fontSize: 8, fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="Classification"
                  stroke="hsl(187, 94%, 43%)"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.Classification < 91) {
                      return <circle key={cx} cx={cx} cy={cy} r={4} fill="hsl(0, 84%, 60%)" stroke="white" strokeWidth={1} />;
                    }
                    return null as any;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Extraction"
                  stroke="hsl(160, 84%, 39%)"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.Extraction < 91) {
                      return <circle key={cx} cx={cx} cy={cy} r={4} fill="hsl(0, 84%, 60%)" stroke="white" strokeWidth={1} />;
                    }
                    return null as any;
                  }}
                />
                <Line type="monotone" dataKey="Mapping" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-background/40 border border-border/50">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Long-Term Analysis</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Classification</span>
                  <div className="text-right">
                    <span className="text-xs text-success font-bold block">+1.2%</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-medium">Optimization</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Extraction</span>
                  <div className="text-right">
                    <span className="text-xs text-warning font-bold block">-0.4%</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-medium">Minor Drift</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Mapping</span>
                  <div className="text-right">
                    <span className="text-xs text-success font-bold block">+0.8%</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-medium">Optimization</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-[9px] text-muted-foreground italic leading-relaxed">
                  <strong className="text-primary font-bold">"Boiling Frog" Monitor:</strong> Detecting slow degradations over 30-version cycles. The extraction drift is being mitigated by the auto-tuning loop.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-[9px] font-bold text-destructive uppercase tracking-tighter">
                <AlertTriangle className="w-3 h-3" /> DevOps Alert
              </div>
              <p className="text-[9px] text-muted-foreground mt-1 leading-tight">
                3 versions in the current cycle are marked <strong className="text-destructive underline decoration-dotted">BLOCKED</strong> due to accuracy drops exceeding 2.1%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ground Truth Database Section */}
      <div className="glass rounded-xl p-5 border border-success/30 bg-success/5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <Database className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-foreground">Ground Truth Database (MCP Integration)</h3>
              <p className="text-xs text-muted-foreground">Source of validation for all AI model tests</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/20 text-success text-[9px] font-bold border border-success/30 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Connected
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Source</div>
            <div className="text-sm font-mono text-foreground">HubSync Internal</div>
            <div className="text-[8px] text-muted-foreground mt-1">Validated Dataset</div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Size</div>
            <div className="text-sm font-mono text-foreground">15,847</div>
            <div className="text-[8px] text-muted-foreground mt-1">Test Cases</div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-sm font-mono text-foreground">Mar 29</div>
            <div className="text-[8px] text-muted-foreground mt-1">14:32 UTC</div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Confidence</div>
            <div className="text-sm font-mono text-success">95%+</div>
            <div className="text-[8px] text-muted-foreground mt-1">Human Verified</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/30 border border-white/5">
          <div className="text-[9px] font-bold text-foreground uppercase tracking-wider mb-2">Coverage</div>
          <div className="space-y-1.5 text-[9px] text-foreground/80">
            <div>• IRS Forms: 1040, 1120S, 1099, K-1 (all variants)</div>
            <div>• Test Types: Classification, Extraction, Mapping, Schema Validation</div>
            <div>• Data Currency: 2025 Tax Year (Rules, Thresholds, Schedules)</div>
          </div>
        </div>
      </div>

      {/* QA Orchestration / Persona Toggle */}
      <div className="glass rounded-xl p-4 border border-primary/20 bg-primary/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {personas[activePersona as keyof typeof personas].icon}
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Agentic QA Orchestration (Section 8.5)</h4>
              <p className="text-[10px] text-muted-foreground">{personas[activePersona as keyof typeof personas].desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm">
            {Object.keys(personas).map((p) => (
              <button
                key={p}
                onClick={() => setActivePersona(p)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${activePersona === p
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-white/5"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Persona Validation Results Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balanced Results */}
        <div className="glass rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Balanced Persona</h4>
          </div>
          <div className="space-y-2 text-[9px]">
            <div className="flex items-center justify-between p-2 rounded bg-success/10 border border-success/20">
              <span className="text-foreground">Passed:</span>
              <span className="font-mono font-bold text-success">14,982</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-destructive/10 border border-destructive/20">
              <span className="text-foreground">Failed:</span>
              <span className="font-mono font-bold text-destructive">865</span>
            </div>
            <div className="p-2 rounded bg-black/30 border border-white/5">
              <div className="text-muted-foreground text-[8px] mb-1">Failure Rate</div>
              <div className="font-mono font-bold text-foreground">5.5%</div>
            </div>
            <div className="p-2 rounded bg-warning/10 border border-warning/20">
              <div className="text-muted-foreground text-[8px] mb-1">Critical Regressions</div>
              <div className="font-mono font-bold text-warning">3</div>
            </div>
            <div className="text-[8px] text-muted-foreground italic mt-2 pt-2 border-t border-white/5">
              Standard distribution across all test metrics. Most reliable baseline.
            </div>
          </div>
        </div>

        {/* Edge-Case Hunter Results */}
        <div className="glass rounded-xl p-4 border border-border/50 hover:border-destructive/50 transition-colors bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-destructive" />
            <h4 className="font-bold text-xs text-destructive uppercase tracking-wider">Edge-Case Hunter</h4>
          </div>
          <div className="space-y-2 text-[9px]">
            <div className="flex items-center justify-between p-2 rounded bg-success/10 border border-success/20">
              <span className="text-foreground">Passed:</span>
              <span className="font-mono font-bold text-success">14,601</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-destructive/10 border border-destructive/20">
              <span className="text-foreground">Failed:</span>
              <span className="font-mono font-bold text-destructive">1,246</span>
            </div>
            <div className="p-2 rounded bg-black/30 border border-white/5">
              <div className="text-muted-foreground text-[8px] mb-1">Failure Rate</div>
              <div className="font-mono font-bold text-destructive">7.9%</div>
            </div>
            <div className="p-2 rounded bg-destructive/20 border border-destructive/30">
              <div className="text-muted-foreground text-[8px] mb-1">Critical Regressions</div>
              <div className="font-mono font-bold text-destructive">8 ↑</div>
            </div>
            <div className="text-[8px] text-muted-foreground italic mt-2 pt-2 border-t border-white/5">
              Aggressive fuzzing finds edge cases others miss. Higher failure = better detection.
            </div>
          </div>
        </div>

        {/* Schema Enforcer Results */}
        <div className="glass rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Schema Enforcer</h4>
          </div>
          <div className="space-y-2 text-[9px]">
            <div className="flex items-center justify-between p-2 rounded bg-success/10 border border-success/20">
              <span className="text-foreground">Passed:</span>
              <span className="font-mono font-bold text-success">15,123</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-destructive/10 border border-destructive/20">
              <span className="text-foreground">Failed:</span>
              <span className="font-mono font-bold text-destructive">724</span>
            </div>
            <div className="p-2 rounded bg-black/30 border border-white/5">
              <div className="text-muted-foreground text-[8px] mb-1">Failure Rate</div>
              <div className="font-mono font-bold text-foreground">4.6%</div>
            </div>
            <div className="p-2 rounded bg-warning/10 border border-warning/20">
              <div className="text-muted-foreground text-[8px] mb-1">Critical Regressions</div>
              <div className="font-mono font-bold text-warning">1</div>
            </div>
            <div className="text-[8px] text-muted-foreground italic mt-2 pt-2 border-t border-white/5">
              Strict API contract validation. Fewest regressions = tightest API compliance.
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted/30 text-foreground text-xs border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Status</option>
          <option value="Pass">Pass</option>
          <option value="Regression">Regression</option>
          <option value="Degraded">Degraded</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} jobs</span>
      </div>

      <DataTable data={filtered} columns={columns} />

      {/* Failure Trace Modal - Enhanced with Ground Truth & Retraining */}
      {showRegressionDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4" onClick={() => setShowRegressionDetail(null)}>
          <div className="glass-strong rounded-xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Failure Trace — {showRegressionDetail.id}
            </h2>

            {/* Test Input & Ground Truth Section */}
            <div className="space-y-3 mb-4">
              {/* Test Input */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">📋 Test Input</div>
                <div className="space-y-1 text-[9px] text-foreground font-mono">
                  <div>Document Type: IRS Form {showRegressionDetail.form}</div>
                  <div>Page: Line 7 (Interest Deductions)</div>
                  <div className="text-muted-foreground">Text Snippet: "12.5% interest on $120K"</div>
                </div>
              </div>

              {/* Visual Diff Viewer */}
              <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                <VisualDiffViewer
                  baselineLabel="Expected (Ground Truth)"
                  candidateLabel="Actual (Model v2.4)"
                  baseline="$15,100"
                  candidate="$12,450"
                />
              </div>
            </div>

            {/* CoT Flow Diagram */}
            {showRegressionDetail.cotTrace && showRegressionDetail.cotTrace.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-black/40 border border-primary/20">
                <CoTFlowDiagram
                  steps={showRegressionDetail.cotTrace}
                  failureStep={showRegressionDetail.cotTrace.length - 1}
                />
              </div>
            )}

            {/* Retraining Recommendation */}
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <h4 className="text-[9px] font-bold text-warning uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Recommended Fix Path
              </h4>
              <div className="space-y-2 text-[9px]">
                <div className="flex gap-2">
                  <span className="font-bold text-warning flex-shrink-0">1.</span>
                  <div>
                    <div className="font-bold text-foreground">Root Cause: Logic version mismatch</div>
                    <div className="text-muted-foreground text-[8px] mt-0.5">v2.4 uses outdated tax rules (2024.1) instead of current year 2025.1</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-warning flex-shrink-0">2.</span>
                  <div>
                    <div className="font-bold text-foreground">Proposed Solution</div>
                    <div className="text-muted-foreground text-[8px] mt-0.5">Add 2025 tax rule weights to training data. Retrain extraction model on 1,200 v2025 examples (~4 hours).</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-warning flex-shrink-0">3.</span>
                  <div>
                    <div className="font-bold text-foreground">Expected Outcome</div>
                    <div className="text-muted-foreground text-[8px] mt-0.5">Accuracy should return to 98.4%. Regression becomes: +0.0% (neutral).</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleStartRetraining(showRegressionDetail.id)}
                  className="flex-1 py-1.5 rounded-lg bg-warning text-black text-[9px] font-bold hover:bg-warning/90 transition-all uppercase tracking-wide"
                >
                  Start Retraining
                </button>
                <button
                  onClick={handleMoreInfo}
                  className="flex-1 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-[9px] font-medium hover:bg-muted/50 transition-all uppercase tracking-wide"
                >
                  More Info
                </button>
              </div>
            </div>

            {(showRegressionDetail as any)?.recommendations && (
              <div className="mt-4 p-3 rounded-lg bg-info/10 border border-info/20">
                <h4 className="text-[8px] font-bold text-info uppercase tracking-widest mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> Additional Recommendations
                </h4>
                <ul className="space-y-1 text-[9px] text-foreground/80">
                  {(showRegressionDetail as any).recommendations.slice(0, 3).map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-info font-bold mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 mt-5 pt-3 border-t border-white/5">
              <button
                onClick={() => setShowRegressionDetail(null)}
                className="flex-1 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-[10px] font-medium hover:bg-muted/50 transition-all uppercase tracking-widest"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Version Comparison Modal - Enhanced with Test Cases */}
      {showVersionCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md px-4" onClick={() => setShowVersionCompare(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-5xl border border-white/10 shadow-glow animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                  <Split className="w-5 h-5 text-primary" /> Model Output Comparison
                </h2>
                <p className="text-xs text-muted-foreground">Analyzing baseline v2.3 vs current release v2.4 (PRD 4.3)</p>
              </div>
              <button onClick={() => setShowVersionCompare(false)} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* JSON Diff Section */}
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileJson className="w-3.5 h-3.5" /> Raw Output Diff
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-t-lg bg-black/40 border-x border-t border-white/10 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    v2.3 Output (Baseline)
                    <span className="text-success bg-success/10 px-1.5 rounded">STABLE</span>
                  </div>
                  <div className="p-4 rounded-b-xl bg-black/40 border border-white/10 font-mono text-[10px] leading-relaxed text-foreground opacity-70 min-h-[180px]">
                    {`{\n  "line_7": 15100,\n  "interest_sched": "Page 4",\n  "confidence": 0.98,\n  "logic_version": "2024.1"\n}`}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-t-lg bg-black/40 border-x border-t border-destructive/20 text-[9px] font-bold text-destructive uppercase tracking-widest">
                    v2.4 Output (Candidate)
                    <span className="text-destructive bg-destructive/10 px-1.5 rounded animate-pulse underline">REGRESSION</span>
                  </div>
                  <div className="p-4 rounded-b-xl bg-black/60 border border-destructive/20 font-mono text-[10px] leading-relaxed text-foreground min-h-[180px] relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] text-destructive font-bold uppercase tracking-tighter bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
                      <AlertTriangle className="w-3 h-3" /> Logic Swap Detected
                    </div>
                    {`{\n`}
                    <span className="text-destructive opacity-50">{`-  "line_7": 15100,\n`}</span>
                    <span className="text-success">{`+  "line_7": 12450,\n`}</span>
                    {`   "interest_sched": "Page 4",\n`}
                    <span className="text-destructive opacity-50">{`-  "confidence": 0.98,\n`}</span>
                    <span className="text-destructive">{`+  "confidence": 0.92,\n`}</span>
                    {`   "logic_version": "2025.1"\n}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Cases Side-by-Side */}
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Test Case Comparison (Real Examples)
              </h3>

              <div className="space-y-3">
                {/* Test Case 1 */}
                <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[9px] font-bold text-foreground uppercase tracking-wider">Test Case #1: Extract Line 7 (IRS 1120S)</div>
                    <span className="text-[8px] font-mono text-muted-foreground">job-abc123</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-2 italic">Input: "Interest expense deduction: $15,100 from Schedule C"</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-black/60 border border-success/20">
                      <div className="text-[8px] text-muted-foreground mb-1">v2.3 (Baseline)</div>
                      <div className="font-mono text-[9px] text-success font-bold">15100 ✓</div>
                      <div className="text-[8px] text-muted-foreground mt-1">Confidence: 98%</div>
                    </div>
                    <div className="p-2 rounded bg-black/60 border border-destructive/20">
                      <div className="text-[8px] text-muted-foreground mb-1">v2.4 (Candidate)</div>
                      <div className="font-mono text-[9px] text-destructive font-bold">12450 ✗</div>
                      <div className="text-[8px] text-destructive mt-1">Confidence: 92%</div>
                    </div>
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                      <div className="text-[8px] text-destructive mb-1 font-bold">Difference</div>
                      <div className="font-mono text-[9px] text-destructive font-bold">-$2,650</div>
                      <div className="text-[8px] text-muted-foreground mt-1">FAILED</div>
                    </div>
                  </div>
                </div>

                {/* Test Case 2 */}
                <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[9px] font-bold text-foreground uppercase tracking-wider">Test Case #2: Classify Form Type</div>
                    <span className="text-[8px] font-mono text-muted-foreground">job-def456</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-2 italic">Input: [Form Image - Multi-page Schedule]</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-black/60 border border-success/20">
                      <div className="text-[8px] text-muted-foreground mb-1">v2.3 (Baseline)</div>
                      <div className="font-mono text-[9px] text-success font-bold">1120S ✓</div>
                      <div className="text-[8px] text-muted-foreground mt-1">Confidence: 97%</div>
                    </div>
                    <div className="p-2 rounded bg-black/60 border border-destructive/20">
                      <div className="text-[8px] text-muted-foreground mb-1">v2.4 (Candidate)</div>
                      <div className="font-mono text-[9px] text-destructive font-bold">1120 ✗</div>
                      <div className="text-[8px] text-destructive mt-1">Confidence: 94%</div>
                    </div>
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                      <div className="text-[8px] text-destructive mb-1 font-bold">Difference</div>
                      <div className="font-mono text-[9px] text-destructive font-bold">Wrong Form</div>
                      <div className="text-[8px] text-muted-foreground mt-1">FAILED</div>
                    </div>
                  </div>
                </div>

                {/* Test Case 3 - Passing */}
                <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[9px] font-bold text-foreground uppercase tracking-wider">Test Case #3: Extract K-1 Schedule Mapping</div>
                    <span className="text-[8px] font-mono text-muted-foreground">job-ghi789</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-2 italic">Input: "Distributed to partner at Line 19, K-1 Part III"</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-black/60 border border-success/20">
                      <div className="text-[8px] text-muted-foreground mb-1">v2.3 (Baseline)</div>
                      <div className="font-mono text-[9px] text-success font-bold">K-1 Sch C ✓</div>
                      <div className="text-[8px] text-muted-foreground mt-1">Confidence: 99%</div>
                    </div>
                    <div className="p-2 rounded bg-black/60 border border-success/20">
                      <div className="text-[8px] text-muted-foreground mb-1">v2.4 (Candidate)</div>
                      <div className="font-mono text-[9px] text-success font-bold">K-1 Sch C ✓</div>
                      <div className="text-[8px] text-muted-foreground mt-1">Confidence: 99%</div>
                    </div>
                    <div className="p-2 rounded bg-success/10 border border-success/30">
                      <div className="text-[8px] text-success mb-1 font-bold">Difference</div>
                      <div className="font-mono text-[9px] text-success font-bold">+0.0%</div>
                      <div className="text-[8px] text-muted-foreground mt-1">PASSED</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Structural Regression Analysis */}
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <h4 className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Structural Regression Analysis
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The candidate model (v2.4) correctly parsed the interest schedule but failed to apply the weighted distribution logic for multi-entity scenarios. Resulted in a <strong className="text-foreground">-$2,650 discrepancy</strong> on Line 7 compared to the stable baseline. 2 of 3 test cases failed. Mapping logic is unaffected (3/3 pass).
              </p>
            </div>

            <button onClick={() => setShowVersionCompare(false)} className="w-full mt-4 py-2 rounded-lg bg-muted/30 text-muted-foreground text-[10px] font-medium hover:bg-muted/50 transition-all">
              Close Comparison
            </button>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
}
