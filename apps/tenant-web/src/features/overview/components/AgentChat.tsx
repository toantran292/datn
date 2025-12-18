import { useState, useRef, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, AlertCircle } from "lucide-react";
import { agentChatStream, type AgentChatMessage } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
}

interface AgentChatProps {
  className?: string;
  projectId?: string; // Optional: focus on specific project
}

const suggestedQuestions = [
  "Tiến độ dự án hiện tại như thế nào?",
  "Tôi có bao nhiêu task chưa hoàn thành?",
  "Ai đang phụ trách nhiều công việc nhất?",
];

export function AgentChat({ className, projectId }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const userQuestion = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    let streamedContent = "";

    try {
      // Build history from previous messages
      const history: AgentChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Stream response
      for await (const chunk of agentChatStream(
        { message: userQuestion, history, projectId },
        () => {
          // Add streaming message when stream starts
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMessageId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
              isStreaming: true,
            },
          ]);
        }
      )) {
        streamedContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: streamedContent }
              : m
          )
        );
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, isStreaming: false }
            : m
        )
      );
    } catch (error: any) {
      console.error("Agent chat error:", error);

      // If streaming started, update the message with error
      if (streamedContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: streamedContent + "\n\n*Lỗi kết nối, phản hồi có thể không đầy đủ.*",
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
      } else {
        // No streaming started, add error message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: "assistant",
            content: "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau.",
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, messages, projectId]);

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <Card className={`p-6 border border-border shadow-md rounded-2xl bg-white flex flex-col ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <h3 style={{ fontWeight: 600 }}>UTS Agent</h3>
          <Sparkles size={16} className="text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Hỏi đáp về workspace của bạn
        </p>
      </div>

      <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <Bot size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Bắt đầu bằng cách hỏi một câu hỏi
            </p>
            <div className="space-y-2 w-full">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  "{question}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : message.isError
                    ? "bg-destructive/10 text-destructive rounded-bl-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="text-sm prose prose-sm prose-neutral max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&_li]:my-0 [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded">
                    {message.isError && (
                      <AlertCircle size={14} className="inline mr-1" />
                    )}
                    <Markdown>{message.content}</Markdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Hỏi về workspace của bạn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isThinking}
          className="rounded-xl"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          size="icon"
          className="rounded-xl flex-shrink-0"
        >
          <Send size={18} />
        </Button>
      </div>
    </Card>
  );
}
