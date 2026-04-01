import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useClaudeAI } from "@/hooks/useClaudeAI";

interface AISummaryDrawerProps {
  systemPrompt: string;
  context: string;
  title?: string;
}

export function AISummaryDrawer({ systemPrompt, context, title = "AI Insight" }: AISummaryDrawerProps) {
  const [open, setOpen] = useState(false);
  const { callClaude, loading, streamingText } = useClaudeAI();
  const [result, setResult] = useState("");

  const handleOpen = async () => {
    setOpen(true);
    setResult("");
    const response = await callClaude(systemPrompt, context);
    setResult(response);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
      >
        <Sparkles className="w-4 h-4" />
        AI Summary
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg glass-strong z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-bold text-lg text-foreground">✨ {title}</h2>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                {loading && !streamingText ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm">Analyzing...</span>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{streamingText || result}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
