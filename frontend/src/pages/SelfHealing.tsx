import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, FileText, AlertTriangle, Bug, Check, X, Sparkles, CheckCircle2, Bot, GitBranch, Terminal, Zap, ShieldAlert, Activity, Cpu, Target, LineChart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as LineChartComponent, Line } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/common/KPICard";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AISummaryDrawer } from "@/components/ai/AISummaryDrawer";
import { useApiData } from "@/hooks/useApi";
import { useChatContext } from "@/context/ChatContext";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export interface HealingEvent {
  id: string;
  suite: string;
  elementSought: string;
  observation: string;
  inference: string;
  action: string;
  confidence: number;
  time: string;
  status: string;
}

const iconMap: Record<string, any> = { RefreshCw, FileText, AlertTriangle, Bug };

export default function SelfHealing() {
  const [searchParams] = useSearchParams();
  const suiteFilter = searchParams.get("suite");

  const [filterInference, setFilterInference] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [approvalsStatus, setApprovalsStatus] = useState<Record<string, "pending" | "approved" | "rejected">>({});
  const [showDiffId, setShowDiffId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<HealingEvent | null>(null);
  const [showAllShadow, setShowAllShadow] = useState(false);

  const { data, isLoading, error } = useApiData("healing-events", "/api/healing/events");
  const { setContextData } = useChatContext();

  useEffect(() => {
    if (data) {
      setContextData({
        page: "AI Self-Healing Monitor",
        overview: data.healingOverview,
        decisionMatrix: data.decisionMatrix,
        eventCount: data.healingEvents?.length,
        shadowApprovals: data.shadowApprovals?.length
      });
    }
  }, [data, setContextData]);

  // Generate historical trend data (30 days)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      data.push({
        day: dayLabel,
        events: Math.floor(30 + Math.random() * 40),
        approved: Math.floor(25 + Math.random() * 35),
        timeSaved: Math.floor(20 + Math.random() * 30)
      });
    }
    return data;
  }, []);

  // Generate flaky test data
  const flakyTests = useMemo(() => {
    return [
      {
        id: "FT-001",
        name: "checkout.spec.ts > Cart Total Calculation",
        suite: "E-Commerce Core",
        runHistory: [true, false, true, false, true, true, false, false, true, true],
        failureRate: 40,
        rootCause: "Async race condition in price recalculation",
        aiSuggestion: "Add explicit wait for network idle before assertion",
        confidence: 85
      },
      {
        id: "FT-002",
        name: "form-validation.spec.ts > Email Validation",
        suite: "Form Handler",
        runHistory: [true, true, false, true, true, false, true, true, true, true],
        failureRate: 30,
        rootCause: "Timezone-dependent date validation",
        aiSuggestion: "Mock system clock before running test",
        confidence: 78
      },
      {
        id: "FT-003",
        name: "api-integration.spec.ts > External API Response",
        suite: "Integration Tests",
        runHistory: [false, true, true, false, true, false, true, true, false, true],
        failureRate: 50,
        rootCause: "Intermittent timeout from 3rd-party service",
        aiSuggestion: "Increase timeout threshold and add retry logic",
        confidence: 72
      }
    ];
  }, []);


  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground animate-pulse">Initializing Winnie AI Core...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Failed to fetch healing events from server. Check MCP connection.</div>;

  const { healingEvents, healingOverview, decisionMatrix, shadowApprovals } = data;

  const handleApprove = (id: string) => {
    setApprovalsStatus(prev => ({ ...prev, [id]: "approved" }));
    toast.success(`Closed-Loop Learning: Script update pushed for ${id}`, {
      description: "Pull Request #8821 created in quality-ai-hub repo.",
      icon: <GitBranch className="w-4 h-4 text-primary" />
    });
  };

  const handleReject = (id: string) => {
    setApprovalsStatus(prev => ({ ...prev, [id]: "rejected" }));
    toast.error(`Shadow Mode: Healing rejected for ${id}.`, {
      description: "Trace sent back to Intelligence Agent for retraining.",
    });
  };

  const handleBulkApprove = () => {
    const pendingIds = shadowApprovals.filter(s => !approvalsStatus[s.id] || approvalsStatus[s.id] === "pending").map(s => s.id);
    if (pendingIds.length === 0) return;

    const nextStatus = { ...approvalsStatus };
    pendingIds.forEach(id => {
      nextStatus[id] = "approved";
    });
    setApprovalsStatus(nextStatus);

    toast.success(`Bulk Sync: Successfully merged ${pendingIds.length} script updates!`, {
      description: "Codebase synchronized with AI intelligence for all similar UI transitions.",
      icon: <Zap className="w-4 h-4 text-primary fill-primary/20" />
    });
  };

  const handleBulkApproveHighConfidence = () => {
    const highConfidenceIds = shadowApprovals
      .filter(s => (!approvalsStatus[s.id] || approvalsStatus[s.id] === "pending") && s.confidence >= 90)
      .map(s => s.id);

    if (highConfidenceIds.length === 0) {
      toast.info("No high-confidence suggestions pending.");
      return;
    }

    const nextStatus = { ...approvalsStatus };
    highConfidenceIds.forEach(id => {
      nextStatus[id] = "approved";
    });
    setApprovalsStatus(nextStatus);

    toast.success(`Bulk Sync: Successfully merged ${highConfidenceIds.length} high-confidence updates!`, {
      description: "Automatic PR created for verified AI healing actions (90%+ Confidence).",
      icon: <Target className="w-4 h-4 text-primary fill-primary/20" />
    });
  };

  const filtered = healingEvents.filter(e => {
    if (suiteFilter && e.suite !== suiteFilter) return false;
    if (filterInference !== "All" && e.inference !== filterInference) return false;
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    return true;
  });


  // Get first event as trigger
  const triggerEvent = healingEvents.length > 0 ? healingEvents[0] : null;

  const columns: Column<HealingEvent>[] = [
    {
      key: "id",
      label: "Event ID",
      sortable: true,
      render: r => (
        <button
          onClick={() => setSelectedEvent(r)}
          className="text-primary font-mono hover:underline text-left group flex items-center gap-1.5 transition-all"
        >
          <Target className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
          {r.id}
        </button>
      )
    },
    { key: "suite", label: "Suite", sortable: true },
    { key: "elementSought", label: "Element Sought", render: r => <span className="font-mono text-[10px] opacity-70">{r.elementSought}</span> },
    { key: "observation", label: "Observation" },
    {
      key: "inference", label: "AI Inference", render: r => (
        <span className={`font-medium ${r.inference === "UI Refactor" || r.inference === "Copy Update" ? "text-primary" : "text-destructive"}`}>{r.inference}</span>
      )
    },
    { key: "action", label: "Action" },
    { key: "confidence", label: "Confidence", sortable: true, render: r => <span className="font-mono">{r.confidence}%</span> },
    { key: "time", label: "Time" },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="AI Self-Healing Monitor" subtitle="Real-time element healing and defect detection">
        <AISummaryDrawer
          systemPrompt="You are a QA Intelligence Analyst. Analyze these self-healing metrics. Identify trends, risks, and recommendations."
          context={JSON.stringify(healingOverview)}
        />
      </PageHeader>

      {/* Suite Filter Indicator */}
      {suiteFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-3 flex items-center justify-between bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground">
              Filtering by: <span className="font-bold text-primary">{suiteFilter}</span>
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-2 py-1 rounded text-[9px] font-bold text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-all"
          >
            Clear Filter
          </button>
        </motion.div>
      )}

      {/* Latest Test Failure Event Card */}
      {triggerEvent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border-l-4 border-destructive bg-destructive/5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground">Latest Test Failure (Trigger Event)</h3>
                <p className="text-xs text-muted-foreground">This failure sparked the AI self-healing analysis</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-full border border-destructive/20 uppercase">Failed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Test Name</label>
              <p className="text-sm font-mono text-foreground">{triggerEvent.suite} &gt; {triggerEvent.elementSought}</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Error Type</label>
              <p className="text-sm font-mono text-destructive">Element #{triggerEvent.elementSought} not found</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stack Trace</label>
              <div className="bg-black/60 p-3 rounded font-mono text-[9px] text-secondary/80 overflow-x-auto">
                at page.click('{triggerEvent.elementSought}') — line {Math.floor(Math.random() * 200) + 10}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Browser / OS</label>
              <p className="text-sm text-foreground">Chrome 127 | Windows 11 | Desktop</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Timestamp</label>
              <p className="text-sm text-foreground">Today 14:32:18 UTC ({triggerEvent.time})</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-[10px] text-destructive/90">Winnie AI is analyzing this failure. Healing suggestion will appear below in ~2 seconds.</p>
          </div>
        </motion.div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Events Today" value={healingOverview.eventsToday} icon="Sparkles" index={0} />
        <KPICard label="Auto-Approved" value={healingOverview.autoApproved} suffix="" change={83} changeLabel="of total" icon="CheckCircle2" index={1} />
        <KPICard label="Pending Review" value={healingOverview.pendingReview} icon="Clock" index={2} />
        <KPICard label="False Positives" value={healingOverview.falsePositives} icon="ShieldAlert" index={3} />
        <KPICard label="Avg Heal Time" value={1.3} suffix="s" icon="Gauge" index={4} />
      </div>

      {/* Decision Matrix */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-4">AI Decision Matrix</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {decisionMatrix.map(item => {
            const Icon = iconMap[item.icon];
            return (
              <div key={item.type} className={`rounded-xl p-4 border ${item.color === "primary" ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                <Icon className={`w-6 h-6 mb-2 ${item.color === "primary" ? "text-primary" : "text-destructive"}`} />
                <h4 className="font-heading font-semibold text-sm text-foreground">{item.type}</h4>
                <p className={`text-xs mt-1 ${item.color === "primary" ? "text-primary" : "text-destructive"}`}>→ {item.action}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Trend Chart (30 Days) */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Healing Trend (30 Days)
          </h3>
          <div className="text-[10px] text-muted-foreground font-mono">Last month analysis</div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChartComponent data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="day"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                label={{ value: "Timeline (30 Days)", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
              />
              <YAxis
                fontSize={10}
                axisLine={false}
                tickLine={false}
                label={{ value: "Events Count", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
              <Line type="monotone" dataKey="events" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={false} name="Healing Events" />
              <Line type="monotone" dataKey="approved" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} name="Auto-Approved" />
            </LineChartComponent>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Total Events (30d)</label>
            <p className="text-xl font-bold text-foreground">1,156</p>
            <p className="text-[9px] text-primary">↑ 38% from last month</p>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Auto-Approved Rate</label>
            <p className="text-xl font-bold text-success">82.4%</p>
            <p className="text-[9px] text-success">High confidence accuracy</p>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Time Saved (30d)</label>
            <p className="text-xl font-bold text-primary">47 hrs</p>
            <p className="text-[9px] text-primary">vs manual selector fixes</p>
          </div>
        </div>
      </div>

      {/* Flaky Test Detection */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-warning" /> Flaky Test Detection
          </h3>
          <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-1 rounded-full border border-warning/20">Intermittent Failures</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {flakyTests.map(test => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-border/50 bg-muted/5 space-y-3 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">{test.name}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{test.id}</p>
                </div>
                <span className="text-[10px] font-bold text-warning bg-warning/20 px-2 py-1 rounded border border-warning/30">{test.failureRate}% fail rate</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-muted-foreground mr-2">Run history (10x):</span>
                {test.runHistory.map((pass, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm border ${pass ? "bg-success/30 border-success" : "bg-destructive/30 border-destructive"}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <span className="text-muted-foreground">Root Cause:</span>
                  <p className="text-foreground font-mono">{test.rootCause}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">AI Suggestion:</span>
                  <p className="text-primary font-mono">{test.aiSuggestion}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-muted-foreground">Confidence:</span>
                  <span className="text-[9px] font-bold text-foreground">{test.confidence}%</span>
                </div>
                <button className="px-2 py-1 rounded bg-primary/10 text-primary text-[9px] font-bold border border-primary/20 hover:bg-primary/20 transition-all">
                  Approve & Auto-Fix
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Winnie Feedback Loop Analytics (Section 6: Model Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5 border-l-4 border-primary bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> "Winnie" Feedback Loop Health
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-success font-bold bg-success/10 px-2 py-0.5 rounded-full border border-success/30 uppercase tracking-tighter">
              <CheckCircle2 className="w-3 h-3" /> Model Optimizing
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Button", fp: 12, fn: 2 },
                { name: "Modal", fp: 5, fn: 8 },
                { name: "Input", fp: 24, fn: 4 },
                { name: "Grid", fp: 18, fn: 12 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Component Type", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold" }}
                />
                <YAxis
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Frequency", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(215, 20%, 55%)", fontWeight: "bold", offset: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                <Bar dataKey="fp" name="False Positives" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="fn" name="False Negatives" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-background/40 border border-border/50">
            <div className="flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
              <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
              <p>
                The Intelligence Agent is seeing higher false-positive rates in <span className="text-primary font-mono font-bold">AntDesign Input</span> components after the v5.4.1 theme update.
                <span className="text-foreground font-semibold"> Automatic fine-tuning triggered</span> for the next 24-hour training cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Shadow Mode - Integrated inside grid for layout balance */}
        <div className="glass rounded-xl p-5 border-l-4 border-warning bg-warning/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50">
            <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-warning" /> Shadow Mode Approvals ({shadowApprovals.filter(s => !approvalsStatus[s.id] || approvalsStatus[s.id] === "pending").length})
              <span className="px-1.5 py-0.5 rounded-full bg-warning/20 text-warning text-[10px] animate-pulse">Review Required</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApproveHighConfidence}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary/20 transition-all group active:scale-95"
              >
                <Target className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                Approve High Conf. (90%+)
              </button>
              <button
                disabled={shadowApprovals.filter(s => !approvalsStatus[s.id] || approvalsStatus[s.id] === "pending").length === 0}
                onClick={handleBulkApprove}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 text-muted-foreground text-[10px] font-bold border border-border/50 hover:bg-muted/60 transition-all disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" /> Approve All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shadowApprovals.slice(0, 2).map(item => ( // Slice for layout balance in grid
              <div key={item.id} className="rounded-xl border border-border/50 p-4 bg-muted/10 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-primary">{item.id}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{item.confidence}%</span>
                </div>
                <p className="text-xs text-foreground mb-1 font-semibold">{item.suite}</p>
                <p className="text-[10px] text-muted-foreground mb-3 font-mono truncate">{item.element}</p>

                {/* Mock Visuals (Section 8: Computer Vision Simulation) */}
                <div className="grid grid-cols-2 gap-2 mb-4 h-32 select-none">
                  {/* Before Screenshot - MORE REALISTIC UI */}
                  <div className="relative rounded bg-muted/30 border border-destructive/20 overflow-hidden flex flex-col p-2 opacity-70">
                    <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
                    <div className="text-[7px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">STALE</div>
                    <div className="w-full h-full bg-gradient-to-b from-sidebar/40 to-sidebar/20 rounded flex flex-col gap-1 p-2">
                      {/* Realistic form mockup */}
                      <div className="w-full h-1 bg-muted/60 rounded" />
                      <div className="w-3/4 h-0.5 bg-muted/40 rounded" />
                      <div className="mt-1 w-full h-3 bg-muted/30 border border-border/50 rounded px-1 flex items-center">
                        <span className="text-[5px] text-muted-foreground">Email field</span>
                      </div>
                      <div className="mt-1 w-full h-3 bg-muted/30 border border-border/50 rounded px-1 flex items-center">
                        <span className="text-[5px] text-muted-foreground">Password</span>
                      </div>
                      <div className="mt-2 w-2/3 h-3 bg-destructive/20 border border-destructive border-dashed rounded flex items-center justify-center">
                        <span className="text-[5px] text-destructive font-bold">#submit-btn</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[5px] font-bold text-destructive bg-background/95 px-1 border border-destructive/30 rounded uppercase tracking-tighter">BROKEN</span>
                    </div>
                  </div>

                  {/* After Screenshot - HEALED WITH CONFIDENCE OVERLAY */}
                  <div className="relative rounded bg-muted/30 border border-success/20 overflow-hidden flex flex-col p-2">
                    <div className="absolute inset-0 bg-success/5 pointer-events-none" />
                    <div className="text-[7px] font-bold text-success mb-1 uppercase tracking-tighter">HEALED</div>
                    <div className="w-full h-full bg-gradient-to-b from-sidebar/40 to-sidebar/20 rounded flex flex-col gap-1 p-2 relative">
                      {/* Realistic form mockup with overlays */}
                      <div className="w-full h-1 bg-muted/60 rounded" />
                      <div className="w-3/4 h-0.5 bg-muted/40 rounded" />
                      <div className="mt-1 w-full h-3 bg-muted/30 border border-border/50 rounded px-1 flex items-center justify-between group relative">
                        <span className="text-[5px] text-muted-foreground">Email field</span>
                        <span className="text-[4px] bg-primary/70 text-white px-0.5 rounded hidden group-hover:inline">97%</span>
                      </div>
                      <div className="mt-1 w-full h-3 bg-muted/30 border border-border/50 rounded px-1 flex items-center justify-between group">
                        <span className="text-[5px] text-muted-foreground">Password</span>
                        <span className="text-[4px] bg-primary/70 text-white px-0.5 rounded hidden group-hover:inline">94%</span>
                      </div>
                      <div className="mt-2 w-2/3 h-3 bg-success/20 border border-success rounded flex items-center justify-center gap-0.5 shadow-[0_0_4px_rgba(34,197,94,0.4)] border-2">
                        <Sparkles className="w-1.5 h-1.5 text-success" />
                        <span className="text-[4px] text-success font-bold">.action-btn</span>
                      </div>
                      <div className="absolute bottom-0.5 right-0.5 text-[4px] bg-success/80 text-white px-1 py-0.5 rounded font-mono">
                        91% conf
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[5px] font-bold text-success bg-background/95 px-1 border border-success/30 rounded uppercase tracking-tighter flex items-center gap-0.5">
                        <Sparkles className="w-1" /> FIXED
                      </span>
                    </div>
                  </div>
                </div>

                {approvalsStatus[item.id] === "approved" ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-success/10 border border-success/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span className="text-[10px] font-bold text-success uppercase tracking-widest">Update Synced</span>
                    </div>

                    {/* Test Re-Execution Result Section */}
                    <div className="space-y-2 p-2 rounded-lg bg-success/5 border border-success/30">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-success uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Test Re-Executed
                      </div>
                      <div className="space-y-1 text-[8px]">
                        <p><span className="text-muted-foreground">Test:</span> <span className="text-foreground font-mono">{item.suite} &gt; {item.element}</span></p>
                        <p><span className="text-muted-foreground">Status:</span> <span className="text-success font-bold">PASSED</span> (was FAILED)</p>
                        <p><span className="text-muted-foreground">Selector:</span> <span className="text-primary font-mono">{item.newSelector || '.action-submit-v2'}</span></p>
                        <p><span className="text-muted-foreground">Duration:</span> <span className="text-foreground font-mono">2.3s</span></p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowDiffId(showDiffId === item.id ? null : item.id)}
                      className="w-full py-1 rounded bg-primary/10 text-primary text-[9px] font-bold border border-primary/20 flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
                    >
                      <Terminal className="w-2.5 h-2.5" /> {showDiffId === item.id ? "Hide" : "View"} Verbose Diff
                    </button>
                    {showDiffId === item.id && (
                      <div className="mt-2 bg-black/90 p-2 rounded-lg font-mono text-[7px] leading-relaxed border border-white/10 shadow-lg animate-in zoom-in-95 space-y-1">
                        <div className="text-secondary opacity-80 border-b border-white/5 pb-1 flex justify-between">
                          <span>{item.fileSought || 'login.spec.ts'}</span>
                          <span className="text-primary font-bold">{item.lineSought || 'L142'}</span>
                        </div>

                        <div className="text-muted-foreground italic mb-1">OLD (Failed 12 of 47 runs):</div>
                        <div className="bg-destructive/20 text-destructive/80 line-through px-1 rounded">
                          {'- await page.click(\'' + item.element + '\');'}
                        </div>
                        <div className="text-muted-foreground text-[6px] mt-0.5">Problem: Old selector was removed in UI v2.3.1 refactor</div>

                        <div className="text-muted-foreground italic mb-1 mt-2">NEW (Fixed 47 of 47 runs):</div>
                        <div className="bg-success/20 text-success px-1 rounded">
                          {'+ await page.click(\'' + (item.newSelector || '.action-submit-v2') + '\');'}
                        </div>
                        <div className="text-muted-foreground text-[6px] mt-0.5">Reason: New selector is 4+ versions stable, used in 8+ similar tests</div>

                        <div className="border-t border-white/5 mt-1 pt-1 text-primary">
                          <span>✓ Zero regressions detected</span> • <span className="text-success">Reliability: Verified</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(item.id)} className="flex-1 py-1.5 rounded-lg bg-success text-success-foreground hover:bg-success/90 text-[10px] font-bold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.95]">
                      <Check className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => handleReject(item.id)} className="flex-1 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-bold border border-destructive/20 transition-all flex items-center justify-center gap-1 active:scale-[0.95]">
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {shadowApprovals.filter(s => !approvalsStatus[s.id] || approvalsStatus[s.id] === "pending").length > 0 && (
              <button
                onClick={() => setShowAllShadow(true)}
                className="col-span-full py-2 text-[10px] text-muted-foreground hover:text-foreground text-center border-t border-border/50 border-dashed mt-2 active:scale-95 transition-transform"
              >
                View All {shadowApprovals.filter(s => !approvalsStatus[s.id] || approvalsStatus[s.id] === "pending").length} Pending
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3">
        <select value={filterInference} onChange={e => setFilterInference(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted/30 text-foreground text-xs border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Inferences</option>
          <option value="UI Refactor">UI Refactor</option>
          <option value="Copy Update">Copy Update</option>
          <option value="Functional Gap">Functional Gap</option>
          <option value="System Bug">System Bug</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted/30 text-foreground text-xs border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Defect">Defect</option>
          <option value="Rejected">Rejected</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} events</span>
      </div>

      <DataTable data={filtered} columns={columns} />

      {/* Winnie Reasoning Drawer (Section 5.3: Explainability) */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60]"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg glass-strong z-[70] flex flex-col border-l border-primary/20 shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50 bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 relative group">
                    <Bot className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
                      Winnie Analysis
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-tighter">Confidence: {selectedEvent.confidence}%</span>
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">{selectedEvent.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-2.5 rounded-xl hover:bg-muted/50 text-muted-foreground transition-all border border-transparent hover:border-border/50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                {/* Reasoning Block */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/80 uppercase tracking-widest">
                    <Activity className="w-3.5 h-3.5 text-primary" /> Executive Reasoning
                  </div>
                  <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 font-mono text-xs leading-relaxed text-foreground shadow-inner">
                    <span className="text-primary mr-2">{"//"} Winnie Intelligence Trace:</span>
                    "I am <span className="text-primary font-bold underline decoration-primary/30">{selectedEvent.confidence}% certain</span> this is a <span className="bg-primary/10 px-1 rounded">{selectedEvent.inference}</span>.
                    The historical failure for <code className="text-[10px] bg-background px-1 rounded">{selectedEvent.elementSought}</code> occurred due to a DOM refactor.
                    By analyzing the functional intent and spatial relationship of adjacent elements (computer vision 8.1),
                    I mapped the intent to the new healed selector with <span className="text-success font-bold">High Precision</span>.
                    The proposed action (<span className="text-primary italic">{selectedEvent.action}</span>) was verified via Shadow Mode."
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Intent Matching</label>
                    <div className="text-lg font-mono font-bold text-foreground">98.2%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Visual Drift</label>
                    <div className="text-lg font-mono font-bold text-foreground">{'<'} 2.1mm</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Selector Stability</label>
                    <div className="text-lg font-mono font-bold text-foreground">Reliable</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Impact Score</label>
                    <div className="text-lg font-mono font-bold text-success flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> High
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="p-4 rounded-xl bg-sidebar/50 border border-primary/20 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                      <Cpu className="w-3.5 h-3.5" /> Model Fine-Tuning Status
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      This event has been flagged for reinforcement learning. The success of this healing action has increased the weight of the <span className="text-foreground">semantic-matching-v4</span> transformer for similar UI components.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border/50 bg-background/40">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Acknowledge Reasoning
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAllShadow && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowAllShadow(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] glass-strong rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-warning/20 bg-warning/5"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-warning" /> Shadow Mode: Pending Approvals
                  </h2>
                  <p className="text-xs text-muted-foreground">Review and merge AI-suggested selector updates into the repository</p>
                </div>
                <button onClick={() => setShowAllShadow(false)} className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 scrollbar-thin">
                <DataTable
                  data={shadowApprovals}
                  columns={[
                    { key: "id", label: "ID", render: (r: any) => <span className="font-mono text-primary text-[10px]">{r.id}</span> },
                    { key: "suite", label: "Suite", sortable: true },
                    { key: "element", label: "Selector", render: (r: any) => <code className="text-[10px] bg-muted/40 px-1 rounded truncate max-w-[150px] inline-block font-mono">{r.element}</code> },
                    { key: "confidence", label: "Conf.", sortable: true, render: (r: any) => <span className="font-mono text-[10px]">{r.confidence}%</span> },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (r: any) => approvalsStatus[r.id] && approvalsStatus[r.id] !== "pending" ? (
                        <div className={`flex items-center gap-1.5 font-bold text-[10px] uppercase ${approvalsStatus[r.id] === "approved" ? "text-success" : "text-destructive"}`}>
                          {approvalsStatus[r.id] === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {approvalsStatus[r.id] === "approved" ? "Synced" : "Rejected"}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="px-2 py-1 rounded bg-success text-success-foreground text-[10px] font-bold hover:bg-success/90 transition-all"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="px-2 py-1 rounded bg-destructive/10 text-destructive text-[10px] font-bold border border-destructive/20 hover:bg-destructive/20 transition-all"
                          >
                            REJECT
                          </button>
                        </div>
                      )
                    }
                  ]}
                />
              </div>

              <div className="p-4 border-t border-border/50 bg-background/40 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                  <Target className="w-3 h-3 text-primary" />
                  <span>Audit Mode: Running AI Selector Verification</span>
                </div>
                <button
                  onClick={handleBulkApprove}
                  disabled={shadowApprovals.filter((s: any) => !approvalsStatus[s.id] || approvalsStatus[s.id] === 'pending').length === 0}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Bulk Approve All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
