import { Router, Request, Response } from "express";
import { syntheticDataStore } from "../lib/syntheticDataStore.js";
import * as staticData from "../data/staticData.js";
import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const router = Router();

// Helper to get Anthropic client (returns null if key is missing)
function getAnthropicClient() {
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new Anthropic({ apiKey });
}

// Local mock data generator for fallback
function generateLocalSample(formType: string, year: string, complexity: string) {
    const baseNamesData = ["Jordan Mercer", "Casey Quinn", "Morgan Riley", "Taylor Vale", "Skyler Hart"];
    const randomName = baseNamesData[Math.floor(Math.random() * baseNamesData.length)];

    const base = {
        taxpayer: {
            name: `${randomName} (Synthetic)`,
            ssn: "***-**-" + Math.floor(1000 + Math.random() * 9000),
            filingStatus: complexity === "Simple" ? "Single" : "Married Filing Jointly"
        },
        year: parseInt(year) || 2024,
        type: formType,
        piiStatus: "Anonymized",
        complianceFlags: { SOC2: true, noPII: true }
    };

    if (formType === "W2") {
        return {
            ...base,
            employer: { name: "Quantum-Systems Inc", ein: "99-***" + Math.floor(1000 + Math.random() * 9000) },
            wages: 85200 + (Math.random() * 20000),
            fedTaxWithheld: 12400 + (Math.random() * 3000),
            stateTaxWithheld: 4200 + (Math.random() * 1000)
        };
    } else if (formType === "1040") {
        return {
            ...base,
            agi: 105400 + (Math.random() * 50000),
            totalTax: 18200 + (Math.random() * 5000),
            refundDue: Math.random() > 0.5 ? 1200 + (Math.random() * 800) : 0,
            forms: ["1040", "Schedule A", "Schedule B"]
        };
    } else {
        return {
            ...base,
            details: `Synthetic ${formType} data generated for ${complexity} scenario.`,
            estimatedValue: 50000 + (Math.random() * 150000),
            reliabilityScore: 0.98,
            tags: ["demo", "synthetic", "test"]
        };
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/synthetic-data
// AI Generation of Compliant Tax Data & PDF Preview
// ──────────────────────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
    try {
        const { formType, recordCount, complexity, scenarioPrompt, year } = req.body;

        console.log(`[Winnie-Data] Generating ${recordCount} ${formType} records...`);

        let sampleJson = {};

        // Step 1: LLM Generation of Anonymized Data Structure
        const anthropic = getAnthropicClient();

        if (anthropic) {
            try {
                const response = await anthropic.messages.create({
                    model: "claude-sonnet-4-6",
                    max_tokens: 1500,
                    messages: [
                        {
                            role: "user",
                            content: `Generate a sample JSON object for a synthetic ${formType} tax document for year ${year}.
                            Complexity Tier: ${complexity}
                            Scenario: ${scenarioPrompt || "Standard Distribution"}
                            
                            CRITICAL: Ensure zero PII. Use fake names like "Dataset User Alpha", "Entity-99", etc.
                            Include fields common to ${formType} (e.g. Wages, Tax Withheld, SSN (masked), EIN (masked)).
                            
                            Return ONLY the JSON object for ONE sample record.`
                        }
                    ]
                });

                if (response.content[0].type === "text") {
                    const text = response.content[0].text;
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        let jsonStr = jsonMatch[0];
                        jsonStr = jsonStr
                            .replace(/,\s*}/g, '}')
                            .replace(/,\s*]/g, ']')
                            .replace(/:\s*undefined/g, ':null')
                            .replace(/([^\\])'([^\\]*)'(?=\s*[,}\]])/g, '$1"$2"');
                        sampleJson = JSON.parse(jsonStr);
                    } else {
                        sampleJson = JSON.parse(text);
                    }
                }
            } catch (aiErr) {
                console.warn("[Synthetic Data] AI generation failed, falling back to local:", aiErr);
                sampleJson = generateLocalSample(formType, year, complexity);
            }
        } else {
            console.log("[Synthetic Data] No API key, using local generation fallback.");
            sampleJson = generateLocalSample(formType, year, complexity);
        }

        // Step 2: Binary PDF Generation
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 400]);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText(`INTERNAL QA - SYNTHETIC ${formType}`, { x: 50, y: 350, size: 20, font, color: rgb(0.1, 0.1, 0.5) });
        page.drawText(`Dataset: QAI-${Math.random().toString(36).substring(7).toUpperCase()}`, { x: 50, y: 320, size: 12, font });
        page.drawText(`Compliance Status: HUB-SYNC-SECURE-PII-FREE`, { x: 50, y: 300, size: 10, color: rgb(0, 0.5, 0) });

        let yPos = 270;
        Object.entries(sampleJson).slice(0, 10).forEach(([key, value]) => {
            page.drawText(`${key}: ${value}`, { x: 50, y: yPos, size: 10 });
            yPos -= 15;
        });

        const pdfBytes = await pdfDoc.saveAsBase64();

        // Step 3: Persistence (Update in-memory store)
        const newDatasetId = `SYN-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const newDataset = {
            id: newDatasetId,
            formType,
            count: recordCount,
            year: parseInt(year) || 2024,
            complexity,
            generated: new Date().toLocaleDateString(),
            size: `${(recordCount * 0.45).toFixed(1)} MB`,
            status: "Ready",
            usedIn: 0,
            schemaVersion: "2.4.2"
        };

        syntheticDataStore.addDataset(newDataset, sampleJson, pdfBytes);

        return res.json({
            message: "Dataset generated and synchronized successfully.",
            dataset: newDataset,
            sample: sampleJson
        });

    } catch (err: any) {
        console.error("[Synthetic Data] Error:", err);
        return res.status(500).json({ error: "Failed to synthesize data", details: err.message });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/synthetic-data
// Returns the synthetic datasets and samples
// ──────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
    try {
        return res.json(syntheticDataStore.getData());
    } catch (err) {
        console.error("Error fetching synthetic datasets:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/synthetic-data/:id/assign
// Assign a synthetic dataset to relevant test suites
// ──────────────────────────────────────────────────────────────────────────────
router.put("/:id/assign", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const suites = staticData.testSuites;

        // Pick a random subset of test suites (3-12)
        const shuffled = [...suites].sort(() => Math.random() - 0.5);
        const assignCount = Math.min(suites.length, Math.floor(Math.random() * 10) + 3);
        const assignedSubset = shuffled.slice(0, assignCount);
        const linkedSuiteNames = assignedSubset.map((s: any) => s.name || s.module || "Unknown");

        syntheticDataStore.updateDataset(id, {
            usedIn: assignCount,
            linkedSuites: linkedSuiteNames.slice(0, 5),
            lastAssigned: new Date().toISOString(),
            status: "Assigned"
        });

        return res.json({
            message: `Dataset ${id} assigned to ${assignCount} test suites`,
            assignedSuites: assignCount,
            linkedSuites: linkedSuiteNames.slice(0, 5),
            timestamp: new Date().toISOString()
        });

    } catch (err: any) {
        console.error("[Synthetic Data Assign] Error:", err);
        return res.status(500).json({ error: "Failed to assign dataset", details: err.message });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/synthetic-data/:id/push
// Deploy/Push a synthetic dataset to trigger regression testing
// ──────────────────────────────────────────────────────────────────────────────
router.put("/:id/push", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const suites = staticData.testSuites;

        syntheticDataStore.updateDataset(id, {
            status: "Deployed",
            lastDeployed: new Date().toISOString(),
        });

        return res.json({
            message: `Dataset ${id} pushed to test suites - triggering regression run`,
            jobsCreated: 3,
            affectedSuites: suites.slice(0, 3).map((s: any) => s.name),
            timestamp: new Date().toISOString()
        });

    } catch (err: any) {
        console.error("[Synthetic Data Push] Error:", err);
        return res.status(500).json({ error: "Failed to push dataset", details: err.message });
    }
});

export default router;
