import { useState, useCallback, useEffect } from "react";
import { useAIStream } from "./use-ai-stream";
import type {
  RefineDescriptionRequest,
  RefineDescriptionData,
} from "@/core/types/ai";

interface UseAIRefineStreamReturn {
  refine: (input: RefineDescriptionRequest) => Promise<RefineDescriptionData | null>;
  isRefining: boolean;
  streamedText: string;
  streamedHtml: string;
  error: string | null;
  reset: () => void;
  abort: () => void;
}

export const useAIRefineStream = (): UseAIRefineStreamReturn => {
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<RefineDescriptionData | null>(null);
  const [streamedHtml, setStreamedHtml] = useState("");

  const { streamAI, streamedText, isStreaming, abort: abortStream, reset: resetStream } = useAIStream();

  // Convert streamedText to HTML in real-time whenever it changes
  useEffect(() => {
    if (streamedText && isStreaming) {
      setStreamedHtml(convertMarkdownToHtml(streamedText));
    }
  }, [streamedText, isStreaming]);

  const refine = useCallback(
    async (input: RefineDescriptionRequest): Promise<RefineDescriptionData | null> => {
      setIsRefining(true);
      setError(null);
      resetStream();

      try {
        // Call streaming endpoint via Edge Gateway
        const EDGE_URL = process.env.NEXT_PUBLIC_EDGE_URL || "http://localhost:8080";
        const result = await streamAI(`${EDGE_URL}/pm/api/ai/refine-description-stream`, input);

        // Parse metadata for confidence and improvements
        const confidence = result.confidence || 0.85;
        const improvements = result.metadata?.improvements || [];

        // Convert markdown to HTML (simple conversion, you might want a proper markdown parser)
        const refinedDescriptionHtml = convertMarkdownToHtml(result.text);

        const refinedData: RefineDescriptionData = {
          refinedDescription: result.text,
          refinedDescriptionHtml,
          confidence,
          improvements,
        };

        setCurrentResult(refinedData);
        setIsRefining(false);
        return refinedData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
        setError(errorMessage);
        setIsRefining(false);
        setCurrentResult(null);
        return null;
      }
    },
    [streamAI, resetStream]
  );

  const reset = useCallback(() => {
    setError(null);
    setCurrentResult(null);
    setStreamedHtml("");
    resetStream();
  }, [resetStream]);

  const abort = useCallback(() => {
    abortStream();
    setIsRefining(false);
  }, [abortStream]);

  return {
    refine,
    isRefining: isRefining || isStreaming,
    streamedText,
    streamedHtml,
    error,
    reset,
    abort,
  };
};

/**
 * Simple markdown to HTML converter
 * For production, consider using a library like marked or react-markdown
 */
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown.trim();

  // Convert headers (must be done before other conversions)
  html = html.replace(/^### (.+)$/gim, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gim, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gim, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>');

  // Convert bold (be careful with italic/bold conflicts)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Convert italic (after bold to avoid conflicts)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Convert unordered lists
  const listItems: string[] = [];
  html = html.replace(/^[\*\-] (.+)$/gim, (match, content) => {
    listItems.push(`<li class="ml-4">${content}</li>`);
    return `<!--LIST_ITEM_${listItems.length - 1}-->`;
  });

  // Wrap list items in ul
  if (listItems.length > 0) {
    let listHtml = '<ul class="list-disc space-y-1 my-3">';
    listItems.forEach((item, index) => {
      html = html.replace(`<!--LIST_ITEM_${index}-->`, '');
      listHtml += item;
    });
    listHtml += '</ul>';
    html = html.replace(/\n*<!--LIST_ITEM_\d+-->\n*/g, '');
    html = html + listHtml;
  }

  // Split by double line breaks for paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      p = p.trim();
      // Don't wrap headers or lists in <p>
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol')) {
        return p;
      }
      // Replace single line breaks with space (not <br>)
      p = p.replace(/\n/g, ' ');
      return p ? `<p class="mb-3">${p}</p>` : '';
    })
    .filter(p => p)
    .join('');

  return html;
}
