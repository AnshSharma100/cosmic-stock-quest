import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ChatbotPanelProps {
  stockName?: string;
  className?: string;
  onClose?: () => void;
  position?: 'fixed' | 'absolute';
}

export const ChatbotPanel = ({ stockName, className, onClose, position = 'fixed' }: ChatbotPanelProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { role: "user", content: message }]);
    setMessage("");
  };

  // esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={cn(`${position} bottom-6 right-6 w-96 glass-panel rounded-2xl p-4 shadow-2xl z-40`, className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">
            {stockName ? `Ask about ${stockName}` : "Ask a Question"}
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose} className="px-2">
            ✕
          </Button>
        </div>
        
        <div className="h-64 overflow-y-auto space-y-3 p-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Ask me anything about {stockName || "your portfolio"}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-lg text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-secondary/50 mr-8"
                )}
              >
                {msg.content}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="cosmic-gradient hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
