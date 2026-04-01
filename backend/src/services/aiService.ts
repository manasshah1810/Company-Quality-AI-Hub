import Anthropic from "@anthropic-ai/sdk";

// Helper to get Anthropic client (lazy-loaded to ensure env vars are available)
function getAnthropicClient() {
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("VITE_ANTHROPIC_API_KEY environment variable not set");
    }
    return new Anthropic({ apiKey });
}

export interface HealingResult {
    healed: boolean;
    newSelector?: string;
    category: "UI Refactor" | "Copy Update" | "Functional Gap" | "System Bug";
    reason: string;
}

export async function attemptSelfHealing(
    screenshotBase64: string,
    failedSelector: string,
    pageContext: string
): Promise<HealingResult> {
    try {
        const anthropic = getAnthropicClient();
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are an AI Test Healing Agent (Winnie). 
              
I was looking for the element with selector '${failedSelector}' on this web page, but it could not be found. 
Context: ${pageContext}

Please analyze the attached screenshot. 
1. Do you see an element that performs the intended action of the original selector?
2. If yes, what is its new CSS selector or a stable locator?
3. Categorize this failure based on the Decision Matrix:
   - "UI Refactor": Element exists but moved (e.g. from Nav to Sidebar).
   - "Copy Update": Element exists but text/label changed.
   - "Functional Gap": Element is missing entirely and no similar intent is found.
   - "System Bug": Element is present but non-functional (e.g. results in error).

Return your response in JSON format exactly like this:
{
  "healed": boolean,
  "newSelector": "string",
  "category": "string",
  "reason": "string"
}`
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/png",
                                data: screenshotBase64,
                            },
                        },
                    ],
                },
            ],
        });

        const content = response.content[0];
        if (content.type === "text") {
            const result = JSON.parse(content.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
            return result as HealingResult;
        }

        throw new Error("Invalid response type from Anthropic");
    } catch (err) {
        console.error("AI Healing Service Error:", err);
        return {
            healed: false,
            category: "System Bug",
            reason: "AI Service failure during healing attempt.",
        };
    }
}

export async function performAgenticValidation(
    actualOutput: string,
    groundTruth: string,
    context: string
): Promise<{ score: number; reasoning: string }> {
    try {
        const anthropic = getAnthropicClient();
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 500,
            messages: [
                {
                    role: "user",
                    content: `You are a specialized QA Auditor (Winnie). Your task is to grade the accuracy of an AI Assistant's extraction.

Ground Truth (Correct Data):
${groundTruth}

Actual Extraction to Grade:
${actualOutput}

Context: ${context}

Evaluate the discrepancies (omissions, wrong values, hallucinations). Assign a score from 0 to 100 based on exactness. 
Return your response in JSON format exactly like this:
{
  "score": number,
  "reasoning": "brief explanation of score"
}`
                }
            ]
        });

        const content = response.content[0];
        if (content.type === "text") {
            const result = JSON.parse(content.text.match(/\{[\s\S]*\}/)?.[0] || '{"score": 0, "reasoning": "failed to parse"}');
            return result;
        }

        throw new Error("Invalid response type from Anthropic");
    } catch (err) {
        console.error("Agentic Validation Error:", err);
        return { score: 0, reasoning: "Evaluation engine failure." };
    }
}
