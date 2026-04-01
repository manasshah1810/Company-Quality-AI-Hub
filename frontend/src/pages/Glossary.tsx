import { useState, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export default function Glossary() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["glossary"],
    queryFn: () => apiClient("/api/glossary")
  });

  const kpiDefinitions: any[] = data?.kpiDefinitions || [];
  const formulaExamples: any[] = data?.formulaExamples || [];
  const chartIndex: any[] = data?.chartIndex || [];
  const aiModels: any[] = data?.aiModels || [];

  const filteredKPIs = useMemo(() => {
    const q = search.toLowerCase();
    // Use any[] explicitly so we can safely read properties without strict type definitions here
    return kpiDefinitions.filter((k: any) => !q || k.name.toLowerCase().includes(q) || k.definition.toLowerCase().includes(q));
  }, [search, kpiDefinitions]);

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
        <p className="text-destructive font-medium">Failed to load glossary data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="KPI & Formula Reference" subtitle="Complete glossary of every metric, formula, and calculation" />

      {/* Search & Filter */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search glossary..." className="bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none flex-1" />
        </div>
        {["All", "KPIs", "Formulas", "Charts", "AI Models"].map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* KPI Definitions */}
      {(category === "All" || category === "KPIs") && (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-lg text-foreground">📊 KPI Definitions</h2>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {["KPI", "Definition", "Formula", "Target", "Current", "Source"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredKPIs.map(kpi => (
                    <tr key={kpi.name} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{kpi.name}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px]">{kpi.definition}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{kpi.formula}</td>
                      <td className="px-4 py-3 font-mono text-xs">{kpi.target}</td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-medium">{kpi.current}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{kpi.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Formulas */}
      {(category === "All" || category === "Formulas") && (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-lg text-foreground">📐 Formulas & Calculations</h2>
          <div className="grid grid-cols-1 gap-4">
            {formulaExamples.map(f => (
              <div key={f.name} className="glass rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-3">{f.name}</h3>
                <pre className="font-mono text-xs text-primary bg-muted/20 rounded-lg p-4 mb-3 overflow-x-auto">{f.formula}</pre>
                <div className="mb-3">
                  <span className="text-xs text-muted-foreground font-medium">Variables:</span>
                  <ul className="mt-1 space-y-1">
                    {f.variables.map(v => <li key={v} className="text-xs text-foreground font-mono">• {v}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Example:</span>
                  <pre className="font-mono text-xs text-success bg-muted/20 rounded-lg p-3 mt-1 overflow-x-auto">{f.example}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Index */}
      {(category === "All" || category === "Charts") && (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-lg text-foreground">📈 Charts Used</h2>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Chart Type", "Page", "Data Shown", "Library"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartIndex.map((c, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-4 py-3 text-foreground">{c.chart}</td>
                    <td className="px-4 py-3 text-primary">{c.page}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.data}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.library}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Models */}
      {(category === "All" || category === "AI Models") && (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-lg text-foreground">🤖 AI Models & Prompts</h2>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Feature", "Model", "Strategy", "Output", "Display"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aiModels.map((m, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-4 py-3 text-foreground">{m.feature}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{m.model}</td>
                    <td className="px-4 py-3">{m.strategy}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.output}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.display}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
