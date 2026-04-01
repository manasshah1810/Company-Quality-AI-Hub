import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleRiskHeatmap } from "@/components/charts/ModuleRiskHeatmap";
import { HeatmapGrid } from "@/components/charts/HeatmapGrid";
import { AlertCircle, Search, Filter, ArrowRight } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { toast } from "sonner";

export default function DebugCenter() {
  const [selectedModule, setSelectedModule] = useState<{ module: string; factor: string; risk: number } | null>(null);
  const [filterModule, setFilterModule] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { setContextData } = useChatContext();

  // Mock data for failure heatmap
  const failureHeatmapData = Array.from({ length: 7 * 24 }, (_, i) => {
    const day = Math.floor(i / 24);
    const hour = i % 24;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return {
      day: days[day],
      hour,
      failures: Math.floor(Math.random() * 30) + (day === 2 && (hour === 14 || hour === 15) ? 15 : 0),
    };
  });

  const modules = ["Auth Service", "Tax Organizer", "FormsEngine", "Payment Gateway"];
  const severities = ["Critical", "High", "Medium", "Low"];

  const allMockFailures = [
    { module: "Tax Organizer", keyword: "404", error: "API endpoint not found", severity: "High" },
    { module: "Tax Organizer", keyword: "timeout", error: "Request timeout on form submission", severity: "Critical" },
    { module: "Auth Service", keyword: "403", error: "Unauthorized access attempt", severity: "High" },
    { module: "FormsEngine", keyword: "validation", error: "Form validation failed", severity: "Medium" },
    { module: "Payment Gateway", keyword: "500", error: "Internal server error", severity: "Critical" },
    { module: "FormsEngine", keyword: "404", error: "Template not found", severity: "High" },
  ];

  const mockFailureDetails = {
    "Tax Organizer": {
      testsFailed: 5,
      failureFrequency: "5 failures in last 24h",
      rootCause: "API timeout on form submission with large payloads (>10MB)",
      recommendedAction: "Increase API timeout from 30s to 60s, implement request batching",
    },
    "Payment Gateway": {
      testsFailed: 3,
      failureFrequency: "3 failures in last 24h",
      rootCause: "Concurrency issue in transaction processing",
      recommendedAction: "Add transaction locking mechanism, review concurrency logic",
    },
    default: {
      testsFailed: 2,
      failureFrequency: "2 failures in last 24h",
      rootCause: "Unknown - needs investigation",
      recommendedAction: "Enable verbose logging, run with debugging enabled",
    },
  };

  // Apply filters to failure data
  const filteredFailures = allMockFailures.filter(failure => {
    const moduleMatch = filterModule === "all" || failure.module === filterModule;
    const severityMatch = filterSeverity === "all" || failure.severity === filterSeverity;
    const searchMatch = searchQuery === "" ||
      failure.error.toLowerCase().includes(searchQuery.toLowerCase()) ||
      failure.keyword.toLowerCase().includes(searchQuery.toLowerCase());

    return moduleMatch && severityMatch && searchMatch;
  });

  // Get critical modules from filtered data
  const criticalModulesFiltered = Array.from(
    new Set(
      filteredFailures
        .filter(f => f.severity === "Critical")
        .map(f => f.module)
    )
  );

  // Count recent failures from filtered data
  const recentFailuresFiltered = filteredFailures.length;

  useEffect(() => {
    setContextData({
      page: "Visual Debugging Center",
      activeTab,
      filterModule,
      filterSeverity,
      searchQuery,
      totalFailures: filteredFailures.length,
      criticalModules: criticalModulesFiltered
    });
  }, [activeTab, filterModule, filterSeverity, searchQuery, filteredFailures.length, criticalModulesFiltered, setContextData]);

  const handleCellClick = (module: string, factor: string, risk: number) => {
    setSelectedModule({ module, factor, risk });
    setActiveTab("breakdown");
  };

  const handleHeatmapCellClick = (day: string, hour: number) => {
    const failureCount = failureHeatmapData.find(d => d.day === day && d.hour === hour)?.failures || 0;
    if (failureCount > 0) {
      toast.info(`${day} ${hour}:00 - ${failureCount} failures detected`, {
        description: "Click to filter and view detailed breakdown",
      });
    }
  };

  const selectedDetails = selectedModule
    ? mockFailureDetails[selectedModule.module as keyof typeof mockFailureDetails] || mockFailureDetails.default
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Debugging Center"
        subtitle="Interactive debugging dashboard with failure heatmaps and root cause analysis"
      >
        <div className="flex gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Click cells to drill into failures and view remediation steps</span>
        </div>
      </PageHeader>

      {/* Search & Filter Panel */}
      <div className="glass rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          Filter & Search
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Module Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Module</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Modules</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Levels</option>
              {severities.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Error message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/20 border border-border/40">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Failure Heatmap</TabsTrigger>
          {selectedModule && <TabsTrigger value="breakdown">Breakdown Details</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Module Risk Heatmap */}
            <ModuleRiskHeatmap onCellClick={handleCellClick} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  🚨 Critical Modules
                </h4>
                <div className="space-y-2">
                  {criticalModulesFiltered.length > 0 ? (
                    criticalModulesFiltered.map(m => (
                      <div key={m} className="p-2 rounded bg-destructive/10 border border-destructive/30">
                        <div className="text-sm font-medium text-foreground">{m}</div>
                        <div className="text-xs text-muted-foreground">Risk: High</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 rounded bg-success/10 border border-success/30">
                      <div className="text-sm font-medium text-foreground">No critical modules</div>
                      <div className="text-xs text-muted-foreground">All systems healthy</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  ⚠️ Recent Failures
                </h4>
                <div className="text-3xl font-bold text-destructive mb-1">{recentFailuresFiltered}</div>
                <div className="text-xs text-muted-foreground">
                  {filterModule !== "all" || filterSeverity !== "all" || searchQuery ? "matching filters" : "in last 24 hours"}
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  🎯 Active Filters
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {filterModule !== "all" && <div>📌 Module: <span className="text-foreground font-medium">{filterModule}</span></div>}
                  {filterSeverity !== "all" && <div>📌 Severity: <span className="text-foreground font-medium">{filterSeverity}</span></div>}
                  {searchQuery && <div>📌 Search: <span className="text-foreground font-medium">"{searchQuery}"</span></div>}
                  {filterModule === "all" && filterSeverity === "all" && !searchQuery && <div className="text-foreground">No filters applied</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Heatmap Tab */}
        {activeTab === "heatmap" && (
          <HeatmapGrid data={failureHeatmapData} />
        )}

        {/* Breakdown Details Tab */}
        {activeTab === "breakdown" && selectedModule && selectedDetails && (
          <div className="space-y-4">
            {/* Module Info */}
            <div className="glass-strong rounded-xl p-6">
              <h2 className="font-bold text-lg text-foreground mb-4">
                {selectedModule.module} - Detailed Analysis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Risk Breakdown */}
                  <div className="p-4 rounded-lg bg-muted/10 border border-border/40">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      Risk Factor: {selectedModule.factor}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Risk Level</span>
                        <span className="text-sm font-mono font-bold text-destructive">
                          {Math.round(selectedModule.risk * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive"
                          style={{ width: `${selectedModule.risk * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Failure Stats */}
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <h3 className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">
                      Failure Statistics
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground">Tests Failed</span>
                        <span className="font-mono font-bold">{selectedDetails.testsFailed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground">Frequency</span>
                        <span className="font-mono font-bold">{selectedDetails.failureFrequency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Root Cause */}
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <h3 className="text-xs font-bold text-warning uppercase tracking-wider mb-2">
                      Root Cause Analysis
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {selectedDetails.rootCause}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                    <h3 className="text-xs font-bold text-success uppercase tracking-wider mb-2">
                      Recommended Action
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed mb-3">
                      {selectedDetails.recommendedAction}
                    </p>
                    <button className="w-full px-3 py-1.5 rounded-lg bg-success text-white text-xs font-bold hover:bg-success/90 transition-all flex items-center justify-center gap-2">
                      Start Remediation
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hover Tooltip Info */}
              <div className="mt-6 pt-4 border-t border-border/20">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Hover Breakdown
                </h3>
                <div className="grid grid-cols-4 gap-2 text-[9px] text-muted-foreground">
                  <div>Test Coverage: 60%</div>
                  <div>Bug Density: HIGH</div>
                  <div>Commit Volatility: 34%</div>
                  <div>AI Confidence: 45%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Tabs>

      {/* Help Text */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          How to Use This Dashboard
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <span className="text-foreground font-medium">Filter by Module:</span> Select a specific service to focus analysis</li>
          <li>• <span className="text-foreground font-medium">Filter by Severity:</span> Show only Critical, High, Medium, or Low priority failures</li>
          <li>• <span className="text-foreground font-medium">Search Errors:</span> Find failures by error message or keyword (e.g., "404", "timeout")</li>
          <li>• <span className="text-foreground font-medium">Module Risk Heatmap:</span> Click any cell to see detailed breakdown</li>
          <li>• <span className="text-foreground font-medium">Results Update Instantly:</span> Stats and data refresh as you adjust filters</li>
        </ul>
      </div>

      {/* Filtered Results Preview */}
      {(filterModule !== "all" || filterSeverity !== "all" || searchQuery) && (
        <div className="glass rounded-xl p-4 border border-primary/30">
          <h3 className="text-sm font-semibold text-foreground mb-3">📊 Filtered Results ({filteredFailures.length})</h3>
          {filteredFailures.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredFailures.map((failure, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/30 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm">{failure.error}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="inline-block mr-3">📦 {failure.module}</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${failure.severity === "Critical" ? "bg-destructive/20 text-destructive" :
                        failure.severity === "High" ? "bg-orange-500/20 text-orange-400" :
                          failure.severity === "Medium" ? "bg-amber-500/20 text-amber-400" :
                            "bg-blue-500/20 text-blue-400"
                        }`}>
                        {failure.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-lg bg-muted/10 border border-border/30">
              <p className="text-sm text-muted-foreground">No failures match the selected filters</p>
              <button
                onClick={() => {
                  setFilterModule("all");
                  setFilterSeverity("all");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
