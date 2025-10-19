import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalaxyPlaceholder } from "@/components/galaxy-placeholder";
import { StockChart } from "@/components/stock-chart";
import { SettingsMenu } from "@/components/ui/settings-menu";

const sandboxStocks = [
  { id: 1, name: "Pinterest", symbol: "PINS", value: 500, x: "20%", y: "35%" },
  { id: 2, name: "Amazon", symbol: "AMZN", value: 500, x: "50%", y: "45%" },
  { id: 3, name: "Google", symbol: "GOOGL", value: 500, x: "70%", y: "30%" },
];

const Sandbox = () => {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<typeof sandboxStocks[0] | null>(null);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)]">
        <div className="flex gap-6 h-full">
          {/* Left Side - Sandbox Galaxy */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/portfolio")}
                className="flex items-center gap-2 hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                BACK
              </Button>
              <div className="flex items-center gap-4">
                <Button className="flex items-center gap-2 cosmic-gradient hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" />
                  ADD
                </Button>
                <SettingsMenu />
              </div>
            </div>

            <div className="flex-1">
              <GalaxyPlaceholder>
                <div className="relative w-full h-full">
                  {sandboxStocks.map((stock) => (
                    <button
                      key={stock.id}
                      onClick={() => setSelectedStock(stock)}
                      className="absolute group"
                      style={{ left: stock.x, top: stock.y }}
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-blue-500/30 blur-xl absolute -inset-2 group-hover:bg-blue-500/50 transition-all" />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center relative shadow-[0_0_20px_hsl(217_91%_60%/0.5)] group-hover:scale-110 transition-transform">
                          <span className="text-xs font-bold">{stock.symbol.slice(0, 2)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-xs font-medium">{stock.name}</div>
                        <div className="text-xs text-blue-400 font-semibold">${stock.value}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </GalaxyPlaceholder>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className="w-96 glass-panel rounded-2xl p-6">
            {selectedStock ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedStock.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedStock.symbol}</p>
                  <p className="text-xl text-blue-400 font-semibold mt-2">${selectedStock.value}</p>
                </div>

                <div className="bg-secondary/30 rounded-lg p-4">
                  <StockChart />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-secondary hover:bg-secondary/80">
                    Buy
                  </Button>
                  <Button variant="destructive">
                    Sell
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold glow-text">
                    CREATE
                    <br />
                    YOUR
                    <br />
                    DREAM
                    <br />
                    GALAXY
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Simulate your perfect portfolio
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sandbox;
