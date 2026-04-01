import { useState } from "react";
import { Sparkles, Loader2, Bot, Copy, Download, Code2, FileJson } from "lucide-react";
import { useClaudeAI } from "@/hooks/useClaudeAI";
import { toast } from "sonner";
import { SyntaxHighlighter } from "@/components/common/SyntaxHighlighter";

interface APIEndpoint {
  method: string;
  path: string;
  description?: string;
}

interface GeneratedAPITest {
  framework: string;
  language: string;
  code: string;
  endpoints: APIEndpoint[];
}

export function APISpecTestGenerator() {
  const [specContent, setSpecContent] = useState("");
  const [specType, setSpecType] = useState<"swagger" | "openapi">("openapi");
  const [framework, setFramework] = useState<"restassured" | "pytest" | "cypress">("restassured");
  const [generatedCode, setGeneratedCode] = useState<GeneratedAPITest | null>(null);
  const { callClaude, loading } = useClaudeAI();

  const reasoningSteps = [
    "Parsing API specification...",
    "Extracting endpoints and operations...",
    "Generating test cases for each endpoint...",
    "Adding assertion logic...",
    "Validating test completeness..."
  ];

  const [reasoningStep, setReasoningStep] = useState("");

  const frameworkConfig: Record<string, { lang: string; ext: string }> = {
    restassured: { lang: "java", ext: "java" },
    pytest: { lang: "python", ext: "py" },
    cypress: { lang: "javascript", ext: "js" },
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSpecContent(content);
      toast.success("API specification loaded");
    };
    reader.readAsText(file);
  };

  const generateTestCode = async () => {
    if (!specContent.trim()) {
      toast.error("Please paste or upload an API specification");
      return;
    }

    setGeneratedCode(null);

    let stepIdx = 0;
    const interval = setInterval(() => {
      setReasoningStep(reasoningSteps[stepIdx % reasoningSteps.length]);
      stepIdx++;
    }, 1500);

    try {
      const prompt = framework === "restassured"
        ? `You are a RestAssured expert. Generate executable Java test code for all endpoints in this API spec:

${specContent}

Requirements:
- Test positive cases (200, 201 responses)
- Include negative cases (400, 404, 500 errors)
- Use proper assertions
- Make it immediately runnable
- Return ONLY the executable Java code`
        : framework === "pytest"
          ? `You are a pytest expert. Generate executable Python test code using requests library for this API spec:

${specContent}

Requirements:
- Test all endpoints with different HTTP methods
- Include positive and negative test cases
- Use pytest assertions
- Make it immediately runnable
- Return ONLY the executable Python code`
          : `You are a Cypress expert. Generate executable JavaScript test code for this API spec:

${specContent}

Requirements:
- Use cy.request() for API calls
- Test all major endpoints
- Include assertions for responses
- Make it immediately runnable
- Return ONLY the executable JavaScript code`;

      const response = await callClaude("Generate API tests", prompt);

      let code = response;
      const codeMatch = response.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
      if (codeMatch) {
        code = codeMatch[1];
      }

      // Extract endpoints from spec (mock parsing)
      const endpoints: APIEndpoint[] = [];
      if (specContent.includes("paths")) {
        const pathMatch = specContent.match(/"paths":\s*{([^}]+)}/);
        if (pathMatch) {
          // Simple extraction
          const paths = pathMatch[1].match(/"\/[^"]+"/g) || [];
          paths.forEach((path) => {
            endpoints.push({
              method: "GET",
              path: path.replace(/"/g, ""),
              description: "API Endpoint"
            });
          });
        }
      }

      setGeneratedCode({
        framework,
        language: frameworkConfig[framework].lang,
        code: code.trim(),
        endpoints: endpoints.length > 0 ? endpoints : [
          { method: "GET", path: "/api/users", description: "Get all users" },
          { method: "POST", path: "/api/users", description: "Create user" },
          { method: "GET", path: "/api/users/{id}", description: "Get user by ID" },
        ]
      });

      toast.success("API tests generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate API tests");
    } finally {
      clearInterval(interval);
      setReasoningStep("");
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      toast.success("Code copied to clipboard");
    }
  };

  const handleDownload = () => {
    if (generatedCode) {
      const element = document.createElement("a");
      const file = new Blob([generatedCode.code], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `api-tests.${frameworkConfig[framework].ext}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success(`Downloaded as api-tests.${frameworkConfig[framework].ext}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Upload API Specification
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileUpload}
            className="hidden"
            id="spec-upload"
          />
          <label htmlFor="spec-upload" className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <FileJson className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload Swagger/OpenAPI spec</span>
          </label>
        </div>
      </div>

      <div className="relative">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Or Paste Specification
        </label>
        <textarea
          value={specContent}
          onChange={e => setSpecContent(e.target.value)}
          placeholder={`Paste your OpenAPI/Swagger specification (JSON or YAML) here...`}
          className="w-full h-40 px-4 py-3 rounded-lg bg-muted/30 text-foreground text-sm placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Select Test Framework
        </label>
        <div className="grid grid-cols-3 gap-3">
          {["restassured", "pytest", "cypress"].map((fw) => (
            <button
              key={fw}
              onClick={() => setFramework(fw as any)}
              className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all uppercase tracking-wider ${
                framework === fw
                  ? "bg-primary border-primary text-white"
                  : "bg-muted/20 border-border/50 text-foreground hover:border-primary/50"
              }`}
            >
              {fw === "pytest" ? "PyTest" : fw === "restassured" ? "RestAssured" : "Cypress"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={generateTestCode}
          disabled={loading || !specContent.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Test Suite
        </button>

        {loading && reasoningStep && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-medium animate-pulse">
            <Bot className="w-3 h-3" />
            <span>{reasoningStep}</span>
          </div>
        )}
      </div>

      {generatedCode && (
        <div className="space-y-6">
          {generatedCode.endpoints.length > 0 && (
            <div className="glass rounded-xl p-6 border border-border/50">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                Detected Endpoints
              </h3>
              <div className="space-y-2">
                {generatedCode.endpoints.map((endpoint, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded bg-muted/20 border border-border/30">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase min-w-max">
                      {endpoint.method}
                    </span>
                    <span className="text-sm font-mono text-foreground">{endpoint.path}</span>
                    {endpoint.description && (
                      <span className="text-xs text-muted-foreground ml-auto">{endpoint.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-6 space-y-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">
                  Generated {framework === "pytest" ? "PyTest" : framework === "restassured" ? "RestAssured" : "Cypress"} Tests
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>

            <SyntaxHighlighter
              code={generatedCode.code}
              language={generatedCode.language}
            />
          </div>
        </div>
      )}
    </div>
  );
}
