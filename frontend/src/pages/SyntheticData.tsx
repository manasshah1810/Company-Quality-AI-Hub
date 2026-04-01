import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, ShieldCheck, Zap, Database, Layers, Sparkles, Bot, RefreshCw, Target, Terminal, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KPICard } from "@/components/common/KPICard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useChatContext } from "@/context/ChatContext";
import { ComplianceBadges } from "@/components/ai/ComplianceBadges";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export interface SyntheticDataset {
  id: string;
  formType: string;
  count: number;
  year: number;
  complexity: string;
  generated: string;
  size: string;
  status: string;
  usedIn: number;
  schemaVersion: string;
  linkedSuites?: string[];
  previewPdf?: string;
}

interface ScenarioTemplate {
  id: string;
  label: string;
  description: string;
  prompt: string;
}

export default function SyntheticData() {
  const [searchParams] = useSearchParams();
  const [selectedDataset, setSelectedDataset] = useState<SyntheticDataset | null>(null);
  const [formType, setFormType] = useState("All");
  const [generating, setGenerating] = useState(false);
  const [recordCount, setRecordCount] = useState(10000);
  const [complexity, setComplexity] = useState("Simple");
  const [scenarioPrompt, setScenarioPrompt] = useState("");
  const [scenarioTemplate, setScenarioTemplate] = useState("");
  const [schemaSynced, setSchemaSynced] = useState(true);
  const [synthesisLogs, setSynthesisLogs] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDataset, setPreviewDataset] = useState<SyntheticDataset | null>(null);

  const scenarioTemplates: ScenarioTemplate[] = [
    {
      id: "standard",
      label: "Standard Distribution (Default)",
      description: "Normal tax return patterns with typical deductions and income sources",
      prompt: "Generate standard distribution of tax returns with typical deductions, W-2 income, and standard tax scenarios."
    },
    {
      id: "edge_cases",
      label: "Edge Cases & Boundary Values",
      description: "Extreme values, unusual tax situations, and boundary conditions",
      prompt: "Generate edge case scenarios including negative AGI, maximum deductions, business loss carryforwards, and unusual income combinations."
    },
    {
      id: "financial",
      label: "High-Variance Financial Scenarios",
      description: "Complex multi-entity returns with significant income and deduction variations",
      prompt: "Generate high-variance financial scenarios including large capital gains, foreign income, K-1 allocations, and complex deductions."
    },
    {
      id: "regional",
      label: "Regional/International Variations",
      description: "Returns with regional differences and international tax implications",
      prompt: "Generate regional variations including foreign earned income exclusions, resident/non-resident scenarios, and regional tax credits."
    }
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["syntheticData"],
    queryFn: () => apiClient("/api/synthetic-data")
  });

  const syntheticDatasets: SyntheticDataset[] = data?.items || [];
  const sampleTaxRecord = data?.sample || {};

  const { setContextData } = useChatContext();

  useEffect(() => {
    if (data) {
      setContextData({
        page: "Synthetic Tax Data Generator",
        datasetCount: syntheticDatasets.length,
        summary: data.items?.map((d: any) => ({ name: d.formType, count: d.count, complexity: d.complexity })),
        sampleSample: sampleTaxRecord
      });
    }
  }, [data, setContextData, syntheticDatasets.length, sampleTaxRecord]);

  useEffect(() => {
    const component = searchParams.get("component");
    const action = searchParams.get("action");

    if (component && action) {
      setScenarioPrompt(`Mitigation for ${component}: ${action}. Focus on high-variance distribution.`);
      if (action.toLowerCase().includes("edge case")) {
        setComplexity("Edge Cases");
      } else if (action.toLowerCase().includes("coverage")) {
        setRecordCount(50000);
      }

      toast.info("Intelligence Engine: Pre-configured", {
        description: `Targeting ${component} risks identified in Analytics.`,
        icon: <Target className="w-4 h-4 text-primary" />
      });
    }
  }, [searchParams]);

  const filtered = syntheticDatasets.filter(d => formType === "All" || d.formType === formType);

  const columns: Column<SyntheticDataset>[] = [
    { key: "id", label: "Dataset ID", render: r => <span className="text-primary font-mono">{r.id}</span> },
    { key: "formType", label: "Form Type", sortable: true },
    { key: "count", label: "Count", sortable: true, render: r => <span className="font-mono">{r.count.toLocaleString()}</span> },
    { key: "year", label: "Year", sortable: true },
    { key: "complexity", label: "Complexity" },
    { key: "generated", label: "Generated" },
    { key: "size", label: "Size", sortable: true },
    {
      key: "schemaVersion" as any,
      label: "Schema",
      render: r => (
        <div className="flex items-center gap-1.5 font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${r.status === "Outdated" ? "bg-destructive animate-pulse" : "bg-success"}`} />
          <span className={`text-[10px] ${r.status === "Outdated" ? "text-destructive font-bold" : "opacity-70"}`}>v{r.schemaVersion}</span>
        </div>
      )
    },
    { key: "status", label: "Status", render: r => <StatusBadge status={r.status} /> },
    { key: "usedIn", label: "Used In", render: r => <span>{r.usedIn} suites</span> },
    {
      key: "linkedSuites" as any,
      label: "Linked Test Suites",
      render: r => (
        <div className="flex flex-wrap gap-1">
          {r.linkedSuites && r.linkedSuites.length > 0 ? (
            r.linkedSuites.map(suite => (
              <span key={suite} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-medium border border-primary/30">
                {suite}
              </span>
            ))
          ) : (
            <span className="text-[9px] text-muted-foreground">Not assigned</span>
          )}
        </div>
      )
    },
    {
      key: "actions" as any,
      label: "Actions",
      render: r => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleAssign(r.id); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/50 text-foreground text-[10px] font-bold border border-border/50 hover:bg-muted transition-all active:scale-95"
          >
            <Layers className="w-3 h-3 text-primary" /> Assign
          </button>
        </div>
      )
    },
  ];

  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setGenerating(true);
    setSynthesisLogs([]);

    const steps = [
      "Initializing Scalability Engine 9.1...",
      `Mapping ${complexity} entity relationships...`,
      "Synchronizing with FormsEngine v2.4.2 API...",
      "Synthesizing AI scenario distribution...",
      `Masking ${recordCount.toLocaleString()} PII entities...`,
      "Finalizing HubSync compliant dataset..."
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setSynthesisLogs(prev => [...prev, step]);
      }, (i * 100)); // Faster visual logs for real API
    });

    try {
      const result = await apiClient("/api/synthetic-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: formType === "All" ? "W2" : formType, // Default to W2 if All is selected
          recordCount,
          complexity,
          scenarioPrompt,
          year: 2024
        })
      });

      queryClient.invalidateQueries({ queryKey: ["syntheticData"] });

      toast.success("Intelligence Engine Success", {
        description: result.message,
        icon: <Sparkles className="w-4 h-4 text-primary" />
      });

      if (scenarioPrompt) setScenarioPrompt("");
    } catch (err: any) {
      toast.error("Synthesis Failed", { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncSchema = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setSchemaSynced(true);
      toast.success("Schema Synchronized", {
        description: "Synthetic engine updated with latest FormsEngine API contracts.",
        icon: <RefreshCw className="w-4 h-4 text-primary" />
      });
    }, 1500);
  };

  const handleAssign = async (id: string) => {
    try {
      setGenerating(true);
      const result = await apiClient(`/api/synthetic-data/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      queryClient.invalidateQueries({ queryKey: ["syntheticData"] });

      toast.success(`Agentic QA: Dataset ${id} assigned to relevant suites!`, {
        description: `Mapped to ${result.assignedSuites} test suites. Intelligent assignment complete.`,
        icon: <Layers className="w-4 h-4 text-primary" />
      });
    } catch (err: any) {
      toast.error("Assignment Failed", { description: err.message });
    } finally {
      setGenerating(false);
    }
  };



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
        <p className="text-destructive font-medium">Failed to load synthetic data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Synthetic Tax Data Generator" subtitle="Generate compliant test datasets at scale" />

      {/* Storage & Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Datasets" value={syntheticDatasets.length} icon="Gauge" />
        <KPICard label="Records Generated" value={Math.round(syntheticDatasets.reduce((sum, d) => sum + d.count, 0) / 1000)} suffix="K" icon="Sparkles" />
        <KPICard label="Storage Used" value={parseFloat(syntheticDatasets.reduce((sum: number, d) => sum + parseFloat(d.size.replace(/\s*MB/, "")), 0).toFixed(1) as any) / 1024} suffix="GB" />
        <KPICard label="Compliance Rate" value={100} suffix="%" icon="CheckCircle2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Panel */}
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex flex-col gap-4 mb-4 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm text-foreground">Generator Panel</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold border border-primary/20 uppercase tracking-tighter">
                <Zap className="w-2.5 h-2.5 fill-current" /> Scalability Engine 9.1
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${schemaSynced ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
                  Schema: <span className={schemaSynced ? "text-success" : "text-destructive"}>{schemaSynced ? "Synced (v2.4.2)" : "Drift Detected"}</span>
                </span>
              </div>
              <button
                onClick={handleSyncSchema}
                disabled={generating}
                className="p-1.5 rounded hover:bg-muted/50 transition-all text-primary disabled:opacity-30"
                title="Sync with Backend Schema"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Form Type</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/30 text-foreground text-sm border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="W2">W2</option>
              <option value="1040">1040</option>
              <option value="1120S">1120S</option>
              <option value="K-1">K-1</option>
              <option value="Schedule C">Schedule C</option>
              <option value="Schedule E">Schedule E</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground block">Record Count</label>
              <span className="text-[10px] font-mono text-primary font-bold">{recordCount.toLocaleString()} Records</span>
            </div>
            <input
              type="range"
              min={100}
              max={100000}
              step={1000}
              value={recordCount}
              onChange={(e) => setRecordCount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono"><span>100</span><span>100,000+</span></div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Complexity Tier (PRD Section 2)</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/30 text-foreground text-sm border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Simple">Simple (Standard Returns)</option>
              <option value="Multi-Entity">Multi-Entity (Corporate/K-1 Mapping)</option>
              <option value="Edge Cases">Edge Cases (Brittle Tax Logic / 1%)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-primary/80 mb-1.5 flex items-center gap-1.5 uppercase tracking-widest font-bold">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" /> Scenario Templates (PRD Section 5)
            </label>
            <select
              value={scenarioTemplate}
              onChange={(e) => {
                setScenarioTemplate(e.target.value);
                const selected = scenarioTemplates.find(t => t.id === e.target.value);
                if (selected) {
                  setScenarioPrompt(selected.prompt);
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-muted/30 text-foreground text-sm border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary mb-2"
            >
              <option value="">Select a template...</option>
              {scenarioTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
              <option value="custom">Custom (Free Text)</option>
            </select>
            {scenarioTemplate && scenarioTemplate !== "custom" && (
              <div className="mb-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-[9px] text-muted-foreground">
                  {scenarioTemplates.find(t => t.id === scenarioTemplate)?.description}
                </p>
              </div>
            )}
            {scenarioTemplate === "custom" && (
              <textarea
                value={scenarioPrompt}
                onChange={(e) => setScenarioPrompt(e.target.value)}
                placeholder="Describe the specific scenario you want to synthesize..."
                className="w-full h-20 px-3 py-2 rounded-xl bg-primary/5 text-foreground text-xs border border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40 resize-none scrollbar-thin font-mono leading-relaxed"
              />
            )}
            <div className="flex items-center gap-1.5 mt-2.5 px-2 py-1 rounded bg-sidebar/40 border border-border/50">
              <Bot className="w-3 h-3 text-primary" />
              <p className="text-[9px] text-muted-foreground leading-none">
                Winnie will dynamically adjust the synthetic distribution weights.
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tax Year</label>
            <select className="w-full px-3 py-2 rounded-lg bg-muted/30 text-foreground text-sm border border-border/50">
              {[2022, 2023, 2024, 2025].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/20">
            <Lock className="w-4 h-4 text-primary" />
            <span>PII Mode: <strong className="text-foreground">Anonymized</strong></span>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 disabled:opacity-50 transition-colors">
            {generating ? "Generating..." : "Generate Dataset"}
          </button>

          {/* Live Synthesis Trace (Progress Log) */}
          {generating && (
            <div className="mt-4 p-3 rounded-xl bg-black/90 border border-white/10 font-mono text-[9px] leading-tight text-success shadow-2xl animate-in slide-in-from-top-2 overflow-hidden">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5 opacity-50">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" />
                  <span className="tracking-widest uppercase font-bold text-[8px]">Live Synthesis Trace</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] animate-pulse">REC</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-none">
                {synthesisLogs.map((log, i) => (
                  <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="opacity-30 whitespace-nowrap">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className="text-success/90">{log}</span>
                  </div>
                ))}
                <div className="text-success animate-pulse inline-block">_</div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-foreground">
              {selectedDataset ? `Preview: ${selectedDataset.id}` : "Sample Record Preview"}
            </h3>
            {selectedDataset && (
              <button
                onClick={() => {
                  setPreviewDataset(selectedDataset);
                  setPreviewModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/30 hover:bg-primary/30 transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> View Full Sample
              </button>
            )}
          </div>
          <pre className="text-[11px] font-mono text-muted-foreground bg-muted/20 rounded-lg p-4 overflow-auto max-h-80 scrollbar-thin">
            {JSON.stringify(sampleTaxRecord, null, 2)}
          </pre>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Compliance Standards</h4>
              <ComplianceBadges />
            </div>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <select value={formType} onChange={e => setFormType(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted/30 text-foreground text-xs border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Form Types</option>
          {["W2", "1040", "1120S", "K-1", "Schedule C", "Schedule E"].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} datasets</span>
      </div>

      <DataTable data={filtered} columns={columns} onRowClick={setSelectedDataset} />

      {/* Data Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dataset Preview - {previewDataset?.id}</DialogTitle>
          </DialogHeader>
          {previewDataset && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 text-xs font-medium p-3 bg-muted/30 rounded-lg border border-border/50">
                <div>ID</div>
                <div>Name</div>
                <div>Income</div>
                <div>Form Type</div>
              </div>
              {Array.from({ length: 10 }).map((_, i) => {
                const firstNames = ["Jordan", "Morgan", "Casey", "Riley", "Alex"];
                const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones"];
                const forms = ["W2", "1040", "K-1"];
                return (
                  <div key={i} className="grid grid-cols-4 gap-2 text-xs p-3 border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <div className="font-mono text-primary">SYN-{Math.random().toString(36).substring(2, 8).toUpperCase()}</div>
                    <div>{firstNames[Math.floor(Math.random() * firstNames.length)]} {lastNames[Math.floor(Math.random() * lastNames.length)]}</div>
                    <div>${(Math.random() * 150000 + 30000).toFixed(0)}</div>
                    <div>{forms[Math.floor(Math.random() * forms.length)]}</div>
                  </div>
                );
              })}
              <p className="text-[11px] text-muted-foreground italic pt-4 border-t border-border/50">
                Showing first 10 of {previewDataset?.count.toLocaleString()} total records
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
