import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fetch from "node-fetch";

/**
 * Quality AI Hub MCP Server
 * ------------------------
 * Exposes core platform capabilities (Trigger Test, Generate Data)
 * as standard Model Context Protocol (MCP) tools.
 */
class QualityAIHubMCPServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: "quality-ai-hub-server",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupTools();
    }

    private setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "trigger_automation_test",
                        description: "Triggers a real-time Playwright automation test session.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                testType: { type: "string", description: "e.g. Functional, Regression, Performance" },
                                scenario: { type: "string", description: "The specific test scenario to execute" },
                                tenantId: { type: "string", description: "Target tenant ID (default: 'default')" },
                            },
                            required: ["scenario"],
                        },
                    },
                    {
                        name: "generate_synthetic_data",
                        description: "Generates AI-powered, compliant synthetic tax data records.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                formType: { type: "string", description: "e.g. W2, 1040, K-1" },
                                recordCount: { type: "number", description: "Number of records to generate" },
                                complexity: { type: "string", description: "Simple, Multi-Entity, or Edge Cases" },
                                tenantId: { type: "string", description: "Target tenant ID (default: 'default')" },
                            },
                            required: ["formType", "recordCount"],
                        },
                    },
                ],
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                if (name === "trigger_automation_test") {
                    const response = await fetch("http://localhost:5003/api/jobs/trigger", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-tenant-id": (args?.tenantId as string) || "default"
                        },
                        body: JSON.stringify(args),
                    });
                    const data = await response.json();
                    return { content: [{ type: "text", text: `Job Triggered: ${JSON.stringify(data)}` }] };
                }

                if (name === "generate_synthetic_data") {
                    const response = await fetch("http://localhost:5003/api/synthetic-data", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-tenant-id": (args?.tenantId as string) || "default"
                        },
                        body: JSON.stringify(args),
                    });
                    const data = await response.json();
                    return { content: [{ type: "text", text: `Data Generation Initialized: ${JSON.stringify(data)}` }] };
                }

                throw new Error(`Tool not found: ${name}`);
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error: ${error.message}` }],
                    isError: true,
                };
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("🚀 Quality AI Hub MCP Server running on stdio");
    }
}

const server = new QualityAIHubMCPServer();
server.run().catch(console.error);
