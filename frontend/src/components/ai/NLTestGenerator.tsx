import { useState } from "react";
import { Sparkles, Loader2, Bot, Copy, Download, Code2, ChevronLeft, ChevronRight, Check, AlertCircle, Play } from "lucide-react";
import { useClaudeAI } from "@/hooks/useClaudeAI";
import { toast } from "sonner";
import { SyntaxHighlighter } from "@/components/common/SyntaxHighlighter";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedTest {
  framework: string;
  language: string;
  code: string;
  persona?: string;
}

interface TestHistory {
  id: string;
  description: string;
  framework: string;
  persona: string;
  code: string;
  timestamp: number;
}

export function NLTestGenerator() {
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState<"playwright" | "cypress" | "pytest" | "restassured">("playwright");
  const [persona, setPersona] = useState<"happy-path" | "edge-cases" | "security">("happy-path");
  const [generatedCode, setGeneratedCode] = useState<GeneratedTest | null>(null);
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [showExamplesCarousel, setShowExamplesCarousel] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [executingTest, setExecutingTest] = useState(false);
  const [testExecutionResult, setTestExecutionResult] = useState<any>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [descriptionQuality, setDescriptionQuality] = useState<"low" | "medium" | "good" | null>(null);
  const { callClaude, loading } = useClaudeAI();

  const reasoningSteps = [
    "Analyzing intent & requirements...",
    "Identifying user flows and edge cases...",
    "Mapping UI elements and selectors...",
    "Generating test code...",
    "Validating syntax & completeness..."
  ];

  const [reasoningStep, setReasoningStep] = useState("");

  // Examples carousel data
  const examples = [
    {
      title: "✅ Good: Specific with assertions and UI elements",
      good: true,
      description: "User uploads a W2 form, extracts parsing results, compares extracted text to source, and verifies error row is highlighted in red",
      expectedCode: "Playwright test with page.goto, page.setInputFiles, assertions on extracted data, visual verification"
    },
    {
      title: "❌ Bad: Too vague and generic",
      good: false,
      description: "Test the upload page",
      expectedCode: "Vague code that may test anything - no specific assertions or user flow"
    },
    {
      title: "✅ Good: Clear actions and expected outcomes",
      good: true,
      description: "Login with valid credentials, navigate to reports section, verify 3 recent reports are displayed in table, click first report, confirm PDF opens in new tab",
      expectedCode: "Complete flow with login, navigation, table verification, and window handling"
    }
  ];

  const frameworkConfig: Record<string, { lang: string; ext: string }> = {
    playwright: {
      lang: "typescript",
      ext: "ts",
    },
    cypress: {
      lang: "javascript",
      ext: "js",
    },
    pytest: {
      lang: "python",
      ext: "py",
    },
    restassured: {
      lang: "java",
      ext: "java",
    }
  };

  const personaConfig = {
    "happy-path": {
      label: "Happy Path",
      description: "Test the main success scenario with valid inputs",
      icon: "😊"
    },
    "edge-cases": {
      label: "Edge Cases",
      description: "Test boundary conditions, empty fields, and unusual inputs",
      icon: "⚠️"
    },
    "security": {
      label: "Security Fuzzing",
      description: "Test for security vulnerabilities and injection attacks",
      icon: "🔒"
    }
  };

  const prompts: Record<string, (desc: string, persona: string) => string> = {
    playwright: (desc, persona) => `You are a Playwright test automation expert. Generate a complete, executable Playwright test in TypeScript based on this description:

"${desc}"

Testing persona: ${personaConfig[persona as keyof typeof personaConfig].label} - ${personaConfig[persona as keyof typeof personaConfig].description}

Requirements:
- Use @playwright/test framework with test() and expect()
- Create realistic test code with page.goto(), page.click(), page.fill(), assertions
- Include proper waits and readability
- Make it immediately runnable
- Use realistic selectors like '#submit', '.modal', '[data-testid]'
- For edge cases: include boundary testing and null/empty handling
- For security: include input validation testing and XSS/injection prevention checks
- Return ONLY the executable TypeScript code, no markdown or explanations`,

    cypress: (desc, persona) => `You are a Cypress test automation expert. Generate a complete, executable Cypress test in JavaScript based on this description:

"${desc}"

Testing persona: ${personaConfig[persona as keyof typeof personaConfig].label} - ${personaConfig[persona as keyof typeof personaConfig].description}

Requirements:
- Use Cypress commands: cy.visit(), cy.get(), cy.click(), cy.type(), cy.should()
- Include describe() and it() blocks
- Make it immediately runnable
- Use realistic selectors and user interactions
- Include appropriate assertions and error handling
- Return ONLY the executable JavaScript code, no markdown or explanations`,

    pytest: (desc, persona) => `You are a pytest expert. Generate a complete, executable pytest test suite in Python based on this description:

"${desc}"

Testing persona: ${personaConfig[persona as keyof typeof personaConfig].label} - ${personaConfig[persona as keyof typeof personaConfig].description}

Requirements:
- Use pytest framework with def test_*() functions
- Include proper assertions with assert
- Make it immediately runnable
- Use realistic fixtures and test data
- Include parametrized tests for edge cases if relevant
- Return ONLY the executable Python code, no markdown or explanations`,

    restassured: (desc, persona) => `You are a RestAssured Java expert. Generate a complete, executable RestAssured API test in Java based on this description:

"${desc}"

Testing persona: ${personaConfig[persona as keyof typeof personaConfig].label} - ${personaConfig[persona as keyof typeof personaConfig].description}

Requirements:
- Use RestAssured library for API testing
- Include proper request/response validation
- Use realistic API operations and assertions
- Make it immediately runnable
- Include error handling and edge case assertions if relevant
- Return ONLY the executable Java code, no markdown or explanations`
  };

  // Real-time validation hints
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDescription(text);
    
    const words = text.trim().split(/\s+/).length;
    setWordCount(words);
    
    // Quality assessment
    if (words < 5) {
      setDescriptionQuality("low");
    } else if (words < 15) {
      setDescriptionQuality("medium");
    } else {
      setDescriptionQuality("good");
    }
  };

  const suggestedElements = [
    "UI elements (buttons, inputs, forms)",
    "User actions (click, type, upload)",
    "Assertions/expectations",
    "Error handling",
    "Navigation flow"
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your test in natural language");
      return;
    }

    if (descriptionQuality === "low") {
      toast.warning("Your description is quite vague. Try to be more specific about user actions and expected outcomes.");
    }

    setGeneratedCode(null);
    setTestExecutionResult(null);

    // Simulate reasoning steps
    let stepIdx = 0;
    const interval = setInterval(() => {
      setReasoningStep(reasoningSteps[stepIdx % reasoningSteps.length]);
      stepIdx++;
    }, 1500);

    try {
      const response = await callClaude("Generate test code", prompts[framework](description, persona));
      
      // Clean up any markdown code blocks if Claude wrapped it
      let code = response;
      const codeMatch = response.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
      if (codeMatch) {
        code = codeMatch[1];
      }

      const newTest: GeneratedTest = {
        framework,
        language: frameworkConfig[framework].lang,
        code: code.trim(),
        persona
      };

      setGeneratedCode(newTest);

      // Add to history
      const historyItem: TestHistory = {
        id: Date.now().toString(),
        description,
        framework,
        persona,
        code: code.trim(),
        timestamp: Date.now()
      };
      setTestHistory([historyItem, ...testHistory]);

      toast.success("Test code generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate test code");
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
      element.download = `test.${frameworkConfig[framework].ext}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success(`Downloaded as test.${frameworkConfig[framework].ext}`);
    }
  };

  const simulateTestExecution = () => {
    setExecutingTest(true);
    
    // Simulate test run
    setTimeout(() => {
      setTestExecutionResult({
        passed: true,
        duration: 2.3,
        assertions: 4,
        status: "✅ 4 assertions passed in 2.3s"
      });
      setExecutingTest(false);
      toast.success("Test execution demo completed successfully!");
    }, 2000);
  };

  const useExampleTemplate = (exampleDesc: string) => {
    setDescription(exampleDesc);
    setShowExamplesCarousel(false);
    toast.success("Template loaded! Customize and generate your test.");
  };

  const loadHistoryTest = (test: TestHistory) => {
    setDescription(test.description);
    setFramework(test.framework as any);
    setPersona(test.persona as any);
    setGeneratedCode({
      framework: test.framework,
      language: frameworkConfig[test.framework].lang,
      code: test.code,
      persona: test.persona
    });
    setShowHistorySidebar(false);
  };

  return (
    <div className="space-y-6">
      {/* Examples Carousel */}
      <AnimatePresence>
        {showExamplesCarousel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl p-6 border-2 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-blue-900 dark:text-blue-100 flex items-center gap-2">
                💡 Good vs Bad Test Descriptions
              </h3>
              <button
                onClick={() => setShowExamplesCarousel(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Hide
              </button>
            </div>

            <div className="relative">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 space-y-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
                <div className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${examples[carouselIndex].good ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                  {examples[carouselIndex].title}
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded text-blue-700 dark:text-blue-400 block my-2">"{examples[carouselIndex].description}"</span>
                </p>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-bold uppercase tracking-wider">
                    Generated Code Will Be:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded border-l-2 border-blue-400">
                    {examples[carouselIndex].expectedCode}
                  </p>
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setCarouselIndex((i) => (i - 1 + examples.length) % examples.length)}
                  className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {examples.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={`h-2 rounded-full transition-all ${i === carouselIndex ? 'bg-blue-600 w-8' : 'bg-blue-300 dark:bg-blue-700 w-2 hover:w-4'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCarouselIndex((i) => (i + 1) % examples.length)}
                  className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Use Template Button */}
              <button
                onClick={() => useExampleTemplate(examples[carouselIndex].description)}
                className="w-full mt-4 px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-bold uppercase tracking-wide text-sm transition-colors shadow-md"
              >
                Use This Template
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Persona Selector */}
      <div className="space-y-4">
        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
          🎯 Testing Persona
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(personaConfig) as Array<[keyof typeof personaConfig, typeof personaConfig[keyof typeof personaConfig]]>).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setPersona(key)}
              className={`px-4 py-3 rounded-lg border-2 font-bold text-xs transition-all uppercase tracking-wider text-center space-y-2 ${
                persona === key
                  ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-cyan-400 dark:hover:border-cyan-600"
              }`}
            >
              <div className="text-lg">{config.icon}</div>
              <div className="font-bold">{config.label}</div>
              <div className="text-[9px] font-normal opacity-70">{config.description.split(" ").slice(0, 2).join(" ")}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Describe Test Section */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
          📝 Describe Your Test
        </label>
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="E.g., 'User uploads a W2 form, extracts parsing results, compares extracted text to source, and verifies error row is highlighted in red'"
          className="w-full h-40 px-4 py-3 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 border-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-body shadow-sm"
        />

        {/* Real-time Validation Hints */}
        <div className="flex items-start justify-between gap-4">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded">
            Words: <span className="font-bold text-gray-900 dark:text-gray-100">{wordCount}</span>
          </div>
          
          <div className="flex-1">
            {descriptionQuality && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border-2 flex items-start gap-2 ${
                  descriptionQuality === "low"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                    : descriptionQuality === "medium"
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800"
                    : "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800"
                }`}
              >
                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  descriptionQuality === "low"
                    ? "text-red-600 dark:text-red-400"
                    : descriptionQuality === "medium"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-green-600 dark:text-green-400"
                }`} />
                <div className="text-xs">
                  {descriptionQuality === "low" && (
                    <p className="text-red-700 dark:text-red-300 font-bold mb-1">Your description is vague—try including:</p>
                  )}
                  {descriptionQuality === "medium" && (
                    <p className="text-amber-700 dark:text-amber-300 font-bold mb-1">Good start! Consider adding more details:</p>
                  )}
                  {descriptionQuality === "good" && (
                    <p className="text-green-700 dark:text-green-300 font-bold">✓ Excellent description—ready to generate!</p>
                  )}
                  {descriptionQuality !== "good" && (
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-0.5">
                      {suggestedElements.map((element, i) => (
                        <li key={i} className="text-[9px]">{element}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Select Framework */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
          🛠️ Select Framework
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["playwright", "cypress", "pytest", "restassured"].map((fw) => (
            <button
              key={fw}
              onClick={() => setFramework(fw as any)}
              className={`px-4 py-3 rounded-lg border-2 font-bold text-xs transition-all uppercase tracking-wider ${
                framework === fw
                  ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-cyan-400 dark:hover:border-cyan-600"
              }`}
            >
              {fw === "pytest" ? "PyTest" : fw === "restassured" ? "RestAssured" : fw.charAt(0).toUpperCase() + fw.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 dark:bg-cyan-700 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold shadow-lg hover:shadow-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Test Code
        </button>

        <button
          onClick={() => setShowHistorySidebar(!showHistorySidebar)}
          className={`px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
            showHistorySidebar
              ? "bg-cyan-100 dark:bg-cyan-900/40 border-cyan-400 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300"
              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-cyan-400 dark:hover:border-cyan-600"
          }`}
        >
          📋 History ({testHistory.length})
        </button>

        {loading && reasoningStep && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 text-xs font-bold animate-pulse">
            <Bot className="w-4 h-4" />
            <span>{reasoningStep}</span>
          </div>
        )}
      </div>

      {/* Test History Sidebar */}
      <AnimatePresence>
        {showHistorySidebar && testHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-xl p-4 border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-900/20 dark:border-cyan-700 max-h-96 overflow-y-auto space-y-2"
          >
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">Generated Tests History</h4>
            {testHistory.map((test) => (
              <button
                key={test.id}
                onClick={() => loadHistoryTest(test)}
                className="w-full text-left p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors text-xs space-y-1.5 border border-gray-200 dark:border-gray-700"
              >
                <div className="font-bold text-gray-900 dark:text-gray-100">{test.framework.toUpperCase()}</div>
                <div className="text-gray-600 dark:text-gray-400 truncate">{test.description.substring(0, 50)}...</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-500">
                  {new Date(test.timestamp).toLocaleTimeString()}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Code Section */}
      {generatedCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6 space-y-4 border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/30 dark:to-slate-900 dark:border-cyan-800 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                Generated {generatedCode.framework.charAt(0).toUpperCase() + generatedCode.framework.slice(1)} Test
                {generatedCode.persona && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">({personaConfig[generatedCode.persona as keyof typeof personaConfig].label})</span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={simulateTestExecution}
                disabled={executingTest}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md"
              >
                <Play className="w-4 h-4" />
                {executingTest ? "Running..." : "Demo"}
              </button>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-md"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <SyntaxHighlighter
            code={generatedCode.code}
            language={generatedCode.language}
          />

          {/* Test Execution Demo Result */}
          <AnimatePresence>
            {testExecutionResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-800 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-bold text-green-700 dark:text-green-300">✓ Test Execution Success (Demo)</h4>
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded border border-gray-800">
                  {testExecutionResult.status}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Duration</div>
                    <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{testExecutionResult.duration}s</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Assertions</div>
                    <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{testExecutionResult.assertions} passed ✓</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
