import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// Lazy initialize Anthropic client to ensure env vars are loaded
let clientInstance: Anthropic | null = null;
function getClient(): Anthropic {
    if (!clientInstance) {
        const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.error("❌ VITE_ANTHROPIC_API_KEY is not set!");
            throw new Error("VITE_ANTHROPIC_API_KEY environment variable not set");
        }
        console.log("✓ analysis.ts: API Key found");
        console.log("  - Length:", apiKey.length);
        console.log("  - Starts with:", apiKey.substring(0, 20));
        console.log("  - Ends with:", apiKey.substring(apiKey.length - 10));
        clientInstance = new Anthropic({ apiKey });
    }
    return clientInstance;
}

interface AnalysisRequest {
    selectedClient: string;
    stressLevel: string;
    simMetrics: {
        throughput: number;
        errorRate: number;
        p95: number;
        progress: number;
    };
    simResources: {
        cpu: number;
        ram: number;
        containers: number;
    };
    tenantClients: Array<{
        name: string;
        healthScore: number;
        passRate: number;
        activeSuites: number;
    }>;
    clientTiles: Array<{
        tileName: string;
        type: string;
        testCases: number;
        passRate: number;
        avgLatency: number;
        issues: number;
        slaMet: boolean;
    }>;
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/analysis/generate-report
// Generate AI-powered audit report using Claude
// ──────────────────────────────────────────────────────────────────────────────
router.post("/generate-report", async (req: Request, res: Response) => {
    try {
        const {
            selectedClient,
            stressLevel,
            simMetrics,
            simResources,
            tenantClients,
            clientTiles,
        } = req.body as AnalysisRequest;

        // Build context for Claude
        const reportContext = `
You are an expert AI Performance Analysis system generating a professional audit report. Analyze the following multi-tenant simulation data and provide a comprehensive performance analysis.

SIMULATION CONTEXT:
- Client: ${selectedClient}
- Stress Level: ${stressLevel}
- Throughput: ${simMetrics.throughput} req/s
- Error Rate: ${simMetrics.errorRate}%
- P95 Latency: ${simMetrics.p95}ms
- CPU Allocation: ${simResources.cpu} cores
- RAM Allocation: ${simResources.ram}GB
- Active Containers: ${simResources.containers}

TENANT HEALTH SNAPSHOT:
${tenantClients.map(c => `- ${c.name}: Health=${c.healthScore}%, PassRate=${c.passRate}%, Suites=${c.activeSuites}`).join('\n')}

CLIENT TILES PERFORMANCE:
${clientTiles.map(t => `- ${t.tileName} (${t.type}): PassRate=${t.passRate}%, Latency=${t.avgLatency}ms, Issues=${t.issues}, SLA=${t.slaMet ? 'MET' : 'BREACHED'}`).join('\n')}

REQUIREMENTS:
1. Provide a professional analysis (2-3 sentences max)
2. Highlight critical findings
3. Include specific metrics and uptime percentage
4. Mention architectural impact
5. Provide verdict (COMPLIANT, DEGRADED, or CRITICAL)
6. Use technical but accessible language
7. Format as a single coherent paragraph

Generate a compelling AI Performance Analysis Report now:
`;

        const message = await getClient().messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: reportContext,
                },
            ],
        });

        const analysisText =
            message.content[0].type === "text" ? message.content[0].text : "Analysis generation failed";

        return res.json({
            success: true,
            report: analysisText,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
        console.error("❌ Error generating AI analysis:");
        console.error("  Error type:", err.type || err.name);
        console.error("  Error message:", err.message);
        console.error("  API Key from env at error time - Length:", apiKey?.length);
        console.error("  API Key starts with:", apiKey?.substring(0, 20));
        console.error("  API Key ends with:", apiKey?.substring((apiKey?.length || 0) - 10));
        console.error("  Full error:", JSON.stringify(err, null, 2));
        return res.status(500).json({
            error: "Failed to generate AI analysis",
            details: err.message,
        });
    }
});

export default router;
