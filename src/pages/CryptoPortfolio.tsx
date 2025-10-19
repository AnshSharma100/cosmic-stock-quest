import { useState } from "react";
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

const mockCryptoAssets = [
  { id: 1, name: "Bitcoin", symbol: "BTC", value: 5000, x: "25%", y: "35%" },
  { id: 2, name: "Ethereum", symbol: "ETH", value: 3000, x: "60%", y: "45%" },
];

const CryptoPortfolio = () => {
  const navigate = useNavigate();
  const [hasStatement, setHasStatement] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<any>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const handleStockClick = (stock: any) => {
    setSelectedCrypto(stock);
    setHasStatement(true);
  };

  return (
    <div className="min-h-screen p-6 relative">
      {/* Full screen galaxy background */}
      <div className="fixed inset-0 z-0">
        <StarUI enableStocks={false} onStockClick={handleStockClick} />
      </div>
      
      {!hasStatement && (
        <div className="fixed inset-0 flex items-center justify-center z-5">
          <Button
            onClick={() => setHasStatement(true)}
            className="cosmic-gradient hover:opacity-90 transition-opacity text-lg px-8 py-6"
          >
            Add Statement
          </Button>
        </div>
      )}
      
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)] relative z-10 pointer-events-none">
        <div className="flex gap-6 h-full">
          {/* Left Side - Crypto Galaxy */}
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
                    CRYPTO GALAXY
                  </h2>
                </div>
                <Button 
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="cosmic-gradient hover:opacity-90 transition-opacity"
                >
                  Ask About Your Portfolio
                </Button>
              </div>
            ) : selectedCrypto ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedCrypto.symbol}</h2>
                  <p className="text-xl text-primary font-semibold mt-2">${selectedCrypto.price?.toFixed(2)}</p>
                  <p className={`text-sm font-semibold ${
                    selectedCrypto.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedCrypto.change > 0 ? '+' : ''}{selectedCrypto.change?.toFixed(2)}%
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
                    About Your Crypto Galaxy
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
                stockName={selectedCrypto?.name}
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

export default CryptoPortfolio;
