import { Router, Request, Response } from "express";

const router = Router();

interface CommitAnalysisRequest {
  commitSHA?: string;
  prNumber?: string;
}

interface ImpactData {
  service: string;
  impact: string;
  affectedTests: number;
  estimatedTime: number;
}

interface AnalysisResponse {
  commit: string;
  severity: string;
  affectedServices: ImpactData[];
  estimatedTestTime: number;
  totalAffectedTests: number;
  recommendation: string;
  confidence: number;
  dependencyGraph: any;
  riskFactors: string[];
}

// Mock data for dependency relationships
const serviceRegistry: Record<string, string[]> = {
  "Tax Organizer": ["1040 Parser", "K-1 Logic", "Report Generator", "Gateway"],
  "1040 Parser": ["Validation Engine", "Report Generator"],
  "K-1 Logic": ["Validation Engine", "Report Generator"],
  "Report Generator": ["Export Service", "Audit Logger"],
  "Gateway": ["Authentication", "Rate Limiter"],
  "Authentication": ["Audit Logger"],
  "Rate Limiter": ["Audit Logger"],
  "Validation Engine": ["Audit Logger"],
  "Export Service": ["Audit Logger"],
  "Audit Logger": [],
};

const testSuiteMap: Record<string, { suites: string[]; timeMinutes: number }> = {
  "Tax Organizer": { suites: ["E2E Tax Flow", "API Integration", "Security"], timeMinutes: 45 },
  "1040 Parser": { suites: ["Parser Unit Tests", "Format Validation", "Edge Cases"], timeMinutes: 25 },
  "K-1 Logic": { suites: ["K-1 Processing", "Multi-Entity", "State Rules"], timeMinutes: 30 },
  "Report Generator": { suites: ["PDF Generation", "XML Output", "Formatting"], timeMinutes: 20 },
  "Gateway": { suites: ["API Contract", "Load Testing", "Rate Limits"], timeMinutes: 35 },
  "Authentication": { suites: ["Auth Flow", "Token Management", "MFA"], timeMinutes: 15 },
  "Rate Limiter": { suites: ["Throttling", "Queue Management", "Fairness"], timeMinutes: 10 },
  "Validation Engine": { suites: ["Rule Engine", "Constraint Validation", "Error Handling"], timeMinutes: 18 },
  "Export Service": { suites: ["Export Formats", "Data Integrity", "Compression"], timeMinutes: 22 },
  "Audit Logger": { suites: ["Log Integrity", "Performance", "Security"], timeMinutes: 12 },
};

// Helper function to traverse dependency graph
function getDownstreamServices(
  service: string,
  registry: Record<string, string[]>,
  visited = new Set<string>()
): string[] {
  if (visited.has(service)) return [];
  visited.add(service);

  const directDownstream = registry[service] || [];
  const allDownstream = [...directDownstream];

  // For each direct downstream, recursively get their downstream
  directDownstream.forEach((ds) => {
    allDownstream.push(...getDownstreamServices(ds, registry, visited));
  });

  return [...new Set(allDownstream)];
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/code-intelligence/analyze
// Analyze commit/PR impact on services and test coverage
// ──────────────────────────────────────────────────────────────────────────────
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { commitSHA, prNumber } = req.body as CommitAnalysisRequest;
    const identifier = commitSHA || prNumber || "unknown";

    // Mock: Simulate commit analysis
    // In production, this would:
    // 1. Fetch actual commit diff from Git
    // 2. Scan changed files against service ownership registry
    // 3. Return validated impact
    // 4. Use actual test suite dependencies

    // For demo: assume impact to Tax Organizer (most critical service)
    const changedService = "Tax Organizer";
    const downstreamServices = getDownstreamServices(
      changedService,
      serviceRegistry
    );

    // Build impact data for changed service and all downstream
    const impactedServices = [
      {
        service: changedService,
        impact: "DIRECT",
        affectedTests: 18,
        estimatedTime:
          testSuiteMap[changedService]?.timeMinutes || 50,
      },
      ...downstreamServices
        .slice(0, 4) // Limit to top 4
        .map((service) => ({
          service,
          impact: "INDIRECT",
          affectedTests: Math.floor(Math.random() * 8) + 3,
          estimatedTime: testSuiteMap[service]?.timeMinutes || 20,
        })),
    ];

    const totalAffectedTests = impactedServices.reduce(
      (sum, s) => sum + s.affectedTests,
      0
    );
    const totalEstimatedTime = impactedServices.reduce(
      (sum, s) => sum + s.estimatedTime,
      0
    );

    // Severity based on number of affected services
    const severity =
      impactedServices.length > 5
        ? "CRITICAL"
        : impactedServices.length > 3
          ? "HIGH"
          : "MODERATE";

    // Risk factors based on changed service
    const riskFactors = [
      "High cyclomatic complexity in Tax Organizer backend",
      "4 downstream services affected by change",
      "Critical path for enterprise tenants",
      "Tax deadline approaching (Q1)",
    ];

    const confidence = 94;
    const recommendation =
      severity === "CRITICAL"
        ? `RUN FULL REGRESSION SUITE (${totalEstimatedTime} mins). ${impactedServices.length} affected services. This commit to ${changedService} impacts critical tax processing paths. HIGH confidence assessment (${confidence}%). Recommendation: Increase test concurrency to 8 workers and run enterprise client simulation.`
        : `RUN STANDARD REGRESSION (${totalEstimatedTime} mins). ${impactedServices.length} services affected. Moderate complexity change. Recommendation: Run focus suites for ${changedService} and immediate dependents.`;

    // Build simple dependency graph data for visualization
    const dependencyGraph = {
      nodes: [
        { id: changedService, type: "changed", label: changedService },
        ...downstreamServices
          .slice(0, 6)
          .map((service) => ({
            id: service,
            type: "affected",
            label: service,
          })),
      ],
      edges: downstreamServices
        .slice(0, 6)
        .map((service) => ({
          source: changedService,
          target: service,
          type: "depends",
        })),
    };

    const response: AnalysisResponse = {
      commit: identifier,
      severity,
      affectedServices: impactedServices,
      estimatedTestTime: totalEstimatedTime,
      totalAffectedTests,
      recommendation,
      confidence,
      dependencyGraph,
      riskFactors,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error analyzing code intelligence:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
