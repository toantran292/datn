import { useState } from "react";

export type TranslateLanguage = "en" | "ko" | "ja" | "zh" | "vi";

export const LANGUAGE_LABELS: Record<TranslateLanguage, string> = {
  en: "🇬🇧  English",
  ko: "🇰🇷  한국어 (Korean)",
  ja: "🇯🇵  日本語 (Japanese)",
  zh: "🇨🇳  中文 (Chinese)",
  vi: "🇻🇳  Tiếng Việt (Vietnamese)",
};

export interface TranslateRequest {
  issueId: string;
  currentDescription: string;
  targetLanguage: TranslateLanguage;
  issueName?: string;
  issueType?: string;
}

export interface TranslateData {
  translatedText: string;
  translatedHtml: string;
  targetLanguage: TranslateLanguage;
}

export function useAITranslateStream() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [streamedHtml, setStreamedHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TranslateData | null>(null);

  const translate = async (req: TranslateRequest): Promise<TranslateData | null> => {
    setIsTranslating(true);
    setStreamedText("");
    setStreamedHtml("");
    setError(null);

    try {
      const response = await fetch("/api/ai/translate-description-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let fullHtml = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.chunk) {
                fullText += parsed.chunk;
                fullHtml += parsed.chunk;
                setStreamedText(fullText);
                setStreamedHtml(fullHtml);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      const result: TranslateData = {
        translatedText: fullText,
        translatedHtml: fullHtml,
        targetLanguage: req.targetLanguage,
      };

      setLastResult(result);
      setIsTranslating(false);
      return result;
    } catch (err) {
      console.error("AI Translate error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setIsTranslating(false);
      return null;
    }
  };

  return {
    translate,
    isTranslating,
    streamedText,
    streamedHtml,
    error,
    lastResult,
  };
}
