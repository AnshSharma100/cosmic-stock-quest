import { useState } from "react";
import { Search } from "lucide-react";
import { NavigationTabs } from "@/components/ui/navigation-tabs";
import { SettingsMenu } from "@/components/ui/settings-menu";
import StarUI from "@/components/StarUI";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/stock-chart";
import { ChatbotPanel } from "@/components/chatbot-panel";
import { cn } from "@/lib/utils";
import { LiveBadge } from "@/components/live-badge";

const mockStocks = [
  { id: 1, name: "Apple", symbol: "AAPL", x: "25%", y: "30%" },
  { id: 2, name: "Microsoft", symbol: "MSFT", x: "60%", y: "45%" },
  { id: 3, name: "NVIDIA", symbol: "NVDA", x: "40%", y: "60%" },
  { id: 4, name: "Google", symbol: "GOOGL", x: "70%", y: "25%" },
];

const Discovery = () => {
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);

  const handleStockClick = (stock: any) => {
    // Clone to ensure state change even if object identity is unchanged
    setSelectedStock({ ...stock });
  };

  return (
    <div className="min-h-screen p-6 relative">
      {/* Full screen galaxy background */}
      <div className="fixed inset-0 z-0">
        <StarUI searchQuery={searchQuery} onStockClick={handleStockClick} />
      </div>
      
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)] relative z-10 pointer-events-none">
        <div className="flex gap-6 h-full">
          {/* Left Side - Galaxy View */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pointer-events-auto">
              <div className="flex items-center gap-3">
                <NavigationTabs />
                <LiveBadge />
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Stock"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-secondary/50 border-primary/20 focus:border-primary"
                  />
                </div>
                <SettingsMenu />
              </div>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className="glass-panel rounded-2xl p-6 w-96 pointer-events-auto">
            {selectedStock ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedStock.symbol}</h2>
                  <p className="text-lg text-primary font-semibold">${selectedStock.price?.toFixed(2)}</p>
                  <p className={cn(
                    "text-sm",
                    selectedStock.change > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {selectedStock.change > 0 ? '+' : ''}{selectedStock.change?.toFixed(2)}%
                  </p>
                </div>

                <div className="bg-secondary/30 rounded-lg p-4">
                  <StockChart />
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowChatbot(!showChatbot)}
                    className="w-full cosmic-gradient hover:opacity-90 transition-opacity"
                  >
                    Ask Questions about {selectedStock.symbol}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold glow-text">
                    DISCOVER
                    <br />
                    YOUR
                    <br />
                    GALAXY
                  </h2>
                </div>
                <Button 
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="cosmic-gradient hover:opacity-90 transition-opacity"
                >
                  Ask questions about any stock
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render chatbot anchored to the right info panel, centered visually */}
      {showChatbot && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)] relative flex">
            {/* left spacer must match layout proportions */}
            <div className="flex-1" />
            {/* right panel width is w-96; place Chatbot absolute inside this column */}
            <div className="relative w-96 pointer-events-none">
              <ChatbotPanel 
                position="absolute"
                stockName={selectedStock?.name}
                className="right-0 bottom-6 translate-x-0 pointer-events-auto animate-fade-in"
                onClose={() => setShowChatbot(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discovery;
