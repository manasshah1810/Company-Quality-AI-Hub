import express, { Router, Request, Response } from "express";

const router = Router();

interface AnalysisResult {
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

// Mock service registry and defect history
const SERVICE_REGISTRY = [
  { name: "Tax Organizer", defects_90d: 6, critical: true },
  { name: "1040 Parser", defects_90d: 4, critical: true },
  { name: "K-1 Logic", defects_90d: 2, critical: true },
  { name: "Report Generator", defects_90d: 1, critical: false },
  { name: "API Gateway", defects_90d: 3, critical: false },
  { name: "Authentication", defects_90d: 0, critical: false },
];

const TEST_SUITES = [
  {
    id: "suite-001",
    name: "Tax Organizer Core Logic",
    risk_level: "HIGH" as const,
    selection_reason: "Direct impact: complexity spike detected",
    test_count: 847,
  },
  {
    id: "suite-002",
    name: "1040 Extract Tests",
    risk_level: "HIGH" as const,
    selection_reason: "Cyclomatic complexity increased +0.84",
    test_count: 623,
  },
  {
    id: "suite-003",
    name: "K-1 Parser Regression",
    risk_level: "MEDIUM" as const,
    selection_reason: "Historical defects related to calc changes",
    test_count: 512,
  },
  {
    id: "suite-004",
    name: "API Contract Tests",
    risk_level: "MEDIUM" as const,
    selection_reason: "Coverage gap for shared utils",
    test_count: 234,
  },
  {
    id: "suite-005",
    name: "Integration Smoke Tests",
    risk_level: "LOW" as const,
    selection_reason: "Cross-service sanity check",
    test_count: 89,
  },
];

const MOCK_ANALYSES: Record<string, AnalysisResult> = {
  "PR #4482": {
    pr: "PR #4482",
    changedFiles: [
      {
        path: "src/tax-organizer.ts",
        additions: 245,
        deletions: 38,
        complexity_delta: 0.84,
        modules_touched: ["Tax Organizer", "K-1 Logic"],
      },
      {
        path: "src/utils/tax-calc.ts",
        additions: 12,
        deletions: 5,
        complexity_delta: 0.12,
        modules_touched: ["Tax Organizer", "Report Generator"],
      },
    ],
    affectedServices: [
      {
        name: "Tax Organizer",
        confidence: 0.89,
        reason: "Direct dependency - primary file changed",
        predicted_failures: "4–6",
      },
      {
        name: "1040 Parser",
        confidence: 0.76,
        reason: "Shares calculation utilities and caching layer",
        predicted_failures: "2–3",
      },
      {
        name: "K-1 Logic",
        confidence: 0.62,
        reason: "Depends on shared calculation cache, uses tax-calc utils",
        predicted_failures: "1–2",
      },
      {
        name: "Report Generator",
        confidence: 0.34,
        reason: "Reads tax results indirectly through API",
        predicted_failures: "0–1",
      },
    ],
    selectedSuites: TEST_SUITES,
    timeSavings: {
      full_regression_hours: 18.5,
      smart_regression_hours: 4.2,
      percentage_saved: 77,
      assumptions: "Based on parallel execution on 8 nodes. Smart selection covers ~95% risk.",
    },
    historical_context: {
      defects_70d: 12,
      failure_rate: 0.08,
      high_risk_areas: ["Tax Organizer", "K-1 Parser", "1040 Extract"],
    },
  },
};

// POST /api/regression-analysis/analyze
router.post("/analyze", (req: Request, res: Response) => {
  try {
    const { commit, pr } = req.body;
    const key = pr || commit || "PR #4482";

    // Simulate analysis delay
    setTimeout(() => {
      try {
        // Look up pre-made analysis or generate new one
        const analysis = MOCK_ANALYSES[key];

        if (analysis) {
          return res.status(200).json(analysis);
        }

        // Generate dynamic response for unknown PRs/commits
        const dynamicAnalysis: AnalysisResult = {
          pr: key,
          changedFiles: [
            {
              path: "src/services/core.ts",
              additions: 156,
              deletions: 42,
              complexity_delta: 0.67,
              modules_touched: ["Core Service", "Validator"],
            },
            {
              path: "src/utils/helpers.ts",
              additions: 8,
              deletions: 3,
              complexity_delta: 0.05,
              modules_touched: ["Core Service"],
            },
          ],
          affectedServices: [
            {
              name: "Tax Organizer",
              confidence: 0.85,
              reason: "Uses core service components",
              predicted_failures: "3–5",
            },
            {
              name: "1040 Parser",
              confidence: 0.71,
              reason: "Shared validation utilities updated",
              predicted_failures: "2–3",
            },
            {
              name: "Report Generator",
              confidence: 0.48,
              reason: "Indirect impact through API contracts",
              predicted_failures: "1–2",
            },
          ],
          selectedSuites: TEST_SUITES.slice(0, 5),
          timeSavings: {
            full_regression_hours: 18.5,
            smart_regression_hours: 4.5,
            percentage_saved: 76,
            assumptions: "Based on parallel execution on 8 nodes. Smart selection covers ~94% risk.",
          },
          historical_context: {
            defects_70d: 10,
            failure_rate: 0.075,
            high_risk_areas: ["Tax Organizer", "1040 Parser"],
          },
        };

        return res.status(200).json(dynamicAnalysis);
      } catch (err: any) {
        console.error("Error in regression analysis callback:", err);
        return res.status(500).json({ error: "Failed to generate analysis", details: err.message });
      }
    }, 800); // 800ms delay to simulate analysis
  } catch (err: any) {
    console.error("Error parsing regression analysis request:", err);
    return res.status(400).json({ error: "Invalid request body", details: err.message });
  }
});

export default router;
