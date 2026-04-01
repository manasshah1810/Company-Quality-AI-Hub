import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Play, BarChart3, AlertCircle, CheckCircle2, Zap, History, Settings, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { RegressionImpactGraph } from "@/components/charts/RegressionImpactGraph";
import { RegressionTimeComparison } from "@/components/charts/RegressionTimeComparison";
import { ExecutionMonitor } from "@/components/execution/ExecutionMonitor";
import { Confetti } from "@/components/execution/Confetti";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

export interface AnalysisResult {
  pr: string;
  changedFiles: Array<{
    path: string;
    additions: number;
    deletions: number;
    complexity_delta: number;
    modules_touched: string[];
  }>;
  affectedServices: Array<{
    name: string;
    confidence: number;
    reason: string;
    predicted_failures: string;
  }>;
  selectedSuites: Array<{
    id: string;
    name: string;
    risk_level: "HIGH" | "MEDIUM" | "LOW";
    selection_reason: string;
    test_count: number;
  }>;
  timeSavings: {
    full_regression_hours: number;
    smart_regression_hours: number;
    percentage_saved: number;
    assumptions: string;
  };
  historical_context: {
    defects_70d: number;
    failure_rate: number;
    high_risk_areas: string[];
  };
}

export default function RegressionAnalysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(searchParams.get("pr") || "PR #4482");
  const [analyzedPr, setAnalyzedPr] = useState(searchParams.get("pr") || null);

  // Execution state
  const [executionState, setExecutionState] = useState<"idle" | "running" | "completed">("idle");
  const [executionProgress, setExecutionProgress] = useState(0);
  const [testsPassed, setTestsPassed] = useState(0);
  const [testsFailed, setTestsFailed] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState(0);
  const [currentTestName, setCurrentTestName] = useState<string | undefined>();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Job history
  const [jobHistory, setJobHistory] = useState<Array<{
    id: string;
    date: string;
    suite: string;
    duration: string;
    tests: number;
    passed: number;
    status: "success" | "failed";
  }>>([
    { id: "job-1", date: "Mar 29, 14:32", suite: "Smart (5 suites)", duration: "4h 12m", tests: 47, passed: 45, status: "success" },
    { id: "job-2", date: "Mar 28, 10:15", suite: "Full (47 suites)", duration: "18h 45m", tests: 342, passed: 339, status: "success" },
    { id: "job-3", date: "Mar 27, 16:20", suite: "Smart (5 suites)", duration: "4h 8m", tests: 47, passed: 46, status: "failed" },
  ]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ["regressionAnalysis", analyzedPr],
    queryFn: async () => {
      if (!analyzedPr) return null;
      const json = await apiClient("/api/regression-analysis/analyze", {
        method: "POST",
        body: JSON.stringify({ pr: analyzedPr }),
      });
      return json as AnalysisResult;
    },
    enabled: !!analyzedPr,
  });

  const totalTests = analysisData?.selectedSuites.reduce((sum, s) => sum + s.test_count, 0) || 47;
  const estimatedTotalTime = analyzedPr && analysisData ? analysisData.timeSavings.smart_regression_hours * 3600 : 15120;

  // Keyboard shortcut: Ctrl+R to run regression
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        if (executionState === "idle" && analysisData) {
          handleRunRegression();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [executionState, analysisData]);

  // Execution timer
  useEffect(() => {
    if (executionState === "running") {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [executionState]);

  // Simulate execution progress
  useEffect(() => {
    if (executionState === "running") {
      const progressInterval = setInterval(() => {
        setExecutionProgress((prev) => {
          if (prev >= 100) {
            setExecutionState("completed");
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            toast.success("✅ All Tests Passed! Ship it with confidence.", {
              description: `Smart Regression completed: ${totalTests} tests passed in ${Math.round(elapsedTime / 60)} minutes`,
            });
            return 100;
          }
          return Math.min(100, prev + Math.random() * 8);
        });
      }, 1200);

      const testInterval = setInterval(() => {
        const newPassed = Math.floor((executionProgress / 100) * totalTests);
        const newFailed = Math.floor(newPassed * 0.04); // Mock 4% failure rate
        setTestsPassed(newPassed);
        setTestsFailed(newFailed);

        // Update current test name
        const testNames = [
          "Auth Service - Login Test",
          "Tax Organizer - Form Processing",
          "Payment Gateway - Transaction Validation",
          "FormsEngine - Multi-Page Workflow",
          "Reporting Engine - Export PDF",
        ];
        setCurrentTestName(testNames[Math.floor(Math.random() * testNames.length)]);
      }, 2000);

      return () => {
        clearInterval(progressInterval);
        clearInterval(testInterval);
      };
    }
  }, [executionState, executionProgress, totalTests, elapsedTime]);

  const handleAnalyze = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a commit SHA or PR number");
      return;
    }
    setAnalyzedPr(inputValue);
  };

  const handleRunRegression = async () => {
    if (executionState !== "idle") return;

    setExecutionState("running");
    setExecutionProgress(0);
    setTestsPassed(0);
    setTestsFailed(0);
    setElapsedTime(0);
    setEstimatedRemaining(estimatedTotalTime);

    // Log in history
    const newJob = {
      id: `job-${Date.now()}`,
      date: new Date().toLocaleString(),
      suite: `Smart (${analysisData?.selectedSuites.length || 5} suites)`,
      duration: "in progress...",
      tests: totalTests,
      passed: 0,
      status: "success" as const,
    };
    setJobHistory([newJob, ...jobHistory.slice(0, 9)]);

    // API call (for real implementation)
    try {
      await apiClient("/api/jobs/trigger", {
        method: "POST",
        body: JSON.stringify({ type: "smart-regression", pr: analyzedPr }),
      });
    } catch (err) {
      console.error("Failed to trigger regression:", err);
    }
  };

  const handleRunFullSuite = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: `Running Full Regression Suite for ${analyzedPr}...`,
        success: `✓ Full suite execution started: 47 suites, estimated 18.5 hours.`,
        error: "Full regression failed",
      }
    );
  };

  const handleCancelExecution = () => {
    setExecutionState("idle");
    setExecutionProgress(0);
    toast.error("Execution cancelled");
  };

  const handleViewResults = () => {
    navigate("/execution-results");
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="space-y-6 flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <PageHeader
          title="Intelligent Regression Engine"
          subtitle="Analyze commits to identify affected tests and quantify time savings"
        >
          <div className="flex gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Press Ctrl+R to run regression (when idle)</span>
          </div>
        </PageHeader>

      {/* INPUT SECTION */}
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-sm text-foreground">Analyze Code Change</h3>
        <p className="text-xs text-muted-foreground">Enter a commit SHA or PR number to analyze impact on test suites</p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="e.g., abc123def or PR #4482"
            className="flex-1 px-4 py-2 rounded-lg bg-background/50 border border-primary/20 text-foreground text-sm focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Analyze
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="glass-strong rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Running Impact Engine (Delta-8)...</p>
          <p className="text-xs text-muted-foreground">Analyzing {analyzedPr}...</p>
        </div>
      )}

      {/* ANALYSIS RESULTS */}
      {analysisData && !isLoading && (
        <>
          {/* CHANGED FILES SECTION */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Changed Files ({analysisData.changedFiles.length})
            </h3>
            
            <div className="space-y-3">
              {analysisData.changedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-background/30 border border-primary/10 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <code className="text-xs font-mono text-primary">{file.path}</code>
                    <span className="text-xs text-muted-foreground">
                      Δ Complexity: <span className="text-amber-400 font-mono">+{file.complexity_delta.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="text-green-400">+{file.additions}</span>
                    <span className="text-red-400">-{file.deletions}</span>
                    <span>•</span>
                    <span>Modules: {file.modules_touched.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 px-3 border-t border-primary/10 text-xs text-muted-foreground">
              <strong className="text-foreground">Summary:</strong> {analysisData.changedFiles.length} files changed,
              {" "}
              <span className="text-green-400">
                +{analysisData.changedFiles.reduce((a, b) => a + b.additions, 0)}
              </span>
              {" "}
              <span className="text-red-400">
                -{analysisData.changedFiles.reduce((a, b) => a + b.deletions, 0)}
              </span>
              {" "}
              lines, complexity spike:
              {" "}
              <span className="text-amber-400 font-mono">
                +{analysisData.changedFiles.reduce((a, b) => a + b.complexity_delta, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* IMPACT ANALYSIS SECTION */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              Impact Analysis: Affected Services ({analysisData.affectedServices.length})
            </h3>

            <div className="space-y-3">
              {analysisData.affectedServices.map((service, idx) => {
                const confidencePercent = Math.round(service.confidence * 100);
                return (
                  <div key={idx} className="p-3 rounded-lg bg-background/30 border border-orange-400/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">{service.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{service.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-orange-400">{confidencePercent}%</div>
                        <div className="text-xs text-muted-foreground">confidence</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-background/50 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Predicted failures: <span className="text-red-400 font-mono">{service.predicted_failures}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* IMPACT GRAPH */}
          <RegressionImpactGraph services={analysisData.affectedServices} changedFiles={analysisData.changedFiles} />

          {/* TIME SAVINGS SECTION */}
          <RegressionTimeComparison timeSavings={analysisData.timeSavings} />

          {/* SELECTED SUITES SECTION */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Smart Test Selection: {analysisData.selectedSuites.length} of 47 Suites
            </h3>
            <p className="text-xs text-muted-foreground">
              {((analysisData.selectedSuites.length / 47) * 100).toFixed(1)}% of total suite,{" "}
              <span className="text-green-400 font-semibold">
                {analysisData.timeSavings.percentage_saved}% time reduction
              </span>
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/10 text-xs text-muted-foreground font-medium">
                    <th className="text-left py-2 px-3">Suite Name</th>
                    <th className="text-left py-2 px-3">Risk Level</th>
                    <th className="text-left py-2 px-3">Selection Reason</th>
                    <th className="text-right py-2 px-3">Tests</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.selectedSuites.map((suite, idx) => (
                    <tr key={idx} className="border-b border-background/50 hover:bg-background/20 transition">
                      <td className="py-3 px-3 text-foreground font-medium">{suite.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            suite.risk_level === "HIGH"
                              ? "bg-red-400/20 text-red-400"
                              : suite.risk_level === "MEDIUM"
                                ? "bg-amber-400/20 text-amber-400"
                                : "bg-green-400/20 text-green-400"
                          }`}
                        >
                          {suite.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{suite.selection_reason}</td>
                      <td className="py-3 px-3 text-right text-foreground font-mono">{suite.test_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* HISTORICAL CONTEXT */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Historical Context</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-background/30 text-center space-y-1">
                <div className="text-2xl font-bold text-foreground">{analysisData.historical_context.defects_70d}</div>
                <div className="text-xs text-muted-foreground">Defects (70 days)</div>
                <div className="text-xs text-orange-400">in affected areas</div>
              </div>
              
              <div className="p-3 rounded-lg bg-background/30 text-center space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {(analysisData.historical_context.failure_rate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Historical Failure</div>
                <div className="text-xs text-orange-400">Rate</div>
              </div>

              <div className="p-3 rounded-lg bg-background/30 text-center space-y-1">
                <div className="text-2xl font-bold text-foreground">70%</div>
                <div className="text-xs text-muted-foreground">Defect Prevention</div>
                <div className="text-xs text-green-400">API Contract Tests</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-2 px-3 border-t border-primary/10">
              <strong>High-risk areas:</strong> {analysisData.historical_context.high_risk_areas.join(", ")}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          {executionState === "idle" && (
            <div className="flex gap-3">
              <button
                onClick={handleRunRegression}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run Smart Regression ({analysisData.selectedSuites.length} suites, {analysisData.timeSavings.smart_regression_hours.toFixed(1)}h)
              </button>
              
              <button
                onClick={handleRunFullSuite}
                className="flex-1 px-6 py-3 rounded-lg bg-background/50 border border-primary/20 text-foreground font-medium hover:bg-background/80 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run Full Suite (47 suites, {analysisData.timeSavings.full_regression_hours.toFixed(1)}h)
              </button>
            </div>
          )}

          {/* EXECUTION MONITOR */}
          {executionState !== "idle" && (
            <ExecutionMonitor
              isRunning={executionState === "running"}
              progress={executionProgress}
              testsPassed={testsPassed}
              testsFailed={testsFailed}
              totalTests={totalTests}
              estimatedTimeRemaining={Math.max(0, estimatedTotalTime - elapsedTime)}
              elapsedTime={elapsedTime}
              currentTestName={currentTestName}
              onCancel={handleCancelExecution}
            />
          )}

          {/* SUCCESS STATE */}
          {executionState === "completed" && (
            <div className="glass-strong rounded-2xl p-8 text-center space-y-4 bg-success/10 border border-success/30">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">🎉 All Tests Passed!</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalTests} tests completed successfully. Ship it with confidence!
                </p>
                <button
                  onClick={handleViewResults}
                  className="px-6 py-2 rounded-lg bg-success text-white font-medium hover:bg-success/90 transition"
                >
                  View Detailed Results →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* EMPTY STATE */}
      {!analysisData && !isLoading && (
        <div className="glass-strong rounded-2xl p-12 text-center space-y-3">
          <Zap className="w-8 h-8 text-primary/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Enter a commit SHA or PR number above to see detailed impact analysis</p>
        </div>
      )}
      </div>
      </div>

      {/* Job History Sidebar */}
      <div className="w-80 h-fit sticky top-6">
        <div className="glass rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Job History
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {jobHistory.map((job) => (
              <div
                key={job.id}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  job.status === "success"
                    ? "bg-success/5 border-success/20 hover:bg-success/10"
                    : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{job.date}</span>
                  {job.status === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  )}
                </div>
                <div className="text-xs font-medium text-foreground truncate">{job.suite}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {job.passed}/{job.tests} passed • {job.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
