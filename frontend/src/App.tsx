import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatBot } from "@/components/ai/ChatBot";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import TestSuites from "./pages/TestSuites";
import AITestGeneration from "./pages/AITestGeneration";
import CodeIntelligence from "./pages/CodeIntelligence";
import RegressionAnalysis from "./pages/RegressionAnalysis";
import SelfHealing from "./pages/SelfHealing";
import SyntheticData from "./pages/SyntheticData";
import AgentTesting from "./pages/AgentTesting";
import MultiTenant from "./pages/MultiTenant";
import Analytics from "./pages/Analytics";
import Glossary from "./pages/Glossary";
import NotFound from "./pages/NotFound";
import DebugCenter from "./pages/DebugCenter";
import ExecutionResults from "./pages/ExecutionResults";

import { useEffect } from "react";
import { currentBrand } from "@/config/branding";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.title = `${currentBrand.name} — AI-Native Quality Engineering`;
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ChatProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <div className="flex min-h-screen w-full grid-texture">
                <AppSidebar />
                <main className="flex-1 p-6 overflow-y-auto relative">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/test-suites" element={<TestSuites />} />
                    <Route path="/ai-test-generation" element={<AITestGeneration />} />
                    <Route path="/code-intelligence" element={<CodeIntelligence />} />
                    <Route path="/regression-analysis" element={<RegressionAnalysis />} />
                    <Route path="/execution-results" element={<ExecutionResults />} />
                    <Route path="/debug-center" element={<DebugCenter />} />
                    <Route path="/self-healing" element={<SelfHealing />} />
                    <Route path="/synthetic-data" element={<SyntheticData />} />
                    <Route path="/agent-testing" element={<AgentTesting />} />
                    <Route path="/multi-tenant" element={<MultiTenant />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/glossary" element={<Glossary />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <ChatBot />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ChatProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
