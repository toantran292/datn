import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  "Tong hop tien do cac project tuan nay",
  "File nao duoc upload gan day nhat?",
  "Ai chua hoat dong trong 7 ngay qua?",
];

const getMockResponse = (question: string): string => {
  if (question.toLowerCase().includes("tien do") || question.toLowerCase().includes("project")) {
    return "Dua tren du lieu workspace cua ban:\n\n**Tong quan tien do tuan nay:**\n\n- **Marketing Campaign**: 85% hoan thanh, 3 tasks con lai\n- **Product Development**: 62% hoan thanh, dang trong sprint 4\n- **Customer Success**: 90% hoan thanh, sap release\n\n**Goi y**: Project Marketing can attention vi deadline gan.";
  }
  if (question.toLowerCase().includes("file") || question.toLowerCase().includes("upload")) {
    return "**Files duoc upload gan day:**\n\n1. `Q4-Report-Final.pdf` - Marketing (2 gio truoc)\n2. `meeting-notes.md` - Product Dev (5 gio truoc)\n3. `budget-2025.xlsx` - Marketing (hom qua)\n\nTong cong **47 files** duoc upload trong tuan nay.";
  }
  if (question.toLowerCase().includes("hoat dong") || question.toLowerCase().includes("inactive")) {
    return "**Thanh vien chua hoat dong (7 ngay):**\n\n- Nguyen Van A - last seen: 10 ngay truoc\n- Tran Thi B - last seen: 8 ngay truoc\n\n**18/20** thanh vien dang hoat dong binh thuong.";
  }
  return "Toi co the giup ban voi cac thong tin ve workspace nhu:\n\n- Tien do cac project\n- Files va documents\n- Hoat dong cua team members\n- Thong ke va bao cao\n\nHay hoi cu the hon de toi co the ho tro tot nhat!";
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

      await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 40));
    }

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

    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

    setIsThinking(false);

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

    const response = getMockResponse(userQuestion);
    await streamText(assistantMessageId, response);
  };

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
          Hoi dap ve workspace cua ban
        </p>
      </div>

      <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <Bot size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Bat dau bang cach hoi mot cau hoi
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
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Hoi ve workspace cua ban..."
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
