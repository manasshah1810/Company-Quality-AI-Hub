import { useState, useRef, useEffect } from "react";
import { currentBrand } from "@/config/branding";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useClaudeAI } from "@/hooks/useClaudeAI";
import { useChatContext } from "@/context/ChatContext";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Winnie, the official QA Intelligence Agent for the ${currentBrand.name}. 

CORE KNOWLEDGE BASE (STRICT):
- AJ-9980: A critical regression detected in the Tax-Logic edge case module due to localized P95 latency spikes (Section 4.1).
- Release Confidence Score: Calculated as: (Pass Rate Percentage * 0.6) + (System Stability Index * 0.4). Anything below 85% is at-risk.

FORMATTING RULES:
1. DO NOT use emojis.
2. DO NOT use tables.
3. DO NOT use bold text (No ** or __).
4. Provide a numbered or bulleted list of 5-7 points maximum.
5. NO unnecessary conversational filler.

STRICT GUARDRAILS:
1. You only answer questions related to the ${currentBrand.name} project, QA automation, and the real-time data provided in the context below. 
2. The 'CURRENT PAGE DATA' is the ABSOLUTE TRUTH. If the user asks about the current page, ONLY use the data provided there.
3. If a user asks anything unrelated (general chat, jokes, other software, etc.), politely decline.
4. Be concise, technical, and data-driven.

CURRENT PAGE DATA (ENTIRE STATE):
{{CONTEXT_DATA}}`;

const SUGGESTED_PROMPTS = [
  "Explain AJ-9980 regression",
  "How is Release Confidence calculated?",
  "What tiles need attention?",
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("winnie_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const { chat, loading } = useClaudeAI();
  const { contextData } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("winnie_messages", JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("winnie_messages");
    toast.success("Chat history cleared.");
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Inject real-time page context into the system prompt
    const finalSystemPrompt = `${SYSTEM_PROMPT}\n\nCONVERSATION GUIDELINE:\nYou are in a continuous session. Use previous messages for context, but prioritize the CURRENT PAGE DATA if specific metrics are mentioned.`;

    // Process context data
    const readySystemPrompt = finalSystemPrompt.replace(
      "{{CONTEXT_DATA}}",
      contextData ? JSON.stringify(contextData, null, 2) : "No context data available."
    );

    const response = await chat(newMessages, readySystemPrompt);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-cyan"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] glass-strong rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">AI</div>
                <div>
                  <span className="font-heading font-bold text-foreground text-sm">Winnie</span>
                  <p className="text-[10px] text-muted-foreground">QA Intelligence Agent</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={clearChat} title="Clear history" className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Try asking:</p>
                  {SUGGESTED_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/30 text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.role === "user"
                    ? "bg-primary/20 text-foreground rounded-br-none"
                    : "bg-muted/40 text-foreground rounded-bl-none"
                    }`}>
                    {msg.role === "assistant" && <span className="text-[10px] font-bold text-primary mr-1 underline">Winnie:</span>}
                    <div className="prose prose-invert prose-xs max-w-none inline">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-muted/40 rounded-bl-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send(input)}
                  placeholder="Ask Winnie..."
                  className="flex-1 px-3 py-2 rounded-lg bg-muted/30 text-foreground text-xs placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
