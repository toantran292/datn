import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Bot, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AgentChatProps {
  className?: string;
}

const suggestedQuestions = [
  "Tổng hợp tiến độ các project tuần này",
  "File nào được upload gần đây nhất?",
  "Ai chưa hoạt động trong 7 ngày qua?",
];

// Mock response for demo - will be replaced with actual API
const getMockResponse = (question: string): string => {
  if (question.toLowerCase().includes("tiến độ") || question.toLowerCase().includes("project")) {
    return "Dựa trên dữ liệu workspace của bạn:\n\n📊 **Tổng quan tiến độ tuần này:**\n\n• **Marketing Campaign**: 85% hoàn thành, 3 tasks còn lại\n• **Product Development**: 62% hoàn thành, đang trong sprint 4\n• **Customer Success**: 90% hoàn thành, sắp release\n\n💡 **Gợi ý**: Project Marketing cần attention vì deadline gần.";
  }
  if (question.toLowerCase().includes("file") || question.toLowerCase().includes("upload")) {
    return "📁 **Files được upload gần đây:**\n\n1. `Q4-Report-Final.pdf` - Marketing (2 giờ trước)\n2. `meeting-notes.md` - Product Dev (5 giờ trước)\n3. `budget-2025.xlsx` - Marketing (hôm qua)\n\nTổng cộng **47 files** được upload trong tuần này.";
  }
  if (question.toLowerCase().includes("hoạt động") || question.toLowerCase().includes("inactive")) {
    return "👥 **Thành viên chưa hoạt động (7 ngày):**\n\n• Nguyen Van A - last seen: 10 ngày trước\n• Tran Thi B - last seen: 8 ngày trước\n\n✅ **18/20** thành viên đang hoạt động bình thường.";
  }
  return "Tôi có thể giúp bạn với các thông tin về workspace như:\n\n• Tiến độ các project\n• Files và documents\n• Hoạt động của team members\n• Thống kê và báo cáo\n\nHãy hỏi cụ thể hơn để tôi có thể hỗ trợ tốt nhất!";
};

export function AgentChat({ className }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const streamText = async (messageId: string, fullText: string) => {
    const words = fullText.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: currentText, isStreaming: true }
            : msg
        )
      );

      // Random delay between words for natural feel
      await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 40));
    }

    // Mark streaming as complete
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isStreaming: false } : msg
      )
    );
    setStreamingMessageId(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking || streamingMessageId) return;

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

    // Simulate thinking delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

    setIsThinking(false);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    // Get mock response and stream it
    const response = getMockResponse(userQuestion);
    await streamText(assistantMessageId, response);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <Card className={`p-6 border border-border shadow-md rounded-2xl bg-white flex flex-col ${className}`}>
      {/* Header */}
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

      {/* Messages */}
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
                    : "bg-muted rounded-bl-md"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="text-sm prose prose-sm prose-neutral max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&_li]:my-0 [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded">
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
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Hỏi về workspace của bạn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isThinking || !!streamingMessageId}
          className="rounded-xl"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isThinking || !!streamingMessageId}
          size="icon"
          className="rounded-xl flex-shrink-0"
        >
          <Send size={18} />
        </Button>
      </div>
    </Card>
  );
}
