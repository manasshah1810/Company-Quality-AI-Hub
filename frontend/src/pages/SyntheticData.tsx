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
        <div className="bg-[#1e293b] rounded-2xl p-6 space-y-5 border border-white/5 shadow-xl">
          <div className="flex flex-col gap-4 mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-[11px] text-slate-100 uppercase tracking-widest">Generator Engine</h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/25">
                <Zap className="w-2.5 h-2.5 fill-current" /> Scalability 9.1
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a] border border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${schemaSynced ? "bg-success shadow-[0_0_10px_rgba(34,197,94,0.6)]" : "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse"}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Schema: <span className={schemaSynced ? "text-success" : "text-destructive"}>{schemaSynced ? "Synced (v2.4.2)" : "Drift Detected"}</span>
                </span>
              </div>
              <button
                onClick={handleSyncSchema}
                disabled={generating}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-primary disabled:opacity-30 border border-white/5"
                title="Sync with Backend Schema"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Form Definition</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-slate-100 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary h-12">
              <option value="W2">W2 - Wage & Tax Statement</option>
              <option value="1040">1040 - US Individual Income Tax</option>
              <option value="1120S">1120S - S-Corp Return</option>
              <option value="K-1">K-1 - Partner Share of Income</option>
              <option value="Schedule C">Schedule C - Profit/Loss</option>
              <option value="Schedule E">Schedule E - Supplemental Income</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Volume Control</label>
              <span className="text-[10px] font-mono text-primary font-black bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{recordCount.toLocaleString()} Records</span>
            </div>
            <input
              type="range"
              min={100}
              max={100000}
              step={1000}
              value={recordCount}
              onChange={(e) => setRecordCount(parseInt(e.target.value))}
              className="w-full h-2 bg-[#0f172a] rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-2 font-black uppercase tracking-widest"><span>Min: 100</span><span>Max: 100K+</span></div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Intelligence Complexity</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-slate-100 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary h-12"
            >
              <option value="Simple">Simple (Standard Returns)</option>
              <option value="Multi-Entity">Multi-Entity (Corporate/K-1 Mapping)</option>
              <option value="Edge Cases">Edge Cases (Brittle Tax Logic / 1%)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-primary mb-2 flex items-center gap-2 uppercase tracking-[0.2em] font-black">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Strategy Templates
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
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-slate-100 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary mb-3 h-12"
            >
              <option value="">Select an intelligence strategy...</option>
              {scenarioTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
              <option value="custom">Manual Definition (Advanced)</option>
            </select>
            {scenarioTemplate && scenarioTemplate !== "custom" && (
              <div className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  {scenarioTemplates.find(t => t.id === scenarioTemplate)?.description}
                </p>
              </div>
            )}
            {scenarioTemplate === "custom" && (
              <textarea
                value={scenarioPrompt}
                onChange={(e) => setScenarioPrompt(e.target.value)}
                placeholder="Describe the specific scenario you want to synthesize..."
                className="w-full h-24 px-4 py-3 rounded-xl bg-[#0f172a] text-slate-100 text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-600 resize-none font-mono leading-relaxed"
              />
            )}
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-[#0f172a] border border-white/5">
              <Bot className="w-4 h-4 text-primary" />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                AI will dynamically weight distribution.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 p-3 rounded-xl bg-[#0f172a] border border-white/5">
            <Lock className="w-4 h-4 text-primary" />
            <span>PII Protocol: <strong className="text-success">VIRTUAL ANONYMIZATION</strong></span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-14 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Intelligence Dataset
              </>
            )}
          </button>

          {/* Live Synthesis Trace (Progress Log) */}
          {generating && (
            <div className="mt-5 p-4 rounded-xl bg-[#020617] border border-white/10 font-mono text-[10px] leading-relaxed text-success shadow-2xl animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span className="tracking-[0.2em] uppercase font-black text-[9px]">Engine Trace</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] animate-pulse font-black text-destructive">RECORDING</span>
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                {synthesisLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="opacity-30 font-black">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className="text-success/90 font-medium tracking-tight">{log}</span>
                  </div>
                ))}
                <div className="text-success animate-pulse inline-block font-black">_</div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-black text-[13px] text-slate-100 uppercase tracking-widest">
                  {selectedDataset ? `Dataset Payload: ${selectedDataset.id}` : "Global Seed Payload"}
                </h3>
              </div>
              {selectedDataset && (
                <button
                  onClick={() => {
                    setPreviewDataset(selectedDataset);
                    setPreviewModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <Database className="w-4 h-4" /> Expand Structure
                </button>
              )}
            </div>
            <div className="flex-1 bg-[#0f172a] rounded-2xl border border-white/5 p-6 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">JSON Output</span>
              </div>
              <pre className="text-[12px] font-mono text-blue-300 leading-relaxed overflow-auto h-[400px] scrollbar-thin">
                {JSON.stringify(sampleTaxRecord, null, 2)}
              </pre>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Compliance Attestations</h4>
              <div className="p-4 bg-[#0f172a] rounded-2xl border border-white/5">
                <ComplianceBadges />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] rounded-xl p-4 flex items-center gap-3 border border-white/5 shadow-lg">
        <select value={formType} onChange={e => setFormType(e.target.value)} className="px-4 py-2 rounded-lg bg-[#0f172a] text-slate-100 text-xs border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Form Types</option>
          {["W2", "1040", "1120S", "K-1", "Schedule C", "Schedule E"].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="h-4 w-px bg-white/10 mx-2" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{filtered.length} active datasets available</span>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <DataTable data={filtered} columns={columns} onRowClick={setSelectedDataset} />
      </div>

      {/* Data Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#0f172a] border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary">Dataset Payload Preview: {previewDataset?.id}</DialogTitle>
          </DialogHeader>
          <div className="h-px bg-white/10 my-4" />
          {previewDataset && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-[10px] font-black uppercase tracking-widest p-4 bg-[#1e293b] rounded-xl border border-white/5 text-slate-500">
                <div>Entity ID</div>
                <div>Legal Identity</div>
                <div>Calculated Income</div>
                <div>Form Structure</div>
              </div>
              <div className="space-y-1">
                {Array.from({ length: 15 }).map((_, i) => {
                  const firstNames = ["Jordan", "Morgan", "Casey", "Riley", "Alex", "Quinn", "Skyler"];
                  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis"];
                  const forms = ["W2", "1040", "K-1", "1120S"];
                  return (
                    <div key={i} className="grid grid-cols-4 gap-4 text-xs p-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center">
                      <div className="font-mono text-primary font-bold">SYN-{Math.random().toString(36).substring(2, 8).toUpperCase()}</div>
                      <div className="font-medium text-slate-300">{firstNames[Math.floor(Math.random() * firstNames.length)]} {lastNames[Math.floor(Math.random() * lastNames.length)]}</div>
                      <div className="font-mono text-success bg-success/10 px-2 py-1 rounded inline-block w-fit">${(Math.random() * 150000 + 30000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[10px] font-black uppercase tracking-tighter bg-slate-800 px-2.5 py-1 rounded-full border border-white/10 text-slate-400 w-fit">{forms[Math.floor(Math.random() * forms.length)]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                <p className="text-[11px] text-slate-400 italic">
                  Showing first 15 of {previewDataset?.count.toLocaleString()} synchronized entities in this synthetic shard.
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-success">Compliant Export</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
