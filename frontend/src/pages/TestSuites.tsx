import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, ShieldAlert, Zap, XCircle, Play, CheckSquare, Square, Bot, TrendingDown, Target } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { NLTestGenerator } from "@/components/ai/NLTestGenerator";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useChatContext } from "@/context/ChatContext";
import { useEffect } from "react";

export interface TestSuite {
  id: string;
  name: string;
  module: string;
  type: string;
  totalCases: number;
  passed: number;
  failed: number;
  flaky: number;
  lastRun: string;
  status: string;
  aiHealed: number;
  runHistory: boolean[];
}

export default function TestSuites() {
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);
  const [filterModule, setFilterModule] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFlakyOnly, setShowFlakyOnly] = useState(false);
  const [showAIHealed, setShowAIHealed] = useState(false);
  const [isSmartView, setIsSmartView] = useState(false);
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);

  const { data: testSuitesData, isLoading, isError } = useQuery({
    queryKey: ["testSuites"],
    queryFn: async () => {
      const json = await apiClient("/api/test-suites");
      return (json.items || []) as TestSuite[];
    }
  });

  const { setContextData } = useChatContext();

  useEffect(() => {
    if (testSuitesData) {
      setContextData({
        page: "Test Suite Manager",
        totalSuites: testSuitesData.length,
        summary: testSuitesData.map(s => ({
          name: s.name,
          status: s.status,
          failRate: `${((s.failed / s.totalCases) * 100).toFixed(1)}%`,
          healed: s.aiHealed
        }))
      });
    }
  }, [testSuitesData, setContextData]);

  const testSuites = testSuitesData || [];

  const handleSmartRegression = () => {
    navigate("/regression-analysis?pr=PR%20%234482");
  };

  const handleParallelHealing = () => {
    if (selectedSuites.length === 0) return;
    const triggerJob = async () => {
      return apiClient("/api/jobs/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType: "Parallel Healing", scenario: `${selectedSuites.length} suites` })
      });
    };

    toast.promise(
      triggerJob(),
      {
        loading: `Initializing Parallel Healing Engine for ${selectedSuites.length} suites...`,
        success: () => {
          setSelectedSuites([]);
          return `Parallel Session Complete: ${selectedSuites.length} suites healed and validated across 8 concurrent nodes.`;
        },
        error: "Parallel execution failed."
      }
    );
  };

  const toggleSuite = (id: string) => {
    setSelectedSuites(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSmartSelect = () => {
    // Select suites with high risk (e.g., status is Failed or Degraded, or has high flaky count)
    const highRisk = filtered.filter(s => s.status === "Failed" || s.status === "Degraded" || s.flaky > 2).map(s => s.id);
    setSelectedSuites(highRisk);
    toast.success(`Smart Select: Identified ${highRisk.length} suites with high risk factors (stability/failure issues).`, {
      icon: <Target className="w-4 h-4 text-primary" />
    });
  };

  const handleReview = (suiteId: string, count: number) => {
    toast.message(`Human-in-the-Loop: Reviewing ${count} pending updates for ${suiteId}`, {
      description: "AI suggesting change from #submit-btn (deprecated) to .action-submit-v2.",
      action: {
        label: "Approve Shadow-Merge",
        onClick: () => toast.success(`Selector updates permanently merged for ${suiteId}!`, { icon: <CheckCircle2 className="w-4 h-4 text-success" /> })
      },
      cancel: {
        label: "Reject Change",
        onClick: () => toast.error(`Self-healing rejected. Trace sent back to agent.`, { icon: <ShieldAlert className="w-4 h-4 text-destructive" /> })
      },
      duration: 6000,
    });
  };

  const modules = ["All", ...new Set(testSuites.map(s => s.module))];
  const types = ["All", ...new Set(testSuites.map(s => s.type))];

  const filtered = testSuites.filter(s => {
    if (isSmartView) {
      // Dynamic priority: show 5 most problematic suites instead of hardcoded IDs
      const problematicIds = [...testSuites]
        .sort((a, b) => (b.failed + b.flaky) - (a.failed + a.flaky))
        .slice(0, 5)
        .map(s => s.id);
      return problematicIds.includes(s.id);
    }
    if (filterModule !== "All" && s.module !== filterModule) return false;
    if (filterType !== "All" && s.type !== filterType) return false;
    if (filterStatus !== "All" && s.status !== filterStatus) return false;
    if (showFlakyOnly && s.flaky === 0) return false;
    if (showAIHealed && s.aiHealed === 0) return false;
    return true;
  });

  const columns: Column<TestSuite>[] = [
    {
      key: "select",
      label: "",
      render: r => (
        <label onClick={e => e.stopPropagation()} className="cursor-pointer">
          <input
            type="checkbox"
            checked={selectedSuites.includes(r.id)}
            onChange={() => toggleSuite(r.id)}
            className="w-3.5 h-3.5 rounded border-border bg-muted/30 accent-primary"
          />
        </label>
      )
    },
    { key: "id", label: "ID", sortable: true },
    {
      key: "name",
      label: "Suite Name",
      sortable: true,
      render: r => (
        <div className="flex items-center gap-2">
          {r.type === "Agent-on-Agent" && (
            <div className="p-1 rounded bg-primary/10" title="Agent-on-Agent AI Test">
              <Bot className="w-3 h-3 text-primary" />
            </div>
          )}
          <span className="font-medium text-foreground">{r.name}</span>
        </div>
      )
    },
    { key: "module", label: "Module", sortable: true },
    { key: "type", label: "Type" },
    { key: "totalCases", label: "Total", sortable: true, render: r => <span className="font-mono">{r.totalCases.toLocaleString()}</span> },
    { key: "passed", label: "Pass", render: r => <span className="text-success">{r.passed.toLocaleString()}</span> },
    { key: "failed", label: "Fail", render: r => <span className={r.failed > 0 ? "text-destructive" : ""}>{r.failed}</span> },
    { key: "flaky", label: "Flaky", render: r => <span className={r.flaky > 0 ? "text-warning" : ""}>{r.flaky}</span> },
    { key: "lastRun", label: "Last Run" },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
    {
      key: "aiHealed",
      label: "AI-Healed",
      sortable: true,
      render: r => r.aiHealed > 0 ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/self-healing?suite=${r.id}`)}
            className="text-primary font-bold text-xs hover:underline cursor-pointer"
          >
            {r.aiHealed}
          </button>
          <button
            onClick={() => navigate(`/self-healing?suite=${r.id}`)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold border border-primary/30 hover:bg-primary/30 transition-all uppercase tracking-tighter animate-pulse"
          >
            Review
          </button>
        </div>
      ) : <span className="text-muted-foreground/30 font-mono text-xs">0</span>
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-destructive font-medium">Failed to load test suites.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Test Suite Manager" subtitle={isSmartView ? "Targeted Regression Suite (AI Prioritized)" : `${testSuites.length} test suites across all modules`}>
        <div className="flex items-center gap-3">
          {!isSmartView ? (
            <button
              onClick={handleSmartRegression}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-all text-sm font-semibold border border-primary/20 hover:glow-cyan"
            >
              <Zap className="w-4 h-4 text-primary fill-primary/20" /> Run Smart Regression
            </button>
          ) : (
            <button
              onClick={() => setIsSmartView(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-all text-sm font-semibold border border-border"
            >
              <XCircle className="w-4 h-4" /> Reset to Global View
            </button>
          )}
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> New Suite
          </button>
        </div>
      </PageHeader>

      {/* Filters & Bulk Actions */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3">
        {selectedSuites.length > 0 ? (
          <div className="flex items-center gap-3 bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-left-2 transition-all">
            <span className="text-[10px] font-bold text-primary uppercase">{selectedSuites.length} Selected</span>
            <div className="h-4 w-px bg-primary/20" />
            <button
              onClick={handleParallelHealing}
              className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80"
            >
              <Play className="w-3 h-3 fill-current" /> Run Parallel Healing Session
            </button>
            <button
              onClick={() => setSelectedSuites([])}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSelectedSuites(filtered.map(s => s.id))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border/50"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Select All
          </button>
        )}

        {selectedSuites.length === 0 && (
          <button
            onClick={handleSmartSelect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-[10px] font-bold text-primary hover:bg-primary/10 border border-primary/20 transition-all ml-1"
          >
            <Target className="w-3.5 h-3.5" /> Smart Select (High Risk)
          </button>
        )}

        <div className="h-4 w-px bg-border/50 mx-1" />

        <select value={filterModule} onChange={e => setFilterModule(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted/30 text-foreground text-xs border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted/30 text-foreground text-xs border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted/30 text-foreground text-xs border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Status</option>
          <option value="Passed">Passed</option>
          <option value="Degraded">Degraded</option>
          <option value="Failed">Failed</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showFlakyOnly} onChange={e => setShowFlakyOnly(e.target.checked)} className="rounded accent-primary" />
          Flaky only
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showAIHealed} onChange={e => setShowAIHealed(e.target.checked)} className="rounded accent-primary" />
          AI-Healed only
        </label>
        <span className="ml-auto text-xs text-muted-foreground">{isSmartView ? "Showing 5 Impacted Suites" : `${filtered.length} suites`}</span>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        expandable={(row) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-muted/10 p-4 rounded-xl border border-border/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stability Run History</span>
                <span className="text-[10px] text-muted-foreground">Last 5 Cycles</span>
              </div>
              <div className="flex items-center gap-2">
                {row.runHistory.map((pass: boolean, i: number) => (
                  <div key={i} className={`w-5 h-5 rounded-full border-2 ${pass ? "bg-success/20 border-success shadow-lg shadow-success/20" : "bg-destructive/20 border-destructive shadow-lg shadow-destructive/20"}`} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Confidence Sparkline</span>
                <div className="flex items-center gap-1 text-[10px] text-destructive">
                  <TrendingDown className="w-3 h-3" />
                  <span>Selector Drift Detected</span>
                </div>
              </div>
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({ length: 12 }, (_, i) => ({ v: 98 - (i * 1.8) + Math.cos(i) * 3 }))}>
                    <defs>
                      <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="hsl(262, 83%, 58%)" fill="url(#confidenceGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      />

      {/* NL Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setShowGenerator(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Generate Test Suite with AI</h2>
            <NLTestGenerator />
            <button onClick={() => setShowGenerator(false)} className="mt-4 text-xs text-muted-foreground hover:text-foreground">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
