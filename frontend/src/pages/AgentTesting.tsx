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
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-foreground uppercase tracking-tight">Intelligence Agency</h3>
            <p className="text-xs text-slate-400 font-medium max-w-lg leading-relaxed mt-1">Deploy specialized QA Agents to validate HubSync's production models. Real-time intelligence surfacing and regression prevention.</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2">
            {[
              { label: "Fetch", icon: <Database className="w-3.5 h-3.5" />, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "Validate", icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "text-purple-400", bg: "bg-purple-400/10" },
              { label: "Sync", icon: <RefreshCw className="w-3.5 h-3.5" />, color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { label: "Deploy", icon: <Bot className="w-3.5 h-3.5" />, color: "text-amber-400", bg: "bg-amber-400/10" }
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${step.bg} border border-white/5 shadow-inner`}>
                  <div className={step.color}>{step.icon}</div>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
              </div>
            ))}
          </div>
          <div className="ml-6 pl-6 border-l border-white/10">
            <div className="flex items-center gap-2 text-[10px] font-black text-success uppercase tracking-widest bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              HUB-SYNC: ACTIVE
            </div>
          </div>
        </div>
      </div>

      {/* Regression Alerts / Safety Gate with Business Impact */}
      {regressions.length > 0 && (
        <div className={`bg-[#1e293b] rounded-2xl p-6 border-2 shadow-2xl ${criticalRegression ? 'border-destructive animate-pulse-subtle shadow-destructive/10' : 'border-destructive/30'}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive text-white shadow-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-black text-[13px] text-destructive uppercase tracking-widest">
                Deployment Safety Gate: {criticalRegression ? 'HALTED' : 'CAUTION'}
              </h3>
            </div>
            <div className="px-3 py-1 bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest rounded border border-destructive/20">
              PRD Violation Detected
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-6 font-medium">
            Intelligence Engine Triggered: <span className="text-white">Critical threshold exceeded</span> ( -2.1% accuracy drop ). The Following deployments have been automatically quarantined.
          </p>

          {/* Business Impact Analysis */}
          {criticalRegression && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-destructive/30 bg-[#0f172a] shadow-inner">
              <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/20 text-[10px] font-black text-destructive uppercase tracking-widest">
                Real-Time Risk Exposure Analysis
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-x divide-white/5 p-4">
                <div className="px-4">
                  <div className="text-lg font-black text-white">$106,400</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Daily Rev Leakage</div>
                </div>
                <div className="px-8">
                  <div className="text-lg font-black text-destructive">5.2% DROP</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Extraction Yield</div>
                </div>
                <div className="px-8">
                  <div className="text-lg font-black text-destructive uppercase">CRITICAL</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Risk Classification</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {regressions.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a] border border-white/5 hover:border-destructive/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-primary font-bold">{job.id}</span>
                    <span className="text-[11px] text-slate-300 font-bold uppercase tracking-tight">{job.targetAgent} — {job.testType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-destructive font-black bg-destructive/10 px-3 py-1 rounded-lg border border-destructive/20">{job.delta}%</span>
                  <button
                    onClick={() => handleInspectTrace(job)}
                    className="h-10 px-5 rounded-xl bg-destructive text-white text-[11px] font-black uppercase tracking-widest hover:bg-destructive/80 transition-all shadow-lg shadow-destructive/20 border border-white/10"
                  >
                    Inspect Failure Trace
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intelligence Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Classification Intelligence",
            icon: <Cpu className="w-5 h-5 text-primary" />,
            what: "Classify document type from imagery",
            input: "[IRS Form 1120S Cluster]",
            expected: "IRS 1120S",
            got: "IRS 1120",
            impact: "-4% Yield | 40 docs/day",
            color: "primary"
          },
          {
            title: "Extraction Accuracy",
            icon: <FileJson className="w-5 h-5 text-destructive" />,
            what: "Extract Line 7 Weighted Sum",
            input: "\"Interest: $15,100\"",
            expected: "15100",
            got: "12450",
            impact: "$2.6K Error | $106K daily",
            color: "destructive",
            isCritical: true
          },
          {
            title: "Mapping Logic",
            icon: <Target className="w-5 h-5 text-success" />,
            what: "Map fields to 2025 Tax Code",
            input: "Line 7 → K-1 Mapping",
            expected: "K-1 Sch C",
            got: "K-1 Sch C",
            impact: "PASS | 99% Conf",
            color: "success"
          }
        ].map((test, i) => (
          <div key={i} className={`bg-[#1e293b] rounded-2xl p-6 border transition-all duration-300 shadow-xl overflow-hidden relative group ${test.isCritical ? 'border-destructive/40 bg-destructive/5' : 'border-white/5 hover:border-primary/30'}`}>
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform ${test.color === 'destructive' ? 'text-destructive' : 'text-primary'}`}>
              {test.icon}
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${test.color === 'destructive' ? 'bg-destructive/10 text-destructive' : test.color === 'success' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'} border border-current/20 shadow-md`}>
                {test.icon}
              </div>
              <h4 className={`font-black text-[11px] uppercase tracking-widest ${test.color === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>{test.title}</h4>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="bg-[#0f172a] rounded-xl p-4 border border-white/5">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Operation Detail</div>
                <p className="text-xs text-slate-300 font-bold leading-relaxed">{test.what}</p>
                <div className="mt-2 text-[10px] font-mono text-primary truncate opacity-60">{test.input}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0f172a] p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Expected</span>
                  <div className="text-xs font-black text-foreground">{test.expected}</div>
                </div>
                <div className="bg-[#0f172a] p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Reality</span>
                  <div className={`text-xs font-black ${test.got === test.expected ? 'text-success' : 'text-destructive'}`}>{test.got} {test.got === test.expected ? '✓' : '✗'}</div>
                </div>
              </div>

              <div className={`pt-4 border-t border-white/5 flex items-center gap-2 ${test.color === 'destructive' ? 'text-destructive' : test.color === 'success' ? 'text-success' : 'text-primary'}`}>
                {test.got === test.expected ? <CheckCircle2 className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{test.impact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accuracy Trend / Continuous Optimization */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-2xi relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="font-heading font-black text-lg text-foreground uppercase tracking-tight">AI Accuracy Propagation</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Multi-dimensional accuracy drift across 30 model iterations.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowVersionCompare(true)}
              className="h-10 px-6 rounded-xl bg-[#0f172a] text-foreground text-[11px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 hover:border-primary/30 transition-all flex items-center gap-3 shadow-lg group"
            >
              <div className="p-1 rounded bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Split className="w-3.5 h-3.5" />
              </div>
              Compare Artifacts
            </button>
            <div className="h-10 px-6 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-3">
              <Zap className="w-4 h-4 fill-primary animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
              Intelligence Auto-Heal ACTIVE
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
          <div className="lg:col-span-3 bg-[#0f172a]/50 p-6 rounded-2xl border border-white/5 shadow-inner">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="version"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)", fontWeight: "black" }}
                  interval={4}
                />
                <YAxis
                  domain={[88, 100]}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)", fontWeight: "black" }}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "black", textTransform: "uppercase", letterSpacing: "0.1em", paddingTop: "20px" }} />
                <ReferenceLine
                  y={91}
                  stroke="rgba(239, 68, 68, 0.4)"
                  strokeDasharray="8 8"
                  label={{ position: 'right', value: 'BLOCK (FAIL)', fill: 'rgba(239, 68, 68, 0.6)', fontSize: 10, fontWeight: 'black' }}
                />
                <Line
                  type="monotone"
                  dataKey="Classification"
                  stroke="hsl(187, 94%, 43%)"
                  strokeWidth={4}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.Classification < 91) {
                      return <circle key={cx} cx={cx} cy={cy} r={6} fill="#ef4444" stroke="white" strokeWidth={2} className="animate-pulse shadow-lg" />;
                    }
                    return null as any;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Extraction"
                  stroke="hsl(160, 84%, 39%)"
                  strokeWidth={4}
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
            <div className="mb-8 relative">
              <div className="absolute -left-6 top-0 w-1.5 h-16 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-lg"><FileJson className="w-4 h-4" /></div>
                Raw AI Output Delta
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Baseline Box */}
                <div className="relative group">
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-success text-success-foreground rounded-lg text-[10px] font-black uppercase tracking-widest z-20 shadow-xl border border-white/20">
                    <ShieldCheck className="w-3 h-3 inline mr-1.5 mb-0.5" /> Stable Baseline
                  </div>
                  <div className="relative flex flex-col h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f172a]">
                    <div className="flex items-center justify-between px-5 py-4 bg-[#1e293b] border-b border-white/5">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">v2.3 Production</span>
                      <div className="text-[9px] font-mono text-slate-500">job-9921-prod</div>
                    </div>
                    <div className="p-6 font-mono text-[12px] leading-relaxed text-blue-400 min-h-[240px]">
                      <span className="text-slate-500">{"{"}</span><br />
                      {"  "}<span className="text-slate-400">"line_7"</span>: <span className="text-amber-400">15100</span>,<br />
                      {"  "}<span className="text-slate-400">"interest_sched"</span>: <span className="text-emerald-400">"Page 4"</span>,<br />
                      {"  "}<span className="text-slate-400">"confidence"</span>: <span className="text-amber-400">0.98</span>,<br />
                      {"  "}<span className="text-slate-400">"logic_version"</span>: <span className="text-emerald-400">"2024.1"</span><br />
                      <span className="text-slate-500">{"}"}</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Box */}
                <div className="relative group">
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-destructive text-white rounded-lg text-[10px] font-black uppercase tracking-widest z-20 shadow-xl border border-white/20 animate-pulse-subtle">
                    <AlertTriangle className="w-3 h-3 inline mr-1.5 mb-0.5" /> Regression Detected
                  </div>
                  <div className="relative flex flex-col h-full rounded-2xl overflow-hidden border border-destructive/40 shadow-[0_0_40px_rgba(239,68,68,0.15)] bg-[#0f172a]">
                    <div className="flex items-center justify-between px-5 py-4 bg-[#1e293b] border-b border-white/5">
                      <span className="text-[11px] font-bold text-destructive uppercase tracking-widest">v2.4 Candidate</span>
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-destructive/10 border border-destructive/20 text-[9px] text-destructive font-black uppercase tracking-tighter">
                        <ZapOff className="w-3 h-3" /> Failed
                      </div>
                    </div>
                    <div className="p-6 font-mono text-[12px] leading-relaxed min-h-[240px] relative">
                      <div className="flex items-center gap-2 absolute top-4 right-4 text-[10px] text-white font-black uppercase tracking-widest bg-destructive px-3 py-1.5 rounded-md shadow-lg z-10 border border-white/10">
                        <AlertTriangle className="w-4 h-4" /> Logic Swap
                      </div>

                      <span className="text-slate-500">{"{"}</span><br />
                      <div className="bg-destructive/20 -mx-6 px-6 py-0.5 border-l-4 border-destructive my-1">
                        <span className="text-destructive font-bold pr-3">-</span>
                        <span className="text-slate-400">"line_7"</span>: <span className="text-amber-400">15100</span>,
                      </div>
                      <div className="bg-success/20 -mx-6 px-6 py-0.5 border-l-4 border-success my-1">
                        <span className="text-success font-bold pr-3">+</span>
                        <span className="text-slate-400">"line_7"</span>: <span className="text-success font-bold">12450</span>,
                      </div>
                      {"  "}<span className="text-slate-400">"interest_sched"</span>: <span className="text-emerald-400">"Page 4"</span>,<br />
                      <div className="bg-destructive/20 -mx-6 px-6 py-0.5 border-l-4 border-destructive my-1">
                        <span className="text-destructive font-bold pr-3">-</span>
                        <span className="text-slate-400">"confidence"</span>: <span className="text-amber-400">0.98</span>,
                      </div>
                      <div className="bg-destructive/30 -mx-6 px-6 py-0.5 border-l-4 border-destructive my-1">
                        <span className="text-destructive font-bold pr-3">+</span>
                        <span className="text-slate-400">"confidence"</span>: <span className="text-destructive font-bold">0.92</span>,
                      </div>
                      {"  "}<span className="text-slate-400">"logic_version"</span>: <span className="text-emerald-400">"2025.1"</span><br />
                      <span className="text-slate-500">{"}"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Intelligence Comparison */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-secondary text-secondary-foreground shadow-lg shadow-black/20">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Intelligence Gap Analysis</h3>
                    <div className="h-1 w-12 bg-primary rounded-full mt-1" />
                  </div>
                </div>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="space-y-6">
                {[
                  {
                    id: "TestCase-01",
                    title: "Extract Line 7 (IRS 1120S)",
                    job: "job-abc123",
                    input: "\"Interest expense deduction: $15,100 from Schedule C\"",
                    v23: "15100",
                    v24: "12450",
                    diff: "-$2,650",
                    status: "FAILED",
                    v23Conf: 98,
                    v24Conf: 92
                  },
                  {
                    id: "TestCase-02",
                    title: "Classify Form Type",
                    job: "job-def456",
                    input: "[Form Image - Multi-page Schedule]",
                    v23: "1120S",
                    v24: "1120",
                    diff: "Wrong Form",
                    status: "FAILED",
                    v23Conf: 97,
                    v24Conf: 94
                  },
                  {
                    id: "TestCase-03",
                    title: "Extract K-1 Schedule Mapping",
                    job: "job-ghi789",
                    input: "\"Distributed to partner at Line 19, K-1 Part III\"",
                    v23: "K-1 Sch C",
                    v24: "K-1 Sch C",
                    diff: "+0.0%",
                    status: "PASSED",
                    v23Conf: 99,
                    v24Conf: 99
                  }
                ].map((tc) => (
                  <div key={tc.id} className="relative rounded-2xl bg-[#1e293b] border border-white/5 overflow-hidden shadow-xl hover:translate-y-[-2px] transition-transform duration-300 group">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${tc.status === 'FAILED' ? 'bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-success shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`} />

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${tc.status === 'FAILED' ? 'bg-destructive text-white shadow-lg shadow-destructive/20' : 'bg-success text-white shadow-lg shadow-success/20'}`}>
                            {tc.status === 'FAILED' ? <ZapOff className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">{tc.title}</h4>
                            <span className="text-[10px] font-mono text-slate-500">{tc.job}</span>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${tc.status === 'FAILED' ? 'bg-destructive text-white border border-white/10' : 'bg-success text-white border border-white/10'}`}>
                          {tc.status}
                        </div>
                      </div>

                      <div className="bg-[#0f172a] border border-white/5 p-4 rounded-xl mb-6">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Input Context</div>
                        <p className="text-xs text-slate-300 font-medium italic">{tc.input}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0f172a]/80 p-5 rounded-2xl border border-white/5 flex flex-col justify-between group-hover:bg-[#0f172a] transition-colors">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Model v2.3</span>
                          <div className="text-xl font-mono font-black text-slate-100">{tc.v23} <span className="text-success text-sm ml-1">✓</span></div>
                          <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Bot className="w-3 h-3" /> Conf: {tc.v23Conf}%
                          </div>
                        </div>

                        <div className={`bg-[#0f172a]/80 p-5 rounded-2xl border flex flex-col justify-between transition-colors ${tc.status === 'FAILED' ? 'border-destructive/30' : 'border-success/30'}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${tc.status === 'FAILED' ? 'text-destructive/80' : 'text-success/80'}`}>Model v2.4</span>
                          <div className={`text-xl font-mono font-black ${tc.status === 'FAILED' ? 'text-destructive' : 'text-success'}`}>{tc.v24}</div>
                          <div className={`mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${tc.status === 'FAILED' ? 'text-destructive/80' : 'text-success/80'}`}>
                            <AlertTriangle className="w-3 h-3" /> Conf: {tc.v24Conf}%
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-lg ${tc.status === 'FAILED' ? 'bg-destructive text-white' : 'bg-success text-white'}`}>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2 underline decoration-white/20 underline-offset-4">Discrepancy</span>
                          <div className="text-2xl font-mono font-black">{tc.diff}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause Insight */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
              <div className="relative flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-destructive text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] border border-white/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-destructive uppercase tracking-[0.3em] mb-4">Critical Root Cause Analysis</h4>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
                    <span className="text-white font-bold">Safeguard Breach:</span> The candidate model (v2.4) correctly parsed the interest schedule but failed to apply the <span className="text-destructive font-black bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20 mx-1">weighted distribution logic</span> for multi-entity scenarios.
                    This resulted in a <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10 mx-1">-$2,650 discrepancy</span> compared to baseline parity.
                    Deployment has been automatically <span className="text-destructive font-black underline decoration-dotted underline-offset-4">BLOCKED</span> to prevent multi-million dollar tax calculation leakage.
                  </p>
                </div>
              </div>
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
