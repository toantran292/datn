import { useState, useCallback, useRef } from "react";

interface UseAIStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

interface AIStreamResult {
  text: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export const useAIStream = (options?: UseAIStreamOptions) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stream AI response using HTTP Streaming (SSE or ReadableStream)
   *
   * @param url - API endpoint URL
   * @param payload - Request payload
   * @returns Promise<AIStreamResult>
   */
  const streamAI = useCallback(
    async (url: string, payload: any): Promise<AIStreamResult> => {
      try {
        setIsStreaming(true);
        setStreamedText("");
        setError(null);

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        // Fetch with streaming support
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream", // For Server-Sent Events
          },
          body: JSON.stringify(payload),
          credentials: "include", // Include cookies for authentication
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let fullText = "";
        let confidence: number | undefined;
        let metadata: Record<string, any> | undefined;

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true });

          // Parse Server-Sent Events format
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "text") {
                  fullText += data.content;
                  setStreamedText(fullText);
                  options?.onChunk?.(data.content);
                } else if (data.type === "confidence") {
                  confidence = data.value;
                } else if (data.type === "metadata") {
                  metadata = data.value;
                } else if (data.type === "error") {
                  throw new Error(data.message);
                }
              } catch (parseError) {
                // If not JSON, treat as plain text
                fullText += line;
                setStreamedText(fullText);
                options?.onChunk?.(line);
              }
            }
          }
        }

        setIsStreaming(false);
        options?.onComplete?.(fullText);

        return {
          text: fullText,
          confidence,
          metadata,
        };
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsStreaming(false);
        options?.onError?.(error);
        throw error;
      }
    },
    [options]
  );

  /**
   * Abort current streaming request
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setStreamedText("");
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    streamAI,
    abort,
    reset,
    isStreaming,
    streamedText,
    error,
  };
};
