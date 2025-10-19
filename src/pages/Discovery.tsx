import { useState } from "react";
import { Search } from "lucide-react";
import { NavigationTabs } from "@/components/ui/navigation-tabs";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { GalaxyPlaceholder } from "@/components/galaxy-placeholder";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/stock-chart";
import { ChatbotPanel } from "@/components/chatbot-panel";
import { cn } from "@/lib/utils";

const mockStocks = [
  { id: 1, name: "Apple", symbol: "AAPL", x: "25%", y: "30%" },
  { id: 2, name: "Microsoft", symbol: "MSFT", x: "60%", y: "45%" },
  { id: 3, name: "NVIDIA", symbol: "NVDA", x: "40%", y: "60%" },
  { id: 4, name: "Google", symbol: "GOOGL", x: "70%", y: "25%" },
];

const Discovery = () => {
  const [selectedStock, setSelectedStock] = useState<typeof mockStocks[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)]">
        <div className="flex gap-6 h-full">
          {/* Left Side - Galaxy View */}
          <div className={cn(
            "flex flex-col transition-all duration-500",
            selectedStock ? "flex-[0.6]" : "flex-1"
          )}>
            <div className="flex items-center justify-between mb-4">
              <NavigationTabs />
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

            <div className="flex-1">
              <GalaxyPlaceholder>
                <div className="relative w-full h-full">
                  {mockStocks.map((stock) => (
                    <button
                      key={stock.id}
                      onClick={() => setSelectedStock(stock)}
                      className="absolute group"
                      style={{ left: stock.x, top: stock.y }}
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-primary/30 blur-xl absolute -inset-2 group-hover:bg-primary/50 transition-all" />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center relative shadow-[0_0_20px_hsl(263_70%_60%/0.5)] group-hover:scale-110 transition-transform">
                          <span className="text-xs font-bold">{stock.symbol.slice(0, 2)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {stock.name}
                      </div>
                    </button>
                  ))}
                </div>
              </GalaxyPlaceholder>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className={cn(
            "glass-panel rounded-2xl p-6 transition-all duration-500",
            selectedStock ? "w-[600px]" : "w-96"
          )}>
            {selectedStock ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedStock.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedStock.symbol}</p>
                </div>

                <div className="bg-secondary/30 rounded-lg p-4">
                  <StockChart />
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowChatbot(!showChatbot)}
                    className="w-full cosmic-gradient hover:opacity-90 transition-opacity"
                  >
                    Ask Questions about {selectedStock.name}
                  </Button>
                  <Button className="w-full bg-secondary hover:bg-secondary/80">
                    Buy
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

      {showChatbot && (
        <ChatbotPanel 
          stockName={selectedStock?.name}
          className="animate-fade-in"
        />
      )}
    </div>
  );
};

export default Discovery;
