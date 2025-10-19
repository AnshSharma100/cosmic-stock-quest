import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationTabs } from "@/components/ui/navigation-tabs";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { GalaxyPlaceholder } from "@/components/galaxy-placeholder";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/stock-chart";
import { ChatbotPanel } from "@/components/chatbot-panel";
import { Microscope } from "lucide-react";
import { cn } from "@/lib/utils";

const mockCryptoAssets = [
  { id: 1, name: "Bitcoin", symbol: "BTC", value: 5000, x: "25%", y: "35%" },
  { id: 2, name: "Ethereum", symbol: "ETH", value: 3000, x: "60%", y: "45%" },
];

const CryptoPortfolio = () => {
  const navigate = useNavigate();
  const [hasStatement, setHasStatement] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<typeof mockCryptoAssets[0] | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)]">
        <div className="flex gap-6 h-full">
          {/* Left Side - Crypto Galaxy */}
          <div className={cn(
            "flex flex-col transition-all duration-500",
            selectedCrypto ? "flex-[0.6]" : "flex-1"
          )}>
            <div className="flex items-center justify-between mb-4">
              <NavigationTabs />
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

            <div className="flex-1">
              <GalaxyPlaceholder>
                <div className="relative w-full h-full">
                  {!hasStatement ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={() => setHasStatement(true)}
                        className="cosmic-gradient hover:opacity-90 transition-opacity text-lg px-8 py-6"
                      >
                        Add Statement
                      </Button>
                    </div>
                  ) : (
                    <>
                      {mockCryptoAssets.map((crypto) => (
                        <button
                          key={crypto.id}
                          onClick={() => setSelectedCrypto(crypto)}
                          className="absolute group"
                          style={{ left: crypto.x, top: crypto.y }}
                        >
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-foreground/20 blur-xl absolute -inset-2 group-hover:bg-foreground/30 transition-all" />
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center relative shadow-[0_0_20px_hsl(45_100%_50%/0.3)] group-hover:scale-110 transition-transform border border-foreground/20">
                              <span className="text-sm font-bold">{crypto.symbol.slice(0, 2)}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <div className="text-xs font-medium">{crypto.name}</div>
                            <div className="text-xs text-primary font-semibold">${crypto.value}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </GalaxyPlaceholder>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className={cn(
            "glass-panel rounded-2xl p-6 transition-all duration-500",
            selectedCrypto ? "w-[600px]" : "w-96"
          )}>
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
                  <h2 className="text-3xl font-bold mb-1">{selectedCrypto.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedCrypto.symbol}</p>
                  <p className="text-xl text-primary font-semibold mt-2">${selectedCrypto.value}</p>
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
        <ChatbotPanel 
          stockName={selectedCrypto?.name}
          className="animate-fade-in"
        />
      )}
    </div>
  );
};

export default CryptoPortfolio;
