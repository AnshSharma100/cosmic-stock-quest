import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationTabs } from "@/components/ui/navigation-tabs";
import { SettingsMenu } from "@/components/ui/settings-menu";
import StarUI from "@/components/StarUI";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/stock-chart";
import { ChatbotPanel } from "@/components/chatbot-panel";
import { Microscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveBadge } from "@/components/live-badge";

const mockPortfolioStocks = [
  { id: 1, name: "Apple", symbol: "AAPL", value: 2000, x: "30%", y: "40%" },
  { id: 2, name: "NVIDIA", symbol: "NVDA", value: 2000, x: "65%", y: "50%" },
];

const Portfolio = () => {
  const navigate = useNavigate();
  const [hasStatement, setHasStatement] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const HARDCODED_VALUE = 2914.31;
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);

  const handleStockClick = (stock: any) => {
    const entry = customSymbols.find((s) => s.split(':')[0] === stock.symbol);
    const positionValue = entry ? Number(entry.split(':')[1]) : undefined;
    setSelectedStock(positionValue ? { ...stock, positionValue } : { ...stock });
    setHasStatement(true);
  };

  function onUploadStatement(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Hardcoded outcome: user has $2,914.31 worth of NVDA
    setHasStatement(true);
    setSelectedStock({ symbol: "NVDA", positionValue: HARDCODED_VALUE });
    setCustomSymbols([`NVDA:${HARDCODED_VALUE}`]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen p-6 relative">
      {/* Full screen galaxy background */}
      <div className="fixed inset-0 z-0">
        {hasStatement && customSymbols.length > 0 ? (
          <StarUI
            enableStocks={true}
            mode="custom"
            customSymbols={customSymbols.map(s => s.split(':')[0])}
            customAmounts={Object.fromEntries(customSymbols.map(s => { const [sym, amt] = s.split(':'); return [sym, Number(amt)]; }))}
            spriteScale={60}
            onStockClick={handleStockClick}
          />
        ) : (
          <StarUI enableStocks={false} onStockClick={handleStockClick} />
        )}
      </div>
      
      {!hasStatement && (
        <div className="fixed inset-0 flex items-center justify-center z-5">
          <label className="cursor-pointer cosmic-gradient hover:opacity-90 transition-opacity text-lg px-8 py-6 rounded-md text-white">
            Upload Statement (CSV/PDF)
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf"
              className="hidden"
              onChange={onUploadStatement}
            />
          </label>
        </div>
      )}
      
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)] relative z-10 pointer-events-none">
        <div className="flex gap-6 h-full">
          {/* Left Side - Portfolio Galaxy */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pointer-events-auto">
              <div className="flex items-center gap-3">
                <NavigationTabs />
                <LiveBadge />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate("/sandbox")}
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-secondary hover:text-primary transition-all"
                >
                  <Microscope className="h-5 w-5" />
                </Button>
                <SettingsMenu />
              </div>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className="glass-panel rounded-2xl p-6 w-96 pointer-events-auto">
            {!hasStatement ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold glow-text">
                    WELCOME
                    <br />
                    TO YOUR
                    <br />
                    GALAXY
                  </h2>
                </div>
                <Button 
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="cosmic-gradient hover:opacity-90 transition-opacity"
                >
                  Ask About Your Portfolio
                </Button>
              </div>
            ) : selectedStock ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedStock.symbol}</h2>
                  {typeof selectedStock?.price === 'number' && (
                    <p className="text-lg text-primary font-semibold">${selectedStock.price.toFixed(2)}</p>
                  )}
                  {typeof selectedStock?.change === 'number' && (
                    <p className={cn(
                      "text-sm",
                      selectedStock.change > 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                    </p>
                  )}
                  {typeof selectedStock?.positionValue === 'number' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Position value: ${selectedStock.positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div className="bg-secondary/30 rounded-lg p-4">
                  <StockChart />
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowChatbot(!showChatbot)}
                    className="w-full cosmic-gradient hover:opacity-90 transition-opacity"
                  >
                    Ask Question
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-secondary hover:bg-secondary/80">
                      Buy
                    </Button>
                    <Button variant="destructive">
                      Sell
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold glow-text">
                    Ask Questions
                    <br />
                    About Your Galaxy
                  </h2>
                </div>
                <Button 
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="cosmic-gradient hover:opacity-90 transition-opacity px-12"
                >
                  ASK
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showChatbot && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)] relative flex">
            <div className="flex-1" />
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

export default Portfolio;
