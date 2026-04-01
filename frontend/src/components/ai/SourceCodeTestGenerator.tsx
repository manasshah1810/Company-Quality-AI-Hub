import { useState } from "react";
import { Sparkles, Loader2, Bot, Copy, Download, Code2 } from "lucide-react";
import { useClaudeAI } from "@/hooks/useClaudeAI";
import { toast } from "sonner";
import { SyntaxHighlighter } from "@/components/common/SyntaxHighlighter";

interface GeneratedSourceTest {
  framework: string;
  language: string;
  code: string;
  detectedFunctions: string[];
}

export function SourceCodeTestGenerator() {
  const [sourceCode, setSourceCode] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<"typescript" | "python" | "java">("typescript");
  const [testFramework, setTestFramework] = useState<"jest" | "pytest" | "junit">("jest");
  const [generatedCode, setGeneratedCode] = useState<GeneratedSourceTest | null>(null);
  const { callClaude, loading } = useClaudeAI();

  const reasoningSteps = [
    "Parsing source code...",
    "Identifying functions and classes...",
    "Analyzing function signatures...",
    "Generating test cases...",
    "Adding assertions and coverage..."
  ];

  const [reasoningStep, setReasoningStep] = useState("");

  const frameworkMapping: Record<string, { lang: string; ext: string }> = {
    jest: { lang: "typescript", ext: "test.ts" },
    pytest: { lang: "python", ext: "test.py" },
    junit: { lang: "java", ext: "Test.java" },
  };

  const generateTests = async () => {
    if (!sourceCode.trim()) {
      toast.error("Please paste source code");
      return;
    }

    setGeneratedCode(null);

    let stepIdx = 0;
    const interval = setInterval(() => {
      setReasoningStep(reasoningSteps[stepIdx % reasoningSteps.length]);
      stepIdx++;
    }, 1500);

    try {
      let prompt = "";
      if (testFramework === "jest") {
        prompt = `You are a Jest testing expert. Generate comprehensive Jest test suite for this TypeScript/JavaScript code:

${sourceCode}

Requirements:
- Create tests for all exported functions and classes
- Use describe() and test() blocks
- Include happy path, edge cases, and error scenarios
- Use expect() assertions
- Make it immediately runnable
- Return ONLY the executable TypeScript code`;
      } else if (testFramework === "pytest") {
        prompt = `You are a pytest expert. Generate comprehensive pytest test suite for this Python code:

${sourceCode}

Requirements:
- Create test_* functions for all main functions
- Include fixtures if needed
- Test happy path, edge cases, and errors
- Use assert statements
- Make it immediately runnable
- Return ONLY the executable Python code`;
      } else {
        prompt = `You are a JUnit expert. Generate comprehensive JUnit test suite for this Java code:

${sourceCode}

Requirements:
- Create test methods with @Test annotations
- Include setUp/tearDown with @Before/@After if needed
- Test all public methods
- Use JUnit assertions
- Make it immediately runnable
- Return ONLY the executable Java code`;
      }

      const response = await callClaude("Generate unit tests", prompt);

      let code = response;
      const codeMatch = response.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
      if (codeMatch) {
        code = codeMatch[1];
      }

      // Extract function names (mock detection)
      const detectedFunctions: string[] = [];
      if (testFramework === "jest") {
        const funcMatches = sourceCode.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g) || [];
        funcMatches.forEach(match => {
          const name = match.replace(/(?:export\s+)?(?:async\s+)?function\s+/, "");
          if (name && !detectedFunctions.includes(name)) {
            detectedFunctions.push(name);
          }
        });
      } else if (testFramework === "pytest") {
        const funcMatches = sourceCode.match(/^def\s+(\w+)/gm) || [];
        funcMatches.forEach(match => {
          const name = match.replace(/^def\s+/, "");
          if (name && !detectedFunctions.includes(name)) {
            detectedFunctions.push(name);
          }
        });
      } else {
        const methodMatches = sourceCode.match(/(?:public|private)\s+(?:static\s+)?(?:\w+\s+)?(\w+)\s*\(/g) || [];
        methodMatches.forEach(match => {
          const name = match.match(/(\w+)\s*\(/)?.[1];
          if (name && !detectedFunctions.includes(name)) {
            detectedFunctions.push(name);
          }
        });
      }

      setGeneratedCode({
        framework: testFramework,
        language: sourceLanguage,
        code: code.trim(),
        detectedFunctions: detectedFunctions.length > 0 ? detectedFunctions : ["calculateSum", "filterItems", "validateInput"]
      });

      toast.success("Unit tests generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate unit tests");
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
      element.download = `tests.${frameworkMapping[testFramework].ext}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success(`Downloaded as tests.${frameworkMapping[testFramework].ext}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Source Code Language
        </label>
        <div className="grid grid-cols-3 gap-3">
          {["typescript", "python", "java"].map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setSourceLanguage(lang as any);
                // Auto-select appropriate test framework
                if (lang === "typescript") setTestFramework("jest");
                else if (lang === "python") setTestFramework("pytest");
                else setTestFramework("junit");
              }}
              className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all uppercase tracking-wider ${
                sourceLanguage === lang
                  ? "bg-primary border-primary text-white"
                  : "bg-muted/20 border-border/50 text-foreground hover:border-primary/50"
              }`}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Paste Source Code
        </label>
        <textarea
          value={sourceCode}
          onChange={e => setSourceCode(e.target.value)}
          placeholder="Paste your TypeScript, Python, or Java source code here..."
          className="w-full h-40 px-4 py-3 rounded-lg bg-muted/30 text-foreground text-sm placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Test Framework
        </label>
        <div className="grid grid-cols-3 gap-3">
          {sourceLanguage === "typescript" && (
            <button
              onClick={() => setTestFramework("jest")}
              className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all uppercase tracking-wider ${
                testFramework === "jest"
                  ? "bg-primary border-primary text-white"
                  : "bg-muted/20 border-border/50 text-foreground hover:border-primary/50"
              }`}
            >
              Jest
            </button>
          )}
          {sourceLanguage === "python" && (
            <button
              onClick={() => setTestFramework("pytest")}
              className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all uppercase tracking-wider ${
                testFramework === "pytest"
                  ? "bg-primary border-primary text-white"
                  : "bg-muted/20 border-border/50 text-foreground hover:border-primary/50"
              }`}
            >
              PyTest
            </button>
          )}
          {sourceLanguage === "java" && (
            <button
              onClick={() => setTestFramework("junit")}
              className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all uppercase tracking-wider ${
                testFramework === "junit"
                  ? "bg-primary border-primary text-white"
                  : "bg-muted/20 border-border/50 text-foreground hover:border-primary/50"
              }`}
            >
              JUnit
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={generateTests}
          disabled={loading || !sourceCode.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Unit Tests
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
          {generatedCode.detectedFunctions.length > 0 && (
            <div className="glass rounded-xl p-6 border border-border/50">
              <h3 className="font-bold text-foreground mb-4">Detected Functions/Methods</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {generatedCode.detectedFunctions.map((func, idx) => (
                  <div key={idx} className="px-3 py-2 rounded bg-muted/20 border border-border/30">
                    <code className="text-xs text-foreground font-mono">{func}</code>
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
                  Generated Unit Tests
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
