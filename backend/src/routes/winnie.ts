import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// ---------------------------------------------------------------------------
// Winnie System Prompt — PRD Section 6: The Intelligence Feedback Loop
// ---------------------------------------------------------------------------
// Winnie is the self-healing engine's reasoning brain. Given a failure log or
// UI diff, she produces a structured analysis with:
//   • inference      — the root-cause classification
//   • confidence     — a 0-100 numeric score
//   • reasoning_trace — a step-by-step chain-of-thought
// ---------------------------------------------------------------------------

const WINNIE_SYSTEM_PROMPT = `You are **Winnie**, the AI Intelligence Agent powering the self-healing test automation engine for a QA platform called "Quality AI Hub."

Your job is to analyze test failures and UI diffs to determine WHY a test element could not be found or interacted with, and to classify what happened.

## Your Classification Categories
You MUST classify every failure into exactly ONE of these categories:
1. **UI Refactor** — The element still exists but its selector (id, class, data-testid) changed due to a UI refactoring or framework update. This is safe to auto-heal.
2. **Copy Update** — The element's visible text or label was updated (e.g., "Submit" became "Send"), but functionality is unchanged. Safe to auto-heal.
3. **Functional Gap** — The element was intentionally removed or its behavior fundamentally changed. This is a TRUE failure and must be escalated as a defect.
4. **System Bug** — The failure is caused by a backend error (500, timeout, CORS), infrastructure issue, or runtime exception unrelated to UI changes. Must be escalated.

## Your Analysis Process (Reasoning Trace)
For every input, you must think step-by-step:
1. **DOM Analysis**: Examine what element was sought vs. what was observed.
2. **Semantic Intent Matching**: Determine if the *functional intent* of the element still exists on the page (even if the selector changed).
3. **Visual Drift Assessment**: Estimate how much the element's position/appearance shifted.
4. **Historical Pattern Matching**: Reference known patterns (framework upgrades, theme changes, refactors) that commonly cause this type of failure.
5. **Confidence Calibration**: Assign a confidence score (0–100) based on how certain you are about your classification. Scores above 90 indicate auto-heal candidates. Scores below 70 require human review.

## Output Format
You MUST respond with valid JSON only. No markdown, no code fences, no explanation outside the JSON:
{
  "inference": "UI Refactor" | "Copy Update" | "Functional Gap" | "System Bug",
  "confidence_score": <number 0-100>,
  "reasoning_trace": [
    "Step 1: <DOM Analysis finding>",
    "Step 2: <Semantic intent finding>",
    "Step 3: <Visual drift finding>",
    "Step 4: <Historical pattern finding>",
    "Step 5: <Confidence calibration rationale>"
  ],
  "healed_selector": "<suggested new selector if applicable, otherwise null>",
  "risk_level": "low" | "medium" | "high" | "critical",
  "recommended_action": "auto_heal" | "human_review" | "escalate_defect" | "escalate_bug"
}`;

// ---------------------------------------------------------------------------
// POST /api/ai/winnie/reason
// ---------------------------------------------------------------------------
router.post("/reason", async (req: Request, res: Response) => {
    try {
        const { failureLog, uiDiff, event } = req.body as {
            failureLog?: string;
            uiDiff?: string;
            event?: {
                id: string;
                suite: string;
                elementSought: string;
                observation: string;
                inference: string;
                action: string;
                confidence: number;
                status: string;
            };
        };

        // Validate input — at least one of the three must be present
        if (!failureLog && !uiDiff && !event) {
            return res.status(400).json({
                error:
                    "Request body must include at least one of: failureLog, uiDiff, or event",
            });
        }

        // Build the user prompt from whatever was provided
        const parts: string[] = [];

        if (event) {
            parts.push(
                `## Healing Event Context`,
                `- **Event ID**: ${event.id}`,
                `- **Test Suite**: ${event.suite}`,
                `- **Element Sought**: ${event.elementSought}`,
                `- **Observation**: ${event.observation}`,
                `- **Current AI Inference**: ${event.inference}`,
                `- **Current Action**: ${event.action}`,
                `- **Current Confidence**: ${event.confidence}%`,
                `- **Status**: ${event.status}`,
                ""
            );
        }

        if (failureLog) {
            parts.push(`## Failure Log`, "```", failureLog, "```", "");
        }

        if (uiDiff) {
            parts.push(`## UI Diff`, "```diff", uiDiff, "```", "");
        }

        parts.push(
            "Analyze the above and respond with your structured JSON reasoning."
        );

        const userMessage = parts.join("\n");

        // ── Call Anthropic ────────────────────────────────────────────────────
        const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error:
                    "VITE_ANTHROPIC_API_KEY is not set. Add it to .env at the project root.",
            });
        }

        const anthropic = new Anthropic({ apiKey });

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: WINNIE_SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }],
        });

        // Extract the text block from the response
        const textBlock = message.content.find((b) => b.type === "text");
        const rawText = textBlock?.text ?? "";

        // Parse the JSON response
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            // If the model wrapped it in markdown fences, strip them
            const stripped = rawText
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            parsed = JSON.parse(stripped);
        }

        return res.json({
            ...parsed,
            _model: "claude-sonnet-4-6",
            _tokens: {
                input: message.usage?.input_tokens,
                output: message.usage?.output_tokens,
            },
        });
    } catch (err: any) {
        console.error("Winnie reasoning error:", err);

        // Surface Anthropic-specific errors clearly
        if (err?.status) {
            return res.status(err.status).json({
                error: `Anthropic API error: ${err.message}`,
                status: err.status,
            });
        }

        return res.status(500).json({ error: "Internal server error" });
    }
});

// ---------------------------------------------------------------------------
// POST /api/ai/winnie/proxy
// Proxy for direct LLM calls from hooks/useClaudeAI.ts
// ---------------------------------------------------------------------------
router.post("/proxy", async (req: Request, res: Response) => {
    try {
        const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Anthropic API key not set in environment." });

        const anthropic = new Anthropic({ apiKey });
        const { model, max_tokens, system, messages, stream } = req.body;

        if (stream) {
            // Streaming response implementation
            const streamResponse = await anthropic.messages.create({
                model: model || "claude-3-5-sonnet-latest",
                max_tokens: max_tokens || 1024,
                system,
                messages,
                stream: true,
            });

            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            for await (const chunk of streamResponse) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            return res.end();
        } else {
            console.log(`[Winnie-Proxy] Calling Claude with model: ${model || "claude-3-5-sonnet-latest"}`);
            const message = await anthropic.messages.create({
                model: model || "claude-3-5-sonnet-latest",
                max_tokens: max_tokens || 1024,
                system,
                messages,
            });
            console.log(`[Winnie-Proxy] Claude response received.`);
            return res.json(message);
        }
    } catch (err: any) {
        console.error("Winnie proxy error:", err);
        return res.status(err.status || 500).json({ error: err.message });
    }
});

export default router;
