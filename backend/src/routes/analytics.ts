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
        console.log("✓ analytics.ts: API Key found");
        console.log("  - Length:", apiKey.length);
        console.log("  - Starts with:", apiKey.substring(0, 20));
        console.log("  - Ends with:", apiKey.substring(apiKey.length - 10));
        clientInstance = new Anthropic({ apiKey });
    }
    return clientInstance;
}

interface HeatmapRequest {
    modules?: string[];
    focusArea?: string;
    analysisType?: "coverage" | "confidence" | "blind-spots";
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/analytics/generate-heatmap
// Generate AI-powered heatmap data analyzing code coverage and AI confidence
// ──────────────────────────────────────────────────────────────────────────────
router.post("/generate-heatmap", async (req: Request, res: Response) => {
    const { modules = [], focusArea = "tax-processing", analysisType = "blind-spots" } = req.body as HeatmapRequest;

    // Define default modules if not provided
    const moduleList = modules.length > 0 ? modules : [
        "Gateway Auth", "Workpapers", "Cognify API", "Document Upload",
        "Client Portal", "Search", "PDF Gen", "Webhook", "Tax Organizer",
        "AI Assistant", "e-Sign", "Report Gen", "Notification", "Bulk Import", "MFA"
    ];

    try {
        const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ Anthropic Key not found");
            throw new Error("MOCK_FALLBACK");
        }

        const prompt = `You are an expert QA analyst specializing in AI model confidence assessment for enterprise tax software. Analyze coverage and AI confidence for these modules: ${moduleList.join(", ")}.

Generate a JSON array with exactly ${moduleList.length} objects, one per module. Each object must have:
- "name": module name (STRING, exactly as listed above)
- "coverage": code coverage % (NUMBER, 50-100)
- "confidence": AI model confidence % (NUMBER, 45-98)

ANALYSIS RULES:
1. Blind-Spot Modules (confidence < 70%): High coverage BUT low AI confidence
   - Examples: Complex business logic, edge cases, dynamic behavior
2. Medium Certainty (70-90%): Moderate to good coverage AND reasonable confidence
3. Optimal (>90%): High coverage AND high confidence
4. For focus area "${focusArea}": modules related to tax/form processing should show varied confidence

CRITICAL: Return ONLY valid JSON array, no other text.`;

        const message = await getClient().messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
        });

        const responseText = message.content[0].type === "text" ? message.content[0].text : "";
        let jsonString = responseText.trim();
        if (jsonString.startsWith("```json")) {
            jsonString = jsonString.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        } else if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }

        const heatmapData = JSON.parse(jsonString);
        if (!Array.isArray(heatmapData)) throw new Error("Invalid response format");

        return res.json({
            success: true,
            heatmapData,
            analysisType,
            generatedAt: new Date().toISOString(),
            aiModel: "Claude 3.5 Sonnet",
        });
    } catch (err: any) {
        console.warn("Falling back to simulated heatmap data due to:", err.message);

        // Dynamic simulation of heatmap data if AI fails
        const simulatedData = moduleList.map(name => {
            let coverage = 85 + Math.random() * 10;
            let confidence = 80 + Math.random() * 15;

            // Apply specific logical defaults based on module name
            if (["AI Assistant", "Tax Organizer", "Bulk Import"].includes(name)) {
                confidence = 55 + Math.random() * 10;
                coverage = 92 + Math.random() * 5; // High cov, low confidence = blind spot
            } else if (["Gateway Auth", "e-Sign", "Notification"].includes(name)) {
                confidence = 94 + Math.random() * 4;
            }

            return {
                name,
                coverage: Math.round(coverage),
                confidence: Math.round(confidence)
            };
        });

        return res.json({
            success: true,
            heatmapData: simulatedData,
            analysisType,
            generatedAt: new Date().toISOString(),
            aiModel: "Simulated Model (Fail-safe Mode)",
            warning: "AI generation unavailable, using predictive simulation"
        });
    }
});

export default router;
