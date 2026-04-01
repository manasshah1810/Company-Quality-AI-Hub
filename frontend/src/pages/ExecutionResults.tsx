import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, ArrowLeft, BarChart3, Zap, Clock } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExecutionResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("summary");

  // Mock results (would come from location.state in real implementation)
  const results = {
    type: "Smart Regression",
    date: new Date().toLocaleDateString(),
    duration: "4 hours 12 minutes",
    status: "completed",
    totalTests: 47,
    passed: 45,
    failed: 2,
    suites: 5,
    startTime: new Date(Date.now() - 4.2 * 3600000).toLocaleString(),
  };

  const failedTests = [
    {
      name: "Tax Organizer - Multi-Schedule Form",
      error: "AssertionError: Expected $15,100 but got $12,450",
      duration: "2.3s",
      type: "extraction",
    },
    {
      name: "Payment Gateway - Concurrent Transactions",
      error: "TimeoutError: Request exceeded 300s timeout",
      duration: "301.2s",
      type: "integration",
    },
  ];

  const performanceMetrics = [
    { name: "Auth Service", duration: "2.1m", tests: 12, passRate: 100 },
    { name: "Tax Organizer", duration: "58.3m", tests: 18, passRate: 89 },
    { name: "Payment Gateway", duration: "45.2m", tests: 10, passRate: 80 },
    { name: "Reporting Engine", duration: "18.4m", tests: 7, passRate: 100 },
  ];

  const passRate = Math.round((results.passed / results.totalTests) * 100);
  const successColor = passRate >= 95 ? "success" : passRate >= 80 ? "warning" : "destructive";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execution Results"
        subtitle={`${results.type} Report - ${results.date}`}
      >
        <button
          onClick={() => navigate("/regression-analysis")}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Regression Analysis
        </button>
      </PageHeader>

      {/* Summary Card */}
      <div className="glass-strong rounded-2xl p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {results.type} Results
            </h2>
            <p className="text-sm text-muted-foreground">
              Execution completed on {results.startTime}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center gap-2 ${
            successColor === "success" ? "bg-success/20 text-success" :
            successColor === "warning" ? "bg-warning/20 text-warning" :
            "bg-destructive/20 text-destructive"
          }`}>
            {successColor === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                All Tests Passed
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                {results.failed} Tests Failed
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-muted/10 border border-border/40">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Total Tests
            </div>
            <div className="text-2xl font-bold text-foreground">{results.totalTests}</div>
          </div>

          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <div className="text-[10px] font-bold text-success uppercase tracking-wider mb-2">
              Passed
            </div>
            <div className="text-2xl font-bold text-success">{results.passed}</div>
          </div>

          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <div className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-2">
              Failed
            </div>
            <div className="text-2xl font-bold text-destructive">{results.failed}</div>
          </div>

          <div className={`p-4 rounded-xl border-2 ${
            successColor === "success" ? "bg-success/10 border-success/50" :
            successColor === "warning" ? "bg-warning/10 border-warning/50" :
            "bg-destructive/10 border-destructive/50"
          }`}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: `var(--color-${successColor})` }}>
              Pass Rate
            </div>
            <div className="text-2xl font-bold" style={{ color: `var(--color-${successColor})` }}>
              {passRate}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/10 border border-border/40">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Duration
            </div>
            <div className="text-lg font-bold text-foreground">{results.duration}</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/20">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Suites Executed</div>
              <div className="text-lg font-bold text-foreground">{results.suites}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Execution Time</div>
              <div className="text-lg font-bold text-foreground">{results.duration}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Saved vs Full</div>
              <div className="text-lg font-bold text-success">78% faster</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="bg-muted/20 border border-border/40">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          {results.failed > 0 && <TabsTrigger value="failed">Failed Tests ({results.failed})</TabsTrigger>}
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Execution Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/40">
                <span className="text-foreground">Total Test Cases</span>
                <span className="font-mono font-bold">{results.totalTests}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
                <span className="text-foreground">Tests Passed</span>
                <span className="font-mono font-bold text-success">{results.passed}</span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <span className="text-foreground">Tests Failed</span>
                  <span className="font-mono font-bold text-destructive">{results.failed}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                <span className="text-foreground">Overall Pass Rate</span>
                <span className="font-mono font-bold text-primary">{passRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Failed Tests Tab */}
        {results.failed > 0 && activeTab === "failed" && (
          <div className="space-y-3">
            {failedTests.map((test, i) => (
              <div key={i} className="glass rounded-xl p-4 border border-destructive/30 bg-destructive/5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground">{test.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{test.error}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">{test.duration}</span>
                    <span className="block text-[9px] text-muted-foreground mt-1">{test.type}</span>
                  </div>
                </div>
                <button className="text-[10px] text-primary font-bold hover:underline">
                  View Detailed Trace →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-foreground mb-4">Performance Metrics by Suite</h3>
            <div className="space-y-2">
              {performanceMetrics.map((metric, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/10 border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{metric.name}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      metric.passRate === 100 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                    }`}>
                      {metric.passRate}% pass
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <span>Tests: <strong className="text-foreground">{metric.tests}</strong></span>
                    <span>Duration: <strong className="text-foreground">{metric.duration}</strong></span>
                    <span>Avg/Test: <strong className="text-foreground">{(parseFloat(metric.duration) / metric.tests).toFixed(1)}m</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Report Tab */}
        {activeTab === "detailed" && (
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-foreground mb-4">Detailed Execution Report</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Full detailed report with logs, traces, and analysis would be displayed here.</p>
              <p>This includes console output, API request/response logs, and timing breakdowns for each test case.</p>
              <button className="text-primary font-bold hover:underline text-sm mt-2">
                Download Full Report (PDF)
              </button>
            </div>
          </div>
        )}
      </Tabs>

      {/* Action Buttons */}
      <div className="glass rounded-xl p-6 flex gap-3 justify-between">
        <button
          onClick={() => navigate("/agent-testing")}
          className="px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground font-medium transition-all"
        >
          View Failure Analysis
        </button>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground font-medium transition-all">
            Download Report
          </button>
          <button
            onClick={() => navigate("/regression-analysis")}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
          >
            Run New Execution
          </button>
        </div>
      </div>
    </div>
  );
}
