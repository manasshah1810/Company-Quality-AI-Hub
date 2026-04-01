import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useClaudeAI() {
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const callClaude = useCallback(async (
    systemPrompt: string,
    userMessage: string,
    onStream?: (text: string) => void
  ): Promise<string> => {
    setLoading(true);
    setStreamingText("");

    try {
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5003").trim();
      const url = `${baseUrl}/api/ai/winnie/proxy`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
          stream: !!onStream
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData.error === "string"
          ? errorData.error
          : errorData.error?.message || `Anthropic API error: ${response.statusText || response.status}`;
        throw new Error(errorMessage);
      }

      if (onStream) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "content_block_delta" && data.delta?.text) {
                    fullText += data.delta.text;
                    setStreamingText(fullText);
                    onStream(fullText);
                  }
                } catch (e) {
                  // Ignore parsing errors for non-JSON lines
                }
              }
            }
          }
        }
        setLoading(false);
        return fullText;
      } else {
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        setStreamingText(text);
        setLoading(false);
        return text;
      }
    } catch (error: any) {
      console.error("Error calling Claude:", error);
      setLoading(false);
      return `Error: ${error.message || "Sorry, I encountered an error while processing your request."}`;
    }
  }, []);

  const chat = useCallback(async (
    messages: Message[],
    systemPrompt: string,
    onStream?: (text: string) => void
  ): Promise<string> => {
    setLoading(true);
    setStreamingText("");

    try {
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5003").trim();
      const url = `${baseUrl}/api/ai/winnie/proxy`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: !!onStream
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData.error === "string"
          ? errorData.error
          : errorData.error?.message || `Anthropic API error: ${response.statusText || response.status}`;
        throw new Error(errorMessage);
      }

      if (onStream) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "content_block_delta" && data.delta?.text) {
                    fullText += data.delta.text;
                    setStreamingText(fullText);
                    onStream(fullText);
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        }
        setLoading(false);
        return fullText;
      } else {
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        setStreamingText(text);
        setLoading(false);
        return text;
      }
    } catch (error: any) {
      console.error("Error calling Claude:", error);
      setLoading(false);
      return `Error: ${error.message || "Sorry, I encountered an error while processing your request."}`;
    }
  }, []);

  return { callClaude, chat, loading, streamingText };
}
