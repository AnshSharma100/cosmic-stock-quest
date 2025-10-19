import { useState } from "react";
import { NavigationTabs } from "@/components/ui/navigation-tabs";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { GalaxyPlaceholder } from "@/components/galaxy-placeholder";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/stock-chart";

const mockPortfolioStocks = [
  { id: 1, name: "Apple", symbol: "AAPL", value: 2000, x: "30%", y: "40%" },
  { id: 2, name: "NVIDIA", symbol: "NVDA", value: 2000, x: "65%", y: "50%" },
];

const Portfolio = () => {
  const [hasStatement, setHasStatement] = useState(false);
  const [selectedStock, setSelectedStock] = useState<typeof mockPortfolioStocks[0] | null>(null);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)]">
        <div className="flex gap-6 h-full">
          {/* Left Side - Portfolio Galaxy */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <NavigationTabs />
              <SettingsMenu />
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
                      {mockPortfolioStocks.map((stock) => (
                        <button
                          key={stock.id}
                          onClick={() => setSelectedStock(stock)}
                          className="absolute group"
                          style={{ left: stock.x, top: stock.y }}
                        >
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-primary/30 blur-xl absolute -inset-2 group-hover:bg-primary/50 transition-all" />
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center relative shadow-[0_0_20px_hsl(263_70%_60%/0.5)] group-hover:scale-110 transition-transform">
                              <span className="text-sm font-bold">{stock.symbol.slice(0, 2)}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <div className="text-xs font-medium">{stock.name}</div>
                            <div className="text-xs text-primary font-semibold">${stock.value}</div>
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
          <div className="w-96 glass-panel rounded-2xl p-6">
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
                <Button className="cosmic-gradient hover:opacity-90 transition-opacity">
                  Ask About Your Portfolio
                </Button>
              </div>
            ) : selectedStock ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedStock.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedStock.symbol}</p>
                  <p className="text-xl text-primary font-semibold mt-2">${selectedStock.value}</p>
                </div>

                <div className="bg-secondary/30 rounded-lg p-4">
                  <StockChart />
                </div>

                <div className="space-y-3">
                  <Button className="w-full cosmic-gradient hover:opacity-90 transition-opacity">
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
                <Button className="cosmic-gradient hover:opacity-90 transition-opacity px-12">
                  ASK
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
