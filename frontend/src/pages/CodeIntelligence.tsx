import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImpactDependencyGraph } from "@/components/charts/ImpactDependencyGraph";
import { DataTable, Column } from "@/components/common/DataTable";
import { AISummaryDrawer } from "@/components/ai/AISummaryDrawer";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useChatContext } from "@/context/ChatContext";
import { useEffect } from "react";

interface AnalysisResponse {
  commit: string;
  severity: string;
  affectedServices: any[];
  estimatedTestTime: number;
  totalAffectedTests: number;
  recommendation: string;
  confidence: number;
  dependencyGraph: any;
  riskFactors: string[];
}

export default function CodeIntelligence() {
  const [commitInput, setCommitInput] = useState("a3f7d9e");
  const [displaySHA, setDisplaySHA] = useState("a3f7d9e");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setContextData } = useChatContext();

  // Run initial analysis on mount
  useEffect(() => {
    handleAnalyze();
  }, []);

  const handleAnalyze = async () => {
    if (!commitInput.trim()) {
      toast.error("Please enter a commit SHA or PR number");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiClient("/api/code-intelligence/analyze", {
        method: "POST",
        body: JSON.stringify({
          commitSHA: commitInput.includes("#") ? undefined : commitInput,
          prNumber: commitInput.includes("#")
            ? parseInt(commitInput.replace("#", ""))
            : undefined,
        }),
      });

      setAnalysis(response);
      setDisplaySHA(commitInput);

      // Update chat context
      setContextData({
        page: "Code Intelligence Engine",
        analysis: response,
        changedService: response.affectedServices[0]?.service,
        affectedCount: response.affectedServices.length,
        recommendation: response.recommendation,
      });

      toast.success("Impact analysis complete", {
        description: `${response.affectedServices.length} services affected. Estimated test time: ${response.estimatedTestTime} minutes.`,
        icon: <Sparkles className="w-4 h-4" />,
      });
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Analysis failed", {
        description: "Could not analyze commit. Try another SHA.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const severityColor = {
    CRITICAL: "text-destructive bg-destructive/10",
    HIGH: "text-warning bg-warning/10",
    MODERATE: "text-cyan-500 bg-cyan-500/10",
  };

  const severityBadge = {
    CRITICAL: "bg-destructive text-white",
    HIGH: "bg-warning text-black",
    MODERATE: "bg-cyan-500 text-white",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Code Intelligence Engine"
        subtitle="Analyze commit impact and required test coverage"
      >
        <AISummaryDrawer
          systemPrompt="You are an AI code intelligence analyst. Summarize the commit analysis in 3-4 bullet points covering: which services are affected, test coverage changes, risk level, and recommended actions."
          context={
            analysis
              ? JSON.stringify({
                  commit: analysis.commit,
                  severity: analysis.severity,
                  affectedServices: analysis.affectedServices,
                  totalTests: analysis.totalAffectedTests,
                  estimatedTime: analysis.estimatedTestTime,
                  recommendation: analysis.recommendation,
                  riskFactors: analysis.riskFactors,
                })
              : "No analysis data available"
          }
        />
      </PageHeader>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 border border-border/50"
      >
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Analyze Commit or Pull Request
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter commit SHA (e.g., a3f7d9e) or PR # (e.g., #8821)"
              value={commitInput}
              onChange={(e) => setCommitInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAnalyzing}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <Search className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors glow-cyan"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          Try commit SHA: a3f7d9e, d5e2f1c, or PR: #8821
        </p>
      </motion.div>

      {analysis && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Summary Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {/* Severity Card */}
              <div
                className={`glass rounded-xl p-6 border-l-4 ${
                  analysis.severity === "CRITICAL"
                    ? "border-destructive bg-destructive/5"
                    : analysis.severity === "HIGH"
                      ? "border-warning bg-warning/5"
                      : "border-cyan-500 bg-cyan-500/5"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      analysis.severity === "CRITICAL"
                        ? "bg-destructive/20"
                        : analysis.severity === "HIGH"
                          ? "bg-warning/20"
                          : "bg-cyan-500/20"
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${
                      analysis.severity === "CRITICAL"
                        ? "text-destructive"
                        : analysis.severity === "HIGH"
                          ? "text-warning"
                          : "text-cyan-500"
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Risk Severity
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        severityBadge[
                          analysis.severity as keyof typeof severityBadge
                        ]
                      }`}
                    >
                      {analysis.severity}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Confidence: <span className="font-bold">{analysis.confidence}%</span>
                </p>
              </div>

              {/* Affected Services Card */}
              <div className="glass rounded-xl p-6 border-l-4 border-primary bg-primary/5">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <GitBranch className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Affected Services
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {analysis.affectedServices.length}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {analysis.affectedServices[0]?.service} is the changed service
                </p>
              </div>

              {/* Test Coverage Card */}
              <div className="glass rounded-xl p-6 border-l-4 border-orange-500 bg-orange-500/5">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Est. Test Time
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {analysis.estimatedTestTime}
                      <span className="text-sm text-muted-foreground ml-1">
                        min
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {analysis.totalAffectedTests} total test cases
                </p>
              </div>
            </motion.div>

            {/* Recommendation Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-6 border border-ring/30 bg-gradient-to-r from-primary/5 via-transparent to-transparent"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    AI Recommendation
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.recommendation}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Risk Factors */}
            {analysis.riskFactors && analysis.riskFactors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-xl p-6 border border-warning/30 bg-warning/5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <h3 className="text-sm font-bold text-foreground">
                    Risk Factors
                  </h3>
                </div>
                <ul className="space-y-2">
                  {analysis.riskFactors.map((factor, idx) => (
                    <li
                      key={idx}
                      className="flex gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-warning font-bold">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Dependency Graph */}
            {analysis.dependencyGraph && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl p-6 border border-border/50"
              >
                <ImpactDependencyGraph
                  nodes={analysis.dependencyGraph.nodes}
                  edges={analysis.dependencyGraph.edges}
                  changedService={analysis.affectedServices[0]?.service}
                />
              </motion.div>
            )}

            {/* Impact Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-xl p-6 border border-border/50"
            >
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Affected Services & Test Requirements
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground">
                        Service
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground">
                        Impact Type
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-muted-foreground">
                        Test Cases
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-muted-foreground">
                        Est. Time (min)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.affectedServices.map((service, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {service.service}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              service.impact === "DIRECT"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {service.impact}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-foreground">
                          {service.affectedTests}
                        </td>
                        <td className="py-3 px-3 text-right text-foreground font-medium">
                          {service.estimatedTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total: {analysis.totalAffectedTests} test cases across{" "}
                    {analysis.affectedServices.length} services
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    Total Estimated Runtime: {analysis.estimatedTestTime} minutes
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `Run full regression suite for commit ${displaySHA}`
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Summary
                </button>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <button className="glass rounded-xl p-6 border border-border/50 hover:bg-muted/50 transition-colors text-left group">
                <Zap className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-foreground mb-1">
                  Schedule Test Run
                </p>
                <p className="text-xs text-muted-foreground">
                  Queue this commit for automated testing with recommended concurrency
                </p>
              </button>
              <button className="glass rounded-xl p-6 border border-border/50 hover:bg-muted/50 transition-colors text-left group">
                <ExternalLink className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-foreground mb-1">
                  View in Repository
                </p>
                <p className="text-xs text-muted-foreground">
                  View commit details and affected files in GitHub
                </p>
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {!analysis && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl p-12 border border-border/50 text-center"
        >
          <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Enter a commit SHA or PR number above to analyze impact
          </p>
        </motion.div>
      )}
    </div>
  );
}
