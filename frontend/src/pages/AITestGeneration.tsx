import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, FileJson, Code2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { NLTestGenerator } from "@/components/ai/NLTestGenerator";
import { APISpecTestGenerator } from "@/components/ai/APISpecTestGenerator";
import { SourceCodeTestGenerator } from "@/components/ai/SourceCodeTestGenerator";
import { useChatContext } from "@/context/ChatContext";

type TabType = "natural-language" | "api-spec" | "source-code";

export default function AITestGeneration() {
  const [activeTab, setActiveTab] = useState<TabType>("natural-language");
  const { setContextData } = useChatContext();

  useEffect(() => {
    setContextData({
      page: "AI Test Generation Engine",
      activeTab,
      tabs: ["natural-language", "api-spec", "source-code"]
    });
  }, [activeTab, setContextData]);

  const tabs = [
    {
      id: "natural-language" as TabType,
      label: "Natural Language",
      icon: Sparkles,
      description: "Describe your test in plain English"
    },
    {
      id: "api-spec" as TabType,
      label: "API Specification",
      icon: FileJson,
      description: "Upload Swagger/OpenAPI specs"
    },
    {
      id: "source-code" as TabType,
      label: "Source Code",
      icon: Code2,
      description: "Paste code to generate unit tests"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Test Generation Engine"
        subtitle="Generate executable test code from 3 different inputs"
      >
        <div className="text-xs text-muted-foreground">
          Generates Playwright, Cypress, PyTest, RestAssured, Jest, and JUnit tests
        </div>
      </PageHeader>

      {/* Tab Navigation */}
      <div className="flex gap-3 border-b border-border/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all text-sm font-bold uppercase tracking-wide ${isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              whileHover={{ y: -2 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="glass rounded-xl p-6 border border-border/50 min-h-screen md:min-h-auto"
      >
        {activeTab === "natural-language" && <NLTestGenerator />}
        {activeTab === "api-spec" && <APISpecTestGenerator />}
        {activeTab === "source-code" && <SourceCodeTestGenerator />}
      </motion.div>

      {/* Info Box */}
      <div className="glass rounded-xl p-5 border border-border/50 space-y-3">
        <h3 className="font-bold text-sm text-foreground">💡 How It Works</h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary font-bold">1.</span>
            <span>Choose an input method: natural language, API spec, or source code</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Select your desired test framework (Playwright, Cypress, PyTest, RestAssured, Jest, JUnit)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Click "Generate" and the AI creates executable, runnable test code</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Copy the code or download it as a file to integrate into your project</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
